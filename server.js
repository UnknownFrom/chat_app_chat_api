import ws from "ws";
import mysql from "mysql2";
import JWT from "jsonwebtoken";

let connection;
connectToBD();
global.usersList = new Map();
global.usersListCount = new Map();
const server = new ws.Server({port: process.env.WEBSOCKET_PORT});

server.on('connection', (ws) => {
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
                break;
            case 'send_page':
                getDataBaseMessages(messages, ws);
        }
    });
});

function checkToken(messages, ws) {
    const token = messages.token;
    if (!token) {
        ws.close();
        return;
    }
    try {
        const data = JWT.verify(token, process.env.TOKEN_KEY);
        messages['id'] = data.id;
        messages['fullName'] = data.fullName;
        confirmUser(messages, ws);
    } catch (err) {
        ws.close();
    }
}

function confirmUser(messages, ws) {
    const id = messages.id;
    const fullName = messages.fullName;
    const event = 'confirm_user';
    usersList.set(id, fullName)
    console.log("Подтверждение " + usersListCount.get(id));
    if (usersListCount.has(id)) {
        usersListCount.set(id, usersListCount.get(id) + 1);
    } else {
        usersListCount.set(id, 1);
    }
    console.log("Подтверждение " + usersListCount.get(id));
    ws.send(JSON.stringify({
        data: [{id, fullName}],
        event: event
    }, replacer));
}

function sendMessage(messages) {
    const fullName = usersList.get(messages.id);
    const message = messages.message;
    const event = messages._event;
    const time = getDate();
    addMessage([fullName, message, time])
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
                data: [{fullName, message, time}],
                event: event
            }, replacer));
        }
    });
}

function addUser(messages) {
    const fullName = usersList.get(messages.id);
    const id = messages.id;
    const message = 'подключился к чату';
    const event = messages._event;
/*    if(usersListCount.get(id) > 1)
    {
        return;
    }*/
    //usersList.set(id, fullName);
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
                data: [{id, fullName, message, usersList}],
                event: event
            }, replacer));
        }
    });
}

function disconnect(messages) {
    const id = messages.id;
    const fullName = usersList.get(id);
    const message = messages.message;
    const event = messages._event;
    console.log(usersListCount.get(id));
    usersListCount.set(id, usersListCount.get(id) - 1);
    console.log(usersListCount.get(id));
    if (usersListCount.get(id) !== 0) {
        return;
    }
    usersListCount.delete(id);
    usersList.delete(id);
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
                data: [{fullName, message, usersList}],
                event: event
            }, replacer));
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
        host: 'chat_app_mysqldb',
        port: '3306',
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DATABASE,
        password: process.env.MYSQL_PASSWORD
    });
}

function getDataBaseMessages(messages, ws) {
    let limit = messages.limit; /* сколько на страницу выводить */
    let offset = limit * messages._offset + 1;
    let sql = 'SELECT * FROM message ORDER BY id DESC limit ?, ?';
    let data = [offset, limit]
    connection.query(sql, data, function (err, data) {
        ws.send(JSON.stringify({data, event: 'send_page'}, replacer));
    });
}

function addMessage(data) {
    getDate();
    const sql = 'INSERT INTO message (id, fullName, message, time) VALUES (NULL, ?, ?, ?)';
    connection.query(sql, data, function (err, results) {
    });
}

function getDate() {
    let options = {
        timeZone: 'Europe/Moscow',
        //year: 'numeric',
        //month: 'numeric',
        //day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        //second: 'numeric'
    };
    return new Date().toLocaleString("ru", options);
}
