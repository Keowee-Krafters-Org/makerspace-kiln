import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Database File Paths ---
const dataDir = process.env.NODE_ENV === 'production'
  ? '/var/lib/kiln-controller'
  : __dirname;

const historyArchiveDir = process.env.NODE_ENV === 'production'
  ? dataDir
  : join(__dirname, '../log');

const historyFile = join(dataDir, 'history.json');
const configFile = join(dataDir, 'config.json');


// --- Database Adapters and Default Data ---
const historyAdapter = new JSONFile(historyFile);
const configAdapter = new JSONFile(configFile);

const defaultHistoryData = { sessions: [] };
const defaultConfigData = { profiles: [], preferences: {} };

const HISTORY_FILE_PATTERN = /^history(?:-[A-Za-z0-9._:-]+)?\.json$/;

const getSnapshotTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-') + '-' + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('-');
};


class KilnDatabase {
  constructor(historyAdapter, configAdapter, defaultHistory, defaultConfig) {
    this.historyDb = new Low(historyAdapter, defaultHistory);
    this.configDb = new Low(configAdapter, defaultConfig);
    this.lastWrite = null;
    this.historyFile = historyFile;
    this.historyArchiveDir = historyArchiveDir;
    this.activeHistoryFileName = 'history.json';
  }

  async init() {
    await mkdir(this.historyArchiveDir, { recursive: true });
    await this.historyDb.read();
    await this.configDb.read();
    
    // Ensure default data is written if files are new
    if (!this.historyDb.data) this.historyDb.data = defaultHistoryData;
    if (!this.configDb.data) this.configDb.data = defaultConfigData;

    await this.historyDb.write();
    await this.configDb.write();
    
    return this;
  }

      resolveHistoryFile(fileName) {
        if (!fileName || fileName === this.activeHistoryFileName) {
          return this.historyFile;
        }

        if (!HISTORY_FILE_PATTERN.test(fileName)) {
          throw new Error('Invalid history file name');
        }

        return join(this.historyArchiveDir, fileName);
      }

      async readHistoryFile(fileName) {
        const targetFile = this.resolveHistoryFile(fileName);
        const rawData = await readFile(targetFile, 'utf-8');
        const parsed = JSON.parse(rawData);

        if (!parsed || !Array.isArray(parsed.sessions)) {
          throw new Error('Invalid history file format');
        }

        return parsed;
      }

      async getHistorySessions(fileName) {
        if (!fileName || fileName === this.activeHistoryFileName) {
          return this.historyDb.data.sessions || [];
        }

        const parsed = await this.readHistoryFile(fileName);
        return parsed.sessions;
      }

      async getHistorySessionById(sessionId, fileName) {
        const sessions = await this.getHistorySessions(fileName);
        return sessions.find(session => session.id === sessionId) || null;
      }

      async listHistoryFiles() {
        await mkdir(this.historyArchiveDir, { recursive: true });

        const files = new Map();
        const activeStats = await stat(this.historyFile);

        files.set(this.activeHistoryFileName, {
          name: this.activeHistoryFileName,
          isActive: true,
          updatedAt: activeStats.mtime.toISOString(),
          size: activeStats.size
        });

        const archiveEntries = await readdir(this.historyArchiveDir, { withFileTypes: true });
        for (const entry of archiveEntries) {
          if (!entry.isFile() || !HISTORY_FILE_PATTERN.test(entry.name)) {
            continue;
          }

          const archivePath = join(this.historyArchiveDir, entry.name);
          const archiveStats = await stat(archivePath);
          files.set(entry.name, {
            name: entry.name,
            isActive: entry.name === this.activeHistoryFileName,
            updatedAt: archiveStats.mtime.toISOString(),
            size: archiveStats.size
          });
        }

        return Array.from(files.values()).sort((left, right) => {
          if (left.isActive !== right.isActive) {
            return left.isActive ? -1 : 1;
          }

          return right.updatedAt.localeCompare(left.updatedAt);
        });
      }

      async storeHistorySnapshot(fileName) {
        await mkdir(this.historyArchiveDir, { recursive: true });

        const snapshotName = fileName || `history-${getSnapshotTimestamp()}.json`;
        if (snapshotName === this.activeHistoryFileName || !HISTORY_FILE_PATTERN.test(snapshotName)) {
          throw new Error('Invalid history file name');
        }

        const targetFile = join(this.historyArchiveDir, snapshotName);
        await writeFile(targetFile, JSON.stringify(this.historyDb.data, null, 2), 'utf-8');

        const snapshotStats = await stat(targetFile);
        return {
          name: snapshotName,
          isActive: false,
          updatedAt: snapshotStats.mtime.toISOString(),
          size: snapshotStats.size
        };
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
