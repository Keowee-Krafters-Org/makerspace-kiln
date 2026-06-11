import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Database File Paths ---
const dataDir = process.env.NODE_ENV === 'production'
  ? '/var/lib/kiln-controller'
  : __dirname;

const historyFile = join(dataDir, 'history.json');
const configFile = join(dataDir, 'config.json');


// --- Database Adapters and Default Data ---
const historyAdapter = new JSONFile(historyFile);
const configAdapter = new JSONFile(configFile);

const defaultHistoryData = { sessions: [] };
const defaultConfigData = { profiles: [], preferences: {} };


class KilnDatabase {
  constructor(historyAdapter, configAdapter, defaultHistory, defaultConfig) {
    this.historyDb = new Low(historyAdapter, defaultHistory);
    this.configDb = new Low(configAdapter, defaultConfig);
    this.lastWrite = null;
  }

  async init() {
    await this.historyDb.read();
    await this.configDb.read();
    
    // Ensure default data is written if files are new
    if (!this.historyDb.data) this.historyDb.data = defaultHistoryData;
    if (!this.configDb.data) this.configDb.data = defaultConfigData;

    await this.historyDb.write();
    await this.configDb.write();
    
    return this;
  }

  /**
   * Creates a new session in the history database.
   * @returns {object} The new session object.
   */
  async createSession(profileId) {
    const newSession = {
      id: Date.now(),
      profileId: profileId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'RUNNING',
      events: []
    }
    this.historyDb.data.sessions.unshift(newSession);
    await this.historyDb.write();
    return newSession;
  }

  /**
   * Returns the most recent RUNNING session, optionally filtered by profileId.
   * @param {string|number|undefined} profileId Optional profile ID.
   * @returns {object|null} Matching active session or null.
   */
  findRunningSession(profileId) {
    const sessions = this.historyDb.data.sessions || [];
    return sessions.find(session => {
      if (session.status !== 'RUNNING') return false;
      if (profileId === undefined || profileId === null) return true;
      return String(session.profileId) === String(profileId);
    }) || null;
  }

  // --- Profile Management (in configDb) ---
  async getProfiles() {
    return this.configDb.data.profiles || [];
  }

  async addProfile(profile) {
    if (!this.configDb.data.profiles) this.configDb.data.profiles = [];
    const newProfile = { ...profile, id: Date.now() };
    this.configDb.data.profiles.push(newProfile);
    await this.configDb.write();
    return newProfile;
  }

  async updateProfile(id, profile) {
    if (!this.configDb.data.profiles) return null;
    const index = this.configDb.data.profiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.configDb.data.profiles[index] = { ...profile, id };
    await this.configDb.write();
    return this.configDb.data.profiles[index];
  }

  async deleteProfile(id) {
    if (!this.configDb.data.profiles) return;
    this.configDb.data.profiles = this.configDb.data.profiles.filter(p => p.id !== id);
    await this.configDb.write();
  }

  // --- Preference Management (in configDb) ---
  async getPreferences() {
    return this.configDb.data.preferences || {};
  }

  async updatePreferences(newPrefs) {
    this.configDb.data.preferences = { ...this.configDb.data.preferences, ...newPrefs };
    await this.configDb.write();
    return this.configDb.data.preferences;
  }

  /**
   * Adds a status event to an active session in the history database.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(sessionId, eventData) {
    const session = this.historyDb.data.sessions.find(s => s.id === sessionId);
    if (session) {
      const startTime = new Date(session.startTime);
      const now = new Date();
      const elapsedTimeInSeconds = Math.round((now - startTime) / 1000);

      session.events.push({
        ...eventData,
        elapsedTime: elapsedTimeInSeconds
      });

      // Throttle writes to the history file
      if (!this.lastWrite || now - this.lastWrite > config.dbWriteInterval) {
        await this.historyDb.write();
        this.lastWrite = now;
      }
    }
  }

  async flush() {
    await this.historyDb.write();
    this.lastWrite = new Date();
  }

  /**
   * Finalizes a session, setting its end time and status.
   * @param {number} sessionId The ID of the session to finalize.
   * @param {string} finalStatus The final status of the session ('COMPLETED' or 'ABORTED').
   */
  async endSession(sessionId, finalStatus) {
    const session = this.historyDb.data.sessions.find(s => s.id === sessionId);
    if (session && session.status === 'RUNNING') {
      session.endTime = new Date().toISOString();
      session.status = finalStatus;
      await this.flush(); // Ensure final state is written
    }
  }

  /**
   * Clears all sessions from the history database.
   */
  async clearHistory() {
    this.historyDb.data.sessions = [];
    await this.historyDb.write();
  }
}

// --- Initialization ---
const kilnDatabase = await new KilnDatabase(
  historyAdapter, 
  configAdapter, 
  defaultHistoryData, 
  defaultConfigData
).init();

export default kilnDatabase;
