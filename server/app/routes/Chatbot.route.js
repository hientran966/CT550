const express = require("express");
const chatbot = require("../controllers/Chatbot.controller");

const router = express.Router();

router.route("/")
  .post(chatbot.handleAsk);

module.exports = router;