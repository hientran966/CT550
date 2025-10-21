<template>
  <el-menu
    :default-active="activeView"
    class="el-menu-vertical-demo"
    @select="handleSelect"
  >
    <el-menu-item index="kanban">
      <el-icon><Menu /></el-icon>
      <span>Danh sách Task</span>
    </el-menu-item>

    <el-menu-item index="timeline">
      <el-icon><Guide /></el-icon>
      <span>Timeline</span>
    </el-menu-item>

    <el-menu-item index="report">
      <el-icon><PieChart /></el-icon>
      <span>Báo cáo</span>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps } from 'vue'
import { Document, Guide, Menu , PieChart, Setting } from '@element-plus/icons-vue'

const props = defineProps({
  activeView: { type: String, required: true }
})
const emit = defineEmits(['update:view'])

function handleSelect(key: string) {
  emit('update:view', key)
}
</script>

<style>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100vh;
  border-right: 1px solid #e0e0e0;
}
</style>