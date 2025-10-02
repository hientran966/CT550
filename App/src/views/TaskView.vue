<template>
  <div class="task-layout">
    <ProjectMenu class="menu" />
    <div class="main-content">
      <TaskHeader class="task-header" />
      <TaskKanban class="kanban" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import ProjectMenu from "@/components/ProjectMenu.vue";
import TaskKanban from "@/components/TaskKanban.vue";
import TaskHeader from "@/components/TaskHeader.vue";
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