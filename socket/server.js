const socket_io = require("socket.io");
const io = {};
const client = {};
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("../utils/user");
module.exports = {
  initiate: (io) => {
    // Run when client connects
    io.on("connection", (socket) => {
      socket.on("joinChat", async ({ username, room }) => {
        const user = await userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit("message", { msg: "Hi", user: "Server" });

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit("message", {
          msg: `${user.username} has joined &#127881;`,
          user: "Server",
        });

        // Send a list of users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      });

      // Receive messages from a client
      socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", {
          msg: msg,
          user: user.username,
          userIcon: user.userIcon,
        });
      });

      // Runs when client disconnects
      socket.on("disconnect", () => {
        console.log("Client disconnected");

        const user = userLeave(socket.id);

        if (user) {
          io.to(user.room).emit("message", {
            msg: `${user.username} has left this chat room &#x1F625;`,
            user: "Server",
          });

          // Send users and room info
          io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
          });
        }
      });
    });
  },
};