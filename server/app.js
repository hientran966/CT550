const express = require("express");
const cors = require("cors");
const path = require("path");
const ApiError = require("./app/api-error");
const { verifyToken } = require("./app/middlewares/auth.middleware");

const authRouter = require("./app/routes/Account.route");
const projectRouter = require("./app/routes/Project.route");
const memberRouter = require("./app/routes/Member.route");
const taskRouter = require("./app/routes/Task.route");
const assignmentRouter = require("./app/routes/Assign.route");
const commentRouter = require("./app/routes/Comment.route");
const notificationRouter = require("./app/routes/Notification.route");
const fileRouter = require("./app/routes/File.route");
const chatRouter = require("./app/routes/Chat.route")
const chatbotRouter = require("./app/routes/Chatbot.route");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', cors(), express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
    res.json({ message: "Ứng dụng quản lý công việc."});
});
// Import routes
app.use("/api/auth", authRouter);

// app.use(verifyToken); //Tắt để test API
app.use("/api/duan", projectRouter);
app.use("/api/thanhvien", memberRouter);
app.use("/api/congviec", taskRouter);
app.use("/api/phancong", assignmentRouter);
app.use("/api/binhluan", commentRouter);
app.use("/api/thongbao", notificationRouter);
app.use("/api/file", fileRouter);
app.use("/api/chat", chatRouter)
app.use("/api/ask", chatbotRouter);

//handle 404
app.use((req, res, next) => {
    //
    return next(new ApiError(404, "Resource not found"));
});

//error handling
app.use((err, req, res, next) => {
    //
    return res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error",
    });
});

module.exports = app;