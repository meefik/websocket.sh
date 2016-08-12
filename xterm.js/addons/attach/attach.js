/*
 * Implements the attach method, that
 * attaches the terminal to a WebSocket stream.
 *
 * The bidirectional argument indicates, whether the terminal should
 * send data to the socket as well and is true, by default.
 */

(function (attach) {
  if (typeof exports === 'object' && typeof module === 'object') {
    /*
     * CommonJS environment
     */
    module.exports = attach(require('../../src/xterm'));
  } else if (typeof define == 'function') {
    /*
     * Require.js is available
     */
    define(['../../src/xterm'], attach);
  } else {
    /*
     * Plain browser environment
     */
    attach(this.Xterm);
  }
})(function (Xterm) {
  'use strict';

  /**
   * This module provides methods for attaching a terminal to a WebSocket
   * stream.
   *
   * @module xterm/addons/attach/attach
   */
  var exports = {};

  /**
   * Attaches the given terminal to the given socket.
   *
   * @param {Xterm} term - The terminal to be attached to the given socket.
   * @param {WebSocket} socket - The socket to attach the current terminal.
   * @param {boolean} bidirectional - Whether the terminal should send data
   *                                  to the socket as well.
   * @param {boolean} buffered - Whether the rendering of incoming data
   *                             should happen instantly or at a maximum
   *                             frequency of 1 rendering per 10ms.
   */
  exports.attach = function (term, socket, bidirectional, buffered) {
    bidirectional = (typeof bidirectional == 'undefined') ? true : bidirectional;
    term.socket = socket;

    function unescape(str) {
        return str.replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        });
    }

    function escape(str) {
        return Array.prototype.map.call(str, function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('');
    }

    var failCounter = 0;
    term._flushBuffer = function () {
      try {
          term.write(decodeURIComponent(term._attachSocketBuffer));
      } catch(e) {
          setTimeout(term._flushBuffer, 10);
          if (failCounter++ < 100) return;
      }
      failCounter = 0;
      // term.write(term._attachSocketBuffer);
      term._attachSocketBuffer = null;
      clearTimeout(term._attachSocketBufferTimer);
      term._attachSocketBufferTimer = null;
    };

    term._pushToBuffer = function (data) {
      if (term._attachSocketBuffer) {
        term._attachSocketBuffer += data;
      } else {
        term._attachSocketBuffer = data;
        setTimeout(term._flushBuffer, 10);
      }
    };

    term._getMessage = function (ev) {
      var data = escape(atob(ev.data));
      if (buffered) {
        term._pushToBuffer(data);
      } else {
        term.write(data);
      }
    };

    term._sendData = function (data) {
      socket.send(btoa(unescape(encodeURIComponent(data))));
    };

    socket.addEventListener('message', term._getMessage);

    if (bidirectional) {
      term.on('data', term._sendData);
    }

    socket.addEventListener('close', term.detach.bind(term, socket));
    socket.addEventListener('error', term.detach.bind(term, socket));
  };

  /**
   * Detaches the given terminal from the given socket
   *
   * @param {Xterm} term - The terminal to be detached from the given socket.
   * @param {WebSocket} socket - The socket from which to detach the current
   *                             terminal.
   */
  exports.detach = function (term, socket) {
    term.off('data', term._sendData);

    socket = (typeof socket == 'undefined') ? term.socket : socket;

    if (socket) {
      socket.removeEventListener('message', term._getMessage);
    }

    delete term.socket;
  };

  /**
   * Attaches the current terminal to the given socket
   *
   * @param {WebSocket} socket - The socket to attach the current terminal.
   * @param {boolean} bidirectional - Whether the terminal should send data
   *                                  to the socket as well.
   * @param {boolean} buffered - Whether the rendering of incoming data
   *                             should happen instantly or at a maximum
   *                             frequency of 1 rendering per 10ms.
   */
  Xterm.prototype.attach = function (socket, bidirectional, buffered) {
    return exports.attach(this, socket, bidirectional, buffered);
  };

  /**
   * Detaches the current terminal from the given socket.
   *
   * @param {WebSocket} socket - The socket from which to detach the current
   *                             terminal.
   */
  Xterm.prototype.detach = function (socket) {
    return exports.detach(this, socket);
  };

  return exports;
});
