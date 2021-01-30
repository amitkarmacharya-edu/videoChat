"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = {
  // send sdp
  send: function send() {
    return _axios["default"].post("/api/signalingSerivce");
  }
};
exports["default"] = _default;