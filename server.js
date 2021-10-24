import ws from "ws";
import {v4 as uuid} from "uuid";
import mysql from "mysql2";
let connection;
connectToBD();

import {writeFile, readFileSync, existsSync} from "fs";

let usersList = [];
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
        const fullName = messages.name;
        const status = messages.status;
        const mess = messages.message;
        const event = messages.event;
        if(event === 'add_user')
        {

        }
        //console.log(messages);
        /* добавление письма в базу */
        addMessage([fullName, mess])

        /* добавление или удаление пользователя */
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
        /* отправление сообщений пользователям */
        server.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify([{fullName: fullName, message: mess, usersList: usersList}] ));
            }
        });
    });
});

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
            ws.send(JSON.stringify(results));
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


