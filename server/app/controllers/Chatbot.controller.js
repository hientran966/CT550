const Ollama = require("../services/Chatbot.service");

exports.handleAsk = async function (req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Thiếu tham số question" });
    }

    const ollamaService = new Ollama();
    const answer = await ollamaService.askOllama(question);
    res.json({ question, answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};