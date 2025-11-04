import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import TasksView from '@/views/TaskView.vue'
import FileView from '@/views/FileView.vue'
import NotificationView from '@/views/NotificationView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/projects', name: 'projects', component: ProjectsView },
  { path: '/projects/:id', name: 'tasks', component: TasksView},
  { path: '/file/:id', name: 'file', component: FileView },
  { path: '/notifications', name: 'notifications', component: NotificationView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;