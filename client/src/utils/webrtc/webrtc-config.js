// RTCPeerConnection configuration
const rtcConfig = {
    iceServers: [
        { 
            urls: [
                    "stun:stun1.l.google.com:19302",
                ]
        }
    ],
    // bundlePolicy: "max-compat",
    // /**
    //  * Settting the value to "relay", can prevent the remote endpoint
    //  * from receiving the user's IP addresses, which may be important
    //  * in some security situations. unless the callee has agreed to 
    //  * receive the call
    // //  */
    // iceTransportPolicy: "all"
};

const peerConConfig = {
    initConfig: {
        rtcConfig: rtcConfig,
        offerConstraints: {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1,
            voiceActivityDetection: false
        }
    }
};

export default peerConConfig;


