<template>
  <div class="dashboard-container">
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="6" v-for="item in kpi" :key="item.label">
        <el-card class="kpi-card">
          <div class="kpi-value">{{ item.value }}</div>
          <div class="kpi-label">{{ item.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <v-chart
            :option="taskStatusOption"
            autoresize
            style="height: 300px"
          />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <v-chart :option="priorityOption" autoresize style="height: 300px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <v-chart
            :option="progressTrendOption"
            autoresize
            style="height: 350px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="members-row" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <h3>Thành viên dự án</h3>
          <el-table :data="members" style="width: 100%">
            <el-table-column prop="name" label="Tên thành viên" />
            <el-table-column prop="total_hours" label="Tổng giờ làm" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import { getSocket } from "@/plugins/socket";

import ProjectService from "@/services/Project.service";

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

let socket;

const props = defineProps({
  projectId: Number,
});

const project = ref(null);
const members = ref([]);
const kpi = ref([
  { label: "Tổng số Task", value: 0 },
  { label: "Hoàn thành", value: "0%" },
  { label: "Số thành viên", value: 0 },
  { label: "Tổng giờ làm", value: 0 },
]);

const taskStatusOption = ref({});
const progressTrendOption = ref({});
const hoursByUserOption = ref({});
const priorityOption = ref({});

async function loadDashboardData(projectId) {
  try {
    const data = await ProjectService.getReportData(projectId);
    console.log(data);

    project.value = data.project;
    members.value = data.hours_by_user;

    const STATUS_COLOR_MAP = {
      "Đang Chờ": "#ffb300", // vàng
      "Đang Tiến Hành": "#1976d2", // xanh dương
      Review: "#9e9e9e", // xám
      "Đã Xong": "#388e3c", // xanh lá
    };

    const PRIORITY_COLOR_MAP = {
      Cao: "#e53935", // đỏ
      "Trung Bình": "#fb8c00", // cam
      Thấp: "#43a047", // xanh lá
    };

    function mapWithColor(baseMap, dataList, keyField = "status") {
      return Object.keys(baseMap)
        .map((key) => {
          const value =
            dataList.find(
              (d) => d[keyField].toLowerCase() === key.toLowerCase()
            )?.count || 0;

          return value > 0
            ? { name: key, value, itemStyle: { color: baseMap[key] } }
            : null;
        })
        .filter(Boolean);
    }

    kpi.value = [
      { label: "Tổng số Task", value: data.total_tasks },
      { label: "Hoàn thành", value: `${data.completion_rate}%` },
      { label: "Số thành viên", value: data.member_count },
      { label: "Tổng giờ làm", value: data.total_hours },
    ];

    taskStatusOption.value = {
      title: {
        text: "Trạng thái",
        left: "center",
        textStyle: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      },
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          type: "pie",
          radius: "60%",
          data: mapWithColor(STATUS_COLOR_MAP, data.task_status, "status"),
          label: {
            textStyle: { fontFamily: '"Noto Sans", Arial, sans-serif' },
          },
        },
      ],
    };

    priorityOption.value = {
      title: {
        text: "Độ ưu tiên",
        left: "center",
        textStyle: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      },
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: mapWithColor(PRIORITY_COLOR_MAP, data.priority, "priority"),
          label: {
            textStyle: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
          },
        },
      ],
    };

    hoursByUserOption.value = {
      color: ["#1976d2"],
      title: {
        text: "Giờ làm",
        left: "center",
        textStyle: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: data.hours_by_user.map((u) => u.name),
        axisLabel: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      },
      yAxis: { type: "value" },
      series: [
        {
          data: data.hours_by_user.map((u) => u.total_hours),
          type: "bar",
          label: {
            show: true,
            fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          },
        },
      ],
    };

    progressTrendOption.value = {
      color: ["#388e3c"],
      title: {
        text: "Tiến độ",
        left: "center",
        textStyle: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: data.progress_trend.map((d) => d.date),
        axisLabel: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      },
      yAxis: { type: "value", max: 100 },
      series: [
        {
          data: data.progress_trend.map((d) => d.progress),
          type: "line",
          smooth: true,
          label: {
            show: true,
            fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          },
          markLine: {
            symbol: "none",
            label: {
              show: true,
              position: "end",
              formatter: "End Day",
              fontFamily: 'Arial, "Helvetica Neue", sans-serif',
            },
            lineStyle: {
              type: "dashed",
              color: "#e53935",
              width: 2,
            },
            data: [{ xAxis: data.project.end_date.split("T")[0] }],
          },
        },
      ],
    };
  } catch (err) {
    console.error(err);
    ElMessage.error("Không thể tải dữ liệu báo cáo");
  }
}

onMounted(async () => {
  await loadDashboardData(props.projectId);

  socket = getSocket();

  socket.on("task_updated", async (event) => {
    await loadDashboardData(props.projectId);
  });
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  overflow-y: scroll;
  height: calc(100vh - 140px);
}

.dashboard-title {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 600;
}

.kpi-row {
  margin-bottom: 20px;
}

.kpi-card {
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
}

.kpi-label {
  font-size: 14px;
  color: #666;
}
</style>
