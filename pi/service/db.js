import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json');

class KilnDatabase {
  constructor(adapter, defaultData) {
    this.db = new Low(adapter, defaultData);
    this.lastWrite = null;
  }

  async init() {
    await this.db.read();
    await this.db.write();
    return this;
  }

  /**
   * Creates a new session.
   * @returns {object} The new session object.
   */
  async createSession() {
    const newSession = {
      id: Date.now(),
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'RUNNING',
      events: []
    }
    this.db.data.sessions.unshift(newSession);
    await this.db.write();
    return newSession;
  }
  async addProfile(profile) {
    if (!this.db.data.profiles) this.db.data.profiles = [];
    const newProfile = { ...profile, id: Date.now() };
    this.db.data.profiles.push(newProfile);
    await this.db.write();
    return newProfile;
  }

  async updateProfile(id, profile) {
    if (!this.db.data.profiles) return null;
    const index = this.db.data.profiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.db.data.profiles[index] = { ...profile, id };
    await this.db.write();
    return this.db.data.profiles[index];
  }

  async deleteProfile(id) {
    if (!this.db.data.profiles) return;
    this.db.data.profiles = this.db.data.profiles.filter(p => p.id !== id);
    await this.db.write();
  }
  /**
   * Adds a status event to an active session.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(sessionId, eventData) {
    const session = this.db.data.sessions.find(s => s.id === sessionId);
    if (session) {
      const startTime = new Date(session.startTime);
      const now = new Date();
      const elapsedTimeInSeconds = Math.round((now - startTime) / 1000);

      session.events.push({
        ...eventData,
        elapsedTime: elapsedTimeInSeconds
      });
      if (!this.lastWrite || now - this.lastWrite > config.dbWriteInterval) {
        await this.db.write();
        this.lastWrite = now;
      }
    }
  }

  async flush() {
    await this.db.write();
    this.lastWrite = new Date();
  }

  /**
   * Finalizes a session, setting its end time and status.
   * @param {number} sessionId The ID of the session to finalize.
   * @param {string} finalStatus The final status of the session ('COMPLETED' or 'ABORTED').
   */
  async endSession(sessionId, finalStatus) {
    const session = this.db.data.sessions.find(s => s.id === sessionId);
    if (session && session.status === 'RUNNING') {
      session.endTime = new Date().toISOString();
      session.status = finalStatus;
      await this.flush();
    }
  }

  /**
   * Clears all sessions from the database.
   */
  async clearHistory() {
    this.db.data.sessions = [];
    await this.db.write();
  }
}

const adapter = new JSONFile(file);
const defaultData = { sessions: [], profiles: [] };
const kilnDatabase = await new KilnDatabase(adapter, defaultData).init();

export default kilnDatabase;
