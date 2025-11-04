const express = require("express");
const crypto = require("crypto");
const GitHubService = require("../services/Github.service.js");
const router = express.Router();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "MY_SECRET";

function verifySignature(req, res, buf) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) throw new Error("No signature");
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(buf).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    throw new Error("Invalid signature");
  }
}

router.post(
  "/webhook",
  express.json({ verify: verifySignature }),
  async (req, res) => {
    const event = req.headers["x-github-event"];
    const payload = req.body;
    console.log(
      "webhook catch",
      event,
      payload.action,
      payload.installation.account.login,
      req.query.state
    );

    if (event === "installation") {
      const action = payload.action;
      if (action === "created") {
        const installationId = payload.installation.id;
        const accountLogin = payload.installation.account.login;
        const state = req.query.state;
        const projectId = state || null;

        await GitHubService.saveInstallation(
          installationId,
          accountLogin,
          projectId
        );
        console.log(
          `Saved installation ${installationId} for project ${projectId}`
        );
      }
    }

    res.status(200).send("OK");
  }
);

module.exports = router;
