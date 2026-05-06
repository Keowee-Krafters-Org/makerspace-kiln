<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { API_URL } from '../api'

const props = defineProps({
  temperature: Number
})

const emit = defineEmits(['update:temperature'])

const message = ref('')
const localTemperature = ref(props.temperature)

watch(() => props.temperature, (newVal) => {
  localTemperature.value = newVal
})

const setSimulatedTemp = async () => {
  try {
    await axios.post(`${API_URL}/api/command`, { 
      command: 'set-temperature',
      payload: { temp: localTemperature.value }
    });
    message.value = `Simulated temperature set to ${localTemperature.value}°C`;
    emit('update:temperature', localTemperature.value);
  } catch (err) {
    message.value = 'Error setting simulated temperature';
  }
};
</script>

<template>
  <div class="card test-temp-panel">
    <h3>Simulated Temperature</h3>
    <div v-if="message" class="message">{{ message }}</div>
    <div class="form-group">
      <label>Set Simulated Temp (°C)</label>
      <input v-model.number="localTemperature" type="number" @change="setSimulatedTemp">
    </div>
  </div>
</template>

<style scoped>
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
.message {
  padding: 12px;
  background: #2c3e50;
  color: white;
  margin-bottom: 20px;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}
</style>
