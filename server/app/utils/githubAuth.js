import fs from "fs";
import jwt from "jsonwebtoken";
import { request } from "@octokit/request";

export const createAppJWT = () => {
  const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, "utf8");
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iat: now - 60,       // issued 1 phút trước
    exp: now + 540,      // hết hạn sau 9 phút
    iss: process.env.GITHUB_APP_ID,
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
};

export const getInstallationAccessToken = async (installationId) => {
  const jwtToken = createAppJWT();

  const response = await request(`POST /app/installations/${installationId}/access_tokens`, {
    headers: {
      authorization: `Bearer ${jwtToken}`,
      accept: "application/vnd.github+json",
    },
  });

  return response.data.token;
};