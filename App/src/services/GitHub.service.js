import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/github";

export default {
  connectApp(projectId) {
    const installUrl = `https://github.com/apps/pmb2111798/installations/new?state=${projectId}`;
    window.open(installUrl, "_blank");
  },

  async linkInstallation(projectId, installationId) {
    const res = await axios.post(
      `${API_BASE}/project/${projectId}/link/${installationId}`
    );
    return res.data;
  },

  async getInstallationByProject(projectId) {
    const res = await axios.get(
      `${API_BASE}/project/${projectId}/installation`
    );
    return res.data;
  },

  async listReposByInstallation(installationId) {
    const res = await axios.get(
      `${API_BASE}/installations/${installationId}/repos`
    );
    return res.data;
  },

  async saveProjectRepos(projectId, repos) {
    const res = await axios.post(`${API_BASE}/project/${projectId}/repos`, {
      repos,
    });
    return res.data;
  },

  async getProjectRepos(projectId) {
    const res = await axios.get(`${API_BASE}/project/${projectId}/repos`);
    return res.data;
  },

  async unlinkInstallation(projectId) {
    const res = await axios.delete(`${API_BASE}/project/${projectId}/unlink`);
    return res.data;
  },

  async listRepoFiles(installationId, owner, repo, path = "") {
    const res = await axios.get(
      `${API_BASE}/installations/${installationId}/repos/${owner}/${repo}/tree/${path}`
    );
    return res.data;
  },

  async listRecentCommits(installationId, owner, repo) {
    const res = await axios.get(
      `${API_BASE}/installations/${installationId}/repos/${owner}/${repo}/commits`
    );
    return res.data;
  },
};
