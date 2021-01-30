import React, { useRef } from "react";

function ListRooms({rooms, handleJoinRoom}) {

    return(
        <div className="row">
            {
                rooms.map((roomId, index) => {
                    return (
                        <div className="col-sm-10 col-md-8 border rounded my-3 p-2 m-auto" key={index}>
                            <span className=" d-block-inline">{index + 1}.</span>
                            <span className="mx-5 text-truncate">RoomID: {roomId}</span>
                            <button 
                                className="btn btn-primary " 
                                onClick={() => handleJoinRoom(roomId)}
                                >
                                    Join Room
                            </button>
                        </div>
                    );
                })
            }
        </div>
    );
}

export default ListRooms;