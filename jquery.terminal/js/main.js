$(document).ready(function() {
    var buffer = '';
    var port = parseInt(location.port) + 1;
    var ws = new WebSocket('ws://' + location.hostname + ':' + port);

    function send(command) {
        // string to base64
        var data = btoa(unescape(encodeURIComponent(command + '\n')));
        ws.send(data);
    }

    function print(data) {
        // concatenate previous fragment
        if (buffer) data = buffer + data;
        // get data without last line
        var arr = data.split('\n');
        buffer = arr.pop();
        data = arr.join('\n');
        // decoding utf-8 chars
        data = decodeURIComponent(escape(data));
        // print on terminal
        terminal.echo(data);
    }

    var terminal = $('#terminal').terminal(function(command, terminal) {
        send(command);
    }, {
        greetings: 'Welcome to websocket.sh terminal',
        prompt: 'shell $ ',
        exit: false
    });
    window.terminal = terminal;

    ws.onopen = function() {
        terminal.enable();
    };
    ws.onclose = function() {
        terminal.disable();
    };
    ws.onmessage = function(msg) {
        // convert base64 to string
        var data = atob(msg.data);
        // show data
        print(data);
    };
});
