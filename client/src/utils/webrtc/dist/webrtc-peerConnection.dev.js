"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _webrtcConfig = _interopRequireDefault(require("../webrtc/webrtc-config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var PeerConnection =
/*#__PURE__*/
function () {
  function PeerConnection(constraints) {
    _classCallCheck(this, PeerConnection);

    // config for RTCPeerConnection and constraints when creating an offer
    this.rtcConfig_ = _webrtcConfig["default"];
    this.constraints_ = constraints; // connection start time

    this.ConStartTime = new Date.now(); // craete peer connection

    this.pc_ = new RTCPeerConnection(this.rtcConfig_);

    this.pc_.oniceconnectionstatechange = function (e) {};

    this.pc_.onicecandidate = function (e) {};

    this.pc_.onsignalingstatechange = function (e) {};

    this.pc_.onnegotiationneeded = this.sessionNegotiation;

    this.pc_.ontrack = function () {}; // handle error


    this.handleError = function () {};

    this.isInit = true;
    this.started_ = true;
  } // creates and sends offer to remote peer


  _createClass(PeerConnection, [{
    key: "sessionNegotiation",
    value: function sessionNegotiation() {
      var offer;
      return regeneratorRuntime.async(function sessionNegotiation$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return regeneratorRuntime.awrap(this.pc_.createOffer);

            case 3:
              offer = _context.sent;
              return _context.abrupt("return", this.pc_.setLocalDescription(offer));

            case 7:
              _context.prev = 7;
              _context.t0 = _context["catch"](0);
              this.handleError({
                msg: "Error while creating and sending offer",
                err: _context.t0
              });

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[0, 7]]);
    }
  }, {
    key: "getIdentityAssertion",
    // get peer identity, peer identify must be validated
    // else setRemoteDescription() cannot result
    value: function getIdentityAssertion() {
      var pIdentity;
      return regeneratorRuntime.async(function getIdentityAssertion$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return regeneratorRuntime.awrap(this.pc_.peerIdentity);

            case 3:
              pIdentity = _context2.sent;
              return _context2.abrupt("return", pIdentity);

            case 7:
              _context2.prev = 7;
              _context2.t0 = _context2["catch"](0);
              this.handleError({
                msg: "Error Identifying remote peer",
                err: _context2.t0
              });
              return _context2.abrupt("return", null);

            case 11:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[0, 7]]);
    }
  }, {
    key: "createPeerConnections",
    value: function createPeerConnections() {} // gets all connection state

  }, {
    key: "getAllConnectionStates",
    value: function getAllConnectionStates() {
      if (!this.pc_) return null;
      return {
        connectionState: this.pc_.connectionState,
        iceConnectionState: this.pc_.iceConnectionState,
        iceGatheringState: this.pc_.iceGatheringState,
        signalingState: this.pc_.signalingState
      };
    }
  }]);

  return PeerConnection;
}();

exports["default"] = PeerConnection;