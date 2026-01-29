<script setup>
import { ref, computed } from 'vue'
import KilnDashboard from './components/KilnDashboard.vue'
import ProfileView from './components/ProfileView.vue'
import TestView from './components/TestView.vue'
import HistoryView from './components/HistoryView.vue'
import PreferenceView from './components/PreferenceView.vue'
import PlotView from './components/PlotView.vue'

const isMenuOpen = ref(false)

const routes = {
  '/': KilnDashboard,
  '/profile': ProfileView,
  '/test': TestView,
  '/history': HistoryView,
  '/preferences': PreferenceView
  // PlotView is handled dynamically
}

const currentPath = ref(window.location.hash)

// Shared state for profile and test parameters
const profile = ref({
  targetTemperature: 1000,
  rampTime: 60,
  soakDuration: 10,
  coolTime: 60
})

const testParams = ref({
  temperature: 25,
  duration: 5,
  setPoint: 25
})

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  const path = currentPath.value.slice(1) || '/';
  const mainPath = path.split('?')[0];

  if (mainPath === '/history/plot') {
    return PlotView;
  }
  // Ensure we match '/history' correctly
  return routes[mainPath] || routes['/'];
});

const currentViewProps = computed(() => {
  const path = currentPath.value.slice(1) || '/';
  const [mainPath, queryString] = path.split('?');

  if (mainPath === '/history/plot' && queryString) {
    const params = new URLSearchParams(queryString);
    const sessionId = params.get('sessionId');
    if (sessionId) {
      return { sessionId };
    }
  }

  // Default props for other views
  return {
    profile: profile.value,
    testParams: testParams.value
  };
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Kiln Controller</h1>
      <button class="hamburger" @click="toggleMenu" :class="{ 'active': isMenuOpen }" aria-label="Toggle Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav :class="{ 'open': isMenuOpen }">
        <a href="#/" @click="closeMenu">Dashboard</a>
        <a href="#/profile" @click="closeMenu">Profile</a>
        <a href="#/test" @click="closeMenu">Test</a>
        <a href="#/history" @click="closeMenu">History</a>
        <a href="#/preferences" @click="closeMenu">Preferences</a>
      </nav>
    </header>
    <main>
      <component 
        :is="currentView" 
        v-bind="currentViewProps"
        @update:profile="Object.assign(profile, $event)"
        @update:testParams="Object.assign(testParams, $event)"
      />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
header {
  background: #1f1f1f;
  padding: 1rem;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative; /* Context for absolute nav */
  z-index: 100;
}
header h1 {
  margin: 0;
  font-size: 1.5rem;
}

/* Hamburger Menu Button */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 110;
}
.hamburger span {
  width: 30px;
  height: 3px;
  background: #ccc;
  border-radius: 10px;
  transition: all 0.3s linear;
  position: relative;
  transform-origin: 1px;
}

/* Hamburger Animation */
.hamburger.active span:first-child {
  transform: rotate(45deg);
}
.hamburger.active span:nth-child(2) {
  opacity: 0;
}
.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg);
}

nav {
  display: flex;
  gap: 1rem;
}
nav a {
  color: #ccc;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
}
nav a:hover,
nav a.router-link-active {
  background-color: #333;
  color: #fff;
}

/* Mobile Responsive Styles */
@media (max-width: 1024px) {
  header {
    padding: 0.5rem 1rem; /* Reduce header height */
  }

  header h1 {
    font-size: 1.2rem; /* Slightly smaller title */
  }

  .hamburger {
    display: flex;
  }

  nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #1f1f1f;
    flex-direction: column;
    padding: 0;
    gap: 0;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    border-bottom: 1px solid #333;
    width: 100%;
  }

  nav.open {
    max-height: 300px; /* Adjust based on content */
    border-top: 1px solid #333;
    box-shadow: 0 5px 10px rgba(0,0,0,0.5);
  }

  nav a {
    padding: 1rem;
    text-align: center;
    border-top: 1px solid #2a2a2a;
    width: 100%;
    box-sizing: border-box;
    display: block;
  }
}

main {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}
</style>
