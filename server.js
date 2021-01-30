const path = require("path");
const express = require("express");
const cors = require("cors");
const app = express();

const http= require("http").Server(app);
const io = require("socket.io")(http, {
  cookie: true
});

const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3001;

// room
let rooms = {};
let usersId = {};

// Define middleware here
if(process.env.NODE_ENV !== "production"){
  app.options("*", cors());
  app.use(cors());
}
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// Add routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/public/index.html"));
});

app.get("/rooms", (req, res) => {
  res.json(Object.keys(rooms));
});

app.get("/api/getUserId", (req, res) => {
  let userUuid = uuidv4();
  // console.log(rooms);
  // console.log(userUuid);
  res.json(userUuid);
});

app.post("/api/createRoom", (req, res) => {
  const roomId = uuidv4();
  const userId = req.body.userId;

  const userRoom = usersId[userId] && usersId[userId].roomId;
  if( userRoom && rooms[userRoom].usersId.indexOf(userId) != -1) {
      res.status(400).json("users can't create or be in more than one room");
      res.end();
  } else {
        let newRoom = {
          roomId: roomId,
          usersId: [userId],
          owner: userId
        };

        rooms[roomId] = newRoom;
        usersId[userId] = { roomId: roomId };
        
        // console.log(rooms);
        // console.log(usersId);
      
        res.status(200).json({
          owner: rooms[roomId].owner,
          roomId: roomId,
          userId: userId
        });
        res.end();
  }

});

app.post("/api/joinRoom", (req, res) => {
  const roomId = req.body.roomId;
  const userId = req.body.userId;

  // check if room exists
  if (!rooms[roomId]) {
    res.status(400).json("The room you are trying to connect has been closed");
    // if user already exists in the room, don't add the user again
  } else if (rooms[roomId].usersId.indexOf(userId) != -1 && usersId[userId] && usersId[userId].roomId) {
    res.json({
      roomId: roomId,
      userId: userId
    });
  } else {

    // remove from other rooms
    if(usersId[userId] && usersId[userId].roomId){
      let previousRoomId = usersId[userId].roomId;
      // create new usersList for that room
      let newUsersId = rooms[previousRoomId].usersId.filter(id => id != userId);
      // add the new list of users
      rooms[previousRoomId].usersId = newUsersId;
    }
    
    // add the user into new room and save his roomId
    rooms[roomId].usersId.push(userId);
    usersId[userId] = { roomId: roomId };
    
    res.status(200).json({
      roomId: roomId,
      userId: userId
    });
  }

});

app.delete("/api/leaveRoom", (req, res) => {
  const roomId = req.body.roomId;
  const userId = req.body.userId;

  // console.log("roomId: " + roomId);
  // console.log("usersId: " + userId);
  // console.log(rooms[roomId]);

  let usersInRoom = [];
  // check if room and userId exits
  if(!rooms[roomId]) {
    res.status(400).json("room with that roomId doesn't exits");
  // if user is the owner, remove everyone and delete the room
  } else if(rooms[roomId] && rooms[roomId].usersId && rooms[roomId].owner === userId) {
    console.log("owner closed the room");
    usersInRoom = rooms[roomId].usersId;
    // delete rooms for all the users
    usersInRoom.forEach(userId => {
      // remove ther user
      if (usersId[userId] && usersId[userId].roomId) {
        delete usersId[userId];
      }
    });

    // delete the room
    if(rooms[roomId]){
      delete rooms[roomId];
    }

    res.status(200).json({
      roomId: roomId,
      userId: userId
    });
  } else if (rooms[roomId].usersId.indexOf(userId) === -1) {
    res.status(400).json("user is not in this room");
  } else {
    let newUsersList = rooms[roomId].usersId.filter(id => id != userId);
    // no users in the room
    rooms[roomId].usersId = newUsersList;
    if(usersId[userId]){
      delete usersId[userId];
    }
    
    res.status(200).json({
      roomId: roomId,
      userId: userId
    });
  }

});

// Start the API server
http.listen(PORT, () => {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});

// socket
io.on('connection', (socket) => {

  console.log("user connected");

  // creates rooms based on the room id
  socket.on("createRoom", ({roomId, userId}) => {
    console.log("creating a socket room");
    // check if the room exists and if the user
    // is the owner of the room
    if(!(rooms[roomId] && 
       rooms[roomId].owner && 
       rooms[roomId].owner === userId)) {
         // send error msg
         socket.send({
          error: "Failed to create a socket room"
         });
         return;
    }

    // create room
    socket.join(roomId);
  });

  // register the client to the room with roomId
  socket.on("connectRoom", ({roomId, userId}) => {
    console.log("connecting to room");
    console.log("roomID : " + roomId);
    console.log("userID : " + userId);
    console.log("room Exists: " + (rooms[roomId] !== undefined));

    if(!roomId || !userId){
      socket.emit("failedConnectRoom", {error: "Failed: \
      room id or client id was not provided"});
      return;
    }

    if(!rooms[roomId]) {
      console.log("failed to connect");
      socket.emit("failedConnectRoom", {error: "failed: \
      room with that id doesn't exist"});
      return;
    }

    if(rooms[roomId].usersId.indexOf(userId) === -1 ){
      console.log("failed to connect");
      socket.emit("failedConnectRoom", {error: "Failed: \
      not connected to room, failed to connect socket room"});
      return;
    }

    // join room
    console.log("connected to room: " + roomId);
    socket.join(roomId);
    socket.emit("connectedToRoom", {
      roomId: roomId,
      userId: userId
    });

  });

  // leave room
  socket.on("leaveRoom", ({roomId}) => {
    console.log("leaveRoom");
    if(roomId && rooms[roomId]){
      socket.leave(roomId);
    }
  });

  // sdp description
  socket.on("signalChannel", ({roomId, userId, data}) => {
    console.log("broadCast sdp and candidates");
    console.log("broadcast TYPE: " + data.peerData.type);
    socket.broadcast.to(roomId).emit("peerMessages", {
      roomId: roomId, 
      userId: userId,
      data: data
    });
  });
  
  socket.on("disconnect", () => {
    console.log("disconnect");
  });

});
