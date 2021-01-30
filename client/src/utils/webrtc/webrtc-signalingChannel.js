import { io } from "socket.io-client";
import axios from "axios";

export default class SignalingChannel {

    constructor(wssUrl, errorCB, msgCB) {
        this.wssUrl = wssUrl;
        this.roomId = null;
        this.userId = null;
        this.socket = null;
        this.connectedToRoom = false;

        // call backs
        this.onerrorCB = errorCB;
        this.onmessageCB = msgCB;
    }

    open() {
        if (this.socket) {
            console.log(this.socket);
            return;
        }

        this.socket = new io();

        // connection
        this.socket.on("connect", () => {
            console.log("connected to socket");
        });

        // error
        this.socket.on("connecterror", () => {
            console.log("connection error");
            console.log("trying to reconnect");

            setTimeout(() => {
                this.socket.connect();
            }, 2000);
        });

        // connected to room
        this.socket.on("connectedToRoom", ({userId, roomId}) => {
            console.log(`${userId} connected to ${roomId}`);
            this.connectedToRoom = true;
        });

        // failed to connect to room
        this.socket.on("failedConnectRoom", (error) => {
            console.log("failed to connect");
            this.onerror(error);
        });

        // mssage forward by signaling channel
        this.socket.on("peerMessages", ({roomId, userId, data}) => {
            console.log("received msessages from peers");
            if(!data || !userId){
                return;
            }

            this.onmessageCB(roomId, userId, data);
        });

        // disconnect
        this.socket.on("disconnect", () => {
            console.log("disconnected");
        });


    }

    connectToRoom(roomId, userId) {
        console.log("signalchannel: connecting to socket room: " + roomId);
        if (this.registered) {
            return;
        }

        console.log(roomId, userId);
        this.roomId = roomId;
        this.userId = userId;

        if (!this.roomId) {
            this.onerror({
                error: "roomId missing to register socket"
            });
        }

        if (!this.userId) {
            this.onerror({
                error: "userId missing to register socket"
            });
        }

        // connect to room
        this.socket.emit("connectRoom", {
            roomId: this.roomId,
            userId: this.userId
        });
    }

    close() {

        if(!this.socket) {
            this.onerror({error: "no socket open to close"});
            return;
        }
        this.socket.close();
        this.socket = null;
        this.userId = null;
        this.roomId = null;
        this.connectedToRoom = false;
        this.onerrorCB = null;
        this.onmessageCB = null;
    }

    leaveRoom() {
        if(!this.connectedToRoom){
            this.onerror({error: "not connected to any room"});
            return;
        }
        
        if(!this.roomId){
            this.onerror({error: "roomId missing to leave room"});
            return;
        } 
    
        this.socket.to(this.roomId).emit("leave", {
            roomId: this.roomId
        });
    }

    send(msg) {
        console.log("sending msg to socket server");
        if (!this.roomId || !this.userId) {
            return;
        }

        if (this.socket && this.connectedToRoom) {
            // sdp description broadcast
            this.socket.emit("signalChannel", {
                roomId: this.roomId,
                userId: this.userId,
                data: msg
            });
        }
    }

    onerror(error){
        console.log(error);
        if(!error){
            return;
        }
        if(!this.onerrorCB){
            alert("signaling channel onerrorCB not implemented");
            return;
        }

        this.onerrorCB({
            error: "userId missing to register socket"
        });

    }

}
