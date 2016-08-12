var term,
    protocol,
    port,
    socketURL,
    socket;

var terminalContainer = document.getElementById('terminal-container');
var optionElements = {
    cursorBlink: true
};

createTerminal();

function createTerminal() {
    while (terminalContainer.children.length) {
        terminalContainer.removeChild(terminalContainer.children[0]);
    }
    term = new Terminal({
        cursorBlink: optionElements.cursorBlink.checked
    });
    protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    port = parseInt(location.port) + 1;
    socketURL = protocol + location.hostname + ((port) ? (':' + port) : '');
    socket = new WebSocket(socketURL);

    term.open(terminalContainer);

    socket.onopen = function() {
        term.attach(socket, true, true);
        term._initialized = true;
    };
}
