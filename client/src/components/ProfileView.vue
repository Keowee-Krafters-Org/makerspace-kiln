<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '../api'

const profiles = ref([])
const currentProfile = ref(null)
const isEditing = ref(false)
const message = ref('')

const fetchProfiles = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/profiles`)
    profiles.value = res.data
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchProfiles)

const createProfile = () => {
  currentProfile.value = {
    name: 'New Profile',
    steps: [
      { id: Date.now(), type: 'RAMP', targetTemperature: 1000, duration: 60, rate: 0 }
    ]
  }
  isEditing.value = true
}

const editProfile = (profile) => {
  currentProfile.value = JSON.parse(JSON.stringify(profile))
  isEditing.value = true
}

const deleteProfile = async (id) => {
  if (!confirm('Are you sure?')) return
  await axios.delete(`${API_URL}/api/profiles/${id}`)
  fetchProfiles()
}

const saveProfile = async () => {
  try {
    if (currentProfile.value.id) {
      await axios.put(`${API_URL}/api/profiles/${currentProfile.value.id}`, currentProfile.value)
    } else {
      await axios.post(`${API_URL}/api/profiles`, currentProfile.value)
    }
    isEditing.value = false
    message.value = 'Saved!'
    setTimeout(()=>message.value='', 2000)
    fetchProfiles()
  } catch (e) {
    message.value = 'Error saving'
  }
}

const addStep = () => {
  const lastStep = currentProfile.value.steps[currentProfile.value.steps.length - 1];
  currentProfile.value.steps.push({
    id: Date.now(),
    type: 'SOAK',
    targetTemperature: lastStep ? lastStep.targetTemperature : 1000,
    duration: 10,
    rate: 0
  })
}

const removeStep = (index) => {
  currentProfile.value.steps.splice(index, 1)
}

const cancel = () => {
  isEditing.value = false
  currentProfile.value = null
}
</script>

<template>
  <div class="profile-view">
    <div v-if="!isEditing" class="profile-list card">
      <div class="header">
        <h3>Saved Profiles</h3>
        <button @click="createProfile" class="add-btn">+ New Profile</button>
      </div>
      <div class="list">
        <div v-for="p in profiles" :key="p.id" class="profile-item">
          <span class="name">{{ p.name }}</span>
          <div class="actions">
            <button @click="editProfile(p)">Edit</button>
            <button @click="deleteProfile(p.id)" class="danger">Delete</button>
          </div>
        </div>
        <p v-if="profiles.length === 0" class="empty">No profiles saved.</p>
      </div>
    </div>

    <div v-else class="profile-editor card">
      <div class="editor-header">
        <input v-model="currentProfile.name" class="profile-name-input" placeholder="Profile Name" />
        <div class="actions">
          <button @click="saveProfile" class="save-btn">Save</button>
          <button @click="cancel">Cancel</button>
        </div>
      </div>
      
      <div class="steps-container">
        <div v-for="(step, index) in currentProfile.steps" :key="step.id" class="step-card">
          <div class="step-header">
            <span class="step-num">Step {{ index + 1 }}</span>
            <button @click="removeStep(index)" class="close-btn" title="Remove Step">×</button>
          </div>
          <div class="step-grid">
            <div class="field">
              <label>Mode</label>
              <select v-model="step.type">
                <option value="RAMP">RAMP</option>
                <option value="SOAK">SOAK</option>
                <option value="COOL">COOL</option>
              </select>
            </div>
            <div class="field">
              <label>Target (°C)</label>
              <input type="number" v-model.number="step.targetTemperature">
            </div>
            <div class="field">
              <label>Duration (min)</label>
              <input type="number" v-model.number="step.duration">
            </div>
            <div class="field">
              <label>Rate (°/hr)</label>
              <input type="number" v-model.number="step.rate">
            </div>
          </div>
        </div>
      </div>
      <button @click="addStep" class="add-step-btn">+ Add Step</button>
    </div>
    <div v-if="message" class="message toast">{{ message }}</div>
  </div>
</template>

<style scoped>
.profile-view {
  max-width: 800px;
  margin: 0 auto;
}
.header, .editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.profile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #252525;
  border: 1px solid #333;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.profile-item:hover {
  background-color: #3a3a3a;
}
.profile-item .name {
  font-weight: bold;
  color: #4cc9f0;
  font-size: 1.1em;
}
.profile-name-input {
  font-size: 1.5em;
  background-color: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 4px 8px;
  color: #ffffff;
  width: 60%;
}
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}
.step-card {
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4cc9f0;
}
.step-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #888;
  font-size: 0.9em;
  text-transform: uppercase;
}
.step-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}
.field {
  display: flex;
  flex-direction: column;
}
.field label {
  font-size: 0.8em;
  color: #aaa;
  margin-bottom: 4px;
}
.field input, .field select {
  background: #1a1a1a;
  border: 1px solid #444;
  color: white;
  padding: 8px;
  border-radius: 4px;
}
.add-btn, .save-btn, .add-step-btn {
  background-color: #2da44e;
  color: white;
  border: none;
}
.danger {
  background-color: #cf222e;
  margin-left: 10px;
}
.message.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #252525;
  border: 1px solid #4cc9f0;
  color: #4cc9f0;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.close-btn {
  background: transparent;
  color: #888;
  border: none;
  font-size: 1.5em;
  line-height: 0.5;
  padding: 0 5px;
}
</style>
