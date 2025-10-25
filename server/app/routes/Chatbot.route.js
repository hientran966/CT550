const express = require("express");
const router = express.Router();
const ChatbotController = require("../controllers/Chatbot.controller");

router.post("/", ChatbotController.handleAsk);

router.route("/history")
  .get(ChatbotController.findAll)
  .post(ChatbotController.create);

router.route("/history/:id")
  .get(ChatbotController.findOne)
  .put(ChatbotController.update)
  .delete(ChatbotController.delete);

router.route("/history/project/:project_id/user/:user_id")
  .get(ChatbotController.findByProject)
  .delete(ChatbotController.deleteByProject);

module.exports = router;
