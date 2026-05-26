import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.fileService.findAll(query || {});
  }

  @Get('avatar/:id')
  getAvatar(@Param('id') id: string) {
    return this.fileService.getAvatar(Number(id));
  }

  @Post('avatar/:id')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Param('id') id: string, @UploadedFile() file, @Body() body) {
    return this.fileService.uploadAvatar(Number(id), {
      file_name: file?.originalname || body.file_name,
      file,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileService.findOne(Number(id));
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(@Req() req, @UploadedFile() file, @Body() body) {
    console.log(file);
    const payload = {
      file_name: file?.originalname || body.file_name,
      file,
      project_id: body.project_id,
      task_id: body.task_id,
      created_by: req.user.id,
    };

    const result = await this.fileService.create(payload);

    return {
      message: 'Tạo file thành công',
      result,
    };
  }

  @Post(':id/version')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addVersion(@Param('id') id: number, @Req() req, @UploadedFile() file) {
    const payload = {
      file_name: file.originalname,
      file,
      updated_by: req.user.id,
    };

    const result = await this.fileService.addVersion(id, payload);

    return {
      message: 'Thêm version thành công',
      result,
    };
  }

  @Get(':id/version')
  findAllVersion(@Param('id') id: string) {
    return this.fileService.findAllVersion(Number(id));
  }

  @Get(':id/version/:versionId')
  findVersion(@Param('versionId') versionId: string) {
    return this.fileService.findVersion(Number(versionId));
  }

  @Get(':id/role/:user_id')
  getRole(@Param('id') id: string, @Param('user_id') userId: string) {
    return this.fileService.getRole(Number(id), Number(userId));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.fileService.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.fileService.delete(Number(id));
  }
}
