<template>
  <div class="timeline-container">
    <el-card>
      <v-chart
        v-if="tasks.length > 0"
        :option="chartOption"
        autoresize
        style="height: 450px"
      />

      <el-empty
        v-else
        description="Chưa có công việc nào trong dự án"
        style="padding: 40px 0"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { CanvasRenderer } from "echarts/renderers";
import { CustomChart, BarChart } from "echarts/charts";
import {
  TooltipComponent,
  TitleComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import TaskService from "@/services/Task.service";

use([
  CanvasRenderer,
  CustomChart,
  BarChart,
  TooltipComponent,
  TitleComponent,
  GridComponent,
  LegendComponent,
]);

const props = defineProps({
  projectId: Number
});


const chartOption = ref({});
const tasks = ref([]);

onMounted(async () => {
  const res = await TaskService.getByProject(props.projectId);
  tasks.value = res || [];
  renderTimeline(tasks.value);
});

function renderTimeline(data) {
  if (!data || data.length === 0) return;

  const taskData = data.map((task, index) => {
    const start = new Date(task.start_date).getTime();
    const end = new Date(task.due_date || new Date()).getTime();
    return {
      name: task.title,
      value: [index, start, end, task.latest_progress || 0],
      itemStyle: { color: getStatusColor(task.status) },
    };
  });

  chartOption.value = {
    backgroundColor: "#fff",
    title: {
      text: "Timeline",
      left: "center",
      textStyle: {
        fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
        fontSize: 16,
      },
    },
    tooltip: {
      confine: true,
      backgroundColor: "#fff",
      borderColor: "#ccc",
      borderWidth: 1,
      textStyle: {
        color: "#333",
        fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
      },
      formatter: (p) => {
        const start = new Date(p.value[1]);
        const end = new Date(p.value[2]);
        return `
          <b>${p.name}</b><br/>
          Bắt đầu: ${formatDate(start)}<br/>
          Hạn: ${formatDate(end)}<br/>
          Tiến độ: ${p.value[3]}%
        `;
      },
    },
    grid: { left: 120, right: 40, top: 60, bottom: 40 },
    xAxis: {
      type: "time",
      nameTextStyle: {
        fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
      },
      axisLabel: {
        fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
        formatter: (v) => {
          const d = new Date(v);
          return `${d.getDate().toString().padStart(2, "0")}/${(
            d.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}`;
        },
      },
    },
    yAxis: {
      type: "category",
      data: data.map((t) => t.title),
      nameTextStyle: {
        fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
      },
      axisLabel: {
        fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
      },
    },
    series: [
      {
        type: "custom",
        renderItem(params, api) {
          const categoryIndex = api.value(0);
          const start = api.coord([api.value(1), categoryIndex]);
          const end = api.coord([api.value(2), categoryIndex]);
          const height = api.size([0, 1])[1] * 0.6;
          const progress = api.value(3);
          const fullWidth = end[0] - start[0];
          const progressWidth = (progress / 100) * fullWidth;

          return {
            type: "group",
            children: [
              {
                type: "rect",
                shape: {
                  x: start[0],
                  y: start[1] - height / 2,
                  width: fullWidth,
                  height,
                },
                style: { fill: "#eee", stroke: "#ccc" },
              },
              {
                type: "rect",
                shape: {
                  x: start[0],
                  y: start[1] - height / 2,
                  width: progressWidth,
                  height,
                },
                style: { fill: api.style().fill },
              },
            ],
          };
        },
        encode: { x: [1, 2], y: 0 },
        data: taskData,
      },
    ],
    textStyle: {
      fontFamily: "Roboto, 'Segoe UI', 'Noto Sans', Arial, sans-serif",
    },
  };
}

function getStatusColor(status) {
  switch (status) {
    case "todo":
      return "#f56c6c";
    case "in_progress":
      return "#e6a23c";
    case "done":
      return "#67c23a";
    default:
      return "#909399";
  }
}

function formatDate(date) {
  return `${date.getDate().toString().padStart(2, "0")}/${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
}
</script>

<style scoped>
.timeline-container {
  margin: 20px;
  font-family: "Roboto", "Segoe UI", "Noto Sans", Arial, sans-serif;
}
.el-empty {
  color: #909399;
  font-family: "Roboto", "Segoe UI", "Noto Sans", Arial, sans-serif;
}
</style>
