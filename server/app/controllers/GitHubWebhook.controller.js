const crypto = require("crypto");
const GitHubService = require("../services/Github.service.js");
const {
  sendGitEventToProject,
  sendGitPushToProject,
  sendGitCommitToProject,
} = require("../socket");
const MySQL = require("../utils/mysql.util");

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifySignature(req, res, buf) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) throw new Error("No signature");

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(buf).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    throw new Error("Invalid signature");
  }
}

async function handleWebhook(req, res) {
  try {
    const event = req.headers["x-github-event"];
    const payload = req.body;
    const repoFullName = payload.repository.full_name;

    const rows = await MySQL.query(
      "SELECT project_id FROM project_repositories WHERE full_name = ?",
      [repoFullName]
    );

    if (!rows || rows.length === 0) {
      console.warn("Repository not found in project_repositories:", repoFullName);
      return res.status(200).send("Repository not linked to project");
    }

    const projectIds = rows.map((r) => r.project_id);

    for (const projectId of projectIds) {
      if (event === "push") {
        const pushData = {
          repo: payload.repository.full_name,
          branch: payload.ref.replace("refs/heads/", ""),
          pusher: payload.pusher?.name,
          commits: payload.commits,
        };

        await sendGitPushToProject(projectId, pushData);

        for (const commit of payload.commits || []) {
          await sendGitCommitToProject(projectId, {
            message: commit.message,
            author: commit.author,
            url: commit.url,
          });
        }
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

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).send("Invalid signature");
  }
}

module.exports = {
  verifySignature,
  handleWebhook,
};