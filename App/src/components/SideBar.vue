<template>
  <el-menu
    class="el-menu-vertical"
    router
    :default-active="$route.path"
    :collapse="true"
    background-color="#545c64"
  >
    <!-- Home -->
    <el-menu-item index="/">
      <el-icon><Location color="white" /></el-icon>
      <template #title>Home</template>
    </el-menu-item>

    <!-- Project -->
    <el-menu-item index="/projects">
      <el-icon><Files /></el-icon>
      <template #title>Dự án</template>
    </el-menu-item>

    <!-- About -->
    <el-menu-item index="/about">
      <el-icon><Document color="white"/></el-icon>
      <template #title>About</template>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import { Document, Files, Location } from "@element-plus/icons-vue";
</script>

<style>
.el-menu-vertical {
    max-width: 100%;
    min-height: 100vh;
}
</style>
