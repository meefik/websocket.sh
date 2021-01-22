# websocket.sh

Copyright (C) 2016-2020 Anton Skshidlevsky (meefik), MIT

The cross platform [WebSocket](https://tools.ietf.org/html/rfc6455) implementation for UNIX shell.
It works on busybox and ash for embedded systems (requires installing busybox applets).

![demo](./demo.gif)

[На русском / In Russian](https://meefik.github.io/2016/08/04/websocket-sh/)

### Bash shell as a web terminal

Run web server httpd in websocket.sh directory.
For [JQuery Terminal Emulator](https://terminal.jcubic.pl/):
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
Open the terminal in browser: [http://localhost:8080/](http://localhost:8080/)

### Custom usage

Run websocket.sh:
```sh
WS_SHELL="cat" nc -l -p 12010 -e websocket.sh
```
Use from browser:
```js
var wsPort = 12010;
var ws = new WebSocket('ws://' + location.hostname + ':' + wsPort);
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

When user closes tab ws disconnect then `nc` will also exit.
You can use `-ll` with `-e` for persistent server:

```sh
nc -ll -p 12010 -e websocket.sh
```

### Multiple socket connections

You can use busybox inetd for multiple connections to single port for websocket.sh:
```sh
export WS_SHELL="/path/to/script.sh"
inetd -e -f /path/to/inetd.conf
```

The `/path/to/inetd.conf` may look like:
```
12010	stream	tcp	nowait	root	/path/to/websocket.sh
```

### Run on Ubuntu
Ubuntu already have busybox with `httpd` with cgi and `nc` with `-e`.
So to run the scripts you need to change shebang and add busybox to commands.
You can apply the patch:

```diff
diff --git a/cgi-bin/init-ws.sh b/cgi-bin/init-ws.sh
index 78fec21..086ecd2 100755
--- a/cgi-bin/init-ws.sh
+++ b/cgi-bin/init-ws.sh
@@ -1,4 +1,4 @@
-#!/bin/sh
+#!/bin/busybox sh
let PORT=${HTTP_HOST##*:}
if [ $PORT -eq 0 ]
@@ -6,7 +6,7 @@ then
else
WS_PORT=$(( PORT+1 ))
fi
-nc -l -p ${WS_PORT} -e ../websocket.sh </dev/null >/dev/null &
+busybox nc -l -p ${WS_PORT} -e ../websocket.sh </dev/null >/dev/null &
echo "Content-Type: application/javascript"
diff --git a/cgi-bin/resize b/cgi-bin/resize
index 903768d..ab82f33 100755
--- a/cgi-bin/resize
+++ b/cgi-bin/resize
@@ -1,4 +1,4 @@
-#!/bin/sh
+#!/bin/busybox sh
for param in ${QUERY_STRING//&/ }
diff --git a/websocket.sh b/websocket.sh
index affb009..6d86889 100755
--- a/websocket.sh
+++ b/websocket.sh
@@ -1,4 +1,4 @@
-#!/bin/sh
+#!/bin/busybox sh
# websocket.sh
# (C) 2016-2018 Anton Skshidlevsky <meefik@gmail.com>, MIT
```

Then to run xterm.js:
```sh
busybox telnetd -p 5023 -l "/bin/sh" -f ./issue
WS_SHELL="telnet 127.0.0.1 5023" busybox httpd -p 8080 -f -vv 
```

Here httpd started with debug mode so you can see any errors in cgi scripts.

#### Run on Ubuntu without busybox with native tools

In Ubuntu the `nc` command from `netcat-openbsd` doesn't have the `-e` option.
You'll need to install `ncat` package (`sudo apt install ncat`) and replace `nc` inside `init-ws.sh` with `ncat`.

The `/bin/sh` in Ubuntu is Dash and it doesn't have `read -n` option.
So you'll need to change shebang to `#!/bin/bash`
