const express = require("express");
const ollama = require("../controllers/Chatbot.controller");

const router = express.Router();

router.route("/")
    .post(ollama.handleAsk)

module.exports = router;