import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GitHubService } from './github.service';
import { GitHubWebhookService } from './github-webhook.service';

@Controller('github')
export class GitHubController {
  constructor(
    private readonly service: GitHubService,
    private readonly webhookService: GitHubWebhookService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    this.webhookService.verifySignature(signature, req.rawBody || Buffer.from(''));
    const result = await this.webhookService.processGitWebhook(event, req.body);
    return result.message;
  }

  @Get('callback')
  async callback(@Query() query: any, @Res() res: Response) {
    const { installation_id, state } = query;
    const projectId = state;

    if (!installation_id) throw new BadRequestException('Missing installation_id');

    await this.service.saveInstallation(installation_id, 'unknown_user');

    if (projectId) {
      const result = await this.service.linkInstallationToProject(
        projectId,
        installation_id,
      );
      if (result instanceof Error) {
        throw new BadRequestException(result.message);
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/git?connected=true&project=${projectId}`);
  }

  @Post('project/:projectId/link/:installationId')
  async linkInstallation(@Param() params: any) {
    const result = await this.service.linkInstallationToProject(
      params.projectId,
      params.installationId,
    );
    if (result instanceof Error) throw new BadRequestException(result.message);
    return { message: 'Linked successfully' };
  }

  @Get('project/:projectId/installation')
  getInstallation(@Param('projectId') projectId: string) {
    return this.service.getInstallationByProject(projectId);
  }

  @Get('installations/:installationId/repos')
  listRepos(@Param('installationId') installationId: string) {
    return this.service.listRepositories(installationId);
  }

  @Post('project/:projectId/repos')
  async saveProjectRepos(@Param('projectId') projectId: string, @Body() body: any) {
    await this.service.saveProjectRepositories(projectId, body.repos);
    return { message: 'Saved project repositories' };
  }

  @Get('project/:projectId/repos')
  getProjectRepos(@Param('projectId') projectId: string) {
    return this.service.getProjectRepositories(projectId);
  }

  @Delete('project/:projectId/unlink')
  async unlinkInstallation(@Param('projectId') projectId: string) {
    const result = await this.service.unlinkInstallationFromProject(projectId);
    if (result instanceof Error) throw new BadRequestException(result.message);
    return { message: 'Installation unlinked successfully' };
  }

  @Get('installations/:installationId/repos/:owner/:repo/tree/*path')
  listRepoFiles(@Param() params: any) {
    const path = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
    return this.service.listRepoFiles(
      params.installationId,
      params.owner,
      params.repo,
      path,
    );
  }

  @Get('installations/:installationId/repos/:owner/:repo/commits')
  listRecentCommits(@Param() params: any) {
    return this.service.listRecentCommits(
      params.installationId,
      params.owner,
      params.repo,
    );
  }

  @Get('installations/:installationId/repos/:owner/:repo/branches')
  listBranches(@Param() params: any) {
    return this.service.listBranches(params.installationId, params.owner, params.repo);
  }

  @Get('installations/:installationId/repos/:owner/:repo/pulls')
  listPullRequests(@Param() params: any, @Query('state') state = 'all') {
    return this.service.listPullRequests(
      params.installationId,
      params.owner,
      params.repo,
      state,
    );
  }
}
