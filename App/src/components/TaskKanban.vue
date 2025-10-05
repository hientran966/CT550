<template>
  <div class="kanban-container">
    <div
      v-for="column in columns"
      :key="column.name"
      class="kanban-column"
      @dragover.prevent
      @drop="onDrop($event, column.name)"
    >
      <div class="kanban-header">
        <strong class="column-name">{{ column.name }}</strong>
        <el-tag
          class="task-count"
          :type="
            column.name === 'Đang Chờ'
              ? 'warning'
              : column.name === 'Đang Tiến Hành'
              ? 'primary'
              : column.name === 'Đã Xong'
              ? 'success'
              : 'default'
          "
          round
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
              v-if="task.latest_progress !== undefined"
            />
          </div>

          <div class="task-footer">
            <div class="assignees">
              <span
                v-for="a in task.assignees || []"
                :key="a.id"
                class="avatar"
              >
                {{ a.initials }}
              </span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <TaskDetail
      v-if="selectedTask"
      v-model="detailVisible"
      :task="selectedTask"
    />
  </div>

</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import TaskDetail from "./TaskDetail.vue";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: "low" | "medium" | "high";
  start_date?: string;
  due_date?: string;
  latest_progress?: number;
  assignees?: { id: number; initials: string }[];
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
}>();

const emit = defineEmits<{
  (e: "update-task-status", task: Task): void;
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
</script>

<style scoped>
.kanban-task {
  margin-bottom: 12px;
  cursor: grab;
}
.kanban-task:active {
  cursor: grabbing;
}
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  font-size: 12px;
  margin-right: 4px;
}
</style>