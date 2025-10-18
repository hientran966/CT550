<template>
  <el-dialog
    class="task-detail"
    v-model="visible"
    :title="task.title"
    width="60%"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="dialog-content">
      <div class="split-layout" >
        <!-- Panel trái -->
        <div class="left-panel">
          <div class="panel-scroll">
            <h3>{{ task.title }}</h3>
            <p v-if="task.description" style="margin-bottom: 16px">
              {{ task.description }}
            </p>

            <!-- Bảng thông tin -->
            <el-table
              :data="tableData"
              border
              style="width: 100%"
              :show-header="false"
            >
              <el-table-column prop="label" label="Thuộc tính" width="150" />
              <el-table-column label="Giá trị">
                <template #default="{ row }">
                  <!-- Giữ nguyên phần logic hiển thị & chỉnh sửa -->
                  <!-- ... -->
                </template>
              </el-table-column>
            </el-table>

            <!-- Đính kèm file -->
            <el-button
              style="margin-top: 16px"
              plain
              :icon="Upload"
              @click="onUpload"
            >
              Đính Kèm File
            </el-button>

            <!-- Danh sách file -->
            <div
              v-if="files.length"
              class="file-grid"
            >
              <FileCard
                v-for="f in files"
                :key="f.id"
                :file="f"
                :size="'small'"
              />
            </div>
            <div v-else class="no-file">Chưa có file đính kèm</div>
          </div>
        </div>

        <!-- Panel phải -->
        <div class="right-panel">
          <div class="panel-scroll" style="padding: 0 !important;">
            <el-card style="height: 100%; border: 0 !important;">
              <template #header>
                <div style="font-weight: 600">Bình luận</div>
              </template>

              <div class="comment-list">
                <div
                  v-for="comment in comments"
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-user">{{ comment.user.name }}</div>
                  <div class="comment-text">{{ comment.content }}</div>
                  <div class="comment-time">{{ comment.created_at }}</div>
                  <el-divider />
                </div>
              </div>
              <template #footer>
                <el-input
                  v-model="newComment"
                  placeholder="Nhập bình luận..."
                  type="textarea"
                  rows="2"
                  style="margin-bottom: 8px"
                />
                <el-button
                  type="primary"
                  @click="addComment"
                  :disabled="!newComment.trim()"
                >
                  Gửi
                </el-button>
              </template>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <UploadForm
      v-model="formRef"
      :project-id="props.projectId"
      :task-id="props.task.id"
      @file-added="loadFiles"
    />
  </el-dialog>
</template>


<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Check, Close, EditPen, Upload } from "@element-plus/icons-vue";
import { dayjs, ElMessage } from "element-plus";
import UploadForm from "./Upload.vue";
import AvatarGroup from "./AvatarGroup.vue";
import FileCard from "./FileCard.vue";
import FileService from "@/services/File.service";
import MemberService from "@/services/Member.service";
import CommentService from "@/services/Comment.service";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: "low" | "medium" | "high";
  start_date?: string;
  due_date?: string;
  latest_progress?: number;
  assignees?: number[];
}

const props = defineProps<{
  modelValue: boolean;
  task: Task;
  projectId: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:task", value: Task): void;
}>();

const formRef = ref(false);
const editRow = ref<string | null>(null);
const editCache = ref<Partial<Task>>({});
const members = ref<any[]>([]);
const files = ref<any[]>([]);
const comments = ref([]);
const newComment = ref("");

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
const task = computed({
  get: () => props.task,
  set: (val) => Object.assign(props.task, val),
});

const tableData = computed(() => [
  { key: "priority", label: "Ưu tiên" },
  { key: "date", label: "Thời gian" },
  { key: "progress", label: "Tiến độ (%)" },
  { key: "assignee", label: "Người được giao" },
]);

const startEdit = (key: string) => {
  editRow.value = key;
  editCache.value = { ...task.value };
};

const cancelEdit = () => {
  editRow.value = null;
  editCache.value = {};
};

const saveEdit = (key: string) => {
  const updated = { ...task.value, ...editCache.value };

  if (key === "date") {
    if (
      updated.start_date &&
      updated.due_date &&
      new Date(updated.start_date) > new Date(updated.due_date)
    ) {
      ElMessage("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
  }

  if (updated.start_date)
    updated.start_date = new Date(updated.start_date)
      .toISOString()
      .split("T")[0];
  if (updated.due_date)
    updated.due_date = new Date(updated.due_date).toISOString().split("T")[0];

  if (Array.isArray(updated.assignees)) {
    updated.assignees = updated.assignees.map((id) => Number(id));
  }

  const updatedTask = { ...updated, changedField: key } as Task & {
    changedField: string;
  };
  emit("update:task", updatedTask);
  editRow.value = null;
  visible.value = false;
};

const onUpload = () => (formRef.value = true);

const priorityLabel = (val: string) =>
  val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const handleClose = () => (visible.value = false);

const loadMembers = async () => {
  try {
    const res = await MemberService.getByProjectId(props.projectId);
    members.value = res;
  } catch (err) {
    console.error(err);
  }
};

const loadFiles = async () => {
  try {
    const res = await FileService.getAllFiles({ task_id: props.task.id });
    files.value = res || [];
  } catch (err) {
    console.error(err);
  }
};

const loadComments = async () => {
  try {
    const res = await CommentService.getAllComments({
      task_id: props.task.id,
    });
    comments.value = (res || []).map((c) => ({
      ...c,
      created_at: dayjs(c.created_at).format("DD/MM/YYYY HH:mm"),
    }));
  } catch (err) {
    console.error("Lỗi khi load bình luận:", err);
  }
};

const addComment = async () => {
  try {
    const payload = {
      user_id: JSON.parse(localStorage.getItem("user") || "{}")?.id,
      task_id: props.task.id,
      content: newComment.value,
    };

    const res = await CommentService.createComment(payload);
    comments.value.unshift({
      ...res,
      created_at: dayjs(res.created_at).format("DD/MM/YYYY HH:mm"),
    });

    newComment.value = "";
    loadComments();
  } catch (err) {
    console.error("Lỗi khi gửi bình luận:", err);
  }
};

onMounted(() => {
  loadMembers();
  loadComments();
  if (props.task?.id) loadFiles();
});
watch(
  () => visible.value,
  (val) => {
    if (val && props.task?.id) {
      loadFiles();
    }
  }
);
</script>

<style scoped>
.task-detail :deep(.el-dialog__body) {
  padding: 0;
  overflow: hidden !important;
  display: flex;
  max-height: 100vh;
  flex-direction: column;
}

.dialog-content {
  flex: 1;
  height: 65vh;
  display: flex;
}

.split-layout {
  display: flex;
  height: 100%;
}
.left-panel {
  flex: 7;
  overflow-y: auto;
  padding: 12px;
}
.right-panel {
  flex: 3;
  overflow-y: auto;
  padding: 0;
}

.panel-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
}

.task-detail .el-table {
  margin-top: 12px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 6px;
  margin-top: 12px;
}

.no-file {
  margin-top: 12px;
  color: #888;
}

.comment-list {
  overflow-y: auto;
  margin-bottom: 12px;
  max-height: 270px;
}

:deep(.el-card__body) {
  padding-right: 0 !important;
}

.comment-item {
  cursor: pointer;
}

.comment-item:hover {
  background-color: #f5f5f5;
}

.comment-user {
  font-weight: 500;
}

.comment-text {
  font-size: 13px;
  color: #555;
}

.comment-time {
  font-size: 12px;
  color: #aaa;
}

.task-detail :deep(.el-splitter__trigger) {
  display: none !important;
  pointer-events: none !important;
}

.panel-scroll::-webkit-scrollbar,
.comment-list::-webkit-scrollbar {
  width: 6px;
}
.panel-scroll::-webkit-scrollbar-thumb,
.comment-list::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}
</style>