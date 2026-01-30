import u, { dirname as I } from "path";
import { fileURLToPath as S } from "url";
import { Low as D } from "lowdb";
import "node:fs";
import { writeFile as j, rename as C, readFile as R } from "node:fs/promises";
import { join as b, dirname as y, basename as N } from "node:path";
import { fileURLToPath as P } from "node:url";
import { SerialPort as E } from "serialport";
import O from "stream";
import h from "express";
import $ from "cors";
const _ = S(import.meta.url), w = u.dirname(_), g = process.env.NODE_ENV === "production", c = {
  isProduction: g,
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
  clientPath: g ? u.join(w, "public") : u.join(w, "../client/dist")
  // Future: Google AppScript Configuration
  // cloudApiUrl: 'https://script.google.com/macros/s/...'
};
function x(i) {
  const t = i instanceof URL ? P(i) : i.toString();
  return b(y(t), `.${N(t)}.tmp`);
}
async function k(i, t, e) {
  for (let s = 0; s < t; s++)
    try {
      return await i();
    } catch (n) {
      if (s < t - 1)
        await new Promise((a) => setTimeout(a, e));
      else
        throw n;
    }
}
class F {
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
  async #l(t) {
    this.#s = !0;
    try {
      await j(this.#e, t, "utf-8"), await k(async () => {
        await C(this.#e, this.#t);
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
    this.#t = t, this.#e = x(t);
  }
  async write(t) {
    return this.#s ? this.#a(t) : this.#l(t);
  }
}
class q {
  #t;
  #e;
  constructor(t) {
    this.#t = t, this.#e = new F(t);
  }
  async read() {
    let t;
    try {
      t = await R(this.#t, "utf-8");
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
class A {
  #t;
  #e;
  #s;
  constructor(t, { parse: e, stringify: s }) {
    this.#t = new q(t), this.#e = e, this.#s = s;
  }
  async read() {
    const t = await this.#t.read();
    return t === null ? null : this.#e(t);
  }
  write(t) {
    return this.#t.write(this.#s(t));
  }
}
class H extends A {
  constructor(t) {
    super(t, {
      parse: JSON.parse,
      stringify: (e) => JSON.stringify(e, null, 2)
    });
  }
}
const M = y(P(import.meta.url)), U = b(M, "db.json");
class B {
  constructor(t, e) {
    this.db = new D(t, e);
  }
  async init() {
    return await this.db.read(), await this.db.write(), this;
  }
  /**
   * Creates a new session.
   * @returns {object} The new session object.
   */
  async createSession() {
    const t = {
      id: Date.now(),
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      endTime: null,
      status: "RUNNING",
      events: []
    };
    return this.db.data.sessions.unshift(t), await this.db.write(), t;
  }
  async addProfile(t) {
    this.db.data.profiles || (this.db.data.profiles = []);
    const e = { ...t, id: Date.now() };
    return this.db.data.profiles.push(e), await this.db.write(), e;
  }
  async updateProfile(t, e) {
    if (!this.db.data.profiles)
      return null;
    const s = this.db.data.profiles.findIndex((n) => n.id === t);
    return s === -1 ? null : (this.db.data.profiles[s] = { ...e, id: t }, await this.db.write(), this.db.data.profiles[s]);
  }
  async deleteProfile(t) {
    this.db.data.profiles && (this.db.data.profiles = this.db.data.profiles.filter((e) => e.id !== t), await this.db.write());
  }
  /**
   * Adds a status event to an active session.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(t, e) {
    const s = this.db.data.sessions.find((n) => n.id === t);
    if (s) {
      const n = new Date(s.startTime), v = Math.round((/* @__PURE__ */ new Date() - n) / 1e3);
      s.events.push({
        ...e,
        elapsedTime: v
      }), await this.db.write();
    }
  }
  /**
   * Finalizes a session, setting its end time and status.
   * @param {number} sessionId The ID of the session to finalize.
   * @param {string} finalStatus The final status of the session ('COMPLETED' or 'ABORTED').
   */
  async endSession(t, e) {
    const s = this.db.data.sessions.find((n) => n.id === t);
    s && s.status === "RUNNING" && (s.endTime = (/* @__PURE__ */ new Date()).toISOString(), s.status = e, await this.db.write());
  }
  /**
   * Clears all sessions from the database.
   */
  async clearHistory() {
    this.db.data.sessions = [], await this.db.write();
  }
}
const G = new H(U), J = { sessions: [], profiles: [] }, l = await new B(G, J).init();
var m = {}, p = {};
Object.defineProperty(p, "__esModule", { value: !0 });
p.DelimiterParser = void 0;
const L = O;
class K extends L.Transform {
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
    let n = Buffer.concat([this.buffer, t]), a;
    for (; (a = n.indexOf(this.delimiter)) !== -1; )
      this.push(n.slice(0, a + (this.includeDelimiter ? this.delimiter.length : 0))), n = n.slice(a + this.delimiter.length);
    this.buffer = n, s();
  }
  _flush(t) {
    this.push(this.buffer), this.buffer = Buffer.alloc(0), t();
  }
}
p.DelimiterParser = K;
Object.defineProperty(m, "__esModule", { value: !0 });
var T = m.ReadlineParser = void 0;
const W = p;
class z extends W.DelimiterParser {
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
T = m.ReadlineParser = z;
class V {
  constructor(t, e = 9600) {
    this.portPath = t, this.baudRate = e, this.port = null, this.parser = null, this.onStatusCallback = null, this.lastState = null, this.activeSessionId = null;
  }
  connect() {
    return new Promise((t, e) => {
      this.port = new E({ path: this.portPath, baudRate: this.baudRate }, (s) => {
        if (s)
          return e(s);
      }), this.port.on("error", (s) => {
        console.error("Serial Port Error:", s.message);
      }), this.parser = this.port.pipe(new T({ delimiter: `\r
` })), this.parser.on("data", (s) => {
        if (!(!s || s.trim() === ""))
          try {
            const n = JSON.parse(s);
            this.handleData(n);
          } catch {
            console.log("Raw Serial Data:", s);
          }
      }), this.port.on("open", () => {
        console.log(`Connected to kiln on ${this.portPath}`), setTimeout(t, 2e3);
      });
    });
  }
  async handleData(t) {
    if (t.status === "ok" || t.status === "error") {
      this.onStatusCallback ? this.onStatusCallback(t) : console.log("Received Command Response:", t);
      return;
    }
    this.onStatusCallback ? this.onStatusCallback(t) : console.log("Received:", t);
    const e = t.state;
    if (e && e !== this.lastState) {
      if (e === "STARTING") {
        const n = await l.createSession();
        this.activeSessionId = n.id, console.log(`[SESSION] Started new session: ${this.activeSessionId}`);
      }
      const s = e === "COMPLETED" || e === "ABORTED" || e === "EMERGENCY_STOP";
      if (this.activeSessionId && s) {
        const n = e;
        console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${n}`), await l.endSession(this.activeSessionId, n), this.activeSessionId = null;
      }
    }
    this.activeSessionId && t.state && await l.addSessionEvent(this.activeSessionId, t), this.lastState = e;
  }
  onStatus(t) {
    this.onStatusCallback = t;
  }
  sendCommand(t) {
    if (!this.port || !this.port.isOpen) {
      console.error("Port not open, cannot send command:", t);
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
    const e = {
      command: "profile",
      steps: t.steps.map((s) => ({
        type: s.mode,
        // RAMP, SOAK, COOL...
        targetTemperature: s.targetTemperature,
        duration: s.duration,
        // minutes
        rate: s.rate
        // degrees/hour
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
const Y = S(import.meta.url);
I(Y);
console.log("Initializing Kiln Controller Service...");
console.log(`Environment: ${c.isProduction ? "Production" : "Development"}`);
console.log(`Serving Client from: ${c.clientPath}`);
const r = new V(c.serialPort, c.baudRate), o = h();
let f = { state: "UNKNOWN", timestamp: 0 }, d = [];
o.use($());
o.use(h.json());
o.use(h.static(c.clientPath));
o.get("/api/profiles", (i, t) => {
  t.json(l.db.data.profiles || []);
});
o.post("/api/profiles", async (i, t) => {
  const e = await l.addProfile(i.body);
  t.json(e);
});
o.put("/api/profiles/:id", async (i, t) => {
  const e = parseInt(i.params.id), s = await l.updateProfile(e, i.body);
  s ? t.json(s) : t.status(404).json({ error: "Profile not found" });
});
o.delete("/api/profiles/:id", async (i, t) => {
  const e = parseInt(i.params.id);
  await l.deleteProfile(e), t.json({ success: !0 });
});
o.get("/api/history", (i, t) => {
  t.json(l.db.data.sessions);
});
o.delete("/api/history", async (i, t) => {
  await l.clearHistory(), t.json({ success: !0, message: "History cleared" });
});
o.get("/api/history/:id", (i, t) => {
  const e = parseInt(i.params.id, 10), s = l.db.data.sessions.find((n) => n.id === e);
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
  d.push(n), i.on("close", () => {
    d = d.filter((a) => a.id !== s);
  });
});
o.get("/api/status", (i, t) => {
  t.json(f);
});
o.post("/api/start", async (i, t) => {
  const { profileId: e } = i.body;
  if (e) {
    const s = l.db.data.profiles?.find((n) => n.id === e);
    if (s)
      console.log(`Loading profile ${s.name} before starting...`), r.setProfile(s);
    else
      return t.status(404).json({ success: !1, message: "Profile not found" });
  }
  r.start(), t.json({ success: !0, message: "Start command sent" });
});
o.post("/api/stop", (i, t) => {
  r.stop(), t.json({ success: !0, message: "Stop command sent" });
});
o.post("/api/profile", (i, t) => {
  const { targetTemperature: e, rampTime: s, soakDuration: n, coolTime: a } = i.body;
  if (e === void 0)
    return t.status(400).json({ success: !1, message: "targetTemperature is required" });
  r.setProfile(e, s, n, a), t.json({
    success: !0,
    message: "Profile update sent",
    params: { targetTemperature: e, rampTime: s, soakDuration: n, coolTime: a }
  });
});
o.post("/api/test", (i, t) => {
  const { temperature: e, duration: s, setPoint: n } = i.body;
  if (e === void 0)
    return t.status(400).json({ success: !1, message: "temperature is required" });
  r.testInput(e, s, n), t.json({
    success: !0,
    message: "Test mode initiated",
    params: { temperature: e, duration: s, setPoint: n }
  });
});
o.post("/api/test/temp", (i, t) => {
  const { temperature: e } = i.body;
  if (e === void 0)
    return t.status(400).json({ success: !1, message: "temperature is required" });
  r.testInput(e), t.json({
    success: !0,
    message: "Simulated temperature set",
    params: { temperature: e }
  });
});
r.onStatus((i) => {
  f = { ...i, timestamp: Date.now() }, d.forEach((t) => {
    t.res.write(`data: ${JSON.stringify(f)}

`);
  }), i.state ? console.log(`[STATUS] State: ${i.state} | Temp: ${i.input?.toFixed(1)}°C | Setpoint: ${i.setpoint?.toFixed(1)}°C`) : i.message ? console.log(`[MSG] ${i.message}`) : console.log("[DATA]", i);
});
o.get("*", (i, t) => {
  t.sendFile(u.join(c.clientPath, "index.html"));
});
async function Q() {
  try {
    await r.connect(), o.listen(c.serverPort, () => {
      console.log(`Web API running on http://localhost:${c.serverPort}`);
    }), console.log("Requesting initial status...");
    const i = () => {
      console.log(`
Service stopping. Turning off kiln...`), r.stop(), setTimeout(() => {
        r.port && r.port.isOpen && r.port.close(), process.exit(0);
      }, 500);
    };
    process.on("SIGINT", i), process.on("SIGTERM", i);
  } catch (i) {
    console.error("ERROR: Failed to connect to kiln."), console.error(`Attempted port: ${c.serialPort}`), console.error("Details:", i.message), console.log(`
Hint: Check if the Arduino is connected and the port is correct in config.js`), process.exit(1);
  }
}
Q();
