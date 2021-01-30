import axios from "axios";

export default {
    getRooms: function() {
        return axios.get("/rooms");
    },
    getUserId: function() {
        return axios.get("/api/getUserId");
    },
    createRoom: function(data) {
        return axios.post("/api/createRoom", data);
    },
    leaveRoom: function(data) {
        return axios.delete("/api/leaveRoom", {data: data});
    },
    joinRoom: function(data) {
        return axios.post("/api/joinRoom", data);
    }
};