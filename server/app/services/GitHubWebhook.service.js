const crypto = require("crypto");
const ActivityService = require("../services/Activity.service");
const MySQL = require("../utils/mysql.util");

const {
  sendGitEventToProject,
  sendGitPushToProject,
  sendGitCommitToProject,
} = require("../socket");

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const TASK_REGEX = /#(\d+)/g;

class WebhookService {
  constructor() {
    this.activityService = new ActivityService(MySQL.pool);
  }

  verifySignature(req, buf) {
    const signature = req.headers["x-hub-signature-256"];
    if (!signature) throw new Error("No signature");

    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const digest = "sha256=" + hmac.update(buf).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      throw new Error("Invalid signature");
    }
  }

  extractTaskCodes(text) {
    if (!text) return [];
    return text.match(TASK_REGEX) || [];
  }

  async getTaskId(projectId, code) {
    const digits = code.replace(/\D/g, "");
    if (!digits) return null;

    const rows = await MySQL.query(
      "SELECT id FROM tasks WHERE id = ? AND project_id = ? AND deleted_at IS NULL",
      [digits, projectId]
    );

    return rows.length > 0 ? rows[0].id : null;
  }

  async processGitWebhook(event, payload) {
    const repoFullName = payload.repository.full_name;

    const rows = await MySQL.query(
      "SELECT project_id FROM project_repositories WHERE full_name = ?",
      [repoFullName]
    );

    if (rows.length === 0) {
      return { message: "Repository not linked to project", projectIds: [] };
    }

    const projectIds = rows.map((r) => r.project_id);

    for (const projectId of projectIds) {
      if (event === "push") {
        await this.handlePushEvent(projectId, payload);
      } else if (event === "pull_request") {
        await sendGitEventToProject(projectId, {
          type: "pull_request",
          action: payload.action,
          title: payload.pull_request.title,
          user: payload.pull_request.user.login,
          url: payload.pull_request.html_url,
        });
      } else if (event === "issues") {
        await sendGitEventToProject(projectId, {
          type: "issue",
          action: payload.action,
          title: payload.issue.title,
          user: payload.issue.user.login,
          url: payload.issue.html_url,
        });
      }
    }

    return { message: "OK", projectIds };
  }

  async handlePushEvent(projectId, payload) {
    const pushData = {
      repo: payload.repository.full_name,
      branch: payload.ref.replace("refs/heads/", ""),
      pusher: payload.pusher?.name,
      commits: payload.commits,
    };

    await sendGitPushToProject(projectId, pushData);

    for (const commit of payload.commits || []) {
      const messages = [commit.message, commit.title, commit.body].filter(
        Boolean
      );
      const fullText = messages.join("\n");

      const taskCodes = this.extractTaskCodes(fullText);

      for (const code of taskCodes) {
        const taskId = await this.getTaskId(projectId, code);

        if (taskId) {
          await this.activityService.create({
            project_id: projectId,
            task_id: taskId,
            actor_id: 0,
            detail: `Đã commit: ${commit.message}`,
            created_at: new Date(),
          });
        }
      }

      await sendGitCommitToProject(projectId, {
        message: commit.message,
        author: commit.author,
        url: commit.url,
      });
    }
  }
}

module.exports = new WebhookService();
