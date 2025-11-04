const GitHubService = require("../services/Github.service");

class GitHubController {
  async callback(req, res) {
    const { installation_id, state } = req.query;
    const project_id = state;

    if (!installation_id || !project_id) {
      return res.status(400).json({ message: "Missing installation_id or project_id" });
    }

    await GitHubService.saveInstallation(installation_id, "unknown_user", project_id);
    console.log("redirect");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    res.redirect(`${frontendUrl}/git?connected=true&project=${project_id}`);
  }

  async listRepos(req, res) {
    try {
      const { installationId } = req.params;
      const repos = await GitHubService.listRepositories(installationId);
      res.json(repos);
    } catch (err) {
      console.error("Error listing repos:", err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getFile(req, res) {
    try {
      const { installationId, owner, repo } = req.params;
      const path = req.params[0];
      const content = await GitHubService.getFileContent(installationId, owner, repo, path);
      res.json({ path, content });
    } catch (err) {
      console.error("Error getting file:", err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getInstallationByProject(req, res) {
    try {
      const { projectId } = req.params;
      const installation = await GitHubService.getInstallationByProject(projectId);
      if (!installation) {
        return res.status(404).json({ message: "No installation found" });
      }
      res.json(installation);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async saveManualInstallation(req, res) {
    try {
      const { installation_id, project_id } = req.body;
      if (!installation_id || !project_id) {
        return res.status(400).json({ message: "Thiếu installation_id hoặc project_id" });
      }

      const installation = await GitHubService.saveManualInstallation(installation_id, project_id);
      res.json(installation);
    } catch (err) {
      console.error("Error saving manual installation:", err.message);
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new GitHubController();
