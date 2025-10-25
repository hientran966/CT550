const fetch = require("node-fetch");
const Ollama = require("../services/Chatbot.service");
const ChatbotHistoryService = require("../services/ChatbotHistory.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");
const { createController } = require("./controllerFactory");

const PROJECT_API_BASE = "http://localhost:3000/api/projects";
const TASK_API_BASE = "http://localhost:3000/api/tasks";

exports.handleAsk = async function (req, res) {
  try {
    const { question, projectId, userId } = req.body;
    if (!question || !projectId || !userId) {
      return res.status(400).json({ error: "Thiếu question hoặc id" });
    }

    const ollama = new Ollama();
    const historyService = new ChatbotHistoryService(MySQL.pool);

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
    console.log("→ intent:", intent);

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
        await historyService.create({
          project_id: projectId,
          user_id: userId,
          question,
          answer: "Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn.",
          intent,
        });
        return res.json({
          question,
          intent,
          answer: "Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn.",
        });
    }

    const response = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await response.json();

    const answerPrompt = `
      Dữ liệu API trả về:
      ${JSON.stringify(data, null, 2)}
      Câu hỏi của người dùng: "${question}"
      Hãy trả lời ngắn gọn, dễ hiểu, đúng trọng tâm.
    `;
    const answer = await ollama.askOllama(answerPrompt);

    await historyService.create({
      project_id: projectId,
      user_id: userId,
      question,
      answer,
      intent,
    });

    res.json({ question, intent, answer, data });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const baseController = createController(ChatbotHistoryService, {
  create: "Đã xảy ra lỗi khi tạo lịch sử chatbot",
  findAll: "Đã xảy ra lỗi khi lấy danh sách lịch sử chatbot",
  findOne: "Đã xảy ra lỗi khi lấy chi tiết lịch sử chatbot",
  notFound: "Không tìm thấy lịch sử chatbot",
  update: "Đã xảy ra lỗi khi cập nhật lịch sử chatbot",
  delete: "Đã xảy ra lỗi khi xóa lịch sử chatbot",
});

const customMethods = {
  findByProject: async (req, res, next) => {
    try {
      const service = new ChatbotHistoryService(MySQL.pool);
      const projectId = req.params.project_id;
      const rows = await service.find({ project_id: projectId });
      res.send(rows);
    } catch (error) {
      return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi lấy lịch sử theo dự án"));
    }
  },

  create: async (req, res, next) => {
    try {
      const service = new ChatbotHistoryService(MySQL.pool);
      const id = await service.create(req.body);
      res.status(201).send({ id });
    } catch (error) {
      return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi tạo lịch sử chatbot"));
    }
  },

  deleteByProject: async (req, res, next) => {
    try {
      const service = new ChatbotHistoryService(MySQL.pool);
      const affectedRows = await service.deleteByProject(req.params.project_id);
      res.send({ affectedRows });
    } catch (error) {
      return next(new ApiError(500, error.message || "Đã xảy ra lỗi khi xóa lịch sử theo dự án"));
    }
  },
};

module.exports = {
  handleAsk: exports.handleAsk,
  ...baseController,
  ...customMethods,
};