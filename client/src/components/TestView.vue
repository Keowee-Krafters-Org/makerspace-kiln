<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { API_URL } from '../api'

const props = defineProps({
  testParams: Object
})

const emit = defineEmits(['update:testParams'])

const message = ref('')

const startTest = async () => {
  try {
    await axios.post(`${API_URL}/api/test`, props.testParams)
    message.value = 'Test mode initiated'
  } catch (err) {
    message.value = 'Error initiating test mode'
  }
}

const updateField = (field, value) => {
  emit('update:testParams', { ...props.testParams, [field]: value })
}
</script>

<template>
  <div class="card test-panel">
    <h3>Test Mode</h3>
    <div v-if="message" class="message">{{ message }}</div>
    <div class="form-group">
      <label>Simulated Temp (°C)</label>
      <input 
        :value="testParams.temperature"
        @input="updateField('temperature', $event.target.valueAsNumber)"
        type="number"
      >
    </div>
    <div class="form-group">
      <label>Duration (min)</label>
      <input 
        :value="testParams.duration"
        @input="updateField('duration', $event.target.valueAsNumber)"
        type="number"
      >
    </div>
    <div class="form-group">
      <label>Setpoint (°C)</label>
      <input 
        :value="testParams.setPoint"
        @input="updateField('setPoint', $event.target.valueAsNumber)"
        type="number"
      >
    </div>
    <button @click="startTest">Start Test Simulation</button>
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
