import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { GitHubAuthService } from './github-auth.service';

@Injectable()
export class GitHubService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly authService: GitHubAuthService,
  ) {}

  async verifyInstallationId(installationId: number | string) {
    try {
      await this.authService.getInstallationAccessToken(installationId);
      return true;
    } catch (error: any) {
      if (error.code === 'GITHUB_INSTALLATION_INVALID') return false;
      throw error;
    }
  }

  async saveInstallation(installationId: number | string, accountLogin: string) {
    await this.mysql.query(
      `
      INSERT INTO github_installations (installation_id, account_login)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE account_login = VALUES(account_login)
      `,
      [installationId, accountLogin],
    );
  }

  async linkInstallationToProject(
    projectId: number | string,
    installationId: number | string,
    accountLogin: string | null = null,
  ) {
    const conn = await this.mysql.getConnection();
    try {
      const isValid = await this.verifyInstallationId(installationId);
      if (!isValid) {
        return new Error('GitHub installation ID khong ton tai hoac da bi go');
      }

      await conn.beginTransaction();

      const [exists] = await conn.query(
        'SELECT 1 FROM project_installations WHERE project_id = ?',
        [projectId],
      );
      if (exists.length) {
        await conn.rollback();
        return new Error('This project already has an installation linked.');
      }

      const [checkInstall] = await conn.query(
        'SELECT 1 FROM github_installations WHERE installation_id = ?',
        [installationId],
      );

      if (!checkInstall.length) {
        await conn.query(
          'INSERT INTO github_installations (installation_id, account_login) VALUES (?, ?)',
          [installationId, accountLogin],
        );
      }

      await conn.query(
        `INSERT INTO project_installations (project_id, installation_id)
         VALUES (?, ?)`,
        [projectId, installationId],
      );

      await conn.commit();
      return null;
    } catch (error) {
      await conn.rollback();
      return error;
    } finally {
      conn.release();
    }
  }

  async getInstallationByProject(projectId: number | string) {
    const [rows] = await this.mysql.query(
      `SELECT gi.installation_id, gi.account_login
       FROM github_installations gi
       JOIN project_installations pi ON gi.installation_id = pi.installation_id
       WHERE pi.project_id = ?
       LIMIT 1`,
      [projectId],
    );
    return rows[0] || null;
  }

  async listRepositories(installationId: number | string) {
    const token = await this.authService.getInstallationAccessToken(installationId);
    const res = await axios.get('https://api.github.com/installation/repositories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.repositories;
  }

  async saveProjectRepositories(projectId: number | string, repos: any[]) {
    if (!repos?.length) return;

    const conn = await this.mysql.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM project_repositories WHERE project_id = ?', [
        projectId,
      ]);

      for (const repo of repos) {
        await conn.query(
          `INSERT INTO project_repositories
           (project_id, repo_id, full_name, html_url, is_private)
           VALUES (?, ?, ?, ?, ?)`,
          [projectId, repo.id, repo.full_name, repo.html_url, repo.private],
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getProjectRepositories(projectId: number | string) {
    const [rows] = await this.mysql.query(
      'SELECT * FROM project_repositories WHERE project_id = ?',
      [projectId],
    );
    return rows;
  }

  async listRepoFiles(
    installationId: number | string,
    owner: string,
    repo: string,
    path = '',
  ) {
    const token = await this.authService.getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  }

  async listRecentCommits(
    installationId: number | string,
    owner: string,
    repo: string,
    limit = 4,
  ) {
    const token = await this.authService.getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  }

  async listBranches(installationId: number | string, owner: string, repo: string) {
    const token = await this.authService.getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      commitSha: branch.commit.sha,
      url: branch.commit.html_url,
    }));
  }

  async listPullRequests(
    installationId: number | string,
    owner: string,
    repo: string,
    state = 'all',
  ) {
    const token = await this.authService.getInstallationAccessToken(installationId);
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
      user: pr.user?.login,
      avatar_url: pr.user?.avatar_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
    }));
  }

  async unlinkInstallationFromProject(projectId: number | string) {
    const conn = await this.mysql.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        'SELECT installation_id FROM project_installations WHERE project_id = ?',
        [projectId],
      );
      if (!rows.length) {
        await conn.rollback();
        return new Error('Khong tim thay installation');
      }

      await conn.query('DELETE FROM project_repositories WHERE project_id = ?', [
        projectId,
      ]);
      await conn.query('DELETE FROM project_installations WHERE project_id = ?', [
        projectId,
      ]);

      await conn.commit();
      return { installationId: rows[0].installation_id };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
