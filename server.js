import ws from "ws";
import mysql from "mysql2";
import JWT from "jsonwebtoken";

let connection;
connectToBD(); /* подключение к базе данных */
global.usersList = new Map(); /* список активных пользователей */
global.usersListCount = new Map(); /* список открытых страниц пользователя */
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
            case 'check_multi_window':
                checkTokenOnWindow(messages, ws);
                break;
            case 'close_window':
                closeWindow(messages, ws);
                break;
            case 'send_page':
                getDataBaseMessages(messages, ws);
        }
    });
});

function closeWindow(messages) {
    const id = messages.id;
    const fullName = usersList.get(id);
    const message = 'отключается от чата';
    const event = 'disconnect';
    /* уменьшение количества открытых вкладок пользователя */
    usersListCount.set(id, usersListCount.get(id) - 1);
    if (usersListCount.get(id) !== 0) {
        return;
    }
    /* удаляем пользователя из активных, если не осталось вкладок */
    usersListCount.delete(id);
    usersList.delete(id);
    /* отправляем сообщение всем об отключении данного пользователя */
    server.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
                data: [{fullName, message, usersList}],
                event: event
            }, replacer));
        }
    });
}

/* проверка токена на подлинность */
function checkTokenOnWindow(messages, ws) {
    const token = messages.token;
    if (!token) {
        ws.close();
        return;
    }
    try {
        JWT.verify(token, process.env.TOKEN_KEY);
    } catch (err) {
        ws.close();
    }
}

/* проверка токена на подлинность */
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

/* отправка данных о подключившемся пользователе */
async function confirmUser(messages, ws) {
    const id = messages.id;
    const fullName = messages.fullName;
    const event = 'confirm_user'
    messages['_event'] = 'add_user';
    /* добавление в список активных пользователей */
    usersList.set(id, fullName)
    if (usersListCount.has(id)) {
        usersListCount.set(id, usersListCount.get(id) + 1);
    } else {
        usersListCount.set(id, 1);
    }
    /* отправка данных пользователя для открытого окна */
    await ws.send(JSON.stringify({
        data: [{id, fullName}],
        event: event
    }, replacer));
    /* оповещение других пользователей о подключении */
    addUser(messages);
}

/* отправка сообщения всем пользователям */
function sendMessage(messages) {
    const fullName = usersList.get(messages.id);
    const message = messages.message;
    if (message === '') {
        return;
    }
    const event = messages._event;
    const time = getDate();
    /* добавление сообщения в базу */
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

/* отправка сообщения о подключении пользователя */
function addUser(messages) {
    const fullName = usersList.get(messages.id);
    const id = messages.id;
    const message = 'подключился к чату';
    const event = messages._event;
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
    /* удаляем пользователя из активных, если не осталось вкладок */
    usersListCount.delete(id);
    usersList.delete(id);
    /* отправляем сообщение всем об отключении данного пользователя */
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

/* подключение к базе данных */
function connectToBD() {
    connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DATABASE,
        password: process.env.MYSQL_PASSWORD
    });
}

/* получение определённого количества записей из БД */
function getDataBaseMessages(messages, ws) {
    /* сколько на страницу выводить */
    let limit = messages.limit;
    /* с какой позиции выводить */
    let offset = limit * messages._offset;
    let sql = 'SELECT * FROM message ORDER BY id DESC limit ?, ?';
    let data = [offset, limit]
    connection.query(sql, data, function (err, data) {
        ws.send(JSON.stringify({data, event: 'send_page'}, replacer));
    });
}

/* добавление сообщения в БД */
function addMessage(data) {
    getDate();
    const sql = 'INSERT INTO message (id, fullName, message, time) VALUES (NULL, ?, ?, ?)';
    connection.query(sql, data, function (err, results) {
    });
}

/* получение текущей даты */
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
