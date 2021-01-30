import { set } from "mongoose";
import React, { useEffect, useState } from "react";
import API from "../../utils/API";
import ListRooms from "../ListRooms";
import MeetingRoom from "../MeetingRoom";

function Main() {

    const [rooms, setRooms] = useState([]);
    const [roomId, setRoomId] = useState("");
    const [userId, setUserId] = useState("");
    const [owner, setOwner] = useState(false);
    const [displayRoom, setDisplayRoom] = useState("false");

    useEffect(() => {
        init();
        return () => {
            console.log("dismount");
        };
    }, []);

    function init() {
        checkForRooms();
        getUserId();
    }

    function checkForRooms() {
        console.log("check for rooms");
        API.getRooms()
            .then(res => {
                setRooms(res.data);
            })
            .catch(err => {
                console.log(err);
            });
    }

    function getUserId() {

        if(userId !== "") {
            return;
        }
        
        API.getUserId()
            .then(res => {
                setUserId(res.data);
            })
            .catch(err => {
                console.log(err);
            });
    }

    function handleCreateRoom() {

        console.log("creating room");
        if(roomId){
            console.log("already assigned to a room");
            return;
        }

        if(!userId) {
            getUserId();
        } else {
            API.createRoom({userId: userId})
            .then(res => {
                setOwner(res.data.owner === userId);
                setRoomId(res.data.roomId);
                setDisplayRoom(true);
            })  
            .catch(err => {
                console.log("failed to create Room");
            });
        }
 
    }

    function handleJoinRoom(roomId) {
        if(!roomId){
            alert("NO room id");
            return;
        }
        API.joinRoom({userId: userId, roomId: roomId})
            .then(res => {
                setOwner(false);
                setRoomId(roomId);
                setDisplayRoom(true);
            })
            .catch(err => {
                console.log(err);
            });
        
        
    }

    function clearRoomId () {
        console.log("clearRoomId");
        setRoomId("");
    }

    function removeMeeting () {
        setDisplayRoom(false);
    }

    return (
        <main className="container-fuild">
            <div className="row">
                <div className="col-12">
                    <div className="mt-5 text-center">
                        <button className="btn btn-primary" onClick={handleCreateRoom}>Create Room</button>
                    </div>
                </div>
            </div>

            <div className="row mt-5">
                <div className="col-12 m-auto">
                    {
                        (rooms && rooms.length > 0) 
                        ? <ListRooms rooms={rooms} handleJoinRoom={handleJoinRoom} /> 
                        : <h5 className="text-center">NO ROOMS TO JOIN</h5>
                    }
                </div>
            </div>
            {
            displayRoom === true
            ? <MeetingRoom 
                owner={owner}
                userId={userId}
                roomId={roomId}
                clearRoomId={clearRoomId}
                removeMeeting={removeMeeting}
                checkForRooms={checkForRooms}
                /> 
            : ""
            }
        </main>
    );
}

export default Main;