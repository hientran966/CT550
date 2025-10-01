<template>
  <div class="task-layout">
    <ProjectMenu class="menu"/>
    <KanbanTable class="kanban"/>
  </div>
</template>

<script lang="ts" setup>
import ProjectMenu from "@/components/ProjectMenu.vue";
import KanbanTable from "@/components/TaskKanban.vue";
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
.kanban {
  flex: 1;
  overflow-x: auto;
  margin: 16px ;
}
</style>