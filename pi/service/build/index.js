import d, { dirname as R } from "path";
import { fileURLToPath as b } from "url";
import { Low as S } from "lowdb";
import "node:fs";
import { writeFile as j, rename as $, readFile as A } from "node:fs/promises";
import { join as m, dirname as v, basename as _ } from "node:path";
import { fileURLToPath as P } from "node:url";
import { SerialPort as k } from "serialport";
import L from "stream";
import g from "express";
import x from "cors";
const F = b(import.meta.url), y = d.dirname(F), D = process.env.NODE_ENV === "production", f = {
  isProduction: D,
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
  clientPath: D ? d.join(y, "public") : d.join(y, "../client/dist")
  // Future: Google AppScript Configuration
  // cloudApiUrl: 'https://script.google.com/macros/s/...'
};
function M(i) {
  const e = i instanceof URL ? P(i) : i.toString();
  return m(v(e), `.${_(e)}.tmp`);
}
async function q(i, e, t) {
  for (let s = 0; s < e; s++)
    try {
      return await i();
    } catch (n) {
      if (s < e - 1)
        await new Promise((o) => setTimeout(o, t));
      else
        throw n;
    }
}
class H {
  #e;
  #t;
  #s = !1;
  #n = null;
  #o = null;
  #r = null;
  #i = null;
  // File is locked, add data for later
  #a(e) {
    return this.#i = e, this.#r ||= new Promise((t, s) => {
      this.#o = [t, s];
    }), new Promise((t, s) => {
      this.#r?.then(t).catch(s);
    });
  }
  // File isn't locked, write data
  async #c(e) {
    this.#s = !0;
    try {
      await j(this.#t, e, "utf-8"), await q(async () => {
        await $(this.#t, this.#e);
      }, 10, 100), this.#n?.[0]();
    } catch (t) {
      throw t instanceof Error && this.#n?.[1](t), t;
    } finally {
      if (this.#s = !1, this.#n = this.#o, this.#o = this.#r = null, this.#i !== null) {
        const t = this.#i;
        this.#i = null, await this.write(t);
      }
    }
  }
  constructor(e) {
    this.#e = e, this.#t = M(e);
  }
  async write(e) {
    return this.#s ? this.#a(e) : this.#c(e);
  }
}
class W {
  #e;
  #t;
  constructor(e) {
    this.#e = e, this.#t = new H(e);
  }
  async read() {
    let e;
    try {
      e = await A(this.#e, "utf-8");
    } catch (t) {
      if (t.code === "ENOENT")
        return null;
      throw t;
    }
    return e;
  }
  write(e) {
    return this.#t.write(e);
  }
}
class B {
  #e;
  #t;
  #s;
  constructor(e, { parse: t, stringify: s }) {
    this.#e = new W(e), this.#t = t, this.#s = s;
  }
  async read() {
    const e = await this.#e.read();
    return e === null ? null : this.#t(e);
  }
  write(e) {
    return this.#e.write(this.#s(e));
  }
}
class I extends B {
  constructor(e) {
    super(e, {
      parse: JSON.parse,
      stringify: (t) => JSON.stringify(t, null, 2)
    });
  }
}
const G = v(P(import.meta.url)), E = process.env.NODE_ENV === "production" ? "/var/lib/kiln-controller" : G, U = m(E, "history.json"), J = m(E, "config.json"), K = new I(U), V = new I(J), T = { sessions: [] }, C = { profiles: [], preferences: {} };
class Y {
  constructor(e, t, s, n) {
    this.historyDb = new S(e, s), this.configDb = new S(t, n), this.lastWrite = null;
  }
  async init() {
    return await this.historyDb.read(), await this.configDb.read(), this.historyDb.data || (this.historyDb.data = T), this.configDb.data || (this.configDb.data = C), await this.historyDb.write(), await this.configDb.write(), this;
  }
  /**
   * Creates a new session in the history database.
   * @returns {object} The new session object.
   */
  async createSession(e) {
    const t = {
      id: Date.now(),
      profileId: e,
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      endTime: null,
      status: "RUNNING",
      events: []
    };
    return this.historyDb.data.sessions.unshift(t), await this.historyDb.write(), t;
  }
  // --- Profile Management (in configDb) ---
  async getProfiles() {
    return this.configDb.data.profiles || [];
  }
  async addProfile(e) {
    this.configDb.data.profiles || (this.configDb.data.profiles = []);
    const t = { ...e, id: Date.now() };
    return this.configDb.data.profiles.push(t), await this.configDb.write(), t;
  }
  async updateProfile(e, t) {
    if (!this.configDb.data.profiles)
      return null;
    const s = this.configDb.data.profiles.findIndex((n) => n.id === e);
    return s === -1 ? null : (this.configDb.data.profiles[s] = { ...t, id: e }, await this.configDb.write(), this.configDb.data.profiles[s]);
  }
  async deleteProfile(e) {
    this.configDb.data.profiles && (this.configDb.data.profiles = this.configDb.data.profiles.filter((t) => t.id !== e), await this.configDb.write());
  }
  // --- Preference Management (in configDb) ---
  async getPreferences() {
    return this.configDb.data.preferences || {};
  }
  async updatePreferences(e) {
    return this.configDb.data.preferences = { ...this.configDb.data.preferences, ...e }, await this.configDb.write(), this.configDb.data.preferences;
  }
  /**
   * Adds a status event to an active session in the history database.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(e, t) {
    const s = this.historyDb.data.sessions.find((n) => n.id === e);
    if (s) {
      const n = new Date(s.startTime), o = /* @__PURE__ */ new Date(), O = Math.round((o - n) / 1e3);
      s.events.push({
        ...t,
        elapsedTime: O
      }), (!this.lastWrite || o - this.lastWrite > f.dbWriteInterval) && (await this.historyDb.write(), this.lastWrite = o);
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
  async endSession(e, t) {
    const s = this.historyDb.data.sessions.find((n) => n.id === e);
    s && s.status === "RUNNING" && (s.endTime = (/* @__PURE__ */ new Date()).toISOString(), s.status = t, await this.flush());
  }
  /**
   * Clears all sessions from the history database.
   */
  async clearHistory() {
    this.historyDb.data.sessions = [], await this.historyDb.write();
  }
}
const a = await new Y(
  K,
  V,
  T,
  C
).init();
var w = {}, p = {};
Object.defineProperty(p, "__esModule", { value: !0 });
p.DelimiterParser = void 0;
const z = L;
class Q extends z.Transform {
  includeDelimiter;
  delimiter;
  buffer;
  constructor({ delimiter: e, includeDelimiter: t = !1, ...s }) {
    if (super(s), e === void 0)
      throw new TypeError('"delimiter" is not a bufferable object');
    if (e.length === 0)
      throw new TypeError('"delimiter" has a 0 or undefined length');
    this.includeDelimiter = t, this.delimiter = Buffer.from(e), this.buffer = Buffer.alloc(0);
  }
  _transform(e, t, s) {
    let n = Buffer.concat([this.buffer, e]), o;
    for (; (o = n.indexOf(this.delimiter)) !== -1; )
      this.push(n.slice(0, o + (this.includeDelimiter ? this.delimiter.length : 0))), n = n.slice(o + this.delimiter.length);
    this.buffer = n, s();
  }
  _flush(e) {
    this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
  }
}
p.DelimiterParser = Q;
Object.defineProperty(w, "__esModule", { value: !0 });
var N = w.ReadlineParser = void 0;
const X = p;
class Z extends X.DelimiterParser {
  constructor(e) {
    const t = {
      delimiter: Buffer.from(`
`, "utf8"),
      encoding: "utf8",
      ...e
    };
    typeof t.delimiter == "string" && (t.delimiter = Buffer.from(t.delimiter, t.encoding)), super(t);
  }
}
N = w.ReadlineParser = Z;
class ee {
  constructor(e, t = 9600) {
    this.portPath = e, this.baudRate = t, this.port = null, this.parser = null, this.onStatusCallback = null, this.lastState = "IDLE", this.activeSessionId = null, this.isConnecting = !1, this.reconnectInterval = null;
  }
  connect() {
    return this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), this.isConnecting || this.port && this.port.isOpen ? Promise.resolve() : (this.isConnecting = !0, console.log(`Attempting to connect to kiln on ${this.portPath}...`), new Promise((e, t) => {
      this.port = new k({ path: this.portPath, baudRate: this.baudRate }, (s) => {
        if (this.isConnecting = !1, s)
          return console.error(`Failed to open port ${this.portPath}:`, s.message), this.scheduleReconnect(), t(s);
      }), this.port.on("error", (s) => {
        console.error("Serial Port Error:", s.message);
      }), this.port.on("close", () => {
        console.log("Serial port closed. Attempting to reconnect..."), this.port = null, this.scheduleReconnect();
      }), this.parser = this.port.pipe(new N({ delimiter: `\r
` })), this.parser.on("data", (s) => {
        if (!(!s || s.trim() === ""))
          try {
            const n = JSON.parse(s);
            this.handleData(n);
          } catch {
            console.log("Raw Serial Data:", s);
          }
      }), this.port.on("open", () => {
        this.isConnecting = !1, console.log(`Connected to kiln on ${this.portPath}`), this.lastState = "IDLE", this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), setTimeout(e, 2e3);
      });
    }));
  }
  scheduleReconnect() {
    this.reconnectInterval || (this.onStatusCallback && this.onStatusCallback({ state: "RECONNECTING", message: "Attempting to reconnect to Arduino..." }), this.reconnectInterval = setInterval(() => {
      this.connect().catch(() => {
      });
    }, 5e3));
  }
  async handleData(e) {
    if (!e.state || e.state === "UNKNOWN")
      return;
    if (e.status === "ok" || e.status === "error") {
      this.onStatusCallback ? this.onStatusCallback(e) : console.log("Received Command Response:", e);
      return;
    }
    this.onStatusCallback ? this.onStatusCallback(e) : console.log("Received:", e);
    const t = e.state;
    if (t && t !== this.lastState) {
      console.log(`[STATE CHANGE] ${this.lastState} -> ${t}`);
      const s = this.lastState === "IDLE" && (t === "RAMP" || t === "PREHEAT" || t === "SOAK");
      if (!this.activeSessionId && s) {
        const o = await a.createSession(e.profileId);
        this.activeSessionId = o.id, console.log(`[SESSION] Started new session: ${this.activeSessionId} for profile ${e.profileId}`);
      }
      const n = t === "COMPLETED" || t === "ABORTED" || t === "EMERGENCY_STOP";
      if (this.activeSessionId && n) {
        const o = t;
        console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${o}`), await a.endSession(this.activeSessionId, o), this.activeSessionId = null, this.lastState = "IDLE";
        return;
      }
    }
    this.activeSessionId && e.state && await a.addSessionEvent(this.activeSessionId, e), this.lastState = t;
  }
  onStatus(e) {
    this.onStatusCallback = e;
  }
  sendCommand(e) {
    if (!this.port || !this.port.isOpen) {
      console.error("Port not open, cannot send command:", e), this.onStatusCallback && this.onStatusCallback({ state: "ERROR", message: "Cannot send command. Port is not open." });
      return;
    }
    const t = JSON.stringify(e);
    console.log("Sending:", t), this.port.write(t + `
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
  setProfile(e) {
    console.log("Setting profile:", JSON.stringify(e, null, 2));
    const t = {
      command: "profile",
      id: String(e.id),
      // Ensure ID is a string
      name: e.name,
      steps: e.steps.map((s) => ({
        type: s.type || s.mode || "IDLE",
        targetTemperature: s.targetTemperature,
        duration: s.duration,
        rate: s.rate
      }))
    };
    this.sendCommand(t);
  }
  getStatus() {
    this.sendCommand({ command: "status" });
  }
  testInput(e, t, s) {
    const n = {
      command: "testInput",
      temperature: e
    };
    t !== void 0 && (n.duration = t), s !== void 0 && (n.setPoint = s), this.sendCommand(n);
  }
}
const te = b(import.meta.url);
R(te);
console.log("Initializing Kiln Controller Service...");
console.log(`Environment: ${f.isProduction ? "Production" : "Development"}`);
console.log(`Serving Client from: ${f.clientPath}`);
const c = new ee(f.serialPort, f.baudRate), r = g();
let h = { state: "UNKNOWN", timestamp: 0 }, u = [], l = null;
r.use(x());
r.use(g.json());
r.use(g.static(f.clientPath));
r.get("/api/preferences", async (i, e) => {
  const t = await a.getPreferences();
  e.json(t);
});
r.post("/api/preferences", async (i, e) => {
  const t = await a.updatePreferences(i.body);
  e.json(t);
});
r.get("/api/profiles", async (i, e) => {
  const t = await a.getProfiles();
  e.json(t || []);
});
r.post("/api/profiles", async (i, e) => {
  const t = await a.addProfile(i.body);
  e.json(t);
});
r.put("/api/profiles/:id", async (i, e) => {
  const t = parseInt(i.params.id), s = await a.updateProfile(t, i.body);
  s ? e.json(s) : e.status(404).json({ error: "Profile not found" });
});
r.delete("/api/profiles/:id", async (i, e) => {
  const t = parseInt(i.params.id);
  await a.deleteProfile(t), e.json({ success: !0 });
});
r.get("/api/history", (i, e) => {
  e.json(a.historyDb.data.sessions);
});
r.delete("/api/history", async (i, e) => {
  await a.clearHistory(), e.json({ success: !0, message: "History cleared" });
});
r.get("/api/history/:id", (i, e) => {
  const t = parseInt(i.params.id, 10), s = a.historyDb.data.sessions.find((n) => n.id === t);
  s ? e.json(s) : e.status(404).json({ success: !1, message: "Session not found" });
});
r.get("/api/events", (i, e) => {
  e.setHeader("Content-Type", "text/event-stream"), e.setHeader("Cache-Control", "no-cache"), e.setHeader("Connection", "keep-alive"), e.flushHeaders();
  const t = JSON.stringify(h);
  e.write(`data: ${t}

`);
  const s = Date.now(), n = {
    id: s,
    res: e
  };
  u.push(n), i.on("close", () => {
    u = u.filter((o) => o.id !== s);
  });
});
r.get("/api/status", (i, e) => {
  e.json(h);
});
r.post("/api/start", async (i, e) => {
  const { profileId: t } = i.body;
  if (t) {
    const n = (await a.getProfiles())?.find((o) => o.id === t);
    if (n)
      console.log(`Loading profile ${n.name} before starting...`), c.setProfile(n);
    else
      return e.status(404).json({ success: !1, message: "Profile not found" });
  }
  setTimeout(() => {
    c.start();
  }, 500);
  try {
    l = (await a.createSession()).id, console.log(`Started new session: ${l}`);
  } catch (s) {
    console.error("Failed to create history session:", s);
  }
  e.json({ success: !0, message: "Start command sent" });
});
r.post("/api/stop", async (i, e) => {
  c.stop(), l && (await a.endSession(l, "ABORTED"), console.log(`Ended session ${l}: ABORTED`), l = null), e.json({ success: !0, message: "Stop command sent" });
});
r.post("/api/profile", (i, e) => {
  const { targetTemperature: t, rampTime: s, soakDuration: n, coolTime: o } = i.body;
  if (t === void 0)
    return e.status(400).json({ success: !1, message: "targetTemperature is required" });
  c.setProfile(t, s, n, o), e.json({
    success: !0,
    message: "Profile update sent",
    params: { targetTemperature: t, rampTime: s, soakDuration: n, coolTime: o }
  });
});
r.post("/api/test", (i, e) => {
  const { temperature: t, duration: s, setPoint: n } = i.body;
  if (t === void 0)
    return e.status(400).json({ success: !1, message: "temperature is required" });
  c.testInput(t, s, n), e.json({
    success: !0,
    message: "Test mode initiated",
    params: { temperature: t, duration: s, setPoint: n }
  });
});
r.post("/api/test/temp", (i, e) => {
  const { temperature: t } = i.body;
  if (t === void 0)
    return e.status(400).json({ success: !1, message: "temperature is required" });
  c.testInput(t), e.json({
    success: !0,
    message: "Simulated temperature set",
    params: { temperature: t }
  });
});
c.onStatus(async (i) => {
  const e = h.state;
  if (h = { ...i, timestamp: Date.now() }, u.forEach((n) => {
    n.res.write(`data: ${JSON.stringify(h)}

`);
  }), l && (i.state === "RAMP" || i.state === "SOAK" || i.state === "COOL"))
    try {
      await a.addSessionEvent(l, i);
    } catch (n) {
      console.error("Error saving session event:", n);
    }
  else if (l && (i.state === "COMPLETED" || i.state === "ABORTED" || i.state === "EMERGENCY_STOP"))
    try {
      await a.addSessionEvent(l, i), await a.endSession(l, i.state), console.log(`Session ${l} completed via status update: ${i.state}`), l = null;
    } catch (n) {
      console.error("Error closing session:", n);
    }
  ((await a.getPreferences()).logLevel || "verbose") === "quiet" ? (i.state && i.state !== e && console.log(`[STATE CHANGE] ${e} -> ${i.state}`), i.message && i.message.includes("Lost contact") && console.log(`[CONNECTION] ${i.message}`)) : i.state ? console.log("[STATUS]", JSON.stringify(i)) : i.message ? console.log(`[MSG] ${i.message}`) : console.log("[DATA]", i);
});
r.get("*", (i, e) => {
  e.sendFile(d.join(f.clientPath, "index.html"));
});
async function se() {
  try {
    await c.connect(), r.listen(f.serverPort, () => {
      console.log(`Web API running on http://localhost:${f.serverPort}`);
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
se();
