import ws from "ws";
//import {v4 as uuid} from "uuid";
import mysql from "mysql2";

let connection;
connectToBD();
let usersList = new Map();
//const clients = {};
const server = new ws.Server({port: 8000});

server.on('connection', (ws) => {
    //const id = uuid();
    //clients[id] = ws;
    getDataBaseMessages(ws);
    /* обработка сообщения */
    ws.on('message', message => {
        const messages = JSON.parse(message);
        //console.log(messages);
        const fullName = messages.name;
        const id = messages.id;
        //const status = messages.status;
        const mess = messages.message;
        const event = messages._event;
        switch (event) {
            case 'add_user':
                //addMessage([fullName, mess])
                usersList.set(id, fullName);
                //console.log(usersList);
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
                break;
            case 'disconnect':
                //addMessage([fullName, mess])
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
    });
});

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

/*process.on('SIGINT', () => {
    server.close();
    writeFile('log', JSON.stringify(log), err => {
        if (err) {
            console.log(err);
        }
        process.exit();
    })
})*/


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
    const sql = "INSERT INTO message (id, fullName, message) VALUES (NULL, ?, ?)";
    connection.query(sql, data, function (err, results) {
    });
}


