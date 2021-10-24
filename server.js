import ws from "ws";
import {v4 as uuid} from "uuid";
import mysql from "mysql2";
let connection;
connectToBD();

import {writeFile, readFileSync, existsSync} from "fs";

let usersList = new Map();
//const log = existsSync('log') && readFileSync('log', 'utf-8');
const clients = {};
const server = new ws.Server({port: 8000});

server.on('connection', (ws) => {
    const id = uuid();
    clients[id] = ws;
    getBaseMessage(ws);
    //console.log(baseMessage);
    //ws.send(JSON.stringify(baseMessage));

    /* обработка сообщения */
    ws.on('message', message => {
        const messages = JSON.parse(message);
        console.log(messages);
        const fullName = messages.name;
        const id = messages.id;
        //const status = messages.status;
        const mess = messages.message;
        const event = messages._event;
        switch (event)
        {
            case 'add_user':
                addMessage([fullName, mess])
                usersList.set(id, fullName);
                console.log(usersList);
                server.clients.forEach(client => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify([{usersList: usersList, event: event}], replacer));
                    }
                });
                break;
            case 'disconnect':
                addMessage([fullName, mess])
                usersList.delete(id);
                server.clients.forEach(client => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify([{fullName: fullName, message: mess, usersList: usersList, event: event}], replacer));
                    }
                });
                break;
            case 'send_message':
                addMessage([fullName, mess])
                server.clients.forEach(client => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify([{fullName: fullName, message: mess, event: event}], replacer));
                    }
                });
                break;
        }
        //console.log(messages);
        /* добавление письма в базу */
        //addMessage([fullName, mess])

        /*/!* добавление или удаление пользователя *!/
        if (status === 'online') {
            //console.log(usersList);
            if (usersList.indexOf(fullName) === -1) {
                usersList.push(fullName);
            }
        } else if (status === 'offline') {
            let i = usersList.indexOf(fullName);
            if (i >= 0) {
                usersList.splice(i, 1);
            }
        }
        console.log(usersList);
        /!* отправление сообщений пользователям *!/
        server.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify([{fullName: fullName, message: mess, usersList: usersList}] ));
            }
        });*/
    });
});
function replacer(key, value) {
    if(value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
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

function connectToBD()
{
    connection = mysql.createConnection({
        host: "localhost",
        port: "8989",
        user: "dev",
        database: "chat",
        password: "dev"
    });
}

function getBaseMessage(ws)
{
    connection.query("SELECT * FROM message",
        function(err, results) {
            results["event"] = 'send_message';
            console.log(results);
            ws.send(JSON.stringify(results, replacer));
            //console.log(results); // собственно данные
        });
}

function addMessage(data)
{
    const sql = "INSERT INTO message (id, fullName, message) VALUES (NULL, ?, ?)";
    connection.query(sql, data, function(err, results) {
            //console.log(err);
            //console.log(results); // собственно данные
        });
}


