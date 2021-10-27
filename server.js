import ws from "ws";
import mysql from "mysql2";
import fetch from "node-fetch";
import jwtDecode from "jwt-decode";

let connection;
connectToBD();
global.usersList = new Map();
const server = new ws.Server({port: 8000});

server.on('connection', (ws) => {
    //const id = uuid();
    //clients[id] = ws;
    //getDataBaseMessages(ws);
    /* обработка сообщения */
    ws.on('message', message => {
        const messages = JSON.parse(message);
        const event = messages._event;
        switch (event) {
            case 'add_user':
                addUser(messages);
                break;
            case 'disconnect':
                disconnect(messages);
                break;
            case 'send_message':
                sendMessage(messages);
                break;
            case 'check_token':
                checkToken(messages, ws);
        }
    });
});

function checkToken(messages, ws) {
    const token = messages.token;
    if (!token) {
        ws.close();
        return;
    }
    const data = jwtDecode(token);
    fetch('http://users.api.loc/id', {
        method: 'POST',
        body: JSON.stringify({id: data.id})
    })
        .then(response => response.json())
        .then((json) => {
            if (json.status === false) {
                ws.close();
            } else {
                /* отправка данных для добавления пользователя в чат */
                messages['name'] = json.login;
                messages['id'] = json.id;
                messages['message'] = ' подключился к чату';
                messages['_event'] = 'add_user';
                addUser(messages)
                getDataBaseMessages(ws);
            }
        });
}

function sendMessage(messages) {
    const fullName = usersList.get(messages.id);
    const mess = messages.message;
    const event = messages._event;
    addMessage([fullName, mess])
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify([{
                fullName: fullName, 
                message: mess, 
                event: event
            }], replacer));
        }
    });
}

function addUser(messages) {
    const fullName = messages.name;
    const id = messages.id;
    const mess = messages.message;
    const event = messages._event;
    usersList.set(id, fullName);
    console.log(usersList);
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify([{
                fullName: fullName,
                id: id,
                message: mess,
                usersList: usersList,
                event: event
            }], replacer));
        }
    });
}


function disconnect(messages) {
    const id = messages.id;
    const fullName = usersList.get(id);
    const mess = messages.message;
    const event = messages._event;
    usersList.delete(id);
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify([{
                fullName: fullName,
                message: mess,
                usersList: usersList,
                event: event
            }], replacer));
        }
    });
}

function replacer(key, value) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

function connectToBD() {
    connection = mysql.createConnection({
        host: "localhost",
        port: "8989",
        user: "dev",
        database: "chat",
        password: "dev"
    });
}

function getDataBaseMessages(ws) {
    connection.query("SELECT * FROM message", function (err, results) {
        ws.send(JSON.stringify(results, replacer));
    });
}

function addMessage(data) {
    const sql = "INSERT INTO message (id, fullName, message, time) VALUES (NULL, ?, ?, '234')";
    connection.query(sql, data, function (err, results) {
    });
}

/*process.on('SIGINT', () => {
    server.close();
    writeFile('log', JSON.stringify(log), err => {
        if (err) {
            console.log(err);
        }
        process.exit();
    })
})*/
