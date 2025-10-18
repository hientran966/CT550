<template>
  <Header :page="'project'" @add="onAdd" />
  <ProjectTable :projects="projects" @update-project="projectStore.updateProject" />
  <ProjectForm v-model="formRef" @project-added="projectStore.fetchProjects" />
</template>

<script setup>
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useProjectStore } from "@/stores/projectStore";
import Header from "@/components/Header.vue";
import ProjectTable from "@/components/ProjectTable.vue";
import ProjectForm from "@/components/ProjectForm.vue";

const projectStore = useProjectStore();
const { projects } = storeToRefs(projectStore);

const formRef = ref(false);
const onAdd = () => (formRef.value = true);

onMounted(() => {
  projectStore.fetchProjects();
});
</script>