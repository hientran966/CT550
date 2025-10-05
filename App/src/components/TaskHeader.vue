<template>
    <el-header class="task-header" height="100px">
        <div style="height: 40px; display: flex; flex-direction: column; width: 100%;">
            <h3>Danh Sách Công Việc</h3>
        </div>
        <el-divider />
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
            <div class="left-section">
                <el-button type="primary" :icon="Plus" plain @click="emit('add-task')">
                    <strong>Thêm mới</strong>
                </el-button>
                <el-button-group style="margin-left: 12px;">
                    <el-button>Board</el-button>
                    <el-button>Table</el-button>
                </el-button-group>
            </div>
            <div class="right-section">
                <el-input
                    v-model="search"
                    placeholder="Search..."
                    size="small"
                    :prefix-icon="Search"
                />
                <el-button :icon="Filter" circle />
                <el-avatar size="small" style="margin-left: 8px;">temp</el-avatar>
                <el-dropdown>
                    <el-button circle>
                        <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item>Settings</el-dropdown-item>
                            <el-dropdown-item>Logout</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </el-header>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { Plus, Search, Filter, More } from "@element-plus/icons-vue";

const search = ref("");

const emit = defineEmits<{
  (e: "add-task"): void;
}>();
</script>

<style scoped>
.el-divider {
  margin: 0 !important;
}
</style>