const Ollama = require("../services/Chatbot.service");
const fetch = require("node-fetch");

const PROJECT_API_BASE = "http://localhost:3000/api/projects";
const TASK_API_BASE = "http://localhost:3000/api/tasks";

exports.handleAsk = async function (req, res) {
  try {
    const { question, projectId } = req.body;
    if (!question || !projectId) {
      return res.status(400).json({ error: "Thiếu question hoặc projectId" });
    }

    const ollama = new Ollama();

    const analysisPrompt = `
      Người dùng hỏi: "${question}"
      Hãy phân tích xem người dùng muốn làm gì trong dự án:
      - Nếu hỏi về thông tin chung của dự án => trả về "get_project"
      - Nếu hỏi về báo cáo, tiến độ hay thông tin chuyên sâu của dự án => trả về "get_report"
      - Nếu hỏi về thông tin công việc => trả về "get_task"
      - Nếu không xác định được => trả về "unknown"

      Chỉ trả về 1 trong 4 từ khóa trên.
      `;
    const intent = (await ollama.askOllama(analysisPrompt)).trim().toLowerCase();
    console.log("yêu cầu: ",intent);

    let apiUrl, method = "GET", body = null;

    switch (intent) {
      case "get_project":
        apiUrl = `${PROJECT_API_BASE}/${projectId}`;
        break;
      case "get_report":
        apiUrl = `${PROJECT_API_BASE}/${projectId}/report`;
        break;
      case "get_task":
        apiUrl = `${TASK_API_BASE}/project/${projectId}`;
        break;
      default:
        return res.json({
          question,
          answer: "Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn."
        });
    }

    const projectResponse = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body
    });
    const projectData = await projectResponse.json();

    const answerPrompt = `
      Dữ liệu API trả về:
      ${JSON.stringify(projectData, null, 2)}

      Câu hỏi của người dùng: "${question}"

      Hãy trả lời ngắn gọn, dễ hiểu, đúng trọng tâm.
      `;
    const answer = await ollama.askOllama(answerPrompt);

    res.json({
      question,
      intent,
      projectData,
      answer
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ error: error.message });
  }
};