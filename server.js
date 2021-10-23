import ws from "ws";
import {v4 as uuid} from "uuid";

import {writeFile, readFileSync, existsSync} from "fs";

let usersList = [];
const log = existsSync('log') && readFileSync('log', 'utf-8');
const clients = {};
const server = new ws.Server({port: 8000});

server.on('connection', (ws) => {
    const id = uuid();
    clients[id] = ws;
    /* обработка сообщения */
    ws.on('message', message => {
        const messages = JSON.parse(message);
        const name = messages.name;
        const status = messages.status;
        const mess = messages.mes;
        /* добавление или удаление пользователя */
        if (status === 'online') {
            console.log(usersList);
            if (usersList.indexOf(name) === -1) {
                usersList.push(name);
            }
        } else {
            let i = usersList.indexOf(name);
            if (i >= 0) {
                usersList.splice(i, 1);
            }
        }
        /* отправление сообщений пользователям */
        server.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({name, mess, usersList}));
            }
        });
    });
});

process.on('SIGINT', () => {
    server.close();
    writeFile('log', JSON.stringify(log), err => {
        if (err) {
            console.log(err);
        }
        process.exit();
    })
})
