const Ollama = require("../services/Chatbot.service");
const ChatbotHistoryService = require("../services/ChatbotHistory.service");
const ProjectService = require("../services/Project.service");
const TaskService = require("../services/Task.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");
const { createController } = require("./controllerFactory");

exports.handleAsk = async function (req, res) {
  try {
    const { question, projectId, userId } = req.body;
    if (!question || !projectId || !userId) {
      return res.status(400).json({ error: "Thiếu question hoặc id" });
    }

    const ollama = new Ollama();
    const historyService = new ChatbotHistoryService(MySQL.pool);
    const projectService = new ProjectService(MySQL.pool);
    const taskService = new TaskService(MySQL.pool);

    const analysisPrompt = `
      Bạn là bộ phân loại ý định dành cho trợ lý quản lý dự án.
      Nhiệm vụ: dựa trên "Câu hỏi của người dùng", chỉ trả về **chính xác 1 từ khóa**:
      - get_project
      - get_report
      - get_task
      - create_task_from_project
      - unknown
      Câu hỏi: """${question}"""
    `;

    const intent = (await ollama.askOllama(analysisPrompt))
      .trim()
      .toLowerCase();

    let data;

    switch (intent) {
      case "get_project":
        data = await projectService.findById(projectId);
        break;

      case "get_report":
        data = await projectService.report(projectId);
        break;

      case "get_task":
        data = await taskService.find({ project_id: projectId });
        break;

      case "create_task_from_project": {
        const project = await projectService.findById(projectId);
        if (!project) throw new Error("Không tìm thấy dự án.");

        const numberExtractPrompt = `
          Câu hỏi: "${question}"
          Nếu người dùng có đề cập đến số lượng task cần tạo, hãy trả về **chỉ số đó** (dạng số).
          Nếu không có, trả về "0".
        `;

        const numberResponse = await ollama.askOllama(numberExtractPrompt);
        const taskCount = parseInt(numberResponse.replace(/\D/g, "")) || 0;

        const taskGenPrompt = `
          Bạn là trợ lý quản lý dự án.
          Dự án: ${project.name}
          Mô tả: ${project.description || "(không có mô tả)"}

          Hãy liệt kê ${taskCount > 0 ? taskCount : "các"} task cụ thể cần thực hiện để hoàn thành dự án này.

          Chỉ trả về JSON hợp lệ:
          [
            { "title": "Tên task 1", "description": "Mô tả ngắn" },
            { "title": "Tên task 2", "description": "Mô tả ngắn" }
          ]
          Không thêm giải thích, tiêu đề, hoặc văn bản khác ngoài JSON.
        `;

        const rawTasks = await ollama.askOllama(taskGenPrompt);

        let taskList;
        try {
          const jsonMatch = rawTasks.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi");
          taskList = JSON.parse(jsonMatch[0]);
          if (!Array.isArray(taskList)) taskList = [taskList];
        } catch (err) {
          console.error("AI trả về không hợp lệ:\n", rawTasks);
          const answer = "Tôi không thể xác định rõ các task cần tạo. Bạn có thể mô tả rõ hơn không?";
          await historyService.create({
            project_id: projectId,
            user_id: userId,
            question,
            answer,
            intent,
          });
          return res.json({ question, intent, answer });
        }

        const createdTasks = [];
        for (const t of taskList) {
          const newTask = await taskService.create({
            title: t.title,
            description: t.description,
            start_date: new Date(),
            due_date: new Date(),
            created_by: userId,
            project_id: projectId,
          });
          createdTasks.push(newTask);
        }

        const answerPrompt = `
          Dự án: ${project.name}
          Các task đã được tạo gồm:
          ${createdTasks.map((t) => `- ${t.title}`).join("\n")}
          Hãy trả lời ngắn gọn, tự nhiên để xác nhận đã tạo xong task.
        `;
        const answer = await ollama.askOllama(answerPrompt);

        await historyService.create({
          project_id: projectId,
          user_id: userId,
          question,
          answer,
          intent,
        });

        return res.json({ question, intent, answer, tasks: createdTasks });
      }

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

    const answerPrompt = `
      Dữ liệu trả về từ hệ thống:
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

    const { question, projectId, userId } = req.body;
    const historyService = new ChatbotHistoryService(MySQL.pool);
    const answer = "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.";
    if (projectId && userId) {
      await historyService.create({
        project_id: projectId,
        user_id: userId,
        question: question || "",
        answer,
        intent: "error",
      });
    }

    res.status(200).json({ question, intent: "error", answer });
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
      const { project_id, user_id } = req.params;
      const rows = await service.find({ project_id, user_id });
      res.send(rows);
    } catch (error) {
      return next(
        new ApiError(
          500,
          error.message || "Đã xảy ra lỗi khi lấy lịch sử theo dự án"
        )
      );
    }
  },

  create: async (req, res, next) => {
    try {
      const service = new ChatbotHistoryService(MySQL.pool);
      const id = await service.create(req.body);
      res.status(201).send({ id });
    } catch (error) {
      return next(
        new ApiError(
          500,
          error.message || "Đã xảy ra lỗi khi tạo lịch sử chatbot"
        )
      );
    }
  },

  deleteByProject: async (req, res, next) => {
    try {
      const service = new ChatbotHistoryService(MySQL.pool);
      const affectedRows = await service.deleteByProject(req.params.project_id);
      res.send({ affectedRows });
    } catch (error) {
      return next(
        new ApiError(
          500,
          error.message || "Đã xảy ra lỗi khi xóa lịch sử theo dự án"
        )
      );
    }
  },
};

module.exports = {
  handleAsk: exports.handleAsk,
  ...baseController,
  ...customMethods,
};
