<template>
  <div class="kanban">
    <el-card
      v-for="(column, columnIndex) in columns"
      :key="columnIndex"
      class="kanban-column"
      @dragover.prevent
      @drop="onDrop($event, columnIndex)"
    >
      <template #header>
        <div class="card-header">
          <strong>{{ column.name }}</strong>
        </div>
      </template>

      <div class="kanban-list">
        <el-card
          v-for="task in column.tasks"
          :key="task.id"
          class="kanban-task"
          draggable="true"
          @dragstart="onDragStart($event, task, columnIndex)"
          shadow="hover"
        >
          <div class="task-header">
            <strong>{{ task.title }}</strong>
            <el-tag
              :type="task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'"
              size="small"
              effect="plain"
            >
              {{ task.priority }}
            </el-tag>
          </div>

          <div class="task-body">
            <p v-if="task.description">{{ task.description }}</p>
            <p><strong>Đến hạn:</strong> {{ formatDate(task.due_date) }}</p>
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
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import TaskService from "@/services/Task.service";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: "low" | "medium" | "high";
  due_date?: string;
  assignees?: { id: number; initials: string }[];
}

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

interface Column {
  name: string;
  tasks: Task[];
}

const columns = reactive<Column[]>([
  { name: "Đang Chờ", tasks: [] },
  { name: "Đang Tiến Hành", tasks: [] },
  { name: "Đã Xong", tasks: [] }
]);

const statusMap: Record<string, string> = {
  todo: "Đang Chờ",
  in_progress: "Đang Tiến Hành",
  done: "Đã Xong"
};

const reverseStatusMap: Record<string, string> = {
  "Đang Chờ": "todo",
  "Đang Tiến Hành": "in_progress",
  "Đã Xong": "done"
};

let draggedTask: Task | null = null;
let fromColumnIndex: number | null = null;

async function loadTasks() {
  try {
    const tasks: Task[] = await TaskService.getAllTasks();
    columns.forEach((col) => (col.tasks = []));
    tasks.forEach((task) => {
      const uiStatus = statusMap[task.status];
      const col = columns.find((c) => c.name === uiStatus);
      if (col) col.tasks.push(task);
    });
  } catch (err) {
    console.error("Lỗi load tasks:", err);
  }
}

function onDragStart(event: DragEvent, task: Task, columnIndex: number) {
  draggedTask = task;
  fromColumnIndex = columnIndex;
  event.dataTransfer?.setData("text/plain", task.id.toString());
}

function onDrop(event: DragEvent, toColumnIndex: number) {
  if (draggedTask && fromColumnIndex !== null) {
    const fromTasks = columns[fromColumnIndex].tasks;
    const taskIndex = fromTasks.findIndex((t) => t.id === draggedTask!.id);
    if (taskIndex > -1) fromTasks.splice(taskIndex, 1);

    const newUiStatus = columns[toColumnIndex].name;
    draggedTask.status = reverseStatusMap[newUiStatus];
    columns[toColumnIndex].tasks.push(draggedTask);

    TaskService.updateTask(draggedTask.id, { status: draggedTask.status });
    draggedTask = null;
    fromColumnIndex = null;
  }
}

onMounted(() => loadTasks());
</script>

<style scoped>
.kanban {
  display: flex;
  gap: 20px;
}
.kanban-column {
  background: #f4f4f4;
  padding: 0 !important;
  width: 280px;
  border-radius: 8px;
  min-height: 300px;
}
.kanban-list {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kanban-task {
  cursor: grab;
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-body {
  margin: 5px 0;
  font-size: 13px;
}
.task-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}
.avatar {
  background: #409eff;
  color: white;
  font-size: 11px;
  border-radius: 50%;
  padding: 4px;
  margin-left: 2px;
}
.card-header {
  text-align: center;
}
</style>