import adapter from "webrtc-adapter";

class WebRTCPeerConnection {

    constructor({
        initConfig,
        errorHandler,
        remoteStreamHandler,
        signalHandler
    }) {

        // save init configuration
        this.initConfig = initConfig;
        // record the time the connnection was started
        this.startTime = Date.now();

        // perfect nogotiation pattern
        this.polite = false;
        this.initiator = false;
        this.makingOffer = false;
        this.ignoreOffer = false;
        this.conHasStarted = false;
        this.localStream = false;
        this.remoteStream = null;

        // needed argument to create RTCPeerConnection instance
        // and to create an offer
        this.rtcConfig = initConfig.rtcConfig;
        this.offerConstraints = initConfig.offerConstraints;

        // RTCPeerConnection creation and initialization
        this.pc = new RTCPeerConnection(this.rtcConfig);
        this.pc.onnegotiationneeded = this.onnegotiation.bind(this);
        this.pc.onicecandidate = this.onIceCandidate.bind(this);
        this.pc.onconnectionstatechange = this.onIceConnectionStateChange.bind(this);
        this.pc.onicecandidateerror = this.onIceCandidateError;
        this.pc.ontrack = this.receivedRemoteStream.bind(this);
        this.pc.onconnectionstatechange = this.connectionStateChange.bind(this);
        this.pc.onicegatheringstatechange = ev => {
            let connection = ev.target;

            switch (connection.iceGatheringState) {
                case "gathering":
                    console.log("gathering");
                    break;
                case "complete":
                    console.log("complete");
                    break;
            }
        }
        this.pc.oniceconnectionstatechange = ev => {
            let state = this.iceConnectionState;

            switch (state) {
                case "new":
                    console.log("ice connection state : new");
                    break;
                case "checking":
                    console.log("ice connection state : checking");
                    break;
                case "connected":
                    console.log("ice connection state : connected");
                    break;
                case "completed":
                    console.log("ice connection state : completed");
                    break;
                case "failed":
                    console.log("ice connection state : failed");
                    break;
                case "disconnected":
                    console.log("ice connectionstate: disconnected");
                    break;
                case "closed":
                    console.log("closed and no longer handling response");
                    break;
            }
        }

        // callbacks to handle various RTCPeeconnection event
        // will be initialized by the app layer
        this.onErrorCB = errorHandler;
        this.onRemoteStreamCB = remoteStreamHandler;
        this.onSignaler = signalHandler;

    }

    /** connection change */

    connectionStateChange(event) {
        switch (this.pc.connectionState) {
            case "connected":
                this.conHasStarted = true;
                console.log("connection has started");
                break;
            case "disconnected":
            case "failed":
            // One or more transports has terminated unexpectedly or in an error
            case "closed":
                console.log("disconnected, failed, closed");
                // The connection has been closed
                this.conHasStarted = false
                break;
        }
    }

    onnegotiation() {
        if (!this.pc) {
            return;
        }

        if (!this.conHasStarted) {
            return
        }

        console.log("negoation under way");

        this.makingOffer = true;

        // calling without arguments automatically creates and sets the 
        // appropriate description based on the current signalingState.
        this.pc.setLocalDescription()
            .then(() => {
                this.sendMessageToSignaler({
                    polite: this.polite,
                    startTime: this.startTime,
                    peerData: {
                        type: "description",
                        description: this.pc.localDescription
                    }
                });
                console.log("sent description on negotiation");
            })
            .catch(err => {
                console.log(false);
                this.onerror(
                    {
                        type: "FSLD",
                        message: "FAILETOSETLOCALDESCRIPTION: onenogationneeded failed to setLocalDescription().",
                        error: err
                    }
                );
            })
            .finally(() => {
                this.makingOffer = false;
            });
    }

    /** Ice */

    onIceConnectionStateChange(event) {

        console.log(event);
        console.log("iceConnectionState: " + this.pc.iceConnectionState);

        if (!this.pc) {
            return
        }

        if (this.pc.iceConnectionState === "failed") {
            this.pc.restartIce();
        }

    }

    onIceCandidate({ candidate }) {

        if (candidate && candidate.candidate && this.onSignaler) {

            // console.log("---------------- filtered candidate -------------");
            // console.log(candidate.candidate);

            this.sendMessageToSignaler({
                polite: this.polite,
                startTime: this.startTime,
                peerData: {
                    type: "candidate",
                    candidate: JSON.stringify({ ice: candidate })
                }
            });

            console.log("ice candidate sent");

        } else {
            this.onerror({
                type: "EOI",
                message: "ENDOFICECANDIDATES: filtered all the non udp and null ice candidate "
            });
        }

    }

    onIceCandidateError(event) {
        console.log("On candidate Error");
        console.log(event);
    }

    /** Connection configuration */

    // caller will always be polite, people in the room
    // will always be an impolite peer and ignore the offer 
    // and respond with their own offer
    startCall() {
        console.log("started call ");

        if (!this.pc) {
            return;
        }

        // check if we connection has already started, offer/answer
        if (this.makingOffer || this.conHasStarted) {
            return;
        }

        this.makingOffer = true;
        this.polite = true;
        this.initiator = true;

        let constraints = this.initConfig.offerConstraints;
        // create an offer
        console.log("creating offer");
        this.pc.createOffer(constraints)
            .then((offer) => {

                console.log("setting localDescription");
                this.pc.setLocalDescription(new RTCSessionDescription(offer))
                    .then(() => {
                        console.log("got localDescription, sending offer");
                        console.log(this.pc.localDescription);

                        this.sendMessageToSignaler({
                            polite: this.polite,
                            startTime: this.startTime,
                            peerData: {
                                type: "description",
                                description: this.pc.localDescription
                            }
                        });

                        console.log("offer sent to signal channel");
                    })
                    .catch(err => {
                        this.onerror({
                            type: "FSLD",
                            message: "FAILETOSETLOCALDESCRIPTION: failed to setLocalDescription() while creating offer",
                            error: err
                        });
                    });

            })
            .catch(err => {
                this.onerror({
                    type: "FTCO",
                    message: "FAILEDTOCREATEOFFER: failed while creating offer as a caller",
                    err: err
                });
            })
            .finally(() => this.makingOffer = false);
    }

    /** user Media / stream */

    // adds tracks from stream to the peer connection
    addLocalStream(stream) {
        if (!this.pc) {
            return;
        }

        console.log("stream: ")
        console.log(stream);
        // add each track to the stream
        for (const track of stream.getTracks()) {
            this.pc.addTrack(track, stream);
        }
        this.localStream = true;
        console.log("added localstream to the connection");
    }

    // forwards the remote stream usig a cb func
    receivedRemoteStream(event) {

        // if cb has been initialized else call error
        if (!this.onRemoteStreamCB) {
            console.log("NO remote stream callback");
            this.onerror(
                {
                    type: "FINI",
                    msg: "FEATUREISNOTIMPLEMENTED: cb function not provided to the RTCPeerConnection Instance when remoteStream is received."
                }
            );
            return;
        }

        // call back that handles the stream from remote peer
        this.remoteStream = event.streams;
        console.log(event.streams);
        this.onRemoteStreamCB(event);
    }

    /** signaling */

    // receive messages from signaler
    receivedMessageFromSignaler({ description, candidate }) {
        console.log("Received msg from signal, I am polite peer: " + this.polite);
        console.log("description:")
        console.log(description);
        console.log("candidate typeof : " + typeof candidate);
        console.log(candidate);
        if (!this.pc) {
            return;
        }

        if (description) {
            console.log("got description from Peer, type: " + description.type);
            // check for collision
            const offerCollision = (description.type == "offer") &&
                (this.makingOffer || this.pc.signalingState != "stable");
            console.log("Did i make and send offer?: " + this.makingOffer);
            console.log("detected offerCollison? : " + offerCollision);

            // polite peer will always answer and cancels its own offer
            this.ignoreOffer = !this.polite && offerCollision;

            console.log("Implite peer igonered offer: " + this.ignoreOffer);
            if (this.ignoreOffer) {
                console.log(" already have an offer sendt, ignore this offer");
                return;
            }

            console.log("creating answer and sending it back");

            // if no collision was detected then save the remote description
            // if it was an offer then send the answer else ignore it
            // set the remote description
            this.pc.setRemoteDescription(new RTCSessionDescription(description))
                .then(() => {
                    // answer with an offer
                    if (description.type == "offer") {
                        this.pc.createAnswer()
                            .then(answer => this.pc.setLocalDescription(answer))
                            .then(() => {
                                this.sendMessageToSignaler({
                                    polite: this.polite,
                                    startTime: this.startTime,
                                    peerData: {
                                        type: "description",
                                        description: this.pc.localDescription
                                    }
                                });
                            })
                            .catch(err => {
                                this.onerror({
                                    type: "FSLD",
                                    message: "FAILEDTOSENDLOCALDESCRIPTION: faile to send answer after receiving offer as polite peer.",
                                    err: err
                                });
                            });
                    }
                })
                .catch(err => {
                    this.onerror({
                        type: "FSRD",
                        message: "FAILEDTOSETREMOTEDESCRIPTION: failed to set remote description as a polite peer",
                        err: err
                    });
                });
            // candidate
        } else if (candidate) {
            let ice = JSON.parse(candidate).ice;
            console.log("got ice candidate =-=========");
            console.log(ice);
            if (ice) {
                this.pc.addIceCandidate(ice)
                    .then(() => console.log("added ice candidate from peer"))
                    .catch(err => {
                        if (!this.ignoreOffer) {
                            this.onerror({
                                type: "FAIC",
                                message: "FAILEDTOADDICECANDIDATE: failed to add ice candidate, received from the signaler",
                                err: err
                            });
                        }
                    });
            }
        }
    }

    // send messages to signaler using the CB
    sendMessageToSignaler(msg) {
        if (!msg) {
            this.onerror({
                error: "can't send empty msg to signal, peer connection"
            });
        }
        if (!this.onSignaler) {
            this.onerror({
                error: "failed to send message using signalChannel ien peerCon, CB not implemented"
            });
            return;
        }
        this.onSignaler(msg);
    }

    // forwards all the error using a cb func
    // if the you have implemented aa error handler
    onerror(error) {
        console.log(error);
        // alert(error.message);
        if (this.onErrorCB) {
            // cb that handles error
            this.onErrorCB(error);
        }
    }

    close() {
        if (!this.pc) {
            return;
        }

        this.pc.close();
        this.pc = null;
    }
}

export default WebRTCPeerConnection;
