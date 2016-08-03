# websocket.sh

Copyright (C) 2016 Anton Skshidlevsky (meefik), MIT

The cross platform [WebSocket](https://tools.ietf.org/html/rfc6455) implementation for SH. It works on busybox and ash for embedded systems.

### Bash shell as a web terminal

Run web server httpd in websocket.sh directory:
```sh
httpd -p 8080
```
Open the terminal in browser: [http://localhost:8080/cgi-bin/terminal](http://localhost:8080/cgi-bin/terminal)

### Custom usage

Run websocket.sh:
```sh
WS_SHELL="bash -i" ncat -l -p 5000 -e websocket.sh
```
Use from browser:
```js
var port = 5000;
var ws = new WebSocket('ws://' + location.hostname + ':' + port);
ws.onmessage = function(msg) {
    // convert base64 to string
    var data = atob(msg.data);
    // decoding utf-8 chars
    data = decodeURIComponent(escape(data));
    console.log('Received data: ', data);
}
ws.onclose = function() {
    console.log('Connection closed.');
}
// send command: ls /
var data = 'ls /';
ws.send(btoa(data));
```

