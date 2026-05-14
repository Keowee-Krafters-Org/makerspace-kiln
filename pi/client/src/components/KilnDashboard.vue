<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import TestTempControl from './TestTempControl.vue'

const props = defineProps({
  testParams: Object,
  profile: Object // Not used directly, but needed for the component signature
})

const emit = defineEmits(['update:testParams'])

const status = ref({
  state: 'UNKNOWN',
  input: 0,
  setpoint: 0,
  targetTemperature: 0,
  timestamp: 0,
  ssrUpper: false,
  ssrLower: false,
  isSimulated: false,
  timeRemaining: 0
})
const loading = ref(false)
const message = ref('')
const profiles = ref([])
const selectedProfileId = ref(localStorage.getItem('selectedProfileId') || null);

let eventSource = null

const isStale = computed(() => {
  if (!status.value.timestamp) return true
  return (Date.now() - status.value.timestamp) > 15000 // 15 seconds
})

const activeProfileName = computed(() => {
    if (status.value.profileId && profiles.value.length > 0) {
        const profileId = parseInt(status.value.profileId, 10);
        const activeProfile = profiles.value.find(p => p.id === profileId);
        return activeProfile ? activeProfile.name : 'Unknown Profile';
    }
    return 'No Active Profile';
});

const countdown = computed(() => {
  if (status.value.timeRemaining === undefined || status.value.timeRemaining === null) return '00:00:00';
  // Check if value is likely in milliseconds (greater than 100 hours worth of seconds is unlikely for this kiln)
  // or simply assume milliseconds since valid values are usually large if ms. 
  // Given the input 1164805, which is ~19 mins in ms, but ~13 days in seconds.
  // It is safer to divide by 1000.
  let totalSeconds = Math.max(0, Math.round(status.value.timeRemaining / 1000));
  
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const isSimulated = computed(() => {
  return status.value.isSimulated
})

const statusIcon = computed(() => {
  const map = {
    'IDLE': '⏸️',
    'STARTING': '🚀',
    'RUNNING': '🔥',
    'RAMP': '📈',
    'SOAK': '🌡️',
    'COOL': '📉',
    'COMPLETED': '✅',
    'ABORTED': '🛑',
    'EMERGENCY_STOP': '🚨',
    'ERROR': '⚠️',
    'RECONNECTING': '🔌',
    'UNKNOWN': '❓'
  };
  return map[status.value.state] || '❓';
});

const statusDescription = computed(() => {
  const s = status.value;
  // If passive state, show simple state name
  if (['IDLE', 'COMPLETED', 'ABORTED', 'EMERGENCY_STOP', 'ERROR', 'UNKNOWN'].includes(s.state)) {
    return s.state;
  }
  // If active sequence
  if (s.currentStep && s.totalSteps) {
    return `Step ${s.currentStep} / ${s.totalSteps}`;
  }
  return s.state;
});

const startKiln = async () => {
    if (!selectedProfileId.value) {
        message.value = 'Please select a profile first';
        return;
    }
  try {
    await axios.post('/api/start', { profileId: selectedProfileId.value })
    message.value = 'Start command sent'
  } catch (err) {
    message.value = 'Error sending start'
  }
}

const stopKiln = async () => {
  try {
    await axios.post('/api/stop')
    message.value = 'Stop command sent'
  } catch (err) {
    message.value = 'Error sending stop'
  }
}

const handleTempUpdate = (newTemp) => {
  emit('update:testParams', { ...props.testParams, temperature: newTemp })
}

watch(selectedProfileId, (newId) => {
    if (newId) {
        localStorage.setItem('selectedProfileId', newId);
    }
});

onMounted(async () => {
    try {
        const res = await axios.get('/api/profiles');
        profiles.value = res.data;
        const storedProfileId = localStorage.getItem('selectedProfileId');
        if (storedProfileId && profiles.value.some(p => p.id == storedProfileId)) {
            selectedProfileId.value = storedProfileId;
        } else if (profiles.value.length > 0) {
            selectedProfileId.value = profiles.value[0].id;
        }
    } catch(e) {
        console.error("Failed to load profiles", e);
    }

  // Setup SSE
  eventSource = new EventSource('/api/events');
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      status.value = data;
    } catch (e) {
      console.error('Error parsing SSE data', e);
    }
  };

  eventSource.onerror = (err) => {
    console.error('EventSource error:', err);
    // EventSource will automatically try to reconnect
  };
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="status-panel" :class="{ stale: isStale }">
      <div class="status-header">
        <div class="status-display">
          <div class="status-label">STATUS</div>
          <div class="status-content">
            <span class="status-icon">{{ statusIcon }}</span>
            <span class="status-text">{{ statusDescription }}</span>
          </div>
        </div>

        <div class="profile-display">
            <div class="status-label">ACTIVE PROFILE</div>
            <div class="profile-name">{{ activeProfileName }}</div>
        </div>
        
        <div class="header-controls">
           <select v-model="selectedProfileId" class="header-select">
                <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <div class="header-buttons">
                <button @click="startKiln" class="start-btn-sm">START</button>
                <button @click="stopKiln" class="stop-btn-sm">STOP</button>
            </div>
        </div>

        <div class="countdown-timer">
          <span class="label">Time Remaining</span>
          <span class="value">{{ countdown }}</span>
        </div>
      </div>
      <div class="readings">
        <div class="reading">
          <span class="label">Current Temp</span>
          <span class="value">{{ status.input ? status.input.toFixed(1) : '--' }} °C</span>
        </div>
        <div class="reading">
          <span class="label">Setpoint</span>
          <span class="value">{{ status.setpoint ? status.setpoint.toFixed(1) : '--' }} °C</span>
        </div>
        <div class="reading">
          <span class="label">Target</span>
          <span class="value">{{ status.targetTemperature }} °C</span>
        </div>
      </div>
      <div class="ssr-status">
        <span :class="status.ssrUpper ? 'ssr-active' : 'ssr-inactive'">Upper: {{ status.ssrUpper ? 'ON' : 'OFF' }}</span>
        <span :class="status.ssrLower ? 'ssr-active' : 'ssr-inactive'">Lower: {{ status.ssrLower ? 'ON' : 'OFF' }}</span>
      </div>
      <p v-if="isStale" class="warning">Status is stale. (Last update: {{ new Date(status.timestamp).toLocaleTimeString() }})</p>
      <p v-if="isSimulated" class="simulation-warning">SIMULATION MODE ACTIVE</p>
      
      <TestTempControl 
        v-if="isSimulated" 
        :temperature="testParams.temperature"
        @update:temperature="handleTempUpdate"
      />
    </div>

    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
}
.status-panel {
  background: #1a1a1a;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.status-panel.stale {
  border: 2px solid orange;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding-bottom: 12px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}
.profile-display {
    text-align: center;
}
.profile-name {
    font-size: 0.9em;
    font-weight: bold;
    color: #e1e1e1;
}
.status-display {
  text-align: center;
}
.status-label {
  color: #888;
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #e1e1e1;
}
.status-icon {
  font-size: 3em;
  line-height: 1;
}
.status-text {
  font-size: 0.6rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.countdown-timer {
  text-align: right;
}
.countdown-timer .label {
  color: #888;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.countdown-timer .value {
  font-size: 1.8em;
  font-weight: bold;
  color: #4cc9f0;
  font-family: 'Courier New', monospace;
}
.readings {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
  gap: 20px;
}
.reading {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  background: #252525;
  padding: 15px;
  border-radius: 8px;
}
.reading .label {
  color: #888;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.reading .value {
  font-size: 2.2em;
  font-weight: bold;
  color: #4cc9f0; /* Bright Cyan for high visibility */
  font-family: 'Courier New', monospace; /* Monospace for numbers */
}
.ssr-status {
  display: flex;
  gap: 30px;
  justify-content: center;
  font-weight: 600;
  background: #252525;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}
.ssr-active {
  color: #2da44e; /* Green */
  text-shadow: 0 0 8px rgba(45, 164, 78, 0.4);
}
.ssr-inactive {
  color: #cf222e; /* Red */
}
.warning {
  color: #ff9f43;
  font-weight: bold;
  margin-top: 15px;
}
.simulation-warning {
  color: #f39c12;
  font-weight: bold;
  margin-top: 15px;
  text-align: center;
  font-size: 1.2em;
}
.message {
  padding: 12px;
  background: #2c3e50;
  color: white;
  margin-bottom: 20px;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}
.controls-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
.profile-selector {
    margin-bottom: 20px;
}
.profile-selector select {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
    background: #333;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 1.1em;
}
.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.start-btn {
  background-color: #2da44e;
}
.stop-btn {
  background-color: #cf222e;
}
.form-group {
  margin-bottom: 10px;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* Header Controls */
.header-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.header-select {
    background: #333;
    color: white;
    border: 1px solid #555;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.9em;
    min-width: 150px;
}
.header-buttons {
    display: flex;
    gap: 10px;
}
.start-btn-sm, .stop-btn-sm {
    padding: 5px 15px;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    color: white;
    font-size: 0.9em;
}
.start-btn-sm {
    background-color: #2da44e;
}
.start-btn-sm:hover {
    background-color: #2c974b;
}
.stop-btn-sm {
    background-color: #cf222e;
}
.stop-btn-sm:hover {
    background-color: #a41c28;
}


/* Responsive Design Updates */
@media (min-width: 600px) {
  .controls-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .status-panel {
    padding: 16px;
  }
  .readings {
    margin: 20px 0;
    gap: 10px;
  }
  .reading {
    padding: 10px;
  }
  .reading .value {
    font-size: 1.8em;
  }
  .status-content {
    font-size: 1.3em;
  }
}

/* Mobile Landscape Optimization */
@media (max-height: 500px) and (orientation: landscape) {
  .dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
    max-width: 100%;
  }
  
  .status-panel {
    margin-bottom: 0;
  }
  
  .controls-grid {
    /* Stack controls vertically on the right side */
    grid-template-columns: 1fr;
  }
}
</style>
