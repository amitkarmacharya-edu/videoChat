/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* More information about these options at jshint.com/docs/options */

/* globals parseJSON, trace, sendUrlRequest, RemoteWebSocket */
/* exported SignalingChannel */

'use strict';

import { io } from "socket.io-client";

// This class implements a signaling channel based on WebSocket.
var SignalingChannel = function(wssUrl, wssPostUrl) {
  this.wssUrl_ = wssUrl;
  this.wssPostUrl_ = wssPostUrl;
  this.roomId_ = null;
  this.clientId_ = null;
  this.websocket_ = null;
  this.registered_ = false;

  // Public callbacks. Keep it sorted.
  this.onerror = null;
  this.onmessage = null;
};

SignalingChannel.prototype.open = function() {
  if (this.websocket_) {
    return;
  }

  return new Promise(function(resolve, reject) {
    this.websocket_ = new WebSocket(this.wssUrl_);

    this.websocket_.onopen = function() {

      this.websocket_.onerror = function() {
      };
      this.websocket_.onclose = function(event) {
        // TODO(tkchin): reconnect to WSS.
        this.websocket_ = null;
        this.registered_ = false;
      };

      if (this.clientId_ && this.roomId_) {
        this.register(this.roomId_, this.clientId_);
      }

      resolve();
    }.bind(this);

    this.websocket_.onmessage = function(event) {

      var message = parseJSON(event.data);
      if (!message) {
        return;
      }
      if (message.error) {
        return;
      }
      this.onmessage(message.msg);
    }.bind(this);

    this.websocket_.onerror = function() {
      reject(Error('WebSocket error.'));
    };
  }.bind(this));
};

SignalingChannel.prototype.register = function(roomId, clientId) {
  if (this.registered_) {
    return;
  }

  this.roomId_ = roomId;
  this.clientId_ = clientId;

  if (!this.roomId_) {
  }
  if (!this.clientId_) {
  }
  if (!this.websocket_ || this.websocket_.readyState !== WebSocket.OPEN) {
    return;
  }
  var registerMessage = {
    cmd: 'register',
    roomid: this.roomId_,
    clientid: this.clientId_
  };
  this.websocket_.send(JSON.stringify(registerMessage));
  this.registered_ = true;

  // TODO(tkchin): Better notion of whether registration succeeded. Basically
  // check that we don't get an error message back from the socket.
};

SignalingChannel.prototype.close = function(async) {
  if (this.websocket_) {
    this.websocket_.close();
    this.websocket_ = null;
  }

  if (!this.clientId_ || !this.roomId_) {
    return;
  }
  // Tell WSS that we're done.
  var path = this.getWssPostUrl();

  return sendUrlRequest('DELETE', path, async).catch(function(error) {
  }.bind(this)).then(function() {
    this.clientId_ = null;
    this.roomId_ = null;
    this.registered_ = false;
  }.bind(this));
};

SignalingChannel.prototype.send = function(message) {
  if (!this.roomId_ || !this.clientId_) {
    return;
  }

  var wssMessage = {
    cmd: 'send',
    msg: message
  };
  var msgString = JSON.stringify(wssMessage);

  if (this.websocket_ && this.websocket_.readyState === WebSocket.OPEN) {
    this.websocket_.send(msgString);
  } else {
    var path = this.getWssPostUrl();
    var xhr = new XMLHttpRequest();
    xhr.open('POST', path, true);
    xhr.send(wssMessage.msg);
  }
};

SignalingChannel.prototype.getWssPostUrl = function() {
  return this.wssPostUrl_ + '/' + this.roomId_ + '/' + this.clientId_;
};

export default SignalingChannel;