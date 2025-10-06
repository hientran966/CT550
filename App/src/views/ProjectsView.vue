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
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await ProjectService.getProjectsByAccountId(user.id);
    projects.value = response;
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
};

fetchProjects();
</script>