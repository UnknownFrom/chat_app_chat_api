const chatEl = document.getElementById("chat");
const ws = new WebSocket("ws://127.0.0.1:8000");
ws.onmessage = (message) => {
    const messages = JSON.parse(message.data);
    messages.forEach((val) => {
        const messageEl = document.createElement('div');
        messageEl.appendChild(document.createTextNode(`${val.name}: ${val.message}`));
        chat.appendChild(messageEl);
    })
}
const send = (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const message = document.getElementById("message").value;
    ws.send(JSON.stringify({
        name, message
    }))
    return false;
}
const formEl = document.getElementById("messageForm");
formEl.addEventListener("submit", send);
