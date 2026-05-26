import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.service.find(query || {});
  }

  @Get('project/:project_id/user/:user_id')
  getByUserId(
    @Param('project_id') projectId: string,
    @Param('user_id') userId: string,
  ) {
    return this.service.getByUserId(Number(userId), Number(projectId));
  }

  @Get('project/:project_id')
  findByProject(@Param('project_id') projectId: string) {
    return this.service.find({ project_id: Number(projectId) });
  }

  @Get(':channel_id/members')
  getMembers(@Param('channel_id') channelId: string) {
    return this.service.getMembers(Number(channelId));
  }

  @Post('member')
  addMember(@Body() body: any) {
    return this.service.addMember(Number(body.channel_id), Number(body.user_id));
  }

  @Delete('member')
  removeMember(@Body() body: any) {
    return this.service.removeMember(
      Number(body.channel_id),
      Number(body.user_id),
    );
  }

  @Post('message')
  addMessage(@Body() body: any) {
    return this.service.addMessage(body);
  }

  @Post('message/files')
  @UseInterceptors(FilesInterceptor('files'))
  addMessageWithFiles(@UploadedFiles() files: any[], @Body() body: any) {
    return this.service.addMessageWithFiles({
      channel_id: body.channel_id,
      sender_id: body.sender_id,
      parent_id: body.parent_id,
      content: body.content,
      project_id: body.project_id,
      task_id: body.task_id,
      files: (files || []).map((file) => ({
        file_name: file.originalname,
        file,
        project_id: body.project_id || null,
        task_id: body.task_id || null,
      })),
    });
  }

  @Get('message/:id/channel')
  getMessageChannel(@Param('id') id: string) {
    return this.service.getMessageChannel(Number(id));
  }

  @Get(':channel_id/messages')
  getMessages(@Param('channel_id') channelId: string, @Query() query: any) {
    return this.service.getMessages(Number(channelId), query || {});
  }

  @Post('mentions')
  addMentions(@Body() body: any) {
    return this.service.addMentions(
      Number(body.message_id),
      body.mentioned_user_ids,
      Number(body.actor_id),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}
