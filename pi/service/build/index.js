import p, { dirname as _ } from "path";
import { fileURLToPath as E } from "url";
import { Low as b } from "lowdb";
import "node:fs";
import { writeFile as N, rename as k, readFile as T, mkdir as g, stat as y, readdir as L } from "node:fs/promises";
import { join as h, dirname as A, basename as x } from "node:path";
import { fileURLToPath as C } from "node:url";
import { SerialPort as M } from "serialport";
import q from "stream";
import S from "express";
import J from "cors";
const U = E(import.meta.url), I = p.dirname(U), P = process.env.NODE_ENV === "production", l = {
  isProduction: P,
  // Serial Port Configuration
  // On Linux/RPi this is often /dev/ttyACM0 or /dev/ttyUSB0
  // On Windows this might be COM3, COM4, etc.
  serialPort: "/dev/ttyACM0",
  baudRate: 9600,
  // Service Configuration
  statusInterval: 1e4,
  // Poll status every 10 seconds
  dbWriteInterval: 15e3,
  // Write to db every 15 seconds
  serverPort: 3e3,
  // Port for the Web API
  // Web App Path (Changes based on environment)
  // Production (Pi): './public' (bundled as sibling to index.js)
  // Development Local: '../client/dist' (relative to source index.js)
  clientPath: P ? p.join(I, "public") : p.join(I, "../client/dist")
  // Future: Google AppScript Configuration
  // cloudApiUrl: 'https://script.google.com/macros/s/...'
};
function W(i) {
  const t = i instanceof URL ? C(i) : i.toString();
  return h(A(t), `.${x(t)}.tmp`);
}
async function G(i, t, e) {
  for (let s = 0; s < t; s++)
    try {
      return await i();
    } catch (n) {
      if (s < t - 1)
        await new Promise((r) => setTimeout(r, e));
      else
        throw n;
    }
}
class B {
  #t;
  #e;
  #s = !1;
  #n = null;
  #r = null;
  #o = null;
  #i = null;
  // File is locked, add data for later
  #a(t) {
    return this.#i = t, this.#o ||= new Promise((e, s) => {
      this.#r = [e, s];
    }), new Promise((e, s) => {
      this.#o?.then(e).catch(s);
    });
  }
  // File isn't locked, write data
  async #c(t) {
    this.#s = !0;
    try {
      await N(this.#e, t, "utf-8"), await G(async () => {
        await k(this.#e, this.#t);
      }, 10, 100), this.#n?.[0]();
    } catch (e) {
      throw e instanceof Error && this.#n?.[1](e), e;
    } finally {
      if (this.#s = !1, this.#n = this.#r, this.#r = this.#o = null, this.#i !== null) {
        const e = this.#i;
        this.#i = null, await this.write(e);
      }
    }
  }
  constructor(t) {
    this.#t = t, this.#e = W(t);
  }
  async write(t) {
    return this.#s ? this.#a(t) : this.#c(t);
  }
}
class z {
  #t;
  #e;
  constructor(t) {
    this.#t = t, this.#e = new B(t);
  }
  async read() {
    let t;
    try {
      t = await T(this.#t, "utf-8");
    } catch (e) {
      if (e.code === "ENOENT")
        return null;
      throw e;
    }
    return t;
  }
  write(t) {
    return this.#e.write(t);
  }
}
class K {
  #t;
  #e;
  #s;
  constructor(t, { parse: e, stringify: s }) {
    this.#t = new z(t), this.#e = e, this.#s = s;
  }
  async read() {
    const t = await this.#t.read();
    return t === null ? null : this.#e(t);
  }
  write(t) {
    return this.#t.write(this.#s(t));
  }
}
class j extends K {
  constructor(t) {
    super(t, {
      parse: JSON.parse,
      stringify: (e) => JSON.stringify(e, null, 2)
    });
  }
}
const O = A(C(import.meta.url)), v = process.env.NODE_ENV === "production" ? "/var/lib/kiln-controller" : O, V = process.env.NODE_ENV === "production" ? v : h(O, "../log"), R = h(v, "history.json"), Y = h(v, "config.json"), Z = new j(R), Q = new j(Y), F = { sessions: [] }, H = { profiles: [], preferences: {} }, w = /^history(?:-[A-Za-z0-9._:-]+)?\.json$/, X = () => {
  const i = /* @__PURE__ */ new Date(), t = (e) => String(e).padStart(2, "0");
  return [
    i.getFullYear(),
    t(i.getMonth() + 1),
    t(i.getDate())
  ].join("-") + "-" + [
    t(i.getHours()),
    t(i.getMinutes()),
    t(i.getSeconds())
  ].join("-");
};
class tt {
  constructor(t, e, s, n) {
    this.historyDb = new b(t, s), this.configDb = new b(e, n), this.lastWrite = null, this.historyFile = R, this.historyArchiveDir = V, this.activeHistoryFileName = "history.json";
  }
  async init() {
    return await g(this.historyArchiveDir, { recursive: !0 }), await this.historyDb.read(), await this.configDb.read(), this.historyDb.data || (this.historyDb.data = F), this.configDb.data || (this.configDb.data = H), await this.historyDb.write(), await this.configDb.write(), this;
  }
  resolveHistoryFile(t) {
    if (!t || t === this.activeHistoryFileName)
      return this.historyFile;
    if (!w.test(t))
      throw new Error("Invalid history file name");
    return h(this.historyArchiveDir, t);
  }
  async readHistoryFile(t) {
    const e = this.resolveHistoryFile(t), s = await T(e, "utf-8"), n = JSON.parse(s);
    if (!n || !Array.isArray(n.sessions))
      throw new Error("Invalid history file format");
    return n;
  }
  async getHistorySessions(t) {
    return !t || t === this.activeHistoryFileName ? this.historyDb.data.sessions || [] : (await this.readHistoryFile(t)).sessions;
  }
  async getHistorySessionById(t, e) {
    return (await this.getHistorySessions(e)).find((n) => n.id === t) || null;
  }
  async listHistoryFiles() {
    await g(this.historyArchiveDir, { recursive: !0 });
    const t = /* @__PURE__ */ new Map(), e = await y(this.historyFile);
    t.set(this.activeHistoryFileName, {
      name: this.activeHistoryFileName,
      isActive: !0,
      updatedAt: e.mtime.toISOString(),
      size: e.size
    });
    const s = await L(this.historyArchiveDir, { withFileTypes: !0 });
    for (const n of s) {
      if (!n.isFile() || !w.test(n.name))
        continue;
      const r = h(this.historyArchiveDir, n.name), u = await y(r);
      t.set(n.name, {
        name: n.name,
        isActive: n.name === this.activeHistoryFileName,
        updatedAt: u.mtime.toISOString(),
        size: u.size
      });
    }
    return Array.from(t.values()).sort((n, r) => n.isActive !== r.isActive ? n.isActive ? -1 : 1 : r.updatedAt.localeCompare(n.updatedAt));
  }
  async storeHistorySnapshot(t) {
    await g(this.historyArchiveDir, { recursive: !0 });
    const e = t || `history-${X()}.json`;
    if (e === this.activeHistoryFileName || !w.test(e))
      throw new Error("Invalid history file name");
    const s = h(this.historyArchiveDir, e);
    await N(s, JSON.stringify(this.historyDb.data, null, 2), "utf-8");
    const n = await y(s);
    return {
      name: e,
      isActive: !1,
      updatedAt: n.mtime.toISOString(),
      size: n.size
    };
  }
  /**
   * Creates a new session in the history database.
   * @returns {object} The new session object.
   */
  async createSession(t) {
    const e = {
      id: Date.now(),
      profileId: t,
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      endTime: null,
      status: "RUNNING",
      events: []
    };
    return this.historyDb.data.sessions.unshift(e), await this.historyDb.write(), e;
  }
  /**
   * Returns the most recent RUNNING session, optionally filtered by profileId.
   * @param {string|number|undefined} profileId Optional profile ID.
   * @returns {object|null} Matching active session or null.
   */
  findRunningSession(t) {
    return (this.historyDb.data.sessions || []).find((s) => s.status !== "RUNNING" ? !1 : t == null ? !0 : String(s.profileId) === String(t)) || null;
  }
  // --- Profile Management (in configDb) ---
  async getProfiles() {
    return this.configDb.data.profiles || [];
  }
  async addProfile(t) {
    this.configDb.data.profiles || (this.configDb.data.profiles = []);
    const e = { ...t, id: Date.now() };
    return this.configDb.data.profiles.push(e), await this.configDb.write(), e;
  }
  async updateProfile(t, e) {
    if (!this.configDb.data.profiles)
      return null;
    const s = this.configDb.data.profiles.findIndex((n) => n.id === t);
    return s === -1 ? null : (this.configDb.data.profiles[s] = { ...e, id: t }, await this.configDb.write(), this.configDb.data.profiles[s]);
  }
  async deleteProfile(t) {
    this.configDb.data.profiles && (this.configDb.data.profiles = this.configDb.data.profiles.filter((e) => e.id !== t), await this.configDb.write());
  }
  // --- Preference Management (in configDb) ---
  async getPreferences() {
    return this.configDb.data.preferences || {};
  }
  async updatePreferences(t) {
    return this.configDb.data.preferences = { ...this.configDb.data.preferences, ...t }, await this.configDb.write(), this.configDb.data.preferences;
  }
  /**
   * Adds a status event to an active session in the history database.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(t, e) {
    const s = this.historyDb.data.sessions.find((n) => n.id === t);
    if (s) {
      const n = new Date(s.startTime), r = /* @__PURE__ */ new Date(), u = Math.round((r - n) / 1e3);
      s.events.push({
        ...e,
        elapsedTime: u
      }), (!this.lastWrite || r - this.lastWrite > l.dbWriteInterval) && (await this.historyDb.write(), this.lastWrite = r);
    }
  }
  async flush() {
    await this.historyDb.write(), this.lastWrite = /* @__PURE__ */ new Date();
  }
  /**
   * Finalizes a session, setting its end time and status.
   * @param {number} sessionId The ID of the session to finalize.
   * @param {string} finalStatus The final status of the session ('COMPLETED' or 'ABORTED').
   */
  async endSession(t, e) {
    const s = this.historyDb.data.sessions.find((n) => n.id === t);
    s && s.status === "RUNNING" && (s.endTime = (/* @__PURE__ */ new Date()).toISOString(), s.status = e, await this.flush());
  }
  /**
   * Clears all sessions from the history database.
   */
  async clearHistory() {
    this.historyDb.data.sessions = [], await this.historyDb.write();
  }
}
const a = await new tt(
  Z,
  Q,
  F,
  H
).init();
var D = {}, m = {};
Object.defineProperty(m, "__esModule", { value: !0 });
m.DelimiterParser = void 0;
const et = q;
class st extends et.Transform {
  includeDelimiter;
  delimiter;
  buffer;
  constructor({ delimiter: t, includeDelimiter: e = !1, ...s }) {
    if (super(s), t === void 0)
      throw new TypeError('"delimiter" is not a bufferable object');
    if (t.length === 0)
      throw new TypeError('"delimiter" has a 0 or undefined length');
    this.includeDelimiter = e, this.delimiter = Buffer.from(t), this.buffer = Buffer.alloc(0);
  }
  _transform(t, e, s) {
    let n = Buffer.concat([this.buffer, t]), r;
    for (; (r = n.indexOf(this.delimiter)) !== -1; )
      this.push(n.slice(0, r + (this.includeDelimiter ? this.delimiter.length : 0))), n = n.slice(r + this.delimiter.length);
    this.buffer = n, s();
  }
  _flush(t) {
    this.push(this.buffer), this.buffer = Buffer.alloc(0), t();
  }
}
m.DelimiterParser = st;
Object.defineProperty(D, "__esModule", { value: !0 });
var $ = D.ReadlineParser = void 0;
const it = m;
class nt extends it.DelimiterParser {
  constructor(t) {
    const e = {
      delimiter: Buffer.from(`
`, "utf8"),
      encoding: "utf8",
      ...t
    };
    typeof e.delimiter == "string" && (e.delimiter = Buffer.from(e.delimiter, e.encoding)), super(e);
  }
}
$ = D.ReadlineParser = nt;
class rt {
  constructor(t, e = 9600) {
    this.portPath = t, this.baudRate = e, this.port = null, this.parser = null, this.onStatusCallback = null, this.lastState = "IDLE", this.activeSessionId = null, this.isConnecting = !1, this.reconnectInterval = null;
  }
  connect() {
    return this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), this.isConnecting || this.port && this.port.isOpen ? Promise.resolve() : (this.isConnecting = !0, console.log(`Attempting to connect to kiln on ${this.portPath}...`), new Promise((t, e) => {
      this.port = new M({ path: this.portPath, baudRate: this.baudRate }, (s) => {
        if (this.isConnecting = !1, s)
          return console.error(`Failed to open port ${this.portPath}:`, s.message), this.scheduleReconnect(), e(s);
      }), this.port.on("error", (s) => {
        console.error("Serial Port Error:", s.message);
      }), this.port.on("close", () => {
        console.log("Serial port closed. Attempting to reconnect..."), this.port = null, this.scheduleReconnect();
      }), this.parser = this.port.pipe(new $({ delimiter: `\r
` })), this.parser.on("data", (s) => {
        if (!(!s || s.trim() === ""))
          try {
            const n = JSON.parse(s);
            this.handleData(n);
          } catch {
            console.log("Raw Serial Data:", s);
          }
      }), this.port.on("open", () => {
        this.isConnecting = !1, console.log(`Connected to kiln on ${this.portPath}`), this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), setTimeout(t, 2e3);
      });
    }));
  }
  scheduleReconnect() {
    this.reconnectInterval || (this.onStatusCallback && this.onStatusCallback({ state: "RECONNECTING", message: "Attempting to reconnect to Arduino..." }), this.reconnectInterval = setInterval(() => {
      this.connect().catch(() => {
      });
    }, 5e3));
  }
  async handleData(t) {
    if (!t.state || t.state === "UNKNOWN")
      return;
    if (t.status === "ok" || t.status === "error") {
      this.onStatusCallback ? this.onStatusCallback(t) : console.log("Received Command Response:", t);
      return;
    }
    this.onStatusCallback ? this.onStatusCallback(t) : console.log("Received:", t);
    const e = t.state, s = e === "COMPLETED" || e === "ABORTED" || e === "EMERGENCY_STOP" || e === "ERROR" || e === "ERROR_STATE";
    if (this.activeSessionId && s) {
      const n = e;
      console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${n}`), await a.endSession(this.activeSessionId, n), this.activeSessionId = null, this.lastState = "IDLE";
      return;
    }
    if (e && e !== this.lastState) {
      console.log(`[STATE CHANGE] ${this.lastState} -> ${e}`);
      const n = this.lastState === "IDLE" && (e === "RAMP" || e === "PREHEAT" || e === "SOAK");
      if (!this.activeSessionId && n) {
        const r = a.findRunningSession(t.profileId);
        if (r)
          this.activeSessionId = r.id, console.log(`[SESSION] Resumed session: ${this.activeSessionId} for profile ${t.profileId}`);
        else {
          const u = await a.createSession(t.profileId);
          this.activeSessionId = u.id, console.log(`[SESSION] Started new session: ${this.activeSessionId} for profile ${t.profileId}`);
        }
      }
    }
    this.activeSessionId && t.state && await a.addSessionEvent(this.activeSessionId, t), this.lastState = e;
  }
  onStatus(t) {
    this.onStatusCallback = t;
  }
  sendCommand(t) {
    if (!this.port || !this.port.isOpen) {
      console.error("Port not open, cannot send command:", t), this.onStatusCallback && this.onStatusCallback({ state: "ERROR", message: "Cannot send command. Port is not open." });
      return;
    }
    const e = JSON.stringify(t);
    console.log("Sending:", e), this.port.write(e + `
`, (s) => {
      if (s)
        return console.log("Error on write: ", s.message);
    });
  }
  // --- High Level Commands mapping to kiln.cpp ---
  start() {
    this.sendCommand({ command: "start" });
  }
  stop() {
    this.sendCommand({ command: "stop" });
  }
  /**
   * Set the kiln profile
   * @param {Object} profile - Full profile object with steps
   */
  setProfile(t) {
    console.log("Setting profile:", JSON.stringify(t, null, 2));
    const e = {
      command: "profile",
      id: String(t.id),
      // Ensure ID is a string
      name: t.name,
      steps: t.steps.map((s) => ({
        type: s.type || s.mode || "IDLE",
        targetTemperature: s.targetTemperature,
        duration: s.duration,
        rate: s.rate
      }))
    };
    this.sendCommand(e);
  }
  getStatus() {
    this.sendCommand({ command: "status" });
  }
  testInput(t, e, s) {
    const n = {
      command: "testInput",
      temperature: t
    };
    e !== void 0 && (n.duration = e), s !== void 0 && (n.setPoint = s), this.sendCommand(n);
  }
}
const ot = E(import.meta.url);
_(ot);
console.log("Initializing Kiln Controller Service...");
console.log(`Environment: ${l.isProduction ? "Production" : "Development"}`);
console.log(`Serving Client from: ${l.clientPath}`);
const c = new rt(l.serialPort, l.baudRate), o = S();
let f = { state: "UNKNOWN", timestamp: 0 }, d = [];
o.use(J());
o.use(S.json());
o.use(S.static(l.clientPath));
o.get("/api/preferences", async (i, t) => {
  const e = await a.getPreferences();
  t.json(e);
});
o.post("/api/preferences", async (i, t) => {
  const e = await a.updatePreferences(i.body);
  t.json(e);
});
o.get("/api/profiles", async (i, t) => {
  const e = await a.getProfiles();
  t.json(e || []);
});
o.post("/api/profiles", async (i, t) => {
  const e = await a.addProfile(i.body);
  t.json(e);
});
o.put("/api/profiles/:id", async (i, t) => {
  const e = parseInt(i.params.id), s = await a.updateProfile(e, i.body);
  s ? t.json(s) : t.status(404).json({ error: "Profile not found" });
});
o.delete("/api/profiles/:id", async (i, t) => {
  const e = parseInt(i.params.id);
  await a.deleteProfile(e), t.json({ success: !0 });
});
o.get("/api/history/files", async (i, t) => {
  try {
    const e = await a.listHistoryFiles();
    t.json({
      remoteMode: l.isProduction,
      activeFile: a.activeHistoryFileName,
      files: e
    });
  } catch (e) {
    console.error("Error listing history files:", e), t.status(500).json({ success: !1, message: "Could not list history files." });
  }
});
o.post("/api/history/files", async (i, t) => {
  try {
    const e = await a.storeHistorySnapshot(i.body?.fileName);
    t.status(201).json({ success: !0, file: e });
  } catch (e) {
    const s = e.message === "Invalid history file name" ? 400 : 500;
    console.error("Error storing history snapshot:", e), t.status(s).json({ success: !1, message: e.message || "Could not store history snapshot." });
  }
});
o.get("/api/history", async (i, t) => {
  try {
    const e = await a.getHistorySessions(i.query.file);
    t.json(e);
  } catch (e) {
    const s = e.message === "Invalid history file name" ? 400 : 404;
    console.error("Error reading history:", e), t.status(s).json({ success: !1, message: "Could not load history." });
  }
});
o.delete("/api/history", async (i, t) => {
  await a.clearHistory(), t.json({ success: !0, message: "History cleared" });
});
o.get("/api/history/:id", async (i, t) => {
  const e = parseInt(i.params.id, 10);
  try {
    const s = await a.getHistorySessionById(e, i.query.file);
    s ? t.json(s) : t.status(404).json({ success: !1, message: "Session not found" });
  } catch (s) {
    const n = s.message === "Invalid history file name" ? 400 : 404;
    console.error(`Error reading history session ${e}:`, s), t.status(n).json({ success: !1, message: "Could not load session data." });
  }
});
o.get("/api/events", (i, t) => {
  t.setHeader("Content-Type", "text/event-stream"), t.setHeader("Cache-Control", "no-cache"), t.setHeader("Connection", "keep-alive"), t.flushHeaders();
  const e = JSON.stringify(f);
  t.write(`data: ${e}

`);
  const s = Date.now(), n = {
    id: s,
    res: t
  };
  d.push(n), i.on("close", () => {
    d = d.filter((r) => r.id !== s);
  });
});
o.get("/api/status", (i, t) => {
  t.json(f);
});
o.post("/api/start", async (i, t) => {
  const { profileId: e } = i.body;
  if (e) {
    const n = (await a.getProfiles())?.find((r) => r.id === e);
    if (n)
      console.log(`Loading profile ${n.name} before starting...`), c.setProfile(n);
    else
      return t.status(404).json({ success: !1, message: "Profile not found" });
  }
  setTimeout(() => {
    c.start();
  }, 500), t.json({ success: !0, message: "Start command sent" });
});
o.post("/api/stop", async (i, t) => {
  c.stop(), t.json({ success: !0, message: "Stop command sent" });
});
o.post("/api/profile", (i, t) => {
  const { targetTemperature: e, rampTime: s, soakDuration: n, coolTime: r } = i.body;
  if (e === void 0)
    return t.status(400).json({ success: !1, message: "targetTemperature is required" });
  c.setProfile(e, s, n, r), t.json({
    success: !0,
    message: "Profile update sent",
    params: { targetTemperature: e, rampTime: s, soakDuration: n, coolTime: r }
  });
});
o.post("/api/test", (i, t) => {
  const { temperature: e, duration: s, setPoint: n } = i.body;
  if (e === void 0)
    return t.status(400).json({ success: !1, message: "temperature is required" });
  c.testInput(e, s, n), t.json({
    success: !0,
    message: "Test mode initiated",
    params: { temperature: e, duration: s, setPoint: n }
  });
});
o.post("/api/test/temp", (i, t) => {
  const { temperature: e } = i.body;
  if (e === void 0)
    return t.status(400).json({ success: !1, message: "temperature is required" });
  c.testInput(e), t.json({
    success: !0,
    message: "Simulated temperature set",
    params: { temperature: e }
  });
});
c.onStatus(async (i) => {
  const t = f.state;
  f = { ...i, timestamp: Date.now() }, d.forEach((n) => {
    n.res.write(`data: ${JSON.stringify(f)}

`);
  }), ((await a.getPreferences()).logLevel || "verbose") === "quiet" ? (i.state && i.state !== t && console.log(`[STATE CHANGE] ${t} -> ${i.state}`), i.message && i.message.includes("Lost contact") && console.log(`[CONNECTION] ${i.message}`)) : i.state ? console.log("[STATUS]", JSON.stringify(i)) : i.message ? console.log(`[MSG] ${i.message}`) : console.log("[DATA]", i);
});
o.get("*", (i, t) => {
  t.sendFile(p.join(l.clientPath, "index.html"));
});
async function at() {
  try {
    await c.connect(), o.listen(l.serverPort, () => {
      console.log(`Web API running on http://localhost:${l.serverPort}`);
    }), console.log("Service is running and attempting to maintain Arduino connection.");
    const i = () => {
      console.log(`
Service stopping. Turning off kiln...`), c.reconnectInterval && clearInterval(c.reconnectInterval), c.stop(), setTimeout(() => {
        c.port && c.port.isOpen && c.port.close(), process.exit(0);
      }, 500);
    };
    process.on("SIGINT", i), process.on("SIGTERM", i);
  } catch (i) {
    console.error("FATAL: Unrecoverable error during service startup."), console.error("Details:", i.message), process.exit(1);
  }
}
at();
