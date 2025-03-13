#!/bin/busybox sh

if [ -z "${WS_PORT}" ]
then
  PORT="${HTTP_HOST##*:}"
  if [ "${PORT}" -eq "${PORT}" ]
  then
    WS_PORT=$(( PORT+1 ))
  else
    WS_PORT=8081
  fi
fi

cd ..
nc -l -p "${WS_PORT}" -e websocket.sh </dev/null >/dev/null &

echo "Content-Type: application/javascript"
echo ""
echo "var WS_PORT = ${WS_PORT};"
