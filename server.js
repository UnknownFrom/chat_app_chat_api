import ws from "ws";
import mysql from "mysql2";
import fetch from "node-fetch";
import jwtDecode from "jwt-decode";

let connection;
connectToBD();
global.usersList = new Map();
const server = new ws.Server({port: 8000});

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
                usersList.set(json.id, json.login)
                //messages['name'] = json.login;
                messages['id'] = json.id;
                //messages['message'] = ' подключился к чату';
                //messages['_event'] = 'add_user';
                confirmUser(messages, ws);
                //getDataBaseMessages(messages, ws);
                //addUser(messages);
            }
        });
}

function confirmUser(messages, ws)
{
    const id = messages.id;
    const fullName = usersList.get(messages.id);
    console.log(fullName);
    const event = 'confirm_user';
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

    usersList.set(id, fullName);
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
        host: 'localhost',
        port: '8989',
        user: 'dev',
        database: 'chat',
        password: 'dev'
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

function getDate()
{
    let options = {
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
