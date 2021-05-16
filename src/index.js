const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Filter = require("bad-words");

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New websocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    //User joins a room
    socket.join(room);

    //Welcome user
    socket.emit(
      "message",
      generateMessage({ username: "ChatCord Bot", message: "Welcome!" })
    );
    socket.broadcast.to(user.room).emit(
      "message",
      generateMessage({
        username: "ChatCord Bot",
        message: `${user.username} has joined`,
      })
    );
    //When a new userjoin update the users list by emitting roomData event
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  //Listens to sendMessage event
  socket.on("sendMessage", (msg, callback) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "message",
      generateMessage({ username: user.username, message: msg })
    );
    callback();
  });

  //Listens to sendLocation event
  socket.on("sendLocation", ({ latitude, longitude } = {}, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage({
        username: user.username,
        url: `https://google.com/maps?q=${latitude},${longitude}`,
      })
    );
    callback();
  });

  //Listens to disconnect event
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage({
          username: "Chatcord Bot",
          message: `${user.username} has left`,
        })
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up and running on ${port}`);
});
