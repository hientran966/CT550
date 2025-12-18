import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import ProjectsView from "@/views/ProjectsView.vue";
import TasksView from "@/views/TaskView.vue";
import FileView from "@/views/FileView.vue";
import NotificationView from "@/views/NotificationView.vue";
import NotFound from "@/views/NotFound.vue";

const routes = [
  { path: "/", component: Home },

  { path: "/projects", name: "projects", component: ProjectsView },
  { path: "/projects/:id", name: "tasks", component: TasksView },

  { path: "/file/:id", name: "file", component: FileView },
  { path: "/notifications", name: "notifications", component: NotificationView },

  {
    path: "/forbidden",
    name: "forbidden",
    component: NotFound,
    meta: { layout: "empty", forbidden: true },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFound,
    meta: { layout: "empty" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/* =========================
   GLOBAL GUARD
========================= */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (!token && to.path !== "/") {
    return next("/");
  }

  if (to.name === "forbidden" && !to.query?.code) {
    return next({ name: "not-found" });
  }

  next();
});

export default router;