"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
// RTCPeerConnection configuration
var rtcConfig = {
  iceServers: [{
    urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]
  }],
  bundlePolicy: "max-compat",

  /**
   * Settting the value to "relay", can prevent the remote endpoint
   * from receiving the user's IP addresses, which may be important
   * in some security situations. unless the callee has agreed to 
   * receive the call
   */
  iceTransportPolicy: "relay"
};
var _default = rtcConfig;
exports["default"] = _default;