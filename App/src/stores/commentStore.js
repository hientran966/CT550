import { defineStore } from "pinia";
import CommentService from "@/services/Comment.service";
import { dayjs } from "element-plus";

export const useCommentStore = defineStore("comment", {
  state: () => ({
    commentsByTask: {},
    commentsByVersion: {},
  }),

  actions: {
    async loadComments(taskId) {
      try {
        const res = await CommentService.getAllComments({ task_id: taskId });
        this.commentsByTask[taskId] = (res || []).map((c) => ({
          ...c,
          created_at: dayjs(c.created_at).format("DD/MM/YYYY HH:mm"),
        }));
      } catch (err) {
        console.error("Lỗi load bình luận:", err);
      }
    },

    async addComment(taskId, payload) {
      const res = await CommentService.createComment(payload);
      const newCmt = {
        ...res,
        created_at: dayjs(res.created_at).format("DD/MM/YYYY HH:mm"),
      };
      if (!this.commentsByTask[taskId]) this.commentsByTask[taskId] = [];
      this.commentsByTask[taskId].unshift(newCmt);
    },
  },

  getters: {
    getCommentsByTask: (state) => (taskId) => state.commentsByTask[taskId] || [],
  },
});
