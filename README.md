# websocket.sh

Copyright (C) 2016 Anton Skshidlevsky (meefik), MIT

The cross platform [WebSocket](https://tools.ietf.org/html/rfc6455) implementation for SH. It works on busybox and ash for embedded systems.

### Bash shell as a web terminal

Run web server httpd in websocket.sh directory. For [JQuery Terminal Emulator](http://terminal.jcubic.pl):
```sh
cd jquery.terminal
WS_SHELL="bash" httpd -p 8080
```
For [Terminal.js](http://terminal.js.org):
```sh
cd terminal.js
WS_SHELL="bash -i" httpd -p 8080
```
For [xterm.js](https://github.com/sourcelair/xterm.js):
```sh
cd xterm.js
telnetd -p 5023 -l /bin/bash
WS_SHELL="telnet 127.0.0.1 5023" httpd -p 8080
```
Open the terminal in browser: [http://localhost:8080/cgi-bin/terminal](http://localhost:8080/cgi-bin/terminal)

### Custom usage

Run websocket.sh:
```sh
WS_SHELL="sh" ncat -l -p 5000 -e websocket.sh
```
Use from browser:
```js
var port = 5000;
var ws = new WebSocket('ws://' + location.hostname + ':' + port);
ws.onmessage = function(msg) {
    // convert base64 to string
    var data = atob(msg.data);
    // decode utf-8 chars
    data = decodeURIComponent(escape(data));
    console.log('Received data: ', data);
}
ws.onclose = function() {
    console.log('Connection closed.');
}
// send command: ls /
var data = 'ls /';
// encode utf-8 chars
data = unescape(encodeURIComponent(data));
// convert string to base64
data = btoa(data);
ws.send(data);
```
