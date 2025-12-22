import { defineStore } from "pinia";
import ChatService from "@/services/Chat.service";
import { dayjs } from "element-plus";

export const useChatStore = defineStore("chat", {
  state: () => ({
    chatByChannel: {},
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
      }
    },

    appendChat(channelId, chat) {
      const formatted = {
        ...chat,
        created_at: dayjs(chat.created_at).format("DD/MM/YYYY HH:mm"),
      };

      this.chatByChannel[channelId] = [
        ...(this.chatByChannel[channelId] || []),
        formatted,
      ];
    },

    /* ================= CHANNEL ================= */

    async getChannelDetail(channelId) {
      const cached = this.channels.find(c => c.id === channelId);
      console.log('cached channel:', cached);
      if (cached) return cached;

      const channel = await ChatService.getChannelById(channelId);
      console.log('fetched channel:', channel);
      this.channels.push(channel);
      return channel;
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
  },

  getters: {
    getChatByChannel: (state) => (channelId) =>
      state.chatByChannel[channelId] || [],
  },
});