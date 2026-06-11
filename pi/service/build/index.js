import h, { dirname as R } from "path";
import { fileURLToPath as D } from "url";
import { Low as w } from "lowdb";
import "node:fs";
import { writeFile as O, rename as j, readFile as $ } from "node:fs/promises";
import { join as m, dirname as v, basename as A } from "node:path";
import { fileURLToPath as P } from "node:url";
import { SerialPort as _ } from "serialport";
import k from "stream";
import g from "express";
import x from "cors";
const L = D(import.meta.url), y = h.dirname(L), b = process.env.NODE_ENV === "production", l = {
  isProduction: b,
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
  clientPath: b ? h.join(y, "public") : h.join(y, "../client/dist")
  // Future: Google AppScript Configuration
  // cloudApiUrl: 'https://script.google.com/macros/s/...'
};
function F(i) {
  const t = i instanceof URL ? P(i) : i.toString();
  return m(v(t), `.${A(t)}.tmp`);
}
async function q(i, t, e) {
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
class H {
  #t;
  #e;
  #s = !1;
  #n = null;
  #o = null;
  #r = null;
  #i = null;
  // File is locked, add data for later
  #a(t) {
    return this.#i = t, this.#r ||= new Promise((e, s) => {
      this.#o = [e, s];
    }), new Promise((e, s) => {
      this.#r?.then(e).catch(s);
    });
  }
  // File isn't locked, write data
  async #c(t) {
    this.#s = !0;
    try {
      await O(this.#e, t, "utf-8"), await q(async () => {
        await j(this.#e, this.#t);
      }, 10, 100), this.#n?.[0]();
    } catch (e) {
      throw e instanceof Error && this.#n?.[1](e), e;
    } finally {
      if (this.#s = !1, this.#n = this.#o, this.#o = this.#r = null, this.#i !== null) {
        const e = this.#i;
        this.#i = null, await this.write(e);
      }
    }
  }
  constructor(t) {
    this.#t = t, this.#e = F(t);
  }
  async write(t) {
    return this.#s ? this.#a(t) : this.#c(t);
  }
}
class U {
  #t;
  #e;
  constructor(t) {
    this.#t = t, this.#e = new H(t);
  }
  async read() {
    let t;
    try {
      t = await $(this.#t, "utf-8");
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
class W {
  #t;
  #e;
  #s;
  constructor(t, { parse: e, stringify: s }) {
    this.#t = new U(t), this.#e = e, this.#s = s;
  }
  async read() {
    const t = await this.#t.read();
    return t === null ? null : this.#e(t);
  }
  write(t) {
    return this.#t.write(this.#s(t));
  }
}
class I extends W {
  constructor(t) {
    super(t, {
      parse: JSON.parse,
      stringify: (e) => JSON.stringify(e, null, 2)
    });
  }
}
const G = v(P(import.meta.url)), T = process.env.NODE_ENV === "production" ? "/var/lib/kiln-controller" : G, J = m(T, "history.json"), M = m(T, "config.json"), B = new I(J), K = new I(M), E = { sessions: [] }, N = { profiles: [], preferences: {} };
class V {
  constructor(t, e, s, n) {
    this.historyDb = new w(t, s), this.configDb = new w(e, n), this.lastWrite = null;
  }
  async init() {
    return await this.historyDb.read(), await this.configDb.read(), this.historyDb.data || (this.historyDb.data = E), this.configDb.data || (this.configDb.data = N), await this.historyDb.write(), await this.configDb.write(), this;
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
      const n = new Date(s.startTime), r = /* @__PURE__ */ new Date(), p = Math.round((r - n) / 1e3);
      s.events.push({
        ...e,
        elapsedTime: p
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
const a = await new V(
  B,
  K,
  E,
  N
).init();
var S = {}, d = {};
Object.defineProperty(d, "__esModule", { value: !0 });
d.DelimiterParser = void 0;
const z = k;
class Y extends z.Transform {
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
d.DelimiterParser = Y;
Object.defineProperty(S, "__esModule", { value: !0 });
var C = S.ReadlineParser = void 0;
const Q = d;
class X extends Q.DelimiterParser {
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
C = S.ReadlineParser = X;
class Z {
  constructor(t, e = 9600) {
    this.portPath = t, this.baudRate = e, this.port = null, this.parser = null, this.onStatusCallback = null, this.lastState = "IDLE", this.activeSessionId = null, this.isConnecting = !1, this.reconnectInterval = null;
  }
  connect() {
    return this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), this.isConnecting || this.port && this.port.isOpen ? Promise.resolve() : (this.isConnecting = !0, console.log(`Attempting to connect to kiln on ${this.portPath}...`), new Promise((t, e) => {
      this.port = new _({ path: this.portPath, baudRate: this.baudRate }, (s) => {
        if (this.isConnecting = !1, s)
          return console.error(`Failed to open port ${this.portPath}:`, s.message), this.scheduleReconnect(), e(s);
      }), this.port.on("error", (s) => {
        console.error("Serial Port Error:", s.message);
      }), this.port.on("close", () => {
        console.log("Serial port closed. Attempting to reconnect..."), this.port = null, this.scheduleReconnect();
      }), this.parser = this.port.pipe(new C({ delimiter: `\r
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
          const p = await a.createSession(t.profileId);
          this.activeSessionId = p.id, console.log(`[SESSION] Started new session: ${this.activeSessionId} for profile ${t.profileId}`);
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
const tt = D(import.meta.url);
R(tt);
console.log("Initializing Kiln Controller Service...");
console.log(`Environment: ${l.isProduction ? "Production" : "Development"}`);
console.log(`Serving Client from: ${l.clientPath}`);
const c = new Z(l.serialPort, l.baudRate), o = g();
let f = { state: "UNKNOWN", timestamp: 0 }, u = [];
o.use(x());
o.use(g.json());
o.use(g.static(l.clientPath));
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
o.get("/api/history", (i, t) => {
  t.json(a.historyDb.data.sessions);
});
o.delete("/api/history", async (i, t) => {
  await a.clearHistory(), t.json({ success: !0, message: "History cleared" });
});
o.get("/api/history/:id", (i, t) => {
  const e = parseInt(i.params.id, 10), s = a.historyDb.data.sessions.find((n) => n.id === e);
  s ? t.json(s) : t.status(404).json({ success: !1, message: "Session not found" });
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
  u.push(n), i.on("close", () => {
    u = u.filter((r) => r.id !== s);
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
  f = { ...i, timestamp: Date.now() }, u.forEach((n) => {
    n.res.write(`data: ${JSON.stringify(f)}

`);
  }), ((await a.getPreferences()).logLevel || "verbose") === "quiet" ? (i.state && i.state !== t && console.log(`[STATE CHANGE] ${t} -> ${i.state}`), i.message && i.message.includes("Lost contact") && console.log(`[CONNECTION] ${i.message}`)) : i.state ? console.log("[STATUS]", JSON.stringify(i)) : i.message ? console.log(`[MSG] ${i.message}`) : console.log("[DATA]", i);
});
o.get("*", (i, t) => {
  t.sendFile(h.join(l.clientPath, "index.html"));
});
async function et() {
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
et();
