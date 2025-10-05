<template>
  <div class="task-layout">
    <ProjectMenu class="menu" />
    <div class="main-content">
      <TaskHeader class="task-header" :project-id="projectId" @add-task="onAdd"/>
      <TaskKanban
        class="kanban"
        :tasks="tasks"
        @update-task-status="updateTaskStatus"
      />
    </div>
  </div>
  <TaskForm v-model="formRef" :project-id="projectId" @task-added="loadTasks" />
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import ProjectMenu from "@/components/ProjectMenu.vue";
import TaskKanban from "@/components/TaskKanban.vue";
import TaskHeader from "@/components/TaskHeader.vue";
import TaskForm from "@/components/TaskForm.vue";
import TaskService from "@/services/Task.service";

const route = useRoute();
const projectId = Number(route.params.id);

const formRef = ref(false);
const tasks = ref<any[]>([]);

const loadTasks = async () => {
  if (!projectId) return;
  try {
    tasks.value = await TaskService.getByProject(projectId);
  } catch (error) {
    console.error("Lỗi khi load tasks:", error);
  }
};

const onAdd = () => {
  formRef.value = true;
};

const updateTaskStatus = async (task: any) => {
  try {
    await TaskService.updateTask(task.id, { status: task.status });
    await loadTasks();
  } catch (err) {
    console.error("Lỗi cập nhật status:", err);
  }
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.task-layout {
  display: flex;
  height: 100vh;
}
.menu {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  height: 100vh;
}
.main-content{
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
}
.kanban {
  flex: 1;
  overflow-x: auto;
  margin: 16px;
}
</style>