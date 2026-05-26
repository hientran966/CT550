import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private io?: Server;
  private readonly onlineUsers = new Map<string, string>();

  init(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      socket.on('register', (userId) => {
        this.onlineUsers.set(String(userId), socket.id);
        (socket as any).userId = userId;
      });

      socket.on('join_channel', (channelId) => {
        socket.join(`channel_${channelId}`);
      });

      socket.on('leave_channel', (channelId) => {
        socket.leave(`channel_${channelId}`);
      });

      socket.on('chat_message', (data) => {
        if (data?.channel_id) {
          this.sendMessageToChannel(data.channel_id, data);
        }
      });

      socket.on('disconnect', () => {
        for (const [userId, socketId] of this.onlineUsers.entries()) {
          if (socketId === socket.id) {
            this.onlineUsers.delete(userId);
            break;
          }
        }
      });
    });
  }

  sendToUser(userId: number | string, event: string, payload: any) {
    const socketId = this.onlineUsers.get(String(userId));
    if (this.io && socketId) this.io.to(socketId).emit(event, payload);
  }

  sendMessageToChannel(channelId: number | string, message: any) {
    this.io?.to(`channel_${channelId}`).emit('chat_message', message);
  }

  async sendToProject(
    mysql: any,
    projectId: number | string,
    event: string,
    payload: any,
  ) {
    if (!this.io) return;

    const [rows] = await mysql.execute(
      `SELECT user_id FROM project_members WHERE project_id = ? AND deleted_at IS NULL`,
      [projectId],
    );

    for (const row of rows) {
      this.sendToUser(row.user_id, event, payload);
    }
  }

  sendGitPushToProject(mysql: any, projectId: number | string, payload: any) {
    return this.sendToProject(mysql, projectId, 'git_push', payload);
  }

  sendGitCommitToProject(mysql: any, projectId: number | string, payload: any) {
    return this.sendToProject(mysql, projectId, 'git_commit', payload);
  }

  sendGitEventToProject(mysql: any, projectId: number | string, payload: any) {
    return this.sendToProject(mysql, projectId, 'git_event', payload);
  }
}
