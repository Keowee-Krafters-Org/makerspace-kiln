<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Chart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  LineController,
  BarController
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  LineController,
  BarController
);

const props = defineProps({
  sessionId: {
    type: [String, Number],
    required: true,
  },
});

const session = ref(null);
const loading = ref(false);
const error = ref(null);

const chartData = computed(() => {
  if (!session.value || !session.value.events || session.value.events.length === 0) {
    return { labels: [], datasets: [] };
  }

  const events = session.value.events;
  const maxTemp = Math.max(...events.map(e => e.input), ...events.map(e => e.setpoint));

  const labels = events.map(e => {
    const minutes = Math.floor(e.elapsedTime / 60);
    const seconds = e.elapsedTime % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        backgroundColor: '#f87979',
        borderColor: '#f87979',
        data: events.map(e => e.input),
        yAxisID: 'y',
      },
      {
        label: 'Setpoint (°C)',
        backgroundColor: '#4cc9f0',
        borderColor: '#4cc9f0',
        data: events.map(e => e.setpoint),
        yAxisID: 'y',
      },
      {
        label: 'SSR Upper (%)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        data: events.map(e => e.ssrUpper ? maxTemp * 0.1 : 0), // Scale to 5% of max temp
        yAxisID: 'y',
        type: 'bar',
      },
      {
        label: 'SSR Lower (%)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        data: events.map(e => e.ssrLower ? maxTemp * 0.1 : 0), // Scale to 2.5% of max temp
        yAxisID: 'y',
        type: 'bar',
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      type: 'linear',
      position: 'left',
      title: {
        display: true,
        text: 'Temperature (°C)'
      }
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label.includes('SSR')) {
            // Don't show the scaled value in the tooltip
            const originalValue = session.value.events[context.dataIndex][label.includes('Upper') ? 'ssrUpper' : 'ssrLower'];
            return `${label}: ${originalValue ? 'ON' : 'OFF'}`;
          }
          if (context.parsed.y !== null) {
            label += `: ${context.parsed.y.toFixed(1)} °C`;
          }
          return label;
        }
      }
    }
  }
};

const fetchSession = async () => {
  loading.value = true;
  error.value = null;
  console.log(`Fetching data for session ID: ${props.sessionId}`);
  try {
    const response = await axios.get(`/api/history/${props.sessionId}`);
    session.value = response.data;
    console.log('Session data received:', session.value);
  } catch (err) {
    console.error(`Error fetching session ${props.sessionId}:`, err);
    error.value = 'Could not load session data.';
  } finally {
    loading.value = false;
  }
};

watch(chartData, (newData) => {
  console.log('Chart data updated:', newData);
}, { deep: true });

onMounted(fetchSession);
</script>

<template>
  <div class="card plot-view">
    <div class="plot-header">
      <h3>Run #{{ sessionId }} - Temperature Plot</h3>
      <a href="#history" class="back-link">Back to History</a>
    </div>
    <div v-if="loading" class="loading">Loading plot data...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="session" class="chart-container">
      <Chart type="line" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.plot-view {
  background-color: #1a1a1a;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #333;
  color: #fff;
}
.plot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.plot-header h3 {
  margin: 0;
}
.back-link {
  color: #4cc9f0;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
.chart-container {
  position: relative;
  height: 60vh;
}
.loading, .error-message {
  padding: 2rem;
  text-align: center;
  background-color: #252525;
  border-radius: 8px;
  font-style: italic;
  color: #888;
}
.error-message {
  color: #ff9f43;
}
</style>
