const express = require("express");
const router = express.Router();
const chatController = require("../controllers/Chat.controller");
const upload = require("../middlewares/upload.middleware");

// --- Channel ---
router.post("/", chatController.create);
router.get("/", chatController.findAll);
router.get("/:id", chatController.getById);
router.get("/project/:project_id", chatController.findByProject);
router.put("/:id", chatController.update);
router.delete("/:id", chatController.delete);
router.patch("/restore/:id", chatController.restore);

// --- Members ---
router.get("/:channel_id/members", chatController.getMembers);
router.post("/member", chatController.addMember);
router.delete("/member", chatController.removeMember);

// --- Messages ---
router.post("/message", chatController.addMessage);
router.get("/message/:id/channel", chatController.getMessageChannel);

router.post("/message/files", upload.array("files"), chatController.addMessageWithFiles);

router.get("/:channel_id/messages", chatController.getMessages);

// --- Mentions ---
router.post("/mentions", chatController.addMentions);

module.exports = router;