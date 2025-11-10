const GitHubService = require("../services/Github.service");

class GitHubController {
  // callback khi cài đặt app
  async callback(req, res) {
    const { installation_id, state } = req.query;
    const projectId = state;

    if (!installation_id)
      return res.status(400).json({ message: "Missing installation_id" });

    await GitHubService.saveInstallation(installation_id, "unknown_user");
    if (projectId) {
      await GitHubService.linkInstallationToProject(projectId, installation_id);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    res.redirect(`${frontendUrl}/git?connected=true&project=${projectId}`);
  }

  // gán installation cho project
  async linkInstallation(req, res) {
    const { projectId, installationId } = req.params;
    await GitHubService.linkInstallationToProject(projectId, installationId);
    res.json({ message: "Linked successfully" });
  }

  // lấy installation của project
  async getInstallation(req, res) {
    const { projectId } = req.params;
    const installation =
      await GitHubService.getInstallationByProject(projectId);
    if (!installation)
      return res.status(404).json({ message: "No installation found" });
    res.json(installation);
  }

  // lấy danh sách repo trong installation
  async listRepos(req, res) {
    const { installationId } = req.params;
    const repos = await GitHubService.listRepositories(installationId);
    res.json(repos);
  }

  // lưu repo mà project chọn
  async saveProjectRepos(req, res) {
    const { projectId } = req.params;
    const repos = req.body.repos;
    await GitHubService.saveProjectRepositories(projectId, repos);
    res.json({ message: "Saved project repositories" });
  }

  // lấy repo mà project đang liên kết
  async getProjectRepos(req, res) {
    const { projectId } = req.params;
    const repos = await GitHubService.getProjectRepositories(projectId);
    res.json(repos);
  }

  // huỷ installation khỏi project
  async unlinkInstallation(req, res) {
    const { projectId } = req.params;
    await GitHubService.unlinkInstallationFromProject(projectId);
    res.json({ message: "Installation unlinked successfully" });
  }

  // list files
  async listRepoFiles(req, res) {
    const { installationId, owner, repo } = req.params;
    const path = req.params[0] || "";
    const files = await GitHubService.listRepoFiles(
      installationId,
      owner,
      repo,
      path
    );
    res.json(files);
  }

  // list commits
  async listRecentCommits(req, res) {
    const { installationId, owner, repo } = req.params;
    const commits = await GitHubService.listRecentCommits(
      installationId,
      owner,
      repo
    );
    res.json(commits);
  }

  // list branches
  async listBranches(req, res) {
    const { installationId, owner, repo } = req.params;
    const branches = await GitHubService.listBranches(
      installationId,
      owner,
      repo
    );
    res.json(branches);
  }

  // list pull requests
  async listPullRequests(req, res) {
    const { installationId, owner, repo } = req.params;
    const state = req.query.state || "all";
    const pulls = await GitHubService.listPullRequests(
      installationId,
      owner,
      repo,
      state
    );
    res.json(pulls);
  }
}

module.exports = new GitHubController();
