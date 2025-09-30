<template>
  <div class="kanban">
    <div
      v-for="(column, columnIndex) in columns"
      :key="columnIndex"
      class="kanban-column"
      @dragover.prevent
      @drop="onDrop($event, columnIndex)"
    >
      <h3>{{ column.name }}</h3>
      <div class="kanban-list">
        <div
          v-for="task in column.tasks"
          :key="task.id"
          class="kanban-task"
          draggable="true"
          @dragstart="onDragStart($event, task, columnIndex)"
        >
          {{ task.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";

interface Task {
  id: number;
  title: string;
}

interface Column {
  name: string;
  tasks: Task[];
}

// Dữ liệu Kanban
const columns = reactive<Column[]>([
  {
    name: "Todo",
    tasks: [
      { id: 1, title: "Task A" },
      { id: 2, title: "Task B" }
    ]
  },
  {
    name: "Doing",
    tasks: [{ id: 3, title: "Task C" }]
  },
  {
    name: "Done",
    tasks: [{ id: 4, title: "Task D" }]
  }
]);

// Biến tạm lưu task đang kéo
let draggedTask: Task | null = null;
let fromColumnIndex: number | null = null;

function onDragStart(event: DragEvent, task: Task, columnIndex: number) {
  draggedTask = task;
  fromColumnIndex = columnIndex;
  // để Firefox không bug
  event.dataTransfer?.setData("text/plain", task.id.toString());
}

function onDrop(event: DragEvent, toColumnIndex: number) {
  if (draggedTask && fromColumnIndex !== null) {
    // Xóa khỏi cột cũ
    const fromTasks = columns[fromColumnIndex].tasks;
    const taskIndex = fromTasks.findIndex((t) => t.id === draggedTask!.id);
    if (taskIndex > -1) {
      fromTasks.splice(taskIndex, 1);
    }

    // Thêm vào cột mới
    columns[toColumnIndex].tasks.push(draggedTask);

    // Reset biến tạm
    draggedTask = null;
    fromColumnIndex = null;
  }
}
</script>

<style scoped>
.kanban {
  display: flex;
  gap: 20px;
}
.kanban-column {
  background: #f4f4f4;
  padding: 10px;
  width: 250px;
  border-radius: 8px;
  min-height: 300px;
}
.kanban-list {
  min-height: 200px;
}
.kanban-task {
  background: white;
  padding: 8px;
  margin: 5px 0;
  border-radius: 4px;
  cursor: grab;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
