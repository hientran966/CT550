<template>
  <el-table :data="projects" style="width: 100%" border :table-layout="'auto'" ref="tableRef" @row-click="onRowClick">
    <el-table-column prop="name" label="Tên dự án" />
    <el-table-column prop="start_date" label="Ngày bắt đầu" sortable :formatter="formatDate"/>
    <el-table-column prop="end_date" label="Ngày kết thúc" sortable :formatter="formatDate"/>
    <el-table-column
      prop="status"
      label="Trạng thái"
      :filters="[
        { text: 'Chưa bắt đầu', value: 'Chưa bắt đầu' },
        { text: 'Đang tiến hành', value: 'Đang tiến hành' },
        { text: 'Đã hoàn thành', value: 'Đã hoàn thành' },
      ]"
      :filter-method="filterTag"
    >
      <template #default="scope">
        <el-tag
          :type="
            scope.row.status === 'Đang tiến hành' ? 'primary' : 'success'
          "
          disable-transitions
        >
          {{ scope.row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="created_by" label="Quản lý" width="250">
        <template #default="scope">
            <el-avatar> user </el-avatar>
        </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import type { TableInstance } from "element-plus";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

interface Project {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

const props = defineProps<{
  projects: Project[];
}>();

const tableRef = ref<TableInstance>();

const filterTag = (value: string, row: Project) => {
  return row.status === value;
};

const onRowClick = (row: Project) => {
  router.push({ name: "tasks", params: { id: row.id } });
};

const formatDate = (_: any, __: any, cellValue: string) => {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  return date.toLocaleDateString('vi-VN');
}
</script>
