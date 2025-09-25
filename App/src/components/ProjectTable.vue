<template>
  <el-table :data="projects" style="width: 100%" border >
    <el-table-column prop="tenDA" label="Tên dự án" width="250" />
    <el-table-column prop="ngayBD" label="Ngày bắt đầu" sortable width="250" :formatter="formatDate"/>
    <el-table-column prop="ngayKT" label="Ngày kết thúc" sortable width="250" :formatter="formatDate"/>
    <el-table-column
      prop="trangThai"
      label="Trạng thái"
      width="250"
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
            scope.row.trangThai === 'Đang tiến hành' ? 'primary' : 'success'
          "
          disable-transitions
        >
          {{ scope.row.trangThai }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="idNguoiTao" label="Quản lý" width="250">
        <template #default="scope">
            <el-avatar> user </el-avatar>
        </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import type { TableInstance } from "element-plus";
import { ref } from "vue";

interface Project {
  tenDA: string;
  ngayBD: string;
  ngayKT: string;
  trangThai: string;
}

const props = defineProps<{
  projects: Project[];
}>();

const tableRef = ref<TableInstance>();

const filterTag = (value: string, row: Project) => {
  return row.trangThai === value;
};

const formatDate = (_: any, __: any, cellValue: string) => {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  return date.toLocaleDateString('vi-VN');
}
</script>
