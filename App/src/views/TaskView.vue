<template>
  <div class="task-layout">
    <ProjectMenu class="menu" />
    <div class="main-content">
      <Header class="task-header" :page="'task'" :project-id="projectId" @add="onAdd"/>
      <TaskKanban
        class="kanban"
        :tasks="tasks"
        :project-id="projectId"
        @update-task-status="updateTaskStatus"
        @update-task="updateTask"
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
import Header from "@/components/Header.vue";
import TaskForm from "@/components/TaskForm.vue";
import TaskService from "@/services/Task.service";
import AssignService from "@/services/Assign.service";
import { ElMessage } from "element-plus";

const route = useRoute();
const projectId = Number(route.params.id);
const user = JSON.parse(localStorage.getItem('user'));

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

const updateTask = async (updatedTask: any) => {
  try {
    if (updatedTask.changedField === "progress") {
      await TaskService.progressLog(updatedTask.id, {
        progress: updatedTask.latest_progress,
        loggedBy: user.id,
      });
    } else if (updatedTask.changedField === "assignee") {
      await TaskService.deleteAssign(updatedTask.id);

      for (const userId of updatedTask.assignees) {
        await AssignService.createAssign({task_id: updatedTask.id, user_id: userId});
      }
    } else {
      await TaskService.updateTask(updatedTask.id, updatedTask);
    }
    ElMessage.success("Cập nhật task thành công");
    await loadTasks();
  } catch (err) {
    console.error("Lỗi cập nhật task:", err);
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