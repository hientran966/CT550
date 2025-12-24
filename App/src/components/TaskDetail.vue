<template>
  <el-dialog
    class="task-detail"
    v-model="visible"
    width="1000px"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="header-editable">
        <!-- NORMAL MODE -->
        <template v-if="editRow !== 'title'">
          <span class="task-title"># {{ task.id }} - {{ task.title }}</span>

          <el-button
            v-if="canEdit"
            link
            :icon="EditPen"
            @click="startEditTitle"
            style="margin-left: 4px"
          />
        </template>

        <!-- EDIT MODE -->
        <template v-else>
          <el-input
            v-model="editCache.title"
            size="small"
            style="width: 60%"
          />

          <el-button
            link
            type="success"
            :icon="Check"
            @click="saveTitle"
          />

          <el-button
            link
            :icon="Close"
            @click="cancelEdit"
          />
        </template>
      </div>
    </template>
    <div class="dialog-content">
      <div class="split-layout">
        <!-- Left Panel -->
        <div class="left-panel">
          <div class="panel-scroll">
            <div class="description-block" v-if="task.description">
              <div class="desc-header">
                <strong>Mô tả</strong>

                <!-- Edit icon -->
                <el-button
                  v-if="canEdit && editRow !== 'description'"
                  link
                  :icon="EditPen"
                  class="desc-edit-btn"
                  @click="startEditDescription"
                />
              </div>

              <!-- VIEW MODE -->
              <div v-if="editRow !== 'description'" class="desc-content">
                <p v-if="task.description">{{ task.description }}</p>
                <p v-else class="desc-empty">Chưa có mô tả...</p>
              </div>

              <!-- EDIT MODE -->
              <div v-else class="desc-edit-box">
                <el-input
                  type="textarea"
                  v-model="editCache.description"
                  rows="4"
                  placeholder="Nhập mô tả..."
                />

                <div class="desc-actions">
                  <el-button
                    size="small"
                    type="success"
                    @click="saveDescription"
                  >
                    Lưu
                  </el-button>

                  <el-button
                    size="small"
                    @click="cancelEdit"
                  >
                    Hủy
                  </el-button>
                </div>
              </div>
            </div>

            <hr class="section-divider" />

            <!-- Task Info Table -->
            <el-table
              :data="tableData"
              border
              style="width: 100%"
              :show-header="false"
            >
              <el-table-column prop="label" width="150" />
              <el-table-column label="Giá trị">
                <template #default="{ row }">
                  <template v-if="editRow !== row.key">
                    <!-- PRIORITY -->
                    <span v-if="row.key === 'priority'">
                      <el-tag
                        :type="
                          task.priority === 'high'
                            ? 'danger'
                            : task.priority === 'medium'
                            ? 'warning'
                            : 'success'
                        "
                        size="small"
                        effect="plain"
                      >
                        {{ priorityLabel(task.priority) }}
                      </el-tag>
                    </span>

                    <!-- DATE -->
                    <span v-else-if="row.key === 'date'">
                      {{ formatDate(task.start_date) }} →
                      {{ formatDate(task.due_date) }}
                    </span>

                    <!-- PROGRESS -->
                    <span v-else-if="row.key === 'progress'">
                      <span>{{ task.latest_progress ?? 0 }}%</span>
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
                      v-if="canEdit || (canUpdate && row.key === 'progress')"
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
                      <el-date-picker
                        v-model="editCache.start_date"
                        type="date"
                        placeholder="Bắt đầu"
                        size="small"
                        :disabled-date="disableStartDate"
                      />
                      <el-date-picker
                        v-model="editCache.due_date"
                        type="date"
                        placeholder="Kết thúc"
                        size="small"
                        :disabled-date="disableDueDate"
                      />
                    </template>

                    <el-select
                      v-else-if="row.key === 'progress'"
                      v-model="editCache.latest_progress"
                      placeholder="Tiến độ"
                      size="small"
                    >
                      <el-option
                        v-for="n in [
                          0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
                        ]"
                        :key="n"
                        :label="`${n}%`"
                        :value="n"
                      />
                    </el-select>

                    <div v-else-if="row.key === 'assignee'">
                      <el-select
                        v-model="editCache.assignees"
                        multiple
                        placeholder="Chọn người được giao"
                        style="width: 100%"
                        size="small"
                      >
                        <el-option
                          v-for="member in members"
                          :key="member.id"
                          :label="member.name"
                          :value="member.user_id"
                        />
                      </el-select>
                    </div>

                    <br>

                    <el-button
                      size="small"
                      type="success"
                      @click="saveEdit(row.key)"
                      link
                      :icon="Check"
                    />
                    <el-button
                      size="small"
                      @click="cancelEdit"
                      link
                      :icon="Close"
                    />
                  </template>
                </template>
              </el-table-column>
            </el-table>

            <!-- File Upload -->
            <el-button
              v-if="canUpdate"
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
          <div class="panel-scroll" style="padding: 0 !important">
            <el-tabs v-model="rightTab" style="height: 100%; padding-left: 10px;">
              <el-tab-pane label="Hoạt động" name="activity">
                <el-card style="height: 100%; border: 0; width: 100%;">
                  <div class="activity-list">
                    <div
                      v-for="activity in activities"
                      :key="activity.id"
                      class="item"
                    >
                      <div class="user-name">{{ activity.user.name }}</div>
                      <div class="detail-text">{{ activity.detail }}</div>
                      <div class="created-at">{{ activity.created_at }}</div>
                      <el-divider />
                    </div>
                  </div>
                </el-card>
              </el-tab-pane>
              <el-tab-pane label="Bình luận" name="comment">
                <el-card style="height: 100%; border: 0; width: 100%;">
                  <div class="comment-list">
                    <div v-for="comment in comments" :key="comment.id" class="item">
                      <div class="user-name">{{ comment.user.name }}</div>
                      <div class="detail-text">{{ comment.content }}</div>
                      <div class="created-at">{{ comment.created_at }}</div>
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
                      >Gửi</el-button
                    >
                  </template>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>

    <UploadDialog
      v-model="uploadRef"
      :project-id="props.projectId"
      :task-id="task.id"
      @file-added="loadData"
    />
  </el-dialog>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { getSocket } from "@/plugins/socket";
import { Check, Close, EditPen, Upload, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

import UploadDialog from "./UploadDialog.vue";
import AvatarGroup from "./AvatarGroup.vue";
import FileCard from "./FileCard.vue";

import { useProjectStore } from "@/stores/projectStore";
import { useTaskStore } from "@/stores/taskStore";
import { useFileStore } from "@/stores/fileStore";
import { useActivityStore } from "@/stores/activityStore";
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

let socket;

const uploadRef = ref(false);
const rightTab = ref("activity");
const editRow = ref(null);
const editCache = ref({});
const task = ref({});
const members = ref([]);
const newComment = ref("");
const canEdit = ref(false);
const canUpdate = ref(false);

const projectStore = useProjectStore();
const taskStore = useTaskStore();
const fileStore = useFileStore();
const activityStore = useActivityStore();
const commentStore = useCommentStore();
const roleStore = useRoleStore();

const { getTasksByProject } = storeToRefs(taskStore);
const { getFilesByTask } = storeToRefs(fileStore);
const { getActivitysByTask } = storeToRefs(activityStore);
const { getCommentsByTask } = storeToRefs(commentStore);

const project = computed(() =>
  projectStore.projects.find(p => p.id === props.projectId)
);
const files = computed(() => getFilesByTask.value(task.value.id) || []);
const activities = computed(
  () => getActivitysByTask.value(task.value.id) || []
);
const comments = computed(() => getCommentsByTask.value(task.value.id) || []);

const tableData = computed(() => [
  { key: "priority", label: "Ưu tiên" },
  { key: "date", label: "Thời gian" },
  { key: "progress", label: "Tiến độ (%)" },
  { key: "assignee", label: "Người được giao" },
]);

const priorityLabel = (val) =>
  val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao";
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const toMySQLDate = (d) => {
  if (!d) return null;
  return dayjs(d).format("YYYY-MM-DD");
};

const handleClose = () => (visible.value = false);

// ROLE CHECK
async function checkRole() {
  try {
    canEdit.value = await roleStore.canEditTask(props.taskId, props.projectId);
    canUpdate.value = await roleStore.canUpdateProgress(
      props.taskId,
      props.projectId
    );
  } catch {
    canEdit.value = canUpdate.value = false;
  }
}

// EDIT TASK
const toDate = (d) => {
  if (!d) return null;
  return d instanceof Date ? d : new Date(d);
};

const disableStartDate = (date) => {
  if (!project.value) return false;

  const projectStart = toDate(project.value.start_date);
  const projectEnd = toDate(project.value.end_date);

  return (
    date < projectStart ||
    date > projectEnd
  );
};

const disableDueDate = (date) => {
  if (!project.value) return false;

  const projectStart = toDate(project.value.start_date);
  const projectEnd = toDate(project.value.end_date);

  if (date < projectStart || date > projectEnd) return true;

  if (editCache.value.start_date) {
    return date < toDate(editCache.value.start_date);
  }

  return false;
};

const startEditTitle = () => {
  if (!canEdit.value) return ElMessage.warning("Bạn không có quyền chỉnh sửa tiêu đề");
  editRow.value = "title";
  editCache.value = { title: task.value.title };
};

const saveTitle = async () => {
  if (!canEdit.value) return;

  const payload = {
    id: task.value.id,
    updated_by: JSON.parse(localStorage.getItem("user") || "{}").id,
    changedField: "title",
    title: editCache.value.title
  };

  await taskStore.updateTask(props.projectId, payload);

  await loadData();

  editRow.value = null;
  ElMessage.success("Đã cập nhật tiêu đề");
};

const startEditDescription = () => {
  if (!canEdit.value)
    return ElMessage.warning("Bạn không có quyền chỉnh sửa mô tả");
  editRow.value = "description";
  editCache.value = { description: task.value.description };
};

const saveDescription = async () => {
  if (!canEdit.value) return;

  const payload = {
    id: task.value.id,
    updated_by: JSON.parse(localStorage.getItem("user") || "{}").id,
    changedField: "description",
    description: editCache.value.description
  };

  await taskStore.updateTask(props.projectId, payload);

  await loadData();

  editRow.value = null;
  ElMessage.success("Đã cập nhật mô tả");
};

const startEdit = (key) => {
  if (!(canEdit.value || (canUpdate.value && key === "progress")))
    return ElMessage.warning("Bạn không có quyền chỉnh sửa mục này");
  editRow.value = key;
  editCache.value = { ...task.value };
};

const cancelEdit = () => {
  editRow.value = null;
  editCache.value = {};
};

const saveEdit = async (key) => {
  if (!(canEdit.value || (canUpdate.value && key === "progress")))
    return ElMessage.warning("Bạn không có quyền chỉnh sửa mục này");

  const payload = {
    id: task.value.id,
    updated_by: JSON.parse(localStorage.getItem("user") || "{}").id,
  };

  if (key === "date") {
    if (!project.value) {
      ElMessage.error("Không xác định được thời gian dự án");
      return;
    }

    const projectStart = toDate(project.value.start_date);
    const projectEnd = toDate(project.value.end_date);

    const newStart = toDate(editCache.value.start_date);
    const newDue = toDate(editCache.value.due_date);

    if (
      (newStart && (newStart < projectStart || newStart > projectEnd)) ||
      (newDue && (newDue < projectStart || newDue > projectEnd))
    ) {
      return ElMessage.error(
        `Thời gian task phải nằm trong khoảng ${project.value.start_date} → ${project.value.end_date}`
      );
    }

    if (newStart && newDue && newDue < newStart) {
      return ElMessage.error("Ngày kết thúc phải ≥ ngày bắt đầu");
    }

    const updates = {};

    const oldStart = toMySQLDate(task.value.start_date);
    const oldDue = toMySQLDate(task.value.due_date);

    const startSQL = toMySQLDate(newStart);
    const dueSQL = toMySQLDate(newDue);

    if (startSQL !== oldStart) updates.start_date = startSQL;
    if (dueSQL !== oldDue) updates.due_date = dueSQL;

    if (Object.keys(updates).length === 0) {
      ElMessage.info("Không có thay đổi nào");
      return cancelEdit();
    }

    payload.changedField = Object.keys(updates);
    Object.assign(payload, updates);
  } else if (key === "assignee") {
    payload.changedField = key;
    payload.assignees = editCache.value.assignees;
  } else if (key === "progress") {
    payload.changedField = key;
    payload.latest_progress = editCache.value.latest_progress;
  } else {
    payload.changedField = key;
    payload[key] = editCache.value[key];
  }

  await taskStore.updateTask(props.projectId, payload);
  await loadData();

  editRow.value = null;
  ElMessage.success("Đã lưu thay đổi");
};

// UPLOAD
const onUpload = () => {
  if (!canUpdate.value)
    return ElMessage.warning("Bạn không có quyền upload file cho task này");
  uploadRef.value = true;
};

// LOAD DATA
const loadMembers = async () => {
  try {
    members.value = await MemberService.getByProjectId(props.projectId);
  } catch {
    members.value = [];
  }
};

const loadData = async () => {
  await taskStore.loadTasks(props.projectId);
  const taskList = getTasksByProject.value(props.projectId);
  task.value = taskList.find((t) => t.id === props.taskId) || {};

  if (task.value?.id) {
    await Promise.all([
      fileStore.loadFiles(task.value.id),
      activityStore.loadActivity(task.value.id),
      commentStore.loadComments(task.value.id),
    ]);
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
onMounted(async () => {
  await loadData();
  await loadMembers();
  await checkRole();

  socket = getSocket();
  if (!socket) return;

  socket.on("task_updated", async () => {
    await loadData();
    await roleStore.fetchTaskRole(props.taskId, props.projectId, true);
    await checkRole();
  });

  socket.on("comment", (event) => {
    if (event.action === "create") {
      loadData();
    }
  });

  socket.on("file", async () => {
    await loadData();
  });

  socket.on("git_push", async () => {
   await loadData();
  });

  socket.on("git_commit", async () => {
    await loadData();
  });

  socket.on("git_event", async () => {
    await loadData();
  });

  socket.on("activity", async () => {
    await loadData();
  });
});
watch(
  () => visible.value,
  async (val) => {
    if (val) {
      await loadData();
      await checkRole();
      editRow.value = null;
      editCache.value = {};
      rightTab.value = "activity";
    }
  }
);
</script>

<style scoped>
.header-editable {
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-title {
  font-weight: 600;
  font-size: 18px;
}

.description-block {
  margin-bottom: 16px;
}

.desc-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.desc-content {
  padding: 8px 0;
  white-space: pre-wrap;
}

.desc-empty {
  color: #999;
  font-style: italic;
}

.desc-edit-box {
  margin-top: 8px;
}

.desc-actions {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.section-divider {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #eee;
}

.task-detail :deep(.el-dialog__body) {
  width: 940px;
  padding: 0;
  overflow: hidden;
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
  width: 620px;
  min-width: 620px;
  max-width: 620px;
  overflow-y: auto;
  padding: 12px;
}
.right-panel {
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  border-left: 1px solid #eee;
  overflow: hidden;
}
.panel-scroll {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
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
  min-height: 270px;
  max-height: 270px;
}
.activity-list {
  overflow-y: auto;
  margin-bottom: 12px;
  min-height: 380px;
  max-height: 380px;
}
.item:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}
.user-name {
  font-weight: 600;
  color: #409eff;
  margin-bottom: 2px;
}
.detail-text {
  font-size: 13px;
  color: #555;
}
.created-at {
  font-size: 12px;
  color: #aaa;
}
</style>
