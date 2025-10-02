<template>
  <div class="kanban">
    <div
      v-for="(column, columnIndex) in columns"
      :key="columnIndex"
      class="kanban-column"
      @dragover.prevent
      @drop="onDrop($event, columnIndex)"
      body-style=""
    >
      <div class="kanban-header">
        <strong class="column-name">{{ column.name }}</strong>
        <el-tag
          :type="column.name === 'Đang Chờ' ? 'warning' : column.name === 'Đang Tiến Hành' ? 'primary' : column.name === 'Đã Xong' ? 'success' : 'default'"
          round
        >
          1
        </el-tag>
        <div class="add-task-button">
          <el-button :icon="Plus" link ></el-button>
        </div>
      </div> <!-- ////////////////// -->

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
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import TaskService from "@/services/Task.service";
import { Plus } from "@element-plus/icons-vue";

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
    minute: "2-digit",
  });
}

interface Column {
  name: string;
  tasks: Task[];
}

const columns = reactive<Column[]>([
  { name: "Đang Chờ", tasks: [] },
  { name: "Đang Tiến Hành", tasks: [] },
  { name: "Đã Xong", tasks: [] },
]);

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
  background: rgb(244, 244, 244);
  width: 280px;
  border-radius: 8px;
  min-height: 300px;
}
.kanban-list {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
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
.kanban-header {
  padding: 10px 16px;
  font-weight: bold;
  border-bottom: 1px solid #ccc;
  font-size: 18px;
}
.column-name {
  margin-right: 8px;
}
.add-task-button {
  float: right;
}
</style>