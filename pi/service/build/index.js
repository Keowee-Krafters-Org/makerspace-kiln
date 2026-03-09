import f, { dirname as D } from "path";
import { fileURLToPath as y } from "url";
import { Low as I } from "lowdb";
import "node:fs";
import { writeFile as O, rename as R, readFile as j } from "node:fs/promises";
import { join as b, dirname as P, basename as C } from "node:path";
import { fileURLToPath as T } from "node:url";
import { SerialPort as N } from "serialport";
import $ from "stream";
import m from "express";
import _ from "cors";
const k = y(import.meta.url), g = f.dirname(k), S = process.env.NODE_ENV === "production", d = {
  isProduction: S,
  // Serial Port Configuration
  // On Linux/RPi this is often /dev/ttyACM0 or /dev/ttyUSB0
  // On Windows this might be COM3, COM4, etc.
  serialPort: "/dev/ttyACM0",
  baudRate: 9600,
  // Service Configuration
  statusInterval: 1e4,
  // Poll status every 10 seconds
  serverPort: 3e3,
  // Port for the Web API
  // Web App Path (Changes based on environment)
  // Production (Pi): './public' (bundled as sibling to index.js)
  // Development Local: '../client/dist' (relative to source index.js)
  clientPath: S ? f.join(g, "public") : f.join(g, "../client/dist")
  // Future: Google AppScript Configuration
  // cloudApiUrl: 'https://script.google.com/macros/s/...'
};
function x(i) {
  const e = i instanceof URL ? T(i) : i.toString();
  return b(P(e), `.${C(e)}.tmp`);
}
async function A(i, e, t) {
  for (let s = 0; s < e; s++)
    try {
      return await i();
    } catch (n) {
      if (s < e - 1)
        await new Promise((c) => setTimeout(c, t));
      else
        throw n;
    }
}
class M {
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
  async #l(e) {
    this.#s = !0;
    try {
      await O(this.#t, e, "utf-8"), await A(async () => {
        await R(this.#t, this.#e);
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
    this.#e = e, this.#t = x(e);
  }
  async write(e) {
    return this.#s ? this.#a(e) : this.#l(e);
  }
}
class q {
  #e;
  #t;
  constructor(e) {
    this.#e = e, this.#t = new M(e);
  }
  async read() {
    let e;
    try {
      e = await j(this.#e, "utf-8");
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
    this.#e = new q(e), this.#t = t, this.#s = s;
  }
  async read() {
    const e = await this.#e.read();
    return e === null ? null : this.#t(e);
  }
  write(e) {
    return this.#e.write(this.#s(e));
  }
}
class F extends B {
  constructor(e) {
    super(e, {
      parse: JSON.parse,
      stringify: (t) => JSON.stringify(t, null, 2)
    });
  }
}
const L = P(T(import.meta.url)), J = b(L, "db.json");
class G {
  constructor(e, t) {
    this.db = new I(e, t);
  }
  async init() {
    return await this.db.read(), await this.db.write(), this;
  }
  /**
   * Creates a new session.
   * @returns {object} The new session object.
   */
  async createSession() {
    const e = {
      id: Date.now(),
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      endTime: null,
      status: "RUNNING",
      events: []
    };
    return this.db.data.sessions.unshift(e), await this.db.write(), e;
  }
  async addProfile(e) {
    this.db.data.profiles || (this.db.data.profiles = []);
    const t = { ...e, id: Date.now() };
    return this.db.data.profiles.push(t), await this.db.write(), t;
  }
  async updateProfile(e, t) {
    if (!this.db.data.profiles)
      return null;
    const s = this.db.data.profiles.findIndex((n) => n.id === e);
    return s === -1 ? null : (this.db.data.profiles[s] = { ...t, id: e }, await this.db.write(), this.db.data.profiles[s]);
  }
  async deleteProfile(e) {
    this.db.data.profiles && (this.db.data.profiles = this.db.data.profiles.filter((t) => t.id !== e), await this.db.write());
  }
  /**
   * Adds a status event to an active session.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(e, t) {
    const s = this.db.data.sessions.find((n) => n.id === e);
    if (s) {
      const n = new Date(s.startTime), E = Math.round((/* @__PURE__ */ new Date() - n) / 1e3);
      s.events.push({
        ...t,
        elapsedTime: E
      }), await this.db.write();
    }
  }
  /**
   * Finalizes a session, setting its end time and status.
   * @param {number} sessionId The ID of the session to finalize.
   * @param {string} finalStatus The final status of the session ('COMPLETED' or 'ABORTED').
   */
  async endSession(e, t) {
    const s = this.db.data.sessions.find((n) => n.id === e);
    s && s.status === "RUNNING" && (s.endTime = (/* @__PURE__ */ new Date()).toISOString(), s.status = t, await this.db.write());
  }
  /**
   * Clears all sessions from the database.
   */
  async clearHistory() {
    this.db.data.sessions = [], await this.db.write();
  }
}
const H = new F(J), U = { sessions: [], profiles: [] }, r = await new G(H, U).init();
var w = {}, h = {};
Object.defineProperty(h, "__esModule", { value: !0 });
h.DelimiterParser = void 0;
const K = $;
class W extends K.Transform {
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
    let n = Buffer.concat([this.buffer, e]), c;
    for (; (c = n.indexOf(this.delimiter)) !== -1; )
      this.push(n.slice(0, c + (this.includeDelimiter ? this.delimiter.length : 0))), n = n.slice(c + this.delimiter.length);
    this.buffer = n, s();
  }
  _flush(e) {
    this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
  }
}
h.DelimiterParser = W;
Object.defineProperty(w, "__esModule", { value: !0 });
var v = w.ReadlineParser = void 0;
const Y = h;
class z extends Y.DelimiterParser {
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
v = w.ReadlineParser = z;
class V {
  constructor(e, t = 9600) {
    this.portPath = e, this.baudRate = t, this.port = null, this.parser = null, this.onStatusCallback = null, this.lastState = null, this.activeSessionId = null;
  }
  connect() {
    return new Promise((e, t) => {
      this.port = new N({ path: this.portPath, baudRate: this.baudRate }, (s) => {
        if (s)
          return t(s);
      }), this.port.on("error", (s) => {
        console.error("Serial Port Error:", s.message);
      }), this.parser = this.port.pipe(new v({ delimiter: `\r
` })), this.parser.on("data", (s) => {
        if (!(!s || s.trim() === ""))
          try {
            const n = JSON.parse(s);
            this.handleData(n);
          } catch {
            console.log("Raw Serial Data:", s);
          }
      }), this.port.on("open", () => {
        console.log(`Connected to kiln on ${this.portPath}`), setTimeout(e, 2e3);
      });
    });
  }
  async handleData(e) {
    if (e.status === "ok" || e.status === "error") {
      this.onStatusCallback ? this.onStatusCallback(e) : console.log("Received Command Response:", e);
      return;
    }
    this.onStatusCallback ? this.onStatusCallback(e) : console.log("Received:", e);
    const t = e.state;
    if (t && t !== this.lastState) {
      if (t === "STARTING") {
        const n = await r.createSession();
        this.activeSessionId = n.id, console.log(`[SESSION] Started new session: ${this.activeSessionId}`);
      }
      const s = t === "COMPLETED" || t === "ABORTED" || t === "EMERGENCY_STOP";
      if (this.activeSessionId && s) {
        const n = t;
        console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${n}`), await r.endSession(this.activeSessionId, n), this.activeSessionId = null;
      }
    }
    this.activeSessionId && e.state && await r.addSessionEvent(this.activeSessionId, e), this.lastState = t;
  }
  onStatus(e) {
    this.onStatusCallback = e;
  }
  sendCommand(e) {
    if (!this.port || !this.port.isOpen) {
      console.error("Port not open, cannot send command:", e);
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
      id: e.id,
      name: e.name,
      steps: e.steps.map((s) => ({
        type: s.type || s.mode || "IDLE",
        // RAMP, SOAK, COOL...
        targetTemperature: s.targetTemperature,
        duration: s.duration,
        // minutes
        rate: s.rate
        // degrees/hour
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
const Q = y(import.meta.url);
D(Q);
console.log("Initializing Kiln Controller Service...");
console.log(`Environment: ${d.isProduction ? "Production" : "Development"}`);
console.log(`Serving Client from: ${d.clientPath}`);
const l = new V(d.serialPort, d.baudRate), o = m();
let p = { state: "UNKNOWN", timestamp: 0 }, u = [], a = null;
o.use(_());
o.use(m.json());
o.use(m.static(d.clientPath));
o.get("/api/profiles", (i, e) => {
  e.json(r.db.data.profiles || []);
});
o.post("/api/profiles", async (i, e) => {
  const t = await r.addProfile(i.body);
  e.json(t);
});
o.put("/api/profiles/:id", async (i, e) => {
  const t = parseInt(i.params.id), s = await r.updateProfile(t, i.body);
  s ? e.json(s) : e.status(404).json({ error: "Profile not found" });
});
o.delete("/api/profiles/:id", async (i, e) => {
  const t = parseInt(i.params.id);
  await r.deleteProfile(t), e.json({ success: !0 });
});
o.get("/api/history", (i, e) => {
  e.json(r.db.data.sessions);
});
o.delete("/api/history", async (i, e) => {
  await r.clearHistory(), e.json({ success: !0, message: "History cleared" });
});
o.get("/api/history/:id", (i, e) => {
  const t = parseInt(i.params.id, 10), s = r.db.data.sessions.find((n) => n.id === t);
  s ? e.json(s) : e.status(404).json({ success: !1, message: "Session not found" });
});
o.get("/api/events", (i, e) => {
  e.setHeader("Content-Type", "text/event-stream"), e.setHeader("Cache-Control", "no-cache"), e.setHeader("Connection", "keep-alive"), e.flushHeaders();
  const t = JSON.stringify(p);
  e.write(`data: ${t}

`);
  const s = Date.now(), n = {
    id: s,
    res: e
  };
  u.push(n), i.on("close", () => {
    u = u.filter((c) => c.id !== s);
  });
});
o.get("/api/status", (i, e) => {
  e.json(p);
});
o.post("/api/start", async (i, e) => {
  const { profileId: t } = i.body;
  if (t) {
    const s = r.db.data.profiles?.find((n) => n.id === t);
    if (s)
      console.log(`Loading profile ${s.name} before starting...`), l.setProfile(s);
    else
      return e.status(404).json({ success: !1, message: "Profile not found" });
  }
  l.start();
  try {
    a = (await r.createSession()).id, console.log(`Started new session: ${a}`);
  } catch (s) {
    console.error("Failed to create history session:", s);
  }
  e.json({ success: !0, message: "Start command sent" });
});
o.post("/api/stop", async (i, e) => {
  l.stop(), a && (await r.endSession(a, "ABORTED"), console.log(`Ended session ${a}: ABORTED`), a = null), e.json({ success: !0, message: "Stop command sent" });
});
o.post("/api/profile", (i, e) => {
  const { targetTemperature: t, rampTime: s, soakDuration: n, coolTime: c } = i.body;
  if (t === void 0)
    return e.status(400).json({ success: !1, message: "targetTemperature is required" });
  l.setProfile(t, s, n, c), e.json({
    success: !0,
    message: "Profile update sent",
    params: { targetTemperature: t, rampTime: s, soakDuration: n, coolTime: c }
  });
});
o.post("/api/test", (i, e) => {
  const { temperature: t, duration: s, setPoint: n } = i.body;
  if (t === void 0)
    return e.status(400).json({ success: !1, message: "temperature is required" });
  l.testInput(t, s, n), e.json({
    success: !0,
    message: "Test mode initiated",
    params: { temperature: t, duration: s, setPoint: n }
  });
});
o.post("/api/test/temp", (i, e) => {
  const { temperature: t } = i.body;
  if (t === void 0)
    return e.status(400).json({ success: !1, message: "temperature is required" });
  l.testInput(t), e.json({
    success: !0,
    message: "Simulated temperature set",
    params: { temperature: t }
  });
});
l.onStatus(async (i) => {
  if (p = { ...i, timestamp: Date.now() }, u.forEach((e) => {
    e.res.write(`data: ${JSON.stringify(p)}

`);
  }), a && (i.state === "RAMP" || i.state === "SOAK" || i.state === "COOL"))
    try {
      await r.addSessionEvent(a, i);
    } catch (e) {
      console.error("Error saving session event:", e);
    }
  else if (a && (i.state === "COMPLETED" || i.state === "ABORTED" || i.state === "EMERGENCY_STOP"))
    try {
      await r.addSessionEvent(a, i), await r.endSession(a, i.state), console.log(`Session ${a} completed via status update: ${i.state}`), a = null;
    } catch (e) {
      console.error("Error closing session:", e);
    }
  i.state ? console.log("[STATUS]", JSON.stringify(i)) : i.message ? console.log(`[MSG] ${i.message}`) : console.log("[DATA]", i);
});
o.get("*", (i, e) => {
  e.sendFile(f.join(d.clientPath, "index.html"));
});
async function X() {
  try {
    await l.connect(), o.listen(d.serverPort, () => {
      console.log(`Web API running on http://localhost:${d.serverPort}`);
    }), console.log("Requesting initial status...");
    const i = () => {
      console.log(`
Service stopping. Turning off kiln...`), l.stop(), setTimeout(() => {
        l.port && l.port.isOpen && l.port.close(), process.exit(0);
      }, 500);
    };
    process.on("SIGINT", i), process.on("SIGTERM", i);
  } catch (i) {
    console.error("ERROR: Failed to connect to kiln."), console.error(`Attempted port: ${d.serialPort}`), console.error("Details:", i.message), console.log(`
Hint: Check if the Arduino is connected and the port is correct in config.js`), process.exit(1);
  }
}
X();
