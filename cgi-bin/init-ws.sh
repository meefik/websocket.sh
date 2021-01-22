#!/bin/sh
let PORT=${HTTP_HOST##*:}
if [ $PORT -eq 0 ]
then
  WS_PORT=12010
else
  WS_PORT=$(( PORT+1 ))
fi
nc -l -p ${WS_PORT} -e ../websocket.sh </dev/null >/dev/null &
echo "Content-Type: text/html"
echo ""
