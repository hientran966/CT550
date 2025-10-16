<template>
  <div class="task-layout">
    <div class="main-content">
      <FileDetail v-if="file" :file="file" style="height: 100%;" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import FileService from "@/services/File.service";
import FileDetail from "@/components/FileDetail.vue";

const route = useRoute();
const file = ref<any | null>(null);

const loadFile = async (id: number) => {
  try {
    const res = await FileService.getAllFiles({ id });
    file.value = res[0] || null;
    console.log("File loaded:", file.value);
  } catch (error) {
    console.error("Lỗi khi load file:", error);
  }
};

onMounted(() => {
  if (route.params.id) loadFile(Number(route.params.id));
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) loadFile(Number(newId));
  }
);
</script>

<style scoped>
.task-layout {
  display: flex;
  height: 100vh;
}
.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
}
</style>