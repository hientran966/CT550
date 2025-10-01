<template>
  <div class="common-layout">
    <el-container>
      <el-aside class="sidebar" width="64px">
        <SideBar />
      </el-aside>

      <el-main class="main-content">
        <router-view/>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import SideBar from './components/SideBar.vue';
</script>

<style>
.main-content {
  background-color: #ffe3e3;
  min-height: 100vh;
}

.el-main {
  padding: 0 !important;
  height: 100%;
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>