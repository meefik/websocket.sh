window.onload = function () {

  function resizePty(pty, rows, cols, refresh) {
    if (!pty) return;
    var xhr = new XMLHttpRequest();
    var uri = 'resize?dev=' + pty + '&rows=' + rows + '&cols=' + cols;
    if (refresh) uri += "&refresh=1";
    xhr.open('GET', uri);
    xhr.send();
  }

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

  var pty;

  var protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
  var socketURL = protocol + location.hostname + ':' + wsPort;
  var socket = new WebSocket(socketURL);

  Terminal.applyAddon(fit);

  var xterm = new Terminal({ cursorBlink: true });
  xterm.open(document.getElementById('terminal'));
  xterm.fit();

  socket.addEventListener('message', function (ev) {
    blobToText(ev.data, function (str) {
      if (!pty) {
        var match = str.match(/\/dev\/pts\/\d+/);
        if (match) {
          pty = match[0];
          resizePty(pty, xterm.rows, xterm.cols);
        }
      }
      str = str.replace(/([^\r])\n|\r$/g, '\r\n');
      xterm.write(str);
    });
  });

  xterm.on('data', function (data) {
    socket.send(textToBlob(data));
  });

  xterm.on('resize', function (e) {
    resizePty(pty, e.rows, e.cols);
  });

  window.addEventListener('resize', function () {
    xterm.fit();
  });

  // Hot key for resize: Ctrl + Alt + r
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.altKey && e.keyCode == 82) {
      resizePty(pty, xterm.rows, xterm.cols, true);
    }
  });
};
