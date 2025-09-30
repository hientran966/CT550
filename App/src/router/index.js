import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProjectsView from '../views/ProjectsView.vue'
import TasksView from '../views/TaskView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/projects', name: 'projects', component: ProjectsView },
  { path: '/projects/:id', name: 'tasks', component: TasksView},
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;