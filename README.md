# websocket.sh

Copyright (C) 2016-2020 Anton Skshidlevsky (meefik), MIT

The cross platform [WebSocket](https://tools.ietf.org/html/rfc6455) implementation for UNIX shell. It works on busybox and ash for embedded systems (requires installing busybox applets).

### Bash shell as a web terminal

Run web server httpd in websocket.sh directory. For [JQuery Terminal Emulator](http://terminal.jcubic.pl):
```sh
cd jquery.terminal
WS_SHELL="sh" httpd -p 8080
```
For [xterm.js](https://github.com/sourcelair/xterm.js):
```sh
cd xterm.js
telnetd -p 5023 -l "/bin/sh" -f ./issue
WS_SHELL="telnet 127.0.0.1 5023" httpd -p 8080
```
Open the terminal in browser: [http://localhost:8080/cgi-bin/terminal](http://localhost:8080/cgi-bin/terminal)

### Custom usage

Run websocket.sh:
```sh
WS_SHELL="cat" nc -l -p 12010 -e websocket.sh
```
Use from browser:
```js
var port = 12010;
var ws = new WebSocket('ws://' + location.hostname + ':' + port);
ws.onmessage = function(ev) {
  var textDecoder = new TextDecoder();
  var fileReader = new FileReader();
  fileReader.addEventListener('load', function () {
    var str = textDecoder.decode(fileReader.result);
    console.log('Received data: ', str);
  });
  fileReader.readAsArrayBuffer(ev.data);
}
ws.onopen = function() {
  ws.send('hello');
}
```

### Multiple socket connections

You can use busybox inetd for multiple connections to single port for websocket.sh:
```sh
export WS_SHELL="/path/to/script.sh"
inetd -e -f /path/to/inetd.conf
```
```
# /path/to/inetd.conf
12010	stream	tcp	nowait	root	/path/to/websocket.sh
```
