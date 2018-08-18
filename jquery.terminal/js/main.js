function blobToText(data, callback) {
  var textDecoder = new TextDecoder();
  var fileReader = new FileReader();
  fileReader.addEventListener('load', function () {
    var str = textDecoder.decode(fileReader.result);
    callback(str);
  });
  fileReader.readAsArrayBuffer(data);
}

function textToBlob(str) {
  return new Blob([str]);
}

$(document).ready(function () {
  var port = parseInt(location.port) + 1;
  var ws = new WebSocket('ws://' + location.hostname + ':' + port);

  var terminal = $('#terminal').terminal(function (command, terminal) {
    ws.send(textToBlob(command + '\n'));
  }, {
    greetings: 'Welcome to websocket.sh terminal',
    prompt: 'shell $ ',
    exit: false
  });

  ws.onopen = function () {
    terminal.enable();
  };
  ws.onclose = function () {
    terminal.disable();
  };
  ws.onmessage = function (ev) {
    blobToText(ev.data, function (str) {
      terminal.echo(str);
    });
  };
});
