#!/bin/busybox sh

for param in ${QUERY_STRING//&/ }
do
    key="${param%=*}"
    value="${param#*=}"
    eval ${key//[^a-zA-Z0-9_]/}=\"$value\"
done

if [ "$dev" -a "$rows" -a "$cols"  ]
then
    if [ -n "$refresh" ]
    then
        stty -F $dev rows $(($rows-1)) cols $(($cols-1))
    fi
    stty -F $dev rows $rows cols $cols
fi

echo "Content-Type: text/plain"
echo ""
