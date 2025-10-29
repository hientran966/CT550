import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import AccountService from '@/services/Account.service';
import ProjectService from '@/services/Project.service';
import TaskService from '@/services/Task.service';
import FileService from '@/services/File.service';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút
const currentUser = JSON.parse(localStorage.getItem("user"));

export const useRoleStore = defineStore('role', () => {
  const user = ref(null);
  const projectRoles = reactive(new Map());
  const taskRoles = reactive(new Map());
  const fileRoles = reactive(new Map());

  function _isExpired(obj) {
    return !obj || (Date.now() - obj.fetchedAt > CACHE_TTL_MS);
  }

  async function loadMe() {
    const { data } = await AccountService.getAccountById(currentUser.id);
    user.value = data.user;
  }

  // ---------- PROJECT ----------
  async function fetchProjectRole(projectId, force = false) {
    const cached = projectRoles.get(projectId);
    if (cached && !force && !_isExpired(cached)) return cached;

    const data = await ProjectService.getRole(projectId, currentUser.id);
    const payload = {
      role: data?.role || 'viewer',
      fetchedAt: Date.now()
    };
    projectRoles.set(projectId, payload);
    return payload;
  }

  // ---------- TASK ----------
  async function fetchTaskRole(taskId, projectId, force = false) {
    const cached = taskRoles.get(taskId);
    if (cached && !force && !_isExpired(cached)) return cached;

    const data = await TaskService.getRole(taskId, currentUser.id);
    const project = await fetchProjectRole(projectId);

    const payload = {
      isCreator: !!data?.isCreator,
      isAssigned: !!data?.isAssigned,
      projectRole: project.role,
      fetchedAt: Date.now()
    };

    taskRoles.set(taskId, payload);
    return payload;
  }

  // ---------- FILE ----------
  async function fetchFileRole(fileId, projectId, force = false) {
    const cached = fileRoles.get(fileId);
    if (cached && !force && !_isExpired(cached)) return cached;

    const data = await FileService.getRole(fileId, currentUser.id);
    const project = await fetchProjectRole(projectId);

    const payload = {
      isCreator: !!data?.isCreator,
      isAssigned: !!data?.isAssigned,
      projectRole: project.role,
      fetchedAt: Date.now()
    };

    fileRoles.set(fileId, payload);
    return payload;
  }

  // ---------- PERMISSIONS ----------
  async function canEditTask(taskId, projectId) {
    const t = await fetchTaskRole(taskId, projectId);
    return ['owner', 'manager'].includes(t.projectRole) || t.isAssigned;
  }

  async function canChangeTaskStatus(taskId, projectId) {
    const t = await fetchTaskRole(taskId, projectId);
    return ['owner', 'manager'].includes(t.projectRole);
  }

  async function canManageMembers(projectId) {
    const p = await fetchProjectRole(projectId);
    return ['owner', 'manager'].includes(p.role);
  }

  async function canUploadFileToTask(taskId, projectId) {
    const t = await fetchTaskRole(taskId, projectId);
    return ['owner', 'manager'].includes(t.projectRole) || t.isAssigned;
  }

  async function canUpdateFileVersion(fileId, projectId) {
    const f = await fetchFileRole(fileId, projectId);
    return f.isCreator || ['owner', 'manager'].includes(f.projectRole);
  }

  // ---------- INVALIDATION ----------
  function invalidateProject(projectId) {
    projectRoles.delete(projectId);
  }

  function invalidateTask(taskId) {
    taskRoles.delete(taskId);
  }

  function invalidateFile(fileId) {
    fileRoles.delete(fileId);
  }

  function clearAll() {
    projectRoles.clear();
    taskRoles.clear();
    fileRoles.clear();
  }

  return {
    user,
    projectRoles,
    taskRoles,
    fileRoles,
    loadMe,
    fetchProjectRole,
    fetchTaskRole,
    fetchFileRole,
    canEditTask,
    canChangeTaskStatus,
    canManageMembers,
    canUploadFileToTask,
    canUpdateFileVersion,
    invalidateProject,
    invalidateTask,
    invalidateFile,
    clearAll
  };
});