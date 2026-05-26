import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('noti')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.service.find(query || {});
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMyNotifications(@Req() req, @Query() query: any) {
    return this.service.find({
      ...query,
      recipient_id: req.user.id,
    });
  }

  @Get('me/count')
  @UseGuards(AuthGuard)
  getMyCount(@Req() req) {
    return this.service.getNewCount(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(Number(id));
  }

  @Patch('me/read')
  @UseGuards(AuthGuard)
  markAllAsRead(@Req() req) {
    return this.service.markAllAsRead(req.user.id);
  }

  @Patch('me/unread')
  @UseGuards(AuthGuard)
  markAllAsUnread(@Req() req) {
    return this.service.markAllAsUnread(req.user.id);
  }

  @Get('recipient/:recipient_id')
  getNewCount(@Param('recipient_id') recipientId: string) {
    return this.service.getNewCount(Number(recipientId));
  }

  @Patch('recipient/:recipient_id')
  markAllAsReadByRecipient(@Param('recipient_id') recipientId: string) {
    return this.service.markAllAsRead(Number(recipientId));
  }

  @Patch('recipient/:recipient_id/unread')
  markAllAsUnreadByRecipient(@Param('recipient_id') recipientId: string) {
    return this.service.markAllAsUnread(Number(recipientId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Put('deactive/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(Number(id));
  }
}
