#!/bin/bash

[ -n "$WS_SHELL" ] || WS_SHELL="bash"

# read pipe as hex without separating and convert to char
hex_to_bin()
{
    while read -n 2 code
    do
        if [ -n "$code" ]; then
            printf "\x$code"
        fi
    done
}

# get arguments, first argument - 2
get_arg()
{
    eval "echo \$$1"
}

# check contains a byte 81
is_packet()
{
    printf "$1" | grep -q $(printf '\x81')
}

# read N bytes from pipe and convert to unsigned decimal 1-byte units (space seporated)
read_dec()
{
    dd bs=$1 count=1 2>/dev/null | od -A n -t u1 -w$1
}

# read pipe and convert to websocket frame
# see RFC6455 "Base Framing Protocol"
ws_send()
{
    while true
    do
        # ws limit 125 bytes (93 bytes for base64)
        # base64 length for n bytes: 4 * n / 3
        data=$(dd bs=93 count=1 2>/dev/null | base64)
        # exit if received 0 bytes
        [ "${#data}" != "0" ] || break
        # 0x8 -> the final frame
        # 0x1 -> textual frame
        printf "\x81\x$(printf '%02x' ${#data})$data"
    done
}

# initialize websocket connection
ws_connect()
{
    while read line
    do
        if printf %s "$line" | grep -q $'^\r$'; then
            outkey=$(printf %s "$sec_websocket_key" | dos2unix)
            outkey="${outkey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
            outkey=$(printf %s "$outkey" | sha1sum | cut -d ' ' -f 1 | hex_to_bin | base64)
            #outkey=$(printf %s "$outkey" |  openssl dgst -binary -sha1 | openssl base64)
            printf "HTTP/1.1 101 Switching Protocols\r\n"
            printf "Upgrade: websocket\r\n"
            printf "Connection: Upgrade\r\n"
            printf "Sec-WebSocket-Accept: %s\r\n" "$outkey"
            printf "\r\n"
            break
        else
            case "$line" in
                Sec-WebSocket-Key*)
                    sec_websocket_key=$(get_arg 3 $line)
                    ;;
            esac
        fi
    done
}

# main loop
ws_server()
{
    while read -n 1 flag
    do
        # each packet starts at byte 81
        is_packet "$flag" || continue
        # read next 5 bytes:
        # 1 -> length
        # 2-5 -> encoding bytes
        header=$(read_dec 5)
        # get packet length
        let length=$(get_arg 2 $header)-128
        # read packet
        let i=0
        for byte in $(read_dec $length)
        do
            # decoding byte: byte ^ encoding_bytes[i % 4]
            let byte=byte^$(get_arg $(($i % 4 + 3)) $header)
            printf "\x$(printf '%02x' $byte)"
            let i=i+1
        done | base64 -d
    done | $WS_SHELL 2>&1 | ws_send
}

# start
ws_connect &&
ws_server
