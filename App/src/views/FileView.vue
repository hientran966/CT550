<template>
  <div class="task-layout">
    <div class="main-content">
      <FileDetail :file="file" style="height: 100%;"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import FileDetail from "@/components/FileDetail.vue";
import FileService from "@/services/File.service";
import { ref } from "vue";

const file = ref<any[]>([]);

const loadFiles = async () => {
  try {
    file.value = (await FileService.getAllFiles({ id: 1 }))[0];

    console.log(file.value)
  } catch (error) {
    console.error("Lỗi khi load file:", error);
  }
};
loadFiles();
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