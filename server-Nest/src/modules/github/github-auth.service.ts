import { Injectable } from '@nestjs/common';
import { request } from '@octokit/request';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GitHubAuthService {
  createAppJWT() {
    const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH;
    if (!privateKeyPath) throw new Error('Missing GITHUB_PRIVATE_KEY_PATH');

    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        iat: now - 60,
        exp: now + 540,
        iss: process.env.GITHUB_APP_ID,
      },
      privateKey,
      { algorithm: 'RS256' },
    );
  }

  async getInstallationAccessToken(installationId: number | string) {
    const jwtToken = this.createAppJWT();

    try {
      const response = await request(
        `POST /app/installations/${installationId}/access_tokens`,
        {
          headers: {
            authorization: `Bearer ${jwtToken}`,
            accept: 'application/vnd.github+json',
          },
        },
      );

      return response.data.token;
    } catch (error: any) {
      if (error.status === 404) {
        const err: any = new Error(
          'GitHub installation khong hop le hoac da bi go cai dat',
        );
        err.code = 'GITHUB_INSTALLATION_INVALID';
        err.status = 400;
        throw err;
      }

      if (error.status === 401) {
        const err: any = new Error('GitHub App authentication failed');
        err.code = 'GITHUB_APP_AUTH_FAILED';
        err.status = 500;
        throw err;
      }

      throw error;
    }
  }
}
