const { Server } = require("socket.io");

let io;
const onlineUsers = new Map();

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("register", (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} online`);
        });

        socket.on("disconnect", () => {
            for (const [uid, sid] of onlineUsers.entries()) {
                if (sid === socket.id) {
                    onlineUsers.delete(uid);
                    console.log(`User ${uid} disconnected`);
                    break;
                }
            }
        });
    });
}

function sendToUser(userId, type, payload) {
    if (!io) return;
    const socketId = onlineUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit("notification", { type, payload });
    }
}

function broadcast(type, payload) {
    if (io) io.emit("notification", { type, payload });
}

module.exports = initSocket;
module.exports.sendToUser = sendToUser;
module.exports.broadcast = broadcast;
