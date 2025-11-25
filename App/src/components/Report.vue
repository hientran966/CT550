<template>
  <div class="dashboard-container">
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="8" v-for="item in kpi" :key="item.label">
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
          <el-table
            :data="workloadByUser"
            :row-class-name="workloadRowClass"
            style="width: 100%"
          >
            <el-table-column label="Tên thành viên">
              <template #default="{ row }">
                <el-tooltip
                  v-if="getWorkloadTooltip(row)"
                  :content="getWorkloadTooltip(row)"
                  placement="top"
                >
                  <div class="full-row">{{ row.name }}</div>
                </el-tooltip>
                <div v-else class="full-row">{{ row.name }}</div>
              </template>
            </el-table-column>

            <el-table-column label="% Workload">
              <template #default="{ row }">
                <el-tooltip
                  v-if="getWorkloadTooltip(row)"
                  :content="getWorkloadTooltip(row)"
                  placement="top"
                >
                  <div class="full-row">{{ row.workload_percent }}</div>
                </el-tooltip>
                <div v-else class="full-row">{{ row.workload_percent }}</div>
              </template>
            </el-table-column>

            <el-table-column label="Số lượng Task">
              <template #default="{ row }">
                <el-tooltip
                  v-if="getWorkloadTooltip(row)"
                  :content="getWorkloadTooltip(row)"
                  placement="top"
                >
                  <div class="full-row">{{ row.assigned_tasks }}</div>
                </el-tooltip>
                <div v-else class="full-row">{{ row.assigned_tasks }}</div>
              </template>
            </el-table-column>
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
const workloadByUser = ref([]);
const kpi = ref([
  { label: "Tổng số Task", value: 0 },
  { label: "Hoàn thành", value: "0%" },
  { label: "Số thành viên", value: 0 },
  { label: "Tổng giờ làm", value: 0 },
]);

const taskStatusOption = ref({});
const progressTrendOption = ref({});
const priorityOption = ref({});

async function loadDashboardData(projectId) {
  try {
    const data = await ProjectService.getReportData(projectId);
    console.log(data);

    project.value = data.project;
    workloadByUser.value = data.workload
      .map((w) => ({
        ...w,
        name: w.name === "non_assign" ? "Chưa được giao" : w.name,
      }))
      .sort((a, b) => {
        if (a.name === "Chưa được giao") return -1;
        if (b.name === "Chưa được giao") return 1;
        return b.workload_percent - a.workload_percent;
      });

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
        data: data.progress_trend.map((d) =>
          new Date(d.date + "T00:00:00").toLocaleDateString("vi-VN")
        ),
        label: {
          show: true,
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
        },
      },
      yAxis: { type: "value", max: 100 },
      series: [
        {
          data: data.progress_trend.map((d) => d.progress),
          type: "line",
          smooth: true,
          label: { show: true },
          markLine: {
            symbol: "none",
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

function workloadRowClass({ row }) {
  const wp = row.workload_percent;
  const n = row.name;

  if (!row.assigned_tasks || row.assigned_tasks === 0) {
    return "";
  }

  if (n === "Chưa được giao") {
    return "workload-info";
  }
  if (wp >= 70) return "workload-red";
  if (wp >= 50) return "workload-yellow";

  return "";
}

function getWorkloadTooltip(row) {
  const wp = row.workload_percent;
  if (wp >= 70) return "Workload cao: cần cân nhắc phân bổ lại nhiệm vụ";
  if (wp >= 50) return "Workload trung bình: theo dõi tiến độ";
  return "";
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

:deep(.el-table .workload-red) {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

:deep(.el-table .workload-yellow) {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

:deep(.el-table .workload-info) {
  opacity: 0.7;
}
</style>
