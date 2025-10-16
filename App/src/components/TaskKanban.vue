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
              {{ task.priority }}
            </el-tag>
          </div>

          <div class="task-body">
            <p v-if="task.description">{{ task.description }}</p>
            <p><strong>Đến hạn:</strong> {{ formatDate(task.due_date) }}</p>
            <el-progress
              :percentage="task.latest_progress || 0"
              size="small"
              style="margin-top: 8px"
              v-if="task.latest_progress !== undefined && task.latest_progress != 0"
            />
          </div>

          <div class="task-footer">
            <div class="task-footer">
              <AvatarGroup :user-ids="task.assignees || []" :max="3" :size="28" />
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <TaskDetail
      v-if="selectedTask"
      v-model="detailVisible"
      :task="selectedTask"
      :project-id="projectId"
      @update:task="updateTask($event)"
    />
  </div>

</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import TaskDetail from "./TaskDetail.vue";
import AvatarGroup from "./AvatarGroup.vue";
import defaultAvatar from "@/assets/default-avatar.png";
import FileService from "@/services/File.service";

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

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const props = defineProps<{
  tasks: Task[];
  projectId:number;
}>();

const emit = defineEmits<{
  (e: "update-task-status", task: Task): void;
  (e: "update-task", task: Task): void;
}>();

const detailVisible = ref(false);
const selectedTask = ref<Task | null>(null);

function openTaskDetail(task: Task) {
  if (dragging.value) return;
  selectedTask.value = task;
  detailVisible.value = true;
}

const statusMap: Record<string, string> = {
  todo: "Đang Chờ",
  in_progress: "Đang Tiến Hành",
  done: "Đã Xong",
};

const reverseStatusMap: Record<string, string> = {
  "Đang Chờ": "todo",
  "Đang Tiến Hành": "in_progress",
  "Đã Xong": "done",
};

const avatarsMap = ref<Record<number, string>>({});

const columns = computed(() => [
  { name: "Đang Chờ", tasks: props.tasks.filter((t) => t.status === "todo") },
  { name: "Đang Tiến Hành", tasks: props.tasks.filter((t) => t.status === "in_progress") },
  { name: "Đã Xong", tasks: props.tasks.filter((t) => t.status === "done") },
]);

let draggedTask = ref<Task | null>(null);
let fromColumn = ref<string | null>(null);
const dragging = ref(false);

function onDragStart(event: DragEvent, task: Task, columnName: string) {
  draggedTask.value = task;
  fromColumn.value = columnName;
  dragging.value = true;
  event.dataTransfer?.setData("text/plain", task.id.toString());
}

function onDrop(event: DragEvent, toColumnName: string) {
  if (draggedTask.value) {
    const newStatus = reverseStatusMap[toColumnName];
    if (draggedTask.value.status !== newStatus) {
      draggedTask.value.status = newStatus;
      emit("update-task-status", draggedTask.value);
    }
  }
  draggedTask.value = null;
  fromColumn.value = null;
  dragging.value = false;
}

function headerClass(name: string) {
  switch (name) {
    case "Đang Chờ":
      return "header-warning";
    case "Đang Tiến Hành":
      return "header-primary";
    case "Đã Xong":
      return "header-success";
    default:
      return "";
  }
}

function columnClass(name: string) {
  switch (name) {
    case "Đang Chờ":
      return "column-warning";
    case "Đang Tiến Hành":
      return "column-primary";
    case "Đã Xong":
      return "column-success";
    default:
      return "";
  }
}

async function loadAvatars() {
  const allUserIds = Array.from(
    new Set(props.tasks.flatMap((t) => t.assignees || []))
  );

  const results: Record<number, string> = {};

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

function getAvatar(id: number) {
  return avatarsMap.value[id] || defaultAvatar;
}

function updateTask(updatedTask: Task) {
  emit("update-task", updatedTask);
}

watch(
  () => props.tasks,
  () => loadAvatars(),
  { deep: true, immediate: true }
);

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

.kanban-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
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