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
                  <!-- Chế độ xem --> 
                  <template v-if="editRow !== row.key"> 
                    <span v-if="row.key === 'priority'"> 
                      <el-tag :type=" task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success' " size="small" effect="plain" > 
                        {{ priorityLabel(task.priority) }} 
                      </el-tag>
                    </span> 
                    <span v-else-if="row.key === 'date'"> 
                      {{ formatDate(task.start_date) }} → {{ formatDate(task.due_date) }} 
                    </span> 
                    <span v-else-if="row.key === 'progress'"> 
                      {{ task.latest_progress ?? 0 }}% 
                    </span> 
                    <div v-else-if="row.key === 'assignee'"> 
                      <AvatarGroup v-if="task.assignees && task.assignees.length" :user-ids="task.assignees" :size="32" :max="5" :tooltips="true" /> 
                      <span v-else>Chưa có</span> 
                    </div> 
                    <el-button size="small" type="info" @click="startEdit(row.key)" link :icon="EditPen" /> 
                  </template> 
                  <!-- Chế độ chỉnh sửa --> 
                  <template v-else> 
                    <!-- Trạng thái --> 
                    <el-select v-if="row.key === 'status'" v-model="editCache.status" placeholder="Chọn trạng thái" size="small" > 
                      <el-option label="Đang chờ" value="todo" />
                      <el-option label="Đang tiến hành" value="in_progress" />
                      <el-option label="Hoàn thành" value="done" />
                    </el-select>

                    <!-- Ưu tiên -->
                    <el-select v-else-if="row.key === 'priority'" v-model="editCache.priority" placeholder="Chọn ưu tiên" size="small" >
                      <el-option label="Thấp" value="low" />
                      <el-option label="Trung Bình" value="medium" />
                      <el-option label="Cao" value="high" />
                    </el-select>

                    <!-- Ngày -->
                    <template v-else-if="row.key === 'date'">
                      <el-date-picker v-model="editCache.start_date" type="date" placeholder="Bắt đầu" size="small" />
                      → <el-date-picker v-model="editCache.due_date" type="date" placeholder="Kết thúc" size="small" />
                    </template>

                    <!-- Tiến độ -->
                    <el-select v-else-if="row.key === 'progress'" v-model="editCache.latest_progress" placeholder="Tiến độ" size="small" >
                      <el-option v-for="n in [0,10,20,30,40,50,60,70,80,90,100]" :key="n" :label="`${n}%`" :value="n" />
                    </el-select>
                    <!-- Người được giao -->
                    <div v-else-if="row.key === 'assignee'">
                      <el-select v-model="editCache.assignees" multiple placeholder="Chọn người được giao" style="width: 100%" size="small" >
                        <el-option v-for="member in members" :key="member.id" :label="member.name" :value="member.user_id" />
                      </el-select>
                    </div>
                    <el-button size="small" type="success" @click="saveEdit(row.key)" link :icon="Check" />
                    <el-button size="small" @click="cancelEdit" link :icon="Close" />
                  </template>
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
      :task-id="task.id"
      @file-added="loadData"
    />
  </el-dialog>
</template>


<script setup>
import { computed, onMounted, ref, watch, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { Check, Close, EditPen, Upload } from "@element-plus/icons-vue";
import { dayjs, ElMessage } from "element-plus";
import { getSocket } from "@/plugins/socket";

import UploadForm from "./Upload.vue";
import AvatarGroup from "./AvatarGroup.vue";
import FileCard from "./FileCard.vue";

import { useTaskStore } from "@/stores/taskStore";
import { useFileStore } from "@/stores/fileStore";
import { useCommentStore } from "@/stores/commentStore";
import MemberService from "@/services/Member.service";

let socket;

const props = defineProps({
  modelValue: Boolean,
  projectId: { type: Number, required: true },
  taskId: { type: Number, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const formRef = ref(false);
const editRow = ref(null);
const editCache = ref();
const members = ref([])
const task = ref({});
const newComment = ref("");

const taskStore = useTaskStore();
const fileStore = useFileStore();
const commentStore = useCommentStore();

const { getTasksByProject } = storeToRefs(taskStore);
const { getFilesByTask } = storeToRefs(fileStore);
const { getCommentsByTask } = storeToRefs(commentStore);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const files = computed(() => getFilesByTask.value(task.value.id) || []);
const comments = computed(() => getCommentsByTask.value(task.value.id) || []);

const tableData = computed(() => [
  { key: "priority", label: "Ưu tiên" },
  { key: "date", label: "Thời gian" },
  { key: "progress", label: "Tiến độ (%)" },
  { key: "assignee", label: "Người được giao" },
]);

const startEdit = (key) => {
  editRow.value = key;
  editCache.value = { ...task.value };
};

const cancelEdit = () => {
  editRow.value = null;
  editCache.value = {};
};

const saveEdit = (key) => {
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

  const updatedTask = { ...updated, changedField: key };
  taskStore.updateTask(props.projectId, updatedTask);
  editRow.value = null;
  visible.value = false;
};

const onUpload = () => (formRef.value = true);

const priorityLabel = (val) =>
  val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao";

const formatDate = (d) =>
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

const loadData = async () => {
  if (props.projectId) {
    await taskStore.loadTasks(props.projectId);
    const taskList = getTasksByProject.value(props.projectId);
    task.value = taskList.find(t => t.id === props.taskId) || {};

    if (task.value?.id) {
      await Promise.all([
        fileStore.loadFiles(task.value.id),
        commentStore.loadComments(task.value.id),
      ]);
    }
  }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    await commentStore.addComment(task.value.id, {
      user_id: user.id,
      task_id: task.value.id,
      content: newComment.value.trim(),
      project_id: props.projectId,
      owner_id: task.value.created_by
    });
    newComment.value = "";
    ElMessage.success("Đã thêm bình luận");
  } catch (err) {
    console.error("Lỗi khi thêm bình luận:", err);
  }
};

onMounted(() => {
  loadData();
  loadMembers();

  socket = getSocket();

  socket.on("comment", (data) => {
    loadData();
  });
});

onUnmounted(() => {
  socket.off("comment");
});

watch(
  () => visible.value,
  (val) => {
    if (val && task?.id) {
      loadData();
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