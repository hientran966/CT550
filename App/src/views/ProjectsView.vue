<template>
    <Header class="task-header" :page="'project'" @add="onAdd"/>
    <ProjectTable :projects="projects" @update-project="updateProject"/>
    <ProjectForm v-model="formRef" @project-added="fetchProjects" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProjectTable from '@/components/ProjectTable.vue';
import ProjectService from '@/services/Project.service';
import Header from '@/components/Header.vue';
import ProjectForm from '@/components/ProjectForm.vue';
import { ElMessage } from 'element-plus';

const projects = ref<any[]>([]);
const formRef = ref();

const fetchProjects = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await ProjectService.getProjectsByAccountId(user.id);
    projects.value = response;
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
};

function onAdd() {
  formRef.value = true;
}

const updateProject = async (updatedProject: any) => {
  try {
    await ProjectService.updateProject(updatedProject.id, updatedProject);
    ElMessage.success("Cập nhật project thành công");
    await fetchProjects();
  } catch (err) {
    console.error("Lỗi cập nhật task:", err);
  }
};
fetchProjects();
</script>