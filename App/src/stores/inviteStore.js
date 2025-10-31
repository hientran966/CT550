import { defineStore } from "pinia";
import MemberService from "@/services/Member.service";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";
import { ElMessage } from "element-plus";

export const useInviteStore = defineStore("invite", {
  state: () => ({
    invites: [],
    loading: false,
    inviterAvatars: {},
  }),

  actions: {
    async fetchInvites() {
      try {
        this.loading = true;
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;

        const res = await MemberService.getInviteList(user.id);
        this.invites = Array.isArray(res) ? res : [];

        await this.loadInviterAvatars();
      } catch (err) {
        console.error("Lỗi khi tải lời mời:", err);
      } finally {
        this.loading = false;
      }
    },

    async loadInviterAvatars() {
      const uniqueIds = [...new Set(this.invites.map((i) => i.invited_by))];

      await Promise.all(
        uniqueIds.map(async (id) => {
          if (!this.inviterAvatars[id]) {
            try {
              const res = await FileService.getAvatar(id);
              this.inviterAvatars[id] = res?.file_url || defaultAvatar;
            } catch {
              this.inviterAvatars[id] = defaultAvatar;
            }
          }
        })
      );
    },

    async acceptInvite(inviteId) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;
        await MemberService.acceptInvite(inviteId, user.id);
        this.invites = this.invites.filter((i) => i.id !== inviteId);
        ElMessage.success("Đã chấp nhận lời mời!");
      } catch (err) {
        console.error("Lỗi khi chấp nhận lời mời:", err);
        ElMessage.error("Không thể chấp nhận lời mời");
      }
    },

    async declineInvite(inviteId) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;
        await MemberService.declineInvite(inviteId, user.id);
        this.invites = this.invites.filter((i) => i.id !== inviteId);
        ElMessage.info("Đã từ chối lời mời");
      } catch (err) {
        console.error("Lỗi khi từ chối lời mời:", err);
      }
    },
  },

  getters: {
    inviteCount: (state) => state.invites.length,

    invitesWithAvatar: (state) =>
      state.invites.map((item) => ({
        ...item,
        inviterAvatar: state.inviterAvatars[item.invited_by] || defaultAvatar,
      })),
  },
});