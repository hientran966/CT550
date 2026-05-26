import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ActivityModule } from '../activity/activity.module';
import { GitHubAuthService } from './github-auth.service';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { GitHubWebhookService } from './github-webhook.service';

@Module({
  imports: [DatabaseModule, ActivityModule],
  controllers: [GitHubController],
  providers: [GitHubAuthService, GitHubService, GitHubWebhookService],
})
export class GitHubModule {}
