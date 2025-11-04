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
      <div class="split-layout">
        <!-- Left Panel -->
        <div class="left-panel">
          <div class="panel-scroll">
            <h3>{{ task.title }}</h3>
            <p v-if="task.description" style="margin-bottom: 16px">{{ task.description }}</p>

            <!-- Task Info Table -->
            <el-table :data="tableData" border style="width:100%" :show-header="false">
              <el-table-column prop="label" width="150" />
              <el-table-column label="Giá trị">
                <template #default="{ row }">
                  <template v-if="editRow !== row.key">
                    <!-- PRIORITY -->
                    <span v-if="row.key === 'priority'">
                      <el-tag
                        :type="task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'"
                        size="small"
                        effect="plain"
                      >
                        {{ priorityLabel(task.priority) }}
                      </el-tag>
                    </span>

                    <!-- DATE -->
                    <span v-else-if="row.key === 'date'">
                      {{ formatDate(task.start_date) }} → {{ formatDate(task.due_date) }}
                    </span>

                    <!-- PROGRESS -->
                    <span v-else-if="row.key === 'progress'">
                      <!-- Manual -->
                      <span v-if="task.progress_type === 'manual'">{{ task.latest_progress ?? 0 }}%</span>
                      <!-- Quantity -->
                      <span v-else-if="task.progress_type === 'quantity'">
                        {{ task.quantity_progress?.completed_quantity || 0 }}/{{ task.quantity_progress?.total_quantity || 0 }}
                      </span>
                    </span>

                    <!-- ASSIGNEE -->
                    <div v-else-if="row.key === 'assignee'">
                      <AvatarGroup
                        v-if="task.assignees?.length"
                        :user-ids="task.assignees"
                        :size="32"
                        :max="5"
                        :tooltips="true"
                      />
                      <span v-else>Chưa có</span>
                    </div>

                    <el-button
                      v-if="canEdit"
                      size="small"
                      type="info"
                      @click="startEdit(row.key)"
                      link
                      :icon="EditPen"
                    />
                  </template>

                  <!-- Edit Mode -->
                  <template v-else>
                    <el-select
                      v-if="row.key === 'status'"
                      v-model="editCache.status"
                      placeholder="Chọn trạng thái"
                      size="small"
                    >
                      <el-option label="Đang chờ" value="todo" />
                      <el-option label="Đang tiến hành" value="in_progress" />
                      <el-option label="Hoàn thành" value="done" />
                    </el-select>

                    <el-select
                      v-else-if="row.key === 'priority'"
                      v-model="editCache.priority"
                      placeholder="Chọn ưu tiên"
                      size="small"
                    >
                      <el-option label="Thấp" value="low" />
                      <el-option label="Trung Bình" value="medium" />
                      <el-option label="Cao" value="high" />
                    </el-select>

                    <template v-else-if="row.key === 'date'">
                      <el-date-picker v-model="editCache.start_date" type="date" placeholder="Bắt đầu" size="small" />
                      →
                      <el-date-picker v-model="editCache.due_date" type="date" placeholder="Kết thúc" size="small" />
                    </template>

                    <el-select
                      v-else-if="row.key === 'progress' && task.progress_type === 'manual'"
                      v-model="editCache.latest_progress"
                      placeholder="Tiến độ"
                      size="small"
                    >
                      <el-option
                        v-for="n in [0,10,20,30,40,50,60,70,80,90,100]"
                        :key="n"
                        :label="`${n}%`"
                        :value="n"
                      />
                    </el-select>

                    <el-input-number
                      v-else-if="row.key === 'progress' && task.progress_type === 'quantity'"
                      v-model="editCache.completed_quantity"
                      :min="0"
                      :max="editCache.total_quantity || 100"
                      size="small"
                      @change="updateQuantity"
                      style="width:80px; margin-left:8px"
                    />

                    <div v-else-if="row.key === 'assignee'">
                      <el-select v-model="editCache.assignees" multiple placeholder="Chọn người được giao" style="width:100%" size="small">
                        <el-option v-for="member in members" :key="member.id" :label="member.name" :value="member.user_id" />
                      </el-select>
                    </div>

                    <el-button size="small" type="success" @click="saveEdit(row.key)" link :icon="Check" />
                    <el-button size="small" @click="cancelEdit" link :icon="Close" />
                  </template>
                </template>
              </el-table-column>
            </el-table>

            <!-- SUBTASK TABLE -->
            <template v-if="task.progress_type === 'subtask'">
              <el-divider>Subtasks</el-divider>
              <el-table :data="task.subtasks || []" border style="width:100%">
                <el-table-column prop="title" label="Tiêu đề" />
                <el-table-column prop="status" label="Trạng thái">
                  <template #default="{ row }">
                    <el-select v-model="row.status" size="small" @change="updateSubtaskStatus(row)">
                      <el-option label="Đang chờ" value="todo" />
                      <el-option label="Đang tiến hành" value="in_progress" />
                      <el-option label="Hoàn thành" value="done" />
                    </el-select>
                  </template>
                </el-table-column>
              </el-table>
              <el-button type="primary" size="small" style="margin-top:8px" @click="addSubtask">Thêm Subtask</el-button>
            </template>

            <!-- File Upload -->
            <el-button
              v-if="canUpload"
              style="margin-top: 16px"
              plain
              :icon="Upload"
              @click="onUpload"
            >
              Đính Kèm File
            </el-button>

            <div v-if="files.length" class="file-grid">
              <FileCard v-for="f in files" :key="f.id" :file="f" size="small" />
            </div>
            <div v-else class="no-file">Chưa có file đính kèm</div>
          </div>
        </div>

        <!-- Right Panel: Comments -->
        <div class="right-panel">
          <div class="panel-scroll" style="padding: 0 !important;">
            <el-card style="height: 100%; border:0;">
              <template #header>
                <div style="font-weight:600;">Bình luận</div>
              </template>
              <div class="comment-list">
                <div v-for="comment in comments" :key="comment.id" class="comment-item">
                  <div class="comment-user">{{ comment.user.name }}</div>
                  <div class="comment-text">{{ comment.content }}</div>
                  <div class="comment-time">{{ comment.created_at }}</div>
                  <el-divider />
                </div>
              </div>
              <template #footer>
                <el-input v-model="newComment" placeholder="Nhập bình luận..." type="textarea" rows="2" style="margin-bottom:8px" />
                <el-button type="primary" @click="addComment" :disabled="!newComment.trim()">Gửi</el-button>
              </template>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <UploadDialog v-model="uploadRef" :project-id="props.projectId" :task-id="task.id" @file-added="loadData" />
  </el-dialog>
</template>

<script setup>
import { computed, ref, onMounted, watch, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { Check, Close, EditPen, Upload } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import UploadDialog from "./UploadDialog.vue";
import AvatarGroup from "./AvatarGroup.vue";
import FileCard from "./FileCard.vue";

import { useTaskStore } from "@/stores/taskStore";
import { useFileStore } from "@/stores/fileStore";
import { useCommentStore } from "@/stores/commentStore";
import { useRoleStore } from "@/stores/roleStore";
import MemberService from "@/services/Member.service";

const props = defineProps({
  modelValue: Boolean,
  projectId: { type: Number, required: true },
  taskId: { type: Number, required: true },
});

const emit = defineEmits(["update:modelValue"]);
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const uploadRef = ref(false);
const editRow = ref(null);
const editCache = ref({});
const task = ref({});
const members = ref([]);
const newComment = ref("");
const canEdit = ref(false);
const canUpload = ref(false);

const taskStore = useTaskStore();
const fileStore = useFileStore();
const commentStore = useCommentStore();
const roleStore = useRoleStore();

const { getTasksByProject } = storeToRefs(taskStore);
const { getFilesByTask } = storeToRefs(fileStore);
const { getCommentsByTask } = storeToRefs(commentStore);

const files = computed(() => getFilesByTask.value(task.value.id) || []);
const comments = computed(() => getCommentsByTask.value(task.value.id) || []);

const tableData = computed(() => [
  { key: "priority", label: "Ưu tiên" },
  { key: "date", label: "Thời gian" },
  ...(task.value.progress_type !== "subtask" ? [{ key: "progress", label: "Tiến độ (%)" }] : []),
  { key: "assignee", label: "Người được giao" },
]);

const priorityLabel = (val) => (val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao");
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const handleClose = () => (visible.value = false);

// ROLE CHECK
async function checkRole() {
  try {
    canEdit.value = await roleStore.canEditTask(props.taskId, props.projectId);
    canUpload.value = await roleStore.canUploadFileToTask(props.taskId, props.projectId);
  } catch {
    canEdit.value = canUpload.value = false;
  }
}

// EDIT TASK
const startEdit = (key) => {
  if (!canEdit.value) return ElMessage.warning("Bạn không có quyền chỉnh sửa task này");
  editRow.value = key;
  editCache.value = { ...task.value };
};

const cancelEdit = () => {
  editRow.value = null;
  editCache.value = {};
};

const saveEdit = (key) => {
  if (!canEdit.value) return ElMessage.warning("Bạn không có quyền chỉnh sửa");
  const updatedTask = { ...task.value, ...editCache.value, changedField: key };
  taskStore.updateTask(props.projectId, updatedTask);
  editRow.value = null;
};

// QUANTITY UPDATE
const updateQuantity = async () => {
  await taskStore.updateTask(props.projectId, {
    ...task.value,
    changedField: "progress",
    progress_type: "quantity",
    completed_quantity: editCache.value.completed_quantity,
    total_quantity: editCache.value.total_quantity,
  });
};

// SUBTASK
const updateSubtaskStatus = async (subtask) => {
  await taskStore.updateTask(props.projectId, { ...subtask, changedField: "status" });
  await loadData();
};

const addSubtask = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const newSub = await taskStore.addSubtask(task.value.id, {
    title: "Subtask mới",
    project_id: props.projectId,
    parent_task_id: task.value.id,
    created_by: user.id,
  });
  if (newSub) task.value.subtasks.push(newSub);
};

// UPLOAD
const onUpload = () => {
  if (!canUpload.value) return ElMessage.warning("Bạn không có quyền upload file cho task này");
  uploadRef.value = true;
};

// LOAD DATA
const loadMembers = async () => {
  try { members.value = await MemberService.getByProjectId(props.projectId); } 
  catch { members.value = []; }
};

const loadData = async () => {
  await taskStore.loadTasks(props.projectId);
  const taskList = getTasksByProject.value(props.projectId);
  task.value = taskList.find((t) => t.id === props.taskId) || {};

  if (task.value?.id) {
    await Promise.all([fileStore.loadFiles(task.value.id), commentStore.loadComments(task.value.id)]);
  }
};

// COMMENTS
const addComment = async () => {
  if (!newComment.value.trim()) return;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  await commentStore.addComment(task.value.id, {
    user_id: user.id,
    task_id: task.value.id,
    content: newComment.value.trim(),
    project_id: props.projectId,
    owner_id: task.value.created_by,
  });
  newComment.value = "";
};

// LIFECYCLE
onMounted(async () => { await loadData(); await loadMembers(); await checkRole(); });
watch(() => visible.value, async (val) => { if (val) { await loadData(); await checkRole(); } });
</script>

<style scoped>
.task-detail :deep(.el-dialog__body) { padding:0; overflow:hidden; display:flex; max-height:100vh; flex-direction:column; }
.dialog-content { flex:1; height:65vh; display:flex; }
.split-layout { display:flex; height:100%; }
.left-panel { flex:7; overflow-y:auto; padding:12px; }
.right-panel { flex:3; overflow-y:auto; padding:0; }
.panel-scroll { height:100%; overflow-y:auto; padding:12px; box-sizing:border-box; }
.file-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:6px; margin-top:12px; }
.no-file { margin-top:12px; color:#888; }
.comment-list { overflow-y:auto; margin-bottom:12px; max-height:270px; }
.comment-item:hover { background-color:#f5f5f5; cursor:pointer; }
.comment-user { font-weight:500; }
.comment-text { font-size:13px; color:#555; }
.comment-time { font-size:12px; color:#aaa; }
</style>