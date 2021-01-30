import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import rtcConfig from "../../utils/webrtc/webrtc-config";

function CallSetup({ renderNextComponent }) {
    const selfiCam = useRef();

    useEffect(() => {
        loadCam();
        console.log("mounting");

        // unmounting
        return () => {
            console.log("unmounting");
        }; 
    }, []);

    async function loadCam() {

        // Put variables in global scope to make them available to the browser console.
        const constraints = window.constraints = {
            audio: false,
            video: true
        };

        function handleSuccess(stream) {
            const videoTracks = stream.getVideoTracks();
            console.log('Got stream with constraints:', constraints);
            console.log(`Using video device: ${videoTracks[0].label}`);
            window.stream = stream; // make variable available to browser console
            selfiCam.current.srcObject = stream;
        }       

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            handleSuccess(stream);
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <div className="row bg-dark h-100">
            <div className="col-12 p-2 h-100 w-100">
                <div className="video-playground">
                    <div className="video-container rounded">
                        <video id="selfi-cam" className="self-potrait" autoPlay playsInline ref={selfiCam}></video>
                        <p className="text-white p-1 text-center name">Amit Karmacharya</p>
                    </div>
                </div>
                {/* controls */}
                <div className="col-12 controls text-center">
                    {/* Cancel Call */}
                    <button type="button" className="btn btn-secondary bg-danger w-25 px-1 mx-1">
                        Cancel
                    </button>
                    {/* Start Call */}
                    <button type="button" className="btn btn-secondary bg-success w-25 px-1 mx-1" onClick={renderNextComponent}>
                        Start
                    </button>
                    {/* Start Call */}
                    <button type="button" className="btn btn-secondary w-25 mx-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-camera-video" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175l3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CallSetup;