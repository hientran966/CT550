import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('members')
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.service.find(query || {});
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.service.getByProjectId(Number(projectId));
  }

  @Get('invites')
  @UseGuards(AuthGuard)
  getMyInvites(@Req() req) {
    return this.service.getInviteList(req.user.id);
  }

  @Get('user/:id')
  getInviteList(@Param('id') id: string) {
    return this.service.getInviteList(Number(id));
  }

  @Get('check/:project_id/:user_id')
  async checkIfMemberExists(
    @Param('project_id') projectId: string,
    @Param('user_id') userId: string,
  ) {
    const exists = await this.service.checkIfMemberExists(
      Number(projectId),
      Number(userId),
    );
    return { exists };
  }

  @Put(':id/accept')
  @UseGuards(AuthGuard)
  acceptInvite(@Param('id') id: string, @Req() req) {
    return this.service.acceptInvite(Number(id), req.user.id);
  }

  @Post(':id/accept')
  acceptInviteLegacy(@Param('id') id: string, @Body() body: any) {
    return this.service.acceptInvite(Number(id), Number(body.user_id));
  }

  @Put(':id/decline')
  @UseGuards(AuthGuard)
  declineInvite(@Param('id') id: string, @Req() req) {
    return this.service.declineInvite(Number(id), req.user.id);
  }

  @Post(':id/decline')
  declineInviteLegacy(@Param('id') id: string, @Body() body: any) {
    return this.service.declineInvite(Number(id), Number(body.user_id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}
