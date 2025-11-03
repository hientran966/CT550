const axios = require("axios");
const { getInstallationAccessToken } = require("../utils/githubAuth");
const MySQL = require("../utils/mysql.util");

class GitHubService {
  static async saveInstallation(installationId, accountLogin, projectId) {
    const sql = `
      INSERT INTO github_installations (installation_id, account_login, project_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE account_login = ?, project_id = ?;
    `;
    await MySQL.pool.query(sql, [
      installationId,
      accountLogin,
      projectId,
      accountLogin,
      projectId,
    ]);
  }

  static async getInstallationByProject(projectId) {
    const [rows] = await MySQL.pool.query(
      "SELECT * FROM github_installations WHERE project_id = ? LIMIT 1",
      [projectId]
    );
    return rows.length ? rows[0] : null;
  }

  static async saveManualInstallation(installationId, projectId) {
    await this.saveInstallation(installationId, "manual_entry", projectId);
    return { installation_id: installationId, project_id: projectId, account_login: "manual_entry" };
  }

  static async listRepositories(installationId) {
    const token = await getInstallationAccessToken(installationId);
    const res = await axios.get("https://api.github.com/installation/repositories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.repositories;
  }

  static async getFileContent(installationId, owner, repo, path) {
    const token = await getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.encoding === "base64") {
      return Buffer.from(res.data.content, "base64").toString("utf8");
    }
    return res.data;
  }
}

module.exports = GitHubService;