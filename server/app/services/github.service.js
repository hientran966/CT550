const axios = require("axios");
const { getInstallationAccessToken } = require("../utils/githubAuth");
const MySQL = require("../utils/mysql.util");

class GitHubService {
  // Lưu installation khi callback từ GitHub
  static async saveInstallation(installationId, accountLogin) {
    const sql = `
      INSERT INTO github_installations (installation_id, account_login)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE account_login = VALUES(account_login);
    `;
    await MySQL.pool.query(sql, [installationId, accountLogin]);
  }

  // Gán installation cho project
  static async linkInstallationToProject(
    projectId,
    installationId,
    accountLogin = null
  ) {
    const conn = await MySQL.pool.getConnection();
    try {
      await conn.beginTransaction();

      const [checkInstall] = await conn.query(
        "SELECT id FROM github_installations WHERE installation_id = ?",
        [installationId]
      );

      if (!checkInstall.length) {
        await conn.query(
          "INSERT INTO github_installations (installation_id, account_login) VALUES (?, ?)",
          [installationId, accountLogin || null]
        );
      }

      await conn.query(
        `INSERT INTO project_installations (project_id, installation_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE installation_id = VALUES(installation_id)`,
        [projectId, installationId]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error("Error linking installation to project:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  // Lấy installation theo project
  static async getInstallationByProject(projectId) {
    const [rows] = await MySQL.pool.query(
      `SELECT gi.installation_id, gi.account_login
       FROM github_installations gi
       JOIN project_installations pi ON gi.installation_id = pi.installation_id
       WHERE pi.project_id = ? LIMIT 1`,
      [projectId]
    );
    return rows.length ? rows[0] : null;
  }

  // Liệt kê repository theo installation
  static async listRepositories(installationId) {
    const token = await getInstallationAccessToken(installationId);
    const res = await axios.get(
      "https://api.github.com/installation/repositories",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data.repositories;
  }

  // Lưu các repository được chọn cho project
  static async saveProjectRepositories(projectId, repos) {
    if (!repos?.length) return;
    const conn = await MySQL.pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        "DELETE FROM project_repositories WHERE project_id = ?",
        [projectId]
      );

      for (const repo of repos) {
        await conn.query(
          `INSERT INTO project_repositories (project_id, repo_id, full_name, html_url, is_private)
           VALUES (?, ?, ?, ?, ?)`,
          [projectId, repo.id, repo.full_name, repo.html_url, repo.private]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Xóa installation khỏi project + các repo liên quan
  static async unlinkInstallationFromProject(projectId) {
    const conn = await MySQL.pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        "SELECT installation_id FROM project_installations WHERE project_id = ?",
        [projectId]
      );
      if (!rows.length)
        throw new Error("No installation found for this project");

      const installationId = rows[0].installation_id;

      await conn.query(
        "DELETE FROM project_repositories WHERE project_id = ?",
        [projectId]
      );

      await conn.query(
        "DELETE FROM project_installations WHERE project_id = ?",
        [projectId]
      );

      await conn.commit();
      return { installationId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Lấy danh sách repo mà project đang gắn
  static async getProjectRepositories(projectId) {
    const [rows] = await MySQL.pool.query(
      "SELECT * FROM project_repositories WHERE project_id = ?",
      [projectId]
    );
    return rows;
  }

  // Lấy nội dung file từ GitHub
  static async listRepoFiles(installationId, owner, repo, path = "") {
    const token = await getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }

  static async listRecentCommits(installationId, owner, repo, limit = 10) {
    const token = await getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }
}

module.exports = GitHubService;
