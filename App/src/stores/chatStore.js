import { defineStore } from "pinia";
import ChatService from "@/services/Chat.service";
import { dayjs } from "element-plus";

export const useChatStore = defineStore("chat", {
  state: () => ({
    chatByChannel: {},
  }),

  actions: {
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

    async addChat(channelId, payload) {
      const res = await ChatService.sendMessage(payload);
      const newChat = {
        ...res,
        created_at: dayjs(res.created_at).format("DD/MM/YYYY HH:mm"),
      };
      if (!this.chatByChannel[channelId]) this.chatByChannel[channelId] = [];
      this.chatByChannel[channelId].unshift(newChat);
    },
  },

  getters: {
    getChatByChannel: (state) => (channelId) => state.chatByChannel[channelId] || [],
  },
});
