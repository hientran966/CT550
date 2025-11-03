const express = require("express");
const GitHubController = require("../controllers/github.controller.js");

const router = express.Router();

router.get("/callback", GitHubController.callback);
router.get("/installations/:installationId/repos", GitHubController.listRepos);
router.get("/installations/:installationId/repos/:owner/:repo/file/*", GitHubController.getFile);

router.get("/project/:projectId", GitHubController.getInstallationByProject);
router.post("/save-installation", GitHubController.saveManualInstallation);

module.exports = router;