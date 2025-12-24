import { defineStore } from "pinia";
import ChatService from "@/services/Chat.service";
import { dayjs } from "element-plus";

export const useChatStore = defineStore("chat", {
  state: () => ({
    chatByChannel: {},
    membersByChannel: {},
    channels: [],
  }),

  actions: {
    /* ================= MESSAGES ================= */

    async loadChats(channelId) {
      try {
        const res = await ChatService.getChannelMessages(channelId);

        this.chatByChannel[channelId] = (res || []).map((c) => ({
          ...c,
          created_at: dayjs(c.created_at).format("DD/MM/YYYY HH:mm"),
        }));
      } catch (err) {
        console.error("Lỗi load tin nhắn:", err);
        this.chatByChannel[channelId] = [];
      }
    },

    appendChat(channelId, chat) {
      if (!this.chatByChannel[channelId]) {
        this.chatByChannel[channelId] = [];
      }

      const formatted = {
        ...chat,
        created_at: dayjs(chat.created_at).format("DD/MM/YYYY HH:mm"),
      };

      this.chatByChannel[channelId].push(formatted);
    },

    /* ================= CHANNEL ================= */

    async getChannelDetail(channelId) {
      const cached = this.channels.find(c => c.id === channelId);
      if (cached) return cached;

      const channel = await ChatService.getChannelById(channelId);
      this.channels.push(channel);
      return channel;
    },

    async loadChannelByUser(projectId, userId) {
      const res = await ChatService.getChannelsByUser(projectId, userId);
      this.channels = res || [];
      return this.channels;
    },

    async loadChannelsByProject(projectId) {
      const res = await ChatService.getChannelsByProject(projectId);
      this.channels = res || [];
      return this.channels;
    },

    async createChannel(payload) {
      const channel = await ChatService.createChannel(payload);
      this.channels.push(channel);
      return channel;
    },

    async updateChannel(channelId, payload) {
      const updated = await ChatService.updateChannel(channelId, payload);

      const idx = this.channels.findIndex(c => c.id === channelId);
      if (idx !== -1) {
        this.channels[idx] = updated;
      }

      return updated;
    },

    async deleteChannel(channelId) {
      await ChatService.deleteChannel(channelId);

      this.channels = this.channels.filter(c => c.id !== channelId);
      delete this.chatByChannel[channelId];
    },
    /* ================= MEMBER ================= */
    async getChannelMembers(channelId) {
      const members = await ChatService.getChannelMembers(channelId);
      this.membersByChannel[channelId] = members;
      return members;
    },

    async addChannelMember(channelId, userId) {
      const updated = await ChatService.addMember({channel_id: channelId, user_id: userId});
      console.log("Adding member", { channelId, userId });
      const idx = this.channels.findIndex(c => c.id === channelId);
      if (idx !== -1) {
        this.channels[idx] = updated;
      }
      return updated;
    },

    async removeChannelMember(channelId, userId) {
      const updated = await ChatService.removeMember({channel_id: channelId, user_id: userId});
      const idx = this.channels.findIndex(c => c.id === channelId);
      if (idx !== -1) {
        this.channels[idx] = updated;
      }
      return updated;
    }
  },

  getters: {
    getChatByChannel: (state) => (channelId) =>
      state.chatByChannel[channelId] || [],
  },
});