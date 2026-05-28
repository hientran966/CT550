import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ActivityService } from '../activity/activity.service';
import { SocketService } from '../../socket/socket.service';

const TASK_REGEX = /#(\d+)/g;

@Injectable()
export class GitHubWebhookService {
  constructor(
    @Inject('MYSQL') private readonly mysql: any,
    private readonly activityService: ActivityService,
    private readonly socketService: SocketService,
  ) {}

  verifySignature(signature: string | undefined, rawBody: Buffer) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) throw new Error('Missing GITHUB_WEBHOOK_SECRET');
    if (!signature) throw new Error('No signature');

    const digest =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      throw new Error('Invalid signature');
    }
  }

  extractTaskCodes(text: string) {
    if (!text) return [];
    return text.match(TASK_REGEX) || [];
  }

  async getTaskId(projectId: number, code: string) {
    const digits = code.replace(/\D/g, '');
    if (!digits) return null;

    const [rows] = await this.mysql.execute(
      'SELECT id FROM tasks WHERE id = ? AND project_id = ? AND deleted_at IS NULL',
      [digits, projectId],
    );

    return rows.length ? rows[0].id : null;
  }

  async processGitWebhook(event: string, payload: any) {
    const repoFullName = payload.repository.full_name;
    const [rows] = await this.mysql.execute(
      'SELECT project_id FROM project_repositories WHERE full_name = ?',
      [repoFullName],
    );

    if (!rows.length) {
      return { message: 'Repository not linked to project', projectIds: [] };
    }

    const projectIds = rows.map((row) => row.project_id);

    for (const projectId of projectIds) {
      if (event === 'push') {
        await this.handlePushEvent(projectId, payload);
      } else if (event === 'pull_request') {
        await this.handlePullRequestEvent(projectId, payload);
      } else if (event === 'issues') {
        this.socketService.sendGitEventToProject(projectId, {
          type: 'issue',
          action: payload.action,
          title: payload.issue.title,
          user: payload.issue.user.login,
          url: payload.issue.html_url,
        });
      }
    }

    return { message: 'OK', projectIds };
  }

  async handlePushEvent(projectId: number, payload: any) {
    const branch = payload.ref.replace('refs/heads/', '');

    this.socketService.sendGitPushToProject(projectId, {
      repo: payload.repository.full_name,
      branch,
      pusher: payload.pusher?.name,
      commits: payload.commits,
    });

    if (branch !== 'main') return;

    const isMergeFromPr =
      payload.compare?.includes('/pull/') ||
      payload.head_commit?.message?.includes('Merge pull request') ||
      payload.commits.length > 1;

    if (isMergeFromPr) return;

    for (const commit of payload.commits || []) {
      const fullText = [commit.message, commit.title, commit.body]
        .filter(Boolean)
        .join('\n');
      const taskCodes = this.extractTaskCodes(fullText);

      for (const code of taskCodes) {
        const taskId = await this.getTaskId(projectId, code);
        if (taskId) {
          await this.activityService.create({
            project_id: projectId,
            task_id: taskId,
            actor_id: 0,
            detail: `Co commit moi: ${commit.message}`,
            created_at: new Date(),
          });
        }
      }

      this.socketService.sendGitCommitToProject(projectId, {
        message: commit.message,
        author: commit.author,
        url: commit.url,
      });
    }
  }

  async handlePullRequestEvent(projectId: number, payload: any) {
    const pr = payload.pull_request;
    const action = payload.action;
    const isOpened = action === 'opened';
    const isMerged =
      action === 'closed' && pr.merged === true && pr.base.ref === 'main';

    if (!isOpened && !isMerged) return;

    this.socketService.sendGitEventToProject(projectId, {
      type: 'pull_request',
      action,
      title: pr.title,
      user: pr.user.login,
      url: pr.html_url,
    });

    const taskCodes = this.extractTaskCodes(
      [pr.title, pr.body].filter(Boolean).join('\n'),
    );
    const detail = isOpened
      ? `Pull Request duoc mo: ${pr.title}`
      : `Pull Request da merged: ${pr.title}`;

    for (const code of taskCodes) {
      const taskId = await this.getTaskId(projectId, code);
      if (taskId) {
        await this.activityService.create({
          project_id: projectId,
          task_id: taskId,
          actor_id: 0,
          detail,
          created_at: new Date(),
        });
      }
    }
  }
}
