<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '../api'

const sessions = ref([])
const loading = ref(false)
const error = ref(null)
const expandedSessionId = ref(null)

const fetchHistory = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`${API_URL}/api/history`)
    sessions.value = response.data
  } catch (err) {
    console.error('Error fetching history:', err)
    error.value = 'Could not load history. Is the service running?'
  } finally {
    loading.value = false
  }
}

const clearHistory = async () => {
  if (!confirm('Are you sure you want to delete all run history? This cannot be undone.')) {
    return
  }
  try {
    await axios.delete(`${API_URL}/api/history`)
    await fetchHistory() // Refresh the list
  } catch (err) {
    console.error('Error clearing history:', err)
    error.value = 'Could not clear history.'
  }
}

const formatTimestamp = (isoString) => {
  if (!isoString) return 'N/A'
  return new Date(isoString).toLocaleString()
}

const formatElapsedTime = (seconds) => {
  if (seconds === undefined || seconds === null) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const toggleSessionDetails = (sessionId) => {
  if (expandedSessionId.value === sessionId) {
    expandedSessionId.value = null
  } else {
    expandedSessionId.value = sessionId
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="card history-view">
    <div class="history-header">
      <h3>Run History</h3>
      <div class="header-buttons">
        <button @click="fetchHistory" :disabled="loading">Refresh</button>
        <button @click="clearHistory" :disabled="loading || sessions.length === 0" class="clear-btn">Clear All</button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">Loading history...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div v-if="!loading && !error" class="history-list">
      <div v-if="sessions.length === 0" class="no-records">
        No history records found.
      </div>
      <div v-for="session in sessions" :key="session.id" class="session-item">
        <div class="session-summary">
          <span class="session-id" @click.stop="toggleSessionDetails(session.id)">Session #{{ session.id }}</span>
          <span class="session-time" @click.stop="toggleSessionDetails(session.id)">{{ formatTimestamp(session.startTime) }}</span>
          <span class="session-status" :class="`status-${session.status.toLowerCase()}`" @click.stop="toggleSessionDetails(session.id)">{{ session.status }}</span>
          <span class="session-events-count" @click.stop="toggleSessionDetails(session.id)">{{ session.events.length }} events</span>
          <a :href="`#/history/plot?sessionId=${session.id}`" class="plot-link-btn" @click.stop>Plot</a>
          <span class="session-toggle" @click.stop="toggleSessionDetails(session.id)">{{ expandedSessionId === session.id ? '▼' : '▶' }}</span>
        </div>
        <div v-if="expandedSessionId === session.id" class="session-details">
          <table>
            <thead>
              <tr>
                <th>Time (MM:SS)</th>
                <th>State</th>
                <th>Temp (°C)</th>
                <th>Setpoint (°C)</th>
                <th>Target (°C)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(event, index) in session.events" :key="index">
                <td>{{ formatElapsedTime(event.elapsedTime) }}</td>
                <td><span class="state-label">{{ event.state }}</span></td>
                <td>{{ event.input?.toFixed(1) || '--' }}</td>
                <td>{{ event.setpoint?.toFixed(1) || '--' }}</td>
                <td>{{ event.targetTemperature || '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  background-color: #1a1a1a;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #333;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.history-header h3 {
  margin: 0;
  font-size: 1.5em;
}
.header-buttons {
  display: flex;
  gap: 0.5rem;
}
.clear-btn {
  background-color: #cf222e; /* Red from dashboard */
  color: #fff;
  border: 1px solid #cf222e;
}
.clear-btn:hover {
  background-color: #e74c3c;
}
.clear-btn:disabled {
  background-color: #555;
  border-color: #555;
  cursor: not-allowed;
}
.loading, .error-message, .no-records {
  padding: 2rem;
  text-align: center;
  background-color: #252525;
  border-radius: 8px;
  font-style: italic;
  color: #888;
}
.error-message {
  color: #ff9f43; /* Warning yellow from dashboard */
}
.history-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.session-item {
  background-color: #252525;
  border-radius: 8px;
  border: 1px solid #333;
  transition: all 0.2s ease-in-out;
}
.session-summary {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  font-weight: bold;
}
.session-summary > *:not(.plot-link-btn) {
  cursor: pointer;
}
.session-summary:hover {
  background-color: #3a3a3a;
}
.session-id {
  color: #4cc9f0; /* Bright Cyan from dashboard */
}

.session-time,
td:first-child {
  font-family: 'Courier New', monospace;
  color: #aaa;
  font-size: 0.9em;
}

.plot-link-btn {
  padding: 0.3rem 0.8rem;
  background-color: #3a3a3a;
  border: 1px solid #555;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9em;
  text-align: center;
  transition: background-color 0.2s;
}
.plot-link-btn:hover {
  background-color: #4f4f4f;
}

.session-status {
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
  color: #fff;
  text-transform: uppercase;
}
.status-running { background-color: #3498db; }
.status-completed { background-color: #2da44e; } /* Green from dashboard */
.status-aborted { background-color: #cf222e; } /* Red from dashboard */

.session-details {
  padding: 1rem;
  background-color: #1e1e1e;
  border-top: 1px solid #333;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #444;
}
th {
  color: #888;
  font-size: 0.85em;
  text-transform: uppercase;
}
tbody tr:last-child td {
  border-bottom: none;
}
tbody tr:hover {
  background-color: #282828;
}
td:nth-child(3), td:nth-child(4), td:nth-child(5) {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #4cc9f0; /* Bright Cyan from dashboard */
}
.state-label {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  background-color: #444;
  color: #eee;
}
</style>
