<template>
    <ProjectTable :projects="projects"/>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProjectTable from '@/components/ProjectTable.vue';
import ProjectService from '@/services/Project.service';

const projects = ref<any[]>([]);

const fetchProjects = async () => {
  try {
    const response = await ProjectService.getAllProjects();
    projects.value = response;
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
};

fetchProjects();
</script>