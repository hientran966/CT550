<template>
  <div class="kanban-container">
    <div
      v-for="column in columns"
      :key="column.name"
      class="kanban-column"
      :class="columnClass(column.name)"
      @dragover.prevent
      @drop="onDrop($event, column.name)"
    >
      <div class="kanban-header" :class="headerClass(column.name)">
        <strong class="column-name">{{ column.name }}</strong>
        <el-tag
          class="task-count"
          :type="
            column.name === 'Đang Chờ'
              ? 'warning'
              : column.name === 'Đang Tiến Hành'
              ? 'primary'
              : column.name === 'Chờ Duyệt'
              ? 'info'
              : 'success'
          "
          round
          effect="plain"
        >
          {{ column.tasks.length }}
        </el-tag>
      </div>

      <div class="kanban-list">
        <el-card
          v-for="task in column.tasks"
          :key="task.id"
          class="kanban-task"
          :class="{ 'can-drag': canChangeStatusMap[task.id] }"
          :draggable="canChangeStatusMap[task.id]"
          @dragstart="onDragStart($event, task, column.name)"
          @click="openTaskDetail(task)"
          shadow="hover"
        >
          <div class="kanban-task-header">
            <strong :class="{ 'done-task': task.status === 'done' }">
              {{ task.title }}
            </strong>

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
          </div>

          <div class="task-body">
            <p v-if="task.description">{{ task.description }}</p>
            <p><strong>Đến hạn:</strong> {{ formatDate(task.due_date) }}</p>
            <el-progress
              v-if="task.latest_progress"
              :percentage="task.latest_progress"
              size="small"
              style="margin-top: 8px"
            />
            <AvatarGroup :user-ids="task.assignees || []" :max="3" :size="28" />
          </div>

          <div class="task-footer"  v-if="task.latest_activity">
            <p>{{ task.latest_activity.detail }}</p>
          </div>

          <el-button
            v-if="canDeleteMap[task.id]"
            class="delete-btn"
            link
            size="small"
            :icon="Close"
            @click.stop="confirmDelete(task)"
          />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { Close } from "@element-plus/icons-vue";
import AvatarGroup from "./AvatarGroup.vue";

import FileService from "@/services/File.service";

import { useTaskStore } from "@/stores/taskStore";
import { useRoleStore } from "@/stores/roleStore";
import { useActivityStore } from "@/stores/activityStore";

import defaultAvatar from "@/assets/default-avatar.png";
import { getSocket } from "@/plugins/socket";

const props = defineProps({
  projectId: Number,
  tasks: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["open-detail"]);

const taskStore = useTaskStore();
const roleStore = useRoleStore();
const activityStore = useActivityStore();

const avatarsMap = ref({});
const canChangeStatusMap = ref({});
const canDeleteMap = ref({});

const statusMap = {
  todo: "Đang Chờ",
  in_progress: "Đang Tiến Hành",
  review: "Chờ Duyệt",
  done: "Đã Xong",
};

const reverseStatusMap = {
  "Đang Chờ": "todo",
  "Đang Tiến Hành": "in_progress",
  "Chờ Duyệt": "review",
  "Đã Xong": "done",
};

const priorityLabel = (val) =>
  val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao";

const columns = computed(() => [
  { name: "Đang Chờ", tasks: props.tasks.filter((t) => t.status === "todo") },
  {
    name: "Đang Tiến Hành",
    tasks: props.tasks.filter((t) => t.status === "in_progress"),
  },
  { name: "Chờ Duyệt", tasks: props.tasks.filter((t) => t.status === "review") },
  { name: "Đã Xong", tasks: props.tasks.filter((t) => t.status === "done") },
]);

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const dragging = ref(false);
const draggedTask = ref(null);
const fromColumn = ref(null);

function onDragStart(event, task, columnName) {
  if (!canChangeStatusMap.value[task.id]) return;
  draggedTask.value = task;
  fromColumn.value = columnName;
  dragging.value = true;
  event.dataTransfer?.setData("text/plain", task.id.toString());
}

async function onDrop(event, toColumnName) {
  if (draggedTask.value) {
    const newStatus = reverseStatusMap[toColumnName];
    if (draggedTask.value.status !== newStatus) {
      await taskStore.updateStatus(props.projectId, {
        ...draggedTask.value,
        status: newStatus,
      });
    }
    await activityStore.loadActivity(draggedTask.value.id);
  }
  draggedTask.value = null;
  fromColumn.value = null;
  dragging.value = false;
}

function openTaskDetail(task) {
  if (!dragging.value) emit("open-detail", task);
}

async function loadAvatars() {
  const list = Array.isArray(props.tasks) ? props.tasks : [];
  const allUserIds = Array.from(new Set(list.flatMap((t) => t.assignees || [])));
  const results = {};

  await Promise.all(
    allUserIds.map(async (id) => {
      try {
        const res = await FileService.getAvatar(id);
        results[id] = res?.file_url || defaultAvatar;
      } catch {
        results[id] = defaultAvatar;
      }
    })
  );

  avatarsMap.value = results;
}

async function checkRoles() {
  const resultStatus = {};
  const resultDelete = {};

  for (const task of props.tasks) {
    const canChange = await roleStore.canEditTask(
      task.id,
      props.projectId
    );
    const projectRole = (await roleStore.fetchProjectRole(props.projectId))
      ?.role;

    resultStatus[task.id] = canChange;
    resultDelete[task.id] = ["owner", "manager"].includes(projectRole);
  }

  canChangeStatusMap.value = resultStatus;
  canDeleteMap.value = resultDelete;
}

async function confirmDelete(task) {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn xóa task "<b>${task.title}</b>" không?`,
      "Xác nhận",
      {
        type: "warning",
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        dangerouslyUseHTMLString: true,
      }
    );
    await taskStore.deleteTask(task.id);
    ElMessage.success("Đã xóa task");
  } catch {}
}

function headerClass(name) {
  switch (name) {
    case "Đang Chờ":
      return "header-warning";
    case "Đang Tiến Hành":
      return "header-primary";
    case "Chờ Duyệt":
      return "header-info";
    case "Đã Xong":
      return "header-success";
    default:
      return "";
  }
}

function columnClass(name) {
  switch (name) {
    case "Đang Chờ":
      return "column-warning";
    case "Đang Tiến Hành":
      return "column-primary";
    case "Chờ Duyệt":
      return "column-info";
    case "Đã Xong":
      return "column-success";
    default:
      return "";
  }
}

onMounted(async () => {
  if (props.projectId) {
    await taskStore.loadTasks(props.projectId);
    await checkRoles();
    await loadAvatars();
  }
  const socket = getSocket();
  if (!socket) return;

  socket.on("git_push", async () => {
    await taskStore.loadTasks(props.projectId);
  });

  socket.on("git_commit", async () => {
    await taskStore.loadTasks(props.projectId);
  });

  socket.on("git_event", async () => {
    await taskStore.loadTasks(props.projectId);
  });

  socket.on("activity", async (data) => {
    await taskStore.loadTasks(props.projectId);
  });
});

watch(
  () => props.tasks,
  async () => {
    await checkRoles();
    await loadAvatars();
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.kanban-container {
  width: 1400px;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: scroll;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  margin-bottom: 10px;
}

.kanban-column {
  height: 80vh;
  width: 300px;
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  position: relative;
}

.kanban-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 75vh;
}

.kanban-task {
  cursor: grab;
  position: relative;
  transition: 0.2s ease;
}

.kanban-task:hover .delete-btn {
  opacity: 1;
  visibility: visible;
}

.delete-btn {
  padding: 5px;
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  visibility: hidden;
  transition: 0.2s ease;
}

.done-task {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Header colors */
.header-warning {
  background-color: #fff8e1;
  color: #b88200;
  border: 1px solid #ffecb3;
}

.header-primary {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.header-success {
  background-color: #e8f5e9;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.header-info {
  background-color: #f5f5f5;
  color: #616161;
  border: 1px solid #e0e0e0;
}

.task-footer {
  margin-top: 10px;
  padding: 8px 10px;
  border-left: 3px solid #1976d2;
  background: #eef5ff;
  border-radius: 6px;
  font-size: 13px;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  line-height: 1.35;
  word-break: break-word;
}

.task-footer p {
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Column colors */
.column-warning {
  background-color: #fffdf6;
  border: 2px solid #ffecb3;
}

.column-primary {
  background-color: #f7fbff;
  border: 2px solid #bbdefb;
}

.column-success {
  background-color: #f9fef9;
  border: 2px solid #c8e6c9;
}

.column-info {
  background-color: #fcfcfc;
  border: 2px solid #e0e0e0;
}
</style>