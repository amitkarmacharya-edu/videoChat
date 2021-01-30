import React, { useState, useEffect, useRef } from "react";
import WebRTCPeerConnection from "../../utils/webrtc/webrtc-peerConnection";
import SignalingChannel from "../../utils/webrtc/webrtc-signalingChannel";
import WebRTCUserMedia from "../../utils/webrtc/webrtc-userMedia";
import peerConConfig from "../../utils/webrtc/webrtc-config";
import adapter from "webrtc-adapter";
import "./style.css";
import API from "../../utils/API";

function MeetingRoom(props) {

    const { owner, userId, roomId, clearRoomId, removeMeeting, checkForRooms } = props;

    const [errorMsg, setErrorMsg] = useState("");
    const [infoMsg, setInfoMsg] = useState("");

    // refs
    const remoteCam = useRef();
    const selfiCam = useRef();

    let pcs = {};
    let signalingChannel = null;
    let userMedia = null;

    // initializes the app
    useEffect(() => {
        init();
        return () => {
            checkForRooms();
        };
    },[]);

    function init() {
        console.log("userId : " + userId);
        console.log("roomId : " + roomId);
        console.log("owner: " + owner);
        console.log("initializing meetingroom");

        if (signalingChannel) {
            return;
        }

        Promise.all([
            createSocketConnection(),
            joinSocketRoom(),
            setupUserMedia()
        ])
            .then((fulfillment) => {
                console.log("setup was successfull");
            },
                (rejection) => {
                    leaveRoom();
                });

    }

    /** SignalChannel */
    function createSocketConnection() {
        console.log("creating Socket Connection");
        return new Promise((resolve, reject) => {
            if (signalingChannel && signalingChannel.socket) {
                resolve();
            }
            try {
                signalingChannel = new SignalingChannel("ws://127.0.0.1:3001",
                    handleSignalError,
                    incomingSignalMessage
                );
                signalingChannel.open();
                console.log(signalingChannel);
                console.log("creating Socket Connection: successfull");
                resolve();
            } catch (e) {
                console.log("Erro while creating signal channel");
                reject();
            }
        });
    }

    function closeSocketConnection() {
        console.log(signalingChannel);
        if (!signalingChannel) {
            return;
        }
        signalingChannel.close();
        signalingChannel = null;
    }

    function joinSocketRoom() {
        return new Promise((resolve, reject) => {
            if (roomId === "") {
                onerror("need roomId to load the socket");
                reject();
            }

            if (!(signalingChannel && signalingChannel.socket)) {
                onerror("socket connection hasn't been established");
                reject();
            }

            console.log("connecting to the socket room");

            signalingChannel.connectToRoom(roomId, userId);
            resolve();
        });

    }

    /** peer Connection */
    function createPeerConnection(params, remoteUserId = "NO_ID") {
        console.log("creating peer connection");
        const cb = {
            errorHandler: handleError,
            remoteStreamHandler: remoteStreamHandler,
            signalHandler: sendSignalMessage,
        }
        let pc = {
            con: new WebRTCPeerConnection({ ...params, ...cb }),
            remoteUserId: remoteUserId,
        };

        pc.con.addLocalStream(userMedia.getLocalStream());
        pcs[remoteUserId] = pc;
        console.log(pc);
        console.log(pcs);
        console.log("created peer connection");

    }

    function closePeerConnection() {
        if (!pcs) {
            return;
        }

        Object.keys(pcs).forEach(pc => {
            pc.pc.close();
        });
        pcs = {};
    }

    function setupPeerConnection({ userId, data }) {

        if(Object.keys(pcs).length <= 0){
            console.log("No existing connection so new connection was found")
            createPeerConnection(peerConConfig);
            if (pcs && pcs["NO_ID"]){
                let pc = pcs["NO_ID"];
                delete pcs["NO_ID"];
                console.log(pcs);
                pc.remoteUserId = userId;
                pc.polite = !data.polite;
                pcs[userId] = pc;

                if(!pcs[userId].con.localStream){
                    pcs[userId].con.addLocalStream(userMedia.getLocalStream());
                }
                pcs[userId].con.receivedMessageFromSignaler(data.peerData);
            }
        } else if (pcs && pcs[userId]){
            console.log("FOund user with id: " + userId);
            if(!pcs[userId].con.localStream){
                pcs[userId].con.addLocalStream(userMedia.getLocalStream());
            }
            pcs[userId].con.receivedMessageFromSignaler(data.peerData);
        } else if (pcs && pcs["NO_ID"]) {

            console.log(`polite: ${data.polite}, startTime: ${data.startTime}`);

            let bePolite = pcs["NO_ID"].con.startTime > data.startTime;
            pcs["NO_ID"].con.polite = bePolite;
            pcs["NO_ID"].remoteUserId = userId;
            let pc = pcs["NO_ID"];
            delete pcs["NO_ID"];
            pcs[userId] = pc;


            console.log(`changed NO_ID to : ${userId} and bePolite: ${pcs[userId].polite}`);
            console.log(pcs);

            if(!pcs[userId].con.localStream){
                pcs[userId].con.addLocalStream(userMedia.getLocalStream());
            }
            pcs[userId].con.receivedMessageFromSignaler(data.peerData)
        }

    }


    function connectToPeers() {
        console.log("connecting to peer");
        console.log("creating NO_ID peer connection");

        createPeerConnection(peerConConfig);

        if (pcs && pcs["NO_ID"]) {
            console.log("starting call");
            pcs["NO_ID"].con.startCall();
            console.log("started Peer Connection");
        } else {
            console.log("no pcs connections");
        }
    }

    /**             roomId: this.roomId,
                    userId: this.userId,
     * 
     *                   data:   {
                            polite: this.polite,
                            type: "description",
                            description: this.pc.localDescription
                            }
     */

    function incomingSignalMessage(roomId, userId, data) {
        console.log("received from peers");
        console.log(roomId);
        console.log(userId);
        console.log(data);
        if (!data || !userId) {
            console.log(data);
            console.log(userId);
            onerror({
                error: `Need data  and userId, Got data:${data && true} and userId: ${userId && true}`
            });
            return;
        }
        if (data.error) {
            console.log(data.error)
            onerror(data.error);
            return;
        }
        setupPeerConnection({ userId, data })
    }

    function sendSignalMessage(msg) {

        console.log("received msg from peerCon sending msg to signal channel");
        console.log(msg);
        if (!msg) {
            return;
        }

        if (!signalingChannel) {
            onerror("no signaling channel present to send msgs");
            return;
        }

        signalingChannel.send(msg);

    }

    function handleSignalError(error) {
        console.log(error);
    }

    /** getUserMedia */

    function setupUserMedia() {
        return new Promise((resolve, reject) => {

            console.log("setting up user media");
            // check if weRTC is supported
            let isWebRTCSupported = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia ||
                window.RTCPeerConnection;

            if (!isWebRTCSupported) {
                this.handleError({
                    error: "webRTC is not supported in your browser/device. We recommend using Firefox or Google chrome."
                });
                reject();
            }

            console.log("creating userMedia");
            userMedia = new WebRTCUserMedia({
                audio: true,
                video: true
                // call backs
            }, handleError, handleInfo, gotLocalStream);
            resolve();
        });
    }

    function closeUserMedia() {
        if (!userMedia) {
            console.log("no media");
            return;
        }
        userMedia.close();
        userMedia = null;
        console.log("media closed");
    }

    function gotLocalStream() {
        console.log("got local stream , invoked by userMedia open inside .then()");
        playLocalStream();
        if(owner){
            console.log("wait for other users to connect");
        } else {
            connectToPeers();
        }
    }

    function playLocalStream() {
        if (!userMedia) {
            this.onerror({
                error: "No Local Media"
            });
            return;
        }

        console.log("playing local stream");
        console.log(selfiCam)
        // older browsers may not have srcObject
        selfiCam.current.srcObject = userMedia.getLocalStream();
        selfiCam.current.muted = true;

    }

    function remoteStreamHandler({ track, streams }) {

        console.log(track);
        console.log(streams);

        console.log(remoteCam.current);
        console.log(remoteCam.current.srcObject);

        track.onunmute = () => {
            console.log("inside onunmute")
            if (remoteCam.current.srcObject) {
                return;
            }
            remoteCam.current.srcObject = streams[0];
            console.log("Playing remote video");
            console.log(remoteCam.current.srcObject);
        }
        // console.log(remoteCam.current.srcObject)

    }

    /** Meeting */
    function closeMeeting() {
        console.log("close meeting");
        clearRoomId();
        checkForRooms();
        removeMeeting();
        closeUserMedia();
        closeSocketConnection();
        closePeerConnection();
    }

    function leaveRoom() {
        console.log("leaving room");
        API.leaveRoom({ userId: userId, roomId: roomId })
            .then(res => {
                console.log(res.data);
                console.log("userMedia");
                console.log(userMedia);
                closeMeeting();
            })
            .catch(err => {
                console.log(err);
            });
    }

    /** error and info */

    function onerror(msg) {
        console.log(msg);
        alert(msg);
    }

    function handleError(error) {
        console.log(error);
        if (error) {
            setErrorMsg(error);
        }
    }

    function handleInfo(info) {
        if (info) {
            setInfoMsg(info);
        }
    }

    return (
        <div className="meeting-room shadow bg-dark d-flex flex-wrap justify-content-center">
            <div className="video-box">
                <video className="video bg-dark" autoPlay playsInline ref={selfiCam}></video>
            </div>
            <div className="video-box">
                <video className="video bg-dark" autoPlay playsInline ref={remoteCam}></video>
            </div>
            <button className="leave-meeting p-3" onClick={() => leaveRoom()}>X</button>
        </div>
    );
}

export default MeetingRoom;