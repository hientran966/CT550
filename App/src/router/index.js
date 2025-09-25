import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProjectsView from '../views/ProjectsView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/projects', component: ProjectsView },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;