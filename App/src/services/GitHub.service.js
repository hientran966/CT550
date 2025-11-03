import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/github";

export default {
  connectApp(projectId) {
    const installUrl = `https://github.com/apps/pmb2111798/installations/new?state=${projectId}`;
    window.open(installUrl, "_blank");
  },

  async saveManualInstallation(installationId, projectId) {
    const res = await axios.post(`${API_BASE}/save-installation`, {
      installation_id: installationId,
      project_id: projectId,
    });
    return res.data;
  },

  async getInstallationByProject(projectId) {
    const res = await axios.get(`${API_BASE}/project/${projectId}`);
    return res.data;
  },

  async getRepos(installationId) {
    const res = await axios.get(`${API_BASE}/installations/${installationId}/repos`);
    return res.data;
  },

  async getFile(installationId, owner, repo, path) {
    const res = await axios.get(
      `${API_BASE}/installations/${installationId}/repos/${owner}/${repo}/file/${path}`
    );
    return res.data;
  },
};
