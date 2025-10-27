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
          draggable="true"
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
              {{priorityLabel( task.priority )}}
            </el-tag>
          </div>

          <div class="task-body">
            <p v-if="task.description">{{ task.description }}</p>
            <p><strong>Đến hạn:</strong> {{ formatDate(task.due_date) }}</p>
            <el-progress
              :percentage="task.latest_progress || 0"
              size="small"
              style="margin-top: 8px"
              v-if="task.latest_progress"
            />
          </div>

          <div class="task-footer">
            <AvatarGroup :user-ids="task.assignees || []" :max="3" :size="28" />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useTaskStore } from "@/stores/taskStore";
import { storeToRefs } from "pinia";

import AvatarGroup from "./AvatarGroup.vue";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";

const props = defineProps({
  projectId: Number,
});
const emit = defineEmits(["open-detail"]);

const taskStore = useTaskStore();
const { getTasksByProject } = storeToRefs(taskStore);
const tasks = computed(() => getTasksByProject.value(props.projectId) || []);

const avatarsMap = ref({});

const statusMap = {
  todo: "Đang Chờ",
  in_progress: "Đang Tiến Hành",
  review: "Review",
  done: "Đã Xong",
};

const reverseStatusMap = {
  "Đang Chờ": "todo",
  "Đang Tiến Hành": "in_progress",
  "Review": "review",
  "Đã Xong": "done",
};

const priorityLabel = (val) =>
  val === "low" ? "Thấp" : val === "medium" ? "Trung Bình" : "Cao";

const columns = computed(() => [
  { name: "Đang Chờ", tasks: tasks.value.filter((t) => t.status === "todo") },
  { name: "Đang Tiến Hành", tasks: tasks.value.filter((t) => t.status === "in_progress") },
  { name: "Review", tasks: tasks.value.filter((t) => t.status === "review") },
  { name: "Đã Xong", tasks: tasks.value.filter((t) => t.status === "done") },
]);

onMounted(async () => {
  if (props.projectId) {
    await taskStore.loadTasks(props.projectId);
  }
});

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
  }
  draggedTask.value = null;
  fromColumn.value = null;
  dragging.value = false;
}

function openTaskDetail(task) {
  if (!dragging.value) emit("open-detail", task);
}

async function loadAvatars() {
  const list = Array.isArray(tasks.value) ? tasks.value : [];
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

watch(
  () => tasks.value,
  () => loadAvatars(),
  { deep: true, immediate: true }
);

function headerClass(name) {
  switch (name) {
    case "Đang Chờ":
      return "header-warning";
    case "Đang Tiến Hành":
      return "header-primary";
    case "Review":
      return "header-info"
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
    case "Review":
      return "column-info";
    case "Đã Xong":
      return "header-success";
    default:
      return "";
  }
}
</script>

<style scoped>
.kanban-container {
  display: flex;
  gap: 16px;
  padding: 16px;
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
}

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

.kanban-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: scroll;
}

.kanban-task {
  cursor: grab;
}

.kanban-task:active {
  cursor: grabbing;
}

.done-task {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>