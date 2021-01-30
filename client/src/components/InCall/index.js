import React, { useEffect, useRef, useState } from "react";
import rtcConfig from "../../utils/webrtc/webrtc-config";
import SignalingService from "../../utils/webrtc/webrtc-signalingChannel";
import "./style.css";

function InCall() {

    const selfiCam = useRef();
    const remoteCam = useRef();

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(false);
    const [videoTrack, setVideoTrack] = useState({});
    const [audioTrack, setAudioTrack] = useState({});

    useEffect(() => {
        loadCam();
    }, []);

    async function loadCam() {

        // Put variables in global scope to make them available to the browser console.
        const constraints = window.constraints = {
            audio: audio,
            video: video
        };

        function handleSuccess(stream) {
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            setVideoTrack(videoTracks);
            setAudioTrack(audioTracks);
            console.log('Got stream with constraints:', constraints);
            console.log(`Using video device: ${videoTracks[0].label}`);
            window.stream = stream; // make variable available to browser console
            selfiCam.current.srcObject = stream;

            // create connection
            const pc = new RTCPeerConnection(rtcConfig);

            // add each tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // handle in coming tracks
            pc.ontrack = ( { track, streams }) => {
                track.onunmute = () => {
                    if (remoteCam.current.srcObject) {
                        return;
                    }
                    remoteCam.current.srcObject = streams[0];
                }
            };

            // handling the negotiationneeded event
            let makingOffer = false;
            pc.onnegotiationneeded = async () => {
                try {
                    makingOffer = true;
                    // when called arguments automatically creates and sets the
                    // appropriate description based on the current signalingState
                    await pc.setLocalDescription();
                    // use your apps signalig Service to send the sdp
                    SignalingService.send({ description: pc.localDescription });

                } catch (err) {

                } finally {
                    makingOffer = false;
                }
            };

        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            handleSuccess(stream);
        } catch (e) {
            console.log(e);
        }
    }

    function toggleVideoAudio(input) {
        if(input === "audio"){
            audioTrack[0].enabled = !audio;
            setAudio(!audio);
        } else {
            videoTrack[0].enabled = !video;
            setVideo(!video);
        }        
        
    }
   
    return (
        <div className="row bg-dark h-100">
            <div className="col-12 p-2">
                <div className="video-playground position-relative">
                    <div className="video-container rounded">
                        <video id="selfi-cam" className="self-potrait-lg" autoPlay playsInline ref={remoteCam}></video>
                        <p className="text-white p-1 text-center name">Amit Karmacharya</p>
                    </div>
                    <div className="video-container self-potrait-sm-container position-absolute rounded">
                        <video id="selfi-cam" className=" bg-dark self-potrait-sm" autoPlay playsInline ref={selfiCam}></video>
                        <p className="text-white p-1 text-center name-sm">Amit Karmacharya</p>
                    </div>
                </div>
                <div className="col-12 controls">
                    {/* microphone */}
                    <button type="button" className="btn btn-secondary bg-dark px-4 w-25" onClick={() => toggleVideoAudio("audio")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-mic" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"></path>
                            <path fillRule="evenodd" d="M10 8V3a2 2 0 1 0-4 0v5a2 2 0 1 0 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"></path>
                        </svg>
                    </button>
                    {/* video camera */}
                    <button type="button" className="btn btn-secondary bg-dark px-4 w-25" onClick={() => toggleVideoAudio("video")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175l3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
                        </svg>
                    </button>
                    {/* end call */}
                    <button type="button" className="btn btn-secondary bg-dark text-danger px-4 w-25">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone-x" viewBox="0 0 16 16">
                            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                            <path fillRule="evenodd" d="M11.146 1.646a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>
                    {/* settings */}
                    <button type="button" className="btn btn-secondary bg-dark px-4 w-25">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear" viewBox="0 0 16 16">
                            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* pop up modal for info */}
            <div className="position-absolute info-modal col-12 p-2">

            </div>
        </div>
    );
}

export default InCall;