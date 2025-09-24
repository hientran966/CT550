const fetch = require("node-fetch");

const OLLAMA_API = "http://localhost:11434/api/generate";

class Ollama {
    constructor() {};

    async askOllama(prompt) {
        try {
            const response = await fetch(OLLAMA_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "gemma3:4b",
                    prompt,
                    stream: false
                }),
            });

            const result = await response.json();
            return result.response;
        } catch (error) {
            console.error("Error calling Ollama:", error);
            throw new Error("Không thể kết nối Ollama");
        }
    }
}

module.exports = Ollama;
