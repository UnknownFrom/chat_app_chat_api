import ws from "ws";
import {v4 as uuid} from "uuid";

import {writeFile, readFileSync, existsSync} from "fs";
let usersList = [];

const server = new ws.Server({port: 8000});

server.on('connection', (ws) => {
    ws.on('message', message => {
        const messages = JSON.parse(message);
        const name = messages.name;
        const status = messages.status;
        const mess = messages.mes;
        console.log(status);
        if(status === 'online')
        {
            console.log(usersList);
            if(usersList.indexOf(name) === -1) {
                usersList.push(name);
            }
        }
        else{
            let i = usersList.indexOf(name);
            if(i >= 0) {
                usersList.splice(i,1);
            }
        }
        console.log(mess);
        server.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({name, mess, usersList}));
            }
        });
    });
    ws.onclose = event => {
        server.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                const mess = event.reason;
                client.send(JSON.stringify({mess, usersList}));
            }
        });
    };
});


/*import ws from "ws";

import {v4 as uuid} from "uuid";

import {writeFile, readFileSync, existsSync} from "fs";

const {Server} = ws;
const clients = {};
const users = [];
const log = existsSync('log') && readFileSync('log', 'utf-8');
const messages = log ? JSON.parse(log) : [];

const wss = new ws.Server({port: 8081});
wss.on('connection', ws => {
    ws.on('message', message => {
        wss.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify([{name, message}]));
            }
        });
    });
});*/
/*wss.on("connection", (ws) => {
    const id = uuid();
    clients[id] = ws;
    users.push()
    messages.push()

    console.log(`Clients ${clients}`);
    console.log(`New client ${id}`);

    //console.log(`Message ${messages.data}`);
    ws.send(JSON.stringify(messages));

    ws.on('message', (rawMessage) => {
        const {name, message} = JSON.parse(rawMessage);
        messages.push({name, message});
        for (const id in clients) {
            clients[id].send(JSON.stringify([{name, message}]))
        }
    })

    ws.on('close', () => {
        delete clients[id];
        console.log(`Client is closed ${id}`)
    })
})

process.on('SIGINT', () => {
    wss.close();
    writeFile('log', JSON.stringify(messages), err => {
        if (err) {
            console.log(err);
        }
        process.exit();
    })
})*/
