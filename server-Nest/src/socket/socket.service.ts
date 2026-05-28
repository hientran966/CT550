import { Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketService {
  private io?: Server;

  constructor(@Inject('MYSQL') private readonly mysql: any) {}

  init(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      socket.on('register', (userId) => {
        void this.registerSocket(socket, userId);
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
    });
  }

  private userRoom(userId: number | string) {
    return `user_${userId}`;
  }

  private projectRoom(projectId: number | string) {
    return `project_${projectId}`;
  }

  private leaveProjectRooms(socket: Socket) {
    for (const room of socket.rooms) {
      if (room.startsWith('project_')) {
        socket.leave(room);
      }
    }
  }

  private async registerSocket(socket: Socket, userId: number | string) {
    const normalizedUserId = String(userId);
    (socket as any).userId = normalizedUserId;

    socket.join(this.userRoom(normalizedUserId));
    this.leaveProjectRooms(socket);

    const [rows] = await this.mysql.execute(
      `SELECT project_id FROM project_members WHERE user_id = ? AND deleted_at IS NULL`,
      [normalizedUserId],
    );

    for (const row of rows) {
      socket.join(this.projectRoom(row.project_id));
    }
  }

  sendToUser(userId: number | string, event: string, payload: any) {
    this.io?.to(this.userRoom(userId)).emit(event, payload);
  }

  sendMessageToChannel(channelId: number | string, message: any) {
    this.io?.to(`channel_${channelId}`).emit('chat_message', message);
  }

  sendToProject(projectId: number | string, event: string, payload: any) {
    this.io?.to(this.projectRoom(projectId)).emit(event, payload);
  }

  sendGitPushToProject(projectId: number | string, payload: any) {
    return this.sendToProject(projectId, 'git_push', payload);
  }

  sendGitCommitToProject(projectId: number | string, payload: any) {
    return this.sendToProject(projectId, 'git_commit', payload);
  }

  sendGitEventToProject(projectId: number | string, payload: any) {
    return this.sendToProject(projectId, 'git_event', payload);
  }
}
