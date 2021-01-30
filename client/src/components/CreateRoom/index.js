import React from "react";

function CreateRoom() {

    const handleCreateRoom = () => {
        console.log("creating a room");
    }

    return(
        <div className="mt-5 text-center">
            <button className="btn btn-primary" onClick={handleCreateRoom}>Create Room</button>
        </div>
    );
}

export default CreateRoom;