
import adapter from "webrtc-adapter";

export default class WebRTCUserMedia {
    constructor(constraints, errorHandler, infoHandler, gotLocalStreamCB){
        this.constraints = constraints;
        this.mediaDevices = [];
        this.videoDevices = [];
        this.audioDevices = [];
        this.audioTracks = [];
        this.videoTracks = [];
        this.localStream = null;
        
        this.onLocalStream = gotLocalStreamCB;
        this.onerror = errorHandler;
        this.oninfo = infoHandler;
        
        // checks for media devices changes
        navigator.mediaDevices.ondevicechange = this.onDeviceChangeHandler;
        
        this.open(constraints);
        this.enumerateDevices();
    }

    open() {
        console.log("opening user Media");
        navigator.mediaDevices.getUserMedia(this.constraints)
            .then(stream => {

                this.localStream = stream;
                console.log("Got local stream");
                console.log(stream);
                this.audioTracks = stream.getAudioTracks();
                this.videoTracks = stream.getVideoTracks();
                this.onLocalStream();
            })
            .catch(err => {
                this.onerror({
                    error: "Failed to Get Media stream from media devices"
                });
            });
    }

    enumerateDevices() {
        if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
            return;
        }        
        
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                this.mediaDevices = devices;
                devices.forEach(device => {
                    if(device.kind === "audioinput"){
                        this.audioDevices.push(device);
                    }
                    if(device.kind === "videoinput") {
                        this.videoDevices.push(device);
                    }
                });
            })
            .catch(err => {
                this.onerror({
                    errormsg: "error while getting list of devices",
                    err: err
                });
            });
    }

    getLocalStream() {
        return this.localStream;
    }

    onDeviceChangeHandler() {
        this.enumerateDevices();
    }

    close() {
        if(!this.localStream){
            console.log("not local stream");
            return;
        }

        console.log("inside close");
        this.localStream.getTracks().forEach(track => {
            track.stop()
        });

        this.localStream = null;
    }
}
