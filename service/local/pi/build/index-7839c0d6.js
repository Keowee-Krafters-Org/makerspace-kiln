import Kr from "express";
import Ke from "path";
import { fileURLToPath as Wo } from "url";
import ft from "node:http";
import Fa from "node:https";
import Ye from "node:zlib";
import ne, { PassThrough as Qt, pipeline as Ge } from "node:stream";
import { Buffer as z } from "node:buffer";
import { types as Yt, promisify as za, deprecate as Xt } from "node:util";
import { format as $a, fileURLToPath as qo } from "node:url";
import { isIP as La } from "node:net";
import "node:fs";
import { join as Zr, dirname as Io, basename as ja } from "node:path";
import Ma from "fs";
import { SerialPort as Na } from "serialport";
import Ua from "stream";
import { Low as _o } from "lowdb";
import { writeFile as xa, rename as Ha, readFile as Va } from "node:fs/promises";
import { EventEmitter as Qa } from "events";
function Ya(a) {
  if (!/^data:/i.test(a))
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  a = a.replace(/\r?\n/g, "");
  const n = a.indexOf(",");
  if (n === -1 || n <= 4)
    throw new TypeError("malformed data: URI");
  const o = a.substring(5, n).split(";");
  let s = "", l = !1;
  const h = o[0] || "text/plain";
  let d = h;
  for (let v = 1; v < o.length; v++)
    o[v] === "base64" ? l = !0 : o[v] && (d += `;${o[v]}`, o[v].indexOf("charset=") === 0 && (s = o[v].substring(8)));
  !o[0] && !s.length && (d += ";charset=US-ASCII", s = "US-ASCII");
  const T = l ? "base64" : "ascii", B = unescape(a.substring(n + 1)), _ = Buffer.from(B, T);
  return _.type = h, _.typeFull = d, _.charset = s, _;
}
var Ur = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, xt = { exports: {} };
/**
 * @license
 * web-streams-polyfill v3.3.3
 * Copyright 2024 Mattias Buelens, Diwank Singh Tomer and other contributors.
 * This code is released under the MIT license.
 * SPDX-License-Identifier: MIT
 */
var wo;
function Ga() {
  return wo || (wo = 1, function(a, n) {
    (function(o, s) {
      s(n);
    })(Ur, function(o) {
      function s() {
      }
      function l(e) {
        return typeof e == "object" && e !== null || typeof e == "function";
      }
      const h = s;
      function d(e, t) {
        try {
          Object.defineProperty(e, "name", {
            value: t,
            configurable: !0
          });
        } catch {
        }
      }
      const T = Promise, B = Promise.prototype.then, _ = Promise.reject.bind(T);
      function v(e) {
        return new T(e);
      }
      function w(e) {
        return v((t) => t(e));
      }
      function m(e) {
        return _(e);
      }
      function k(e, t, r) {
        return B.call(e, t, r);
      }
      function y(e, t, r) {
        k(k(e, t, r), void 0, h);
      }
      function U(e, t) {
        y(e, t);
      }
      function q(e, t) {
        y(e, void 0, t);
      }
      function I(e, t, r) {
        return k(e, t, r);
      }
      function x(e) {
        k(e, void 0, h);
      }
      let ie = (e) => {
        if (typeof queueMicrotask == "function")
          ie = queueMicrotask;
        else {
          const t = w(void 0);
          ie = (r) => k(t, r);
        }
        return ie(e);
      };
      function W(e, t, r) {
        if (typeof e != "function")
          throw new TypeError("Argument is not a function");
        return Function.prototype.apply.call(e, t, r);
      }
      function O(e, t, r) {
        try {
          return w(W(e, t, r));
        } catch (i) {
          return m(i);
        }
      }
      const $ = 16384;
      class L {
        constructor() {
          this._cursor = 0, this._size = 0, this._front = {
            _elements: [],
            _next: void 0
          }, this._back = this._front, this._cursor = 0, this._size = 0;
        }
        get length() {
          return this._size;
        }
        // For exception safety, this method is structured in order:
        // 1. Read state
        // 2. Calculate required state mutations
        // 3. Perform state mutations
        push(t) {
          const r = this._back;
          let i = r;
          r._elements.length === $ - 1 && (i = {
            _elements: [],
            _next: void 0
          }), r._elements.push(t), i !== r && (this._back = i, r._next = i), ++this._size;
        }
        // Like push(), shift() follows the read -> calculate -> mutate pattern for
        // exception safety.
        shift() {
          const t = this._front;
          let r = t;
          const i = this._cursor;
          let u = i + 1;
          const f = t._elements, c = f[i];
          return u === $ && (r = t._next, u = 0), --this._size, this._cursor = u, t !== r && (this._front = r), f[i] = void 0, c;
        }
        // The tricky thing about forEach() is that it can be called
        // re-entrantly. The queue may be mutated inside the callback. It is easy to
        // see that push() within the callback has no negative effects since the end
        // of the queue is checked for on every iteration. If shift() is called
        // repeatedly within the callback then the next iteration may return an
        // element that has been removed. In this case the callback will be called
        // with undefined values until we either "catch up" with elements that still
        // exist or reach the back of the queue.
        forEach(t) {
          let r = this._cursor, i = this._front, u = i._elements;
          for (; (r !== u.length || i._next !== void 0) && !(r === u.length && (i = i._next, u = i._elements, r = 0, u.length === 0)); )
            t(u[r]), ++r;
        }
        // Return the element that would be returned if shift() was called now,
        // without modifying the queue.
        peek() {
          const t = this._front, r = this._cursor;
          return t._elements[r];
        }
      }
      const ht = Symbol("[[AbortSteps]]"), tn = Symbol("[[ErrorSteps]]"), rr = Symbol("[[CancelSteps]]"), nr = Symbol("[[PullSteps]]"), or = Symbol("[[ReleaseSteps]]");
      function rn(e, t) {
        e._ownerReadableStream = t, t._reader = e, t._state === "readable" ? ar(e) : t._state === "closed" ? Vo(e) : nn(e, t._storedError);
      }
      function ir(e, t) {
        const r = e._ownerReadableStream;
        return K(r, t);
      }
      function ae(e) {
        const t = e._ownerReadableStream;
        t._state === "readable" ? sr(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : Qo(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), t._readableStreamController[or](), t._reader = void 0, e._ownerReadableStream = void 0;
      }
      function mt(e) {
        return new TypeError("Cannot " + e + " a stream using a released reader");
      }
      function ar(e) {
        e._closedPromise = v((t, r) => {
          e._closedPromise_resolve = t, e._closedPromise_reject = r;
        });
      }
      function nn(e, t) {
        ar(e), sr(e, t);
      }
      function Vo(e) {
        ar(e), on(e);
      }
      function sr(e, t) {
        e._closedPromise_reject !== void 0 && (x(e._closedPromise), e._closedPromise_reject(t), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0);
      }
      function Qo(e, t) {
        nn(e, t);
      }
      function on(e) {
        e._closedPromise_resolve !== void 0 && (e._closedPromise_resolve(void 0), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0);
      }
      const an = Number.isFinite || function(e) {
        return typeof e == "number" && isFinite(e);
      }, Yo = Math.trunc || function(e) {
        return e < 0 ? Math.ceil(e) : Math.floor(e);
      };
      function Go(e) {
        return typeof e == "object" || typeof e == "function";
      }
      function te(e, t) {
        if (e !== void 0 && !Go(e))
          throw new TypeError(`${t} is not an object.`);
      }
      function Q(e, t) {
        if (typeof e != "function")
          throw new TypeError(`${t} is not a function.`);
      }
      function Jo(e) {
        return typeof e == "object" && e !== null || typeof e == "function";
      }
      function sn(e, t) {
        if (!Jo(e))
          throw new TypeError(`${t} is not an object.`);
      }
      function se(e, t, r) {
        if (e === void 0)
          throw new TypeError(`Parameter ${t} is required in '${r}'.`);
      }
      function lr(e, t, r) {
        if (e === void 0)
          throw new TypeError(`${t} is required in '${r}'.`);
      }
      function ur(e) {
        return Number(e);
      }
      function ln(e) {
        return e === 0 ? 0 : e;
      }
      function Ko(e) {
        return ln(Yo(e));
      }
      function fr(e, t) {
        const i = Number.MAX_SAFE_INTEGER;
        let u = Number(e);
        if (u = ln(u), !an(u))
          throw new TypeError(`${t} is not a finite number`);
        if (u = Ko(u), u < 0 || u > i)
          throw new TypeError(`${t} is outside the accepted range of 0 to ${i}, inclusive`);
        return !an(u) || u === 0 ? 0 : u;
      }
      function cr(e, t) {
        if (!Re(e))
          throw new TypeError(`${t} is not a ReadableStream.`);
      }
      function Fe(e) {
        return new be(e);
      }
      function un(e, t) {
        e._reader._readRequests.push(t);
      }
      function dr(e, t, r) {
        const u = e._reader._readRequests.shift();
        r ? u._closeSteps() : u._chunkSteps(t);
      }
      function pt(e) {
        return e._reader._readRequests.length;
      }
      function fn(e) {
        const t = e._reader;
        return !(t === void 0 || !ye(t));
      }
      class be {
        constructor(t) {
          if (se(t, 1, "ReadableStreamDefaultReader"), cr(t, "First parameter"), Ce(t))
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          rn(this, t), this._readRequests = new L();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed,
         * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          return ye(this) ? this._closedPromise : m(bt("closed"));
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(t = void 0) {
          return ye(this) ? this._ownerReadableStream === void 0 ? m(mt("cancel")) : ir(this, t) : m(bt("cancel"));
        }
        /**
         * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read() {
          if (!ye(this))
            return m(bt("read"));
          if (this._ownerReadableStream === void 0)
            return m(mt("read from"));
          let t, r;
          const i = v((f, c) => {
            t = f, r = c;
          });
          return Ze(this, {
            _chunkSteps: (f) => t({ value: f, done: !1 }),
            _closeSteps: () => t({ value: void 0, done: !0 }),
            _errorSteps: (f) => r(f)
          }), i;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!ye(this))
            throw bt("releaseLock");
          this._ownerReadableStream !== void 0 && Zo(this);
        }
      }
      Object.defineProperties(be.prototype, {
        cancel: { enumerable: !0 },
        read: { enumerable: !0 },
        releaseLock: { enumerable: !0 },
        closed: { enumerable: !0 }
      }), d(be.prototype.cancel, "cancel"), d(be.prototype.read, "read"), d(be.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(be.prototype, Symbol.toStringTag, {
        value: "ReadableStreamDefaultReader",
        configurable: !0
      });
      function ye(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_readRequests") ? !1 : e instanceof be;
      }
      function Ze(e, t) {
        const r = e._ownerReadableStream;
        r._disturbed = !0, r._state === "closed" ? t._closeSteps() : r._state === "errored" ? t._errorSteps(r._storedError) : r._readableStreamController[nr](t);
      }
      function Zo(e) {
        ae(e);
        const t = new TypeError("Reader was released");
        cn(e, t);
      }
      function cn(e, t) {
        const r = e._readRequests;
        e._readRequests = new L(), r.forEach((i) => {
          i._errorSteps(t);
        });
      }
      function bt(e) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${e} can only be used on a ReadableStreamDefaultReader`);
      }
      const Xo = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype);
      class dn {
        constructor(t, r) {
          this._ongoingPromise = void 0, this._isFinished = !1, this._reader = t, this._preventCancel = r;
        }
        next() {
          const t = () => this._nextSteps();
          return this._ongoingPromise = this._ongoingPromise ? I(this._ongoingPromise, t, t) : t(), this._ongoingPromise;
        }
        return(t) {
          const r = () => this._returnSteps(t);
          return this._ongoingPromise ? I(this._ongoingPromise, r, r) : r();
        }
        _nextSteps() {
          if (this._isFinished)
            return Promise.resolve({ value: void 0, done: !0 });
          const t = this._reader;
          let r, i;
          const u = v((c, p) => {
            r = c, i = p;
          });
          return Ze(t, {
            _chunkSteps: (c) => {
              this._ongoingPromise = void 0, ie(() => r({ value: c, done: !1 }));
            },
            _closeSteps: () => {
              this._ongoingPromise = void 0, this._isFinished = !0, ae(t), r({ value: void 0, done: !0 });
            },
            _errorSteps: (c) => {
              this._ongoingPromise = void 0, this._isFinished = !0, ae(t), i(c);
            }
          }), u;
        }
        _returnSteps(t) {
          if (this._isFinished)
            return Promise.resolve({ value: t, done: !0 });
          this._isFinished = !0;
          const r = this._reader;
          if (!this._preventCancel) {
            const i = ir(r, t);
            return ae(r), I(i, () => ({ value: t, done: !0 }));
          }
          return ae(r), w({ value: t, done: !0 });
        }
      }
      const hn = {
        next() {
          return mn(this) ? this._asyncIteratorImpl.next() : m(pn("next"));
        },
        return(e) {
          return mn(this) ? this._asyncIteratorImpl.return(e) : m(pn("return"));
        }
      };
      Object.setPrototypeOf(hn, Xo);
      function ei(e, t) {
        const r = Fe(e), i = new dn(r, t), u = Object.create(hn);
        return u._asyncIteratorImpl = i, u;
      }
      function mn(e) {
        if (!l(e) || !Object.prototype.hasOwnProperty.call(e, "_asyncIteratorImpl"))
          return !1;
        try {
          return e._asyncIteratorImpl instanceof dn;
        } catch {
          return !1;
        }
      }
      function pn(e) {
        return new TypeError(`ReadableStreamAsyncIterator.${e} can only be used on a ReadableSteamAsyncIterator`);
      }
      const bn = Number.isNaN || function(e) {
        return e !== e;
      };
      var hr, mr, pr;
      function Xe(e) {
        return e.slice();
      }
      function yn(e, t, r, i, u) {
        new Uint8Array(e).set(new Uint8Array(r, i, u), t);
      }
      let le = (e) => (typeof e.transfer == "function" ? le = (t) => t.transfer() : typeof structuredClone == "function" ? le = (t) => structuredClone(t, { transfer: [t] }) : le = (t) => t, le(e)), ge = (e) => (typeof e.detached == "boolean" ? ge = (t) => t.detached : ge = (t) => t.byteLength === 0, ge(e));
      function gn(e, t, r) {
        if (e.slice)
          return e.slice(t, r);
        const i = r - t, u = new ArrayBuffer(i);
        return yn(u, 0, e, t, i), u;
      }
      function yt(e, t) {
        const r = e[t];
        if (r != null) {
          if (typeof r != "function")
            throw new TypeError(`${String(t)} is not a function`);
          return r;
        }
      }
      function ti(e) {
        const t = {
          [Symbol.iterator]: () => e.iterator
        }, r = async function* () {
          return yield* t;
        }(), i = r.next;
        return { iterator: r, nextMethod: i, done: !1 };
      }
      const br = (pr = (hr = Symbol.asyncIterator) !== null && hr !== void 0 ? hr : (mr = Symbol.for) === null || mr === void 0 ? void 0 : mr.call(Symbol, "Symbol.asyncIterator")) !== null && pr !== void 0 ? pr : "@@asyncIterator";
      function Sn(e, t = "sync", r) {
        if (r === void 0)
          if (t === "async") {
            if (r = yt(e, br), r === void 0) {
              const f = yt(e, Symbol.iterator), c = Sn(e, "sync", f);
              return ti(c);
            }
          } else
            r = yt(e, Symbol.iterator);
        if (r === void 0)
          throw new TypeError("The object is not iterable");
        const i = W(r, e, []);
        if (!l(i))
          throw new TypeError("The iterator method must return an object");
        const u = i.next;
        return { iterator: i, nextMethod: u, done: !1 };
      }
      function ri(e) {
        const t = W(e.nextMethod, e.iterator, []);
        if (!l(t))
          throw new TypeError("The iterator.next() method must return an object");
        return t;
      }
      function ni(e) {
        return !!e.done;
      }
      function oi(e) {
        return e.value;
      }
      function ii(e) {
        return !(typeof e != "number" || bn(e) || e < 0);
      }
      function _n(e) {
        const t = gn(e.buffer, e.byteOffset, e.byteOffset + e.byteLength);
        return new Uint8Array(t);
      }
      function yr(e) {
        const t = e._queue.shift();
        return e._queueTotalSize -= t.size, e._queueTotalSize < 0 && (e._queueTotalSize = 0), t.value;
      }
      function gr(e, t, r) {
        if (!ii(r) || r === 1 / 0)
          throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        e._queue.push({ value: t, size: r }), e._queueTotalSize += r;
      }
      function ai(e) {
        return e._queue.peek().value;
      }
      function Se(e) {
        e._queue = new L(), e._queueTotalSize = 0;
      }
      function wn(e) {
        return e === DataView;
      }
      function si(e) {
        return wn(e.constructor);
      }
      function li(e) {
        return wn(e) ? 1 : e.BYTES_PER_ELEMENT;
      }
      class ve {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
         */
        get view() {
          if (!Sr(this))
            throw Tr("view");
          return this._view;
        }
        respond(t) {
          if (!Sr(this))
            throw Tr("respond");
          if (se(t, 1, "respond"), t = fr(t, "First parameter"), this._associatedReadableByteStreamController === void 0)
            throw new TypeError("This BYOB request has been invalidated");
          if (ge(this._view.buffer))
            throw new TypeError("The BYOB request's buffer has been detached and so cannot be used as a response");
          wt(this._associatedReadableByteStreamController, t);
        }
        respondWithNewView(t) {
          if (!Sr(this))
            throw Tr("respondWithNewView");
          if (se(t, 1, "respondWithNewView"), !ArrayBuffer.isView(t))
            throw new TypeError("You can only respond with array buffer views");
          if (this._associatedReadableByteStreamController === void 0)
            throw new TypeError("This BYOB request has been invalidated");
          if (ge(t.buffer))
            throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
          Rt(this._associatedReadableByteStreamController, t);
        }
      }
      Object.defineProperties(ve.prototype, {
        respond: { enumerable: !0 },
        respondWithNewView: { enumerable: !0 },
        view: { enumerable: !0 }
      }), d(ve.prototype.respond, "respond"), d(ve.prototype.respondWithNewView, "respondWithNewView"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ve.prototype, Symbol.toStringTag, {
        value: "ReadableStreamBYOBRequest",
        configurable: !0
      });
      class ue {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the current BYOB pull request, or `null` if there isn't one.
         */
        get byobRequest() {
          if (!Ee(this))
            throw tt("byobRequest");
          return Cr(this);
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!Ee(this))
            throw tt("desiredSize");
          return Wn(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!Ee(this))
            throw tt("close");
          if (this._closeRequested)
            throw new TypeError("The stream has already been closed; do not close it again!");
          const t = this._controlledReadableByteStream._state;
          if (t !== "readable")
            throw new TypeError(`The stream (in ${t} state) is not in the readable state and cannot be closed`);
          et(this);
        }
        enqueue(t) {
          if (!Ee(this))
            throw tt("enqueue");
          if (se(t, 1, "enqueue"), !ArrayBuffer.isView(t))
            throw new TypeError("chunk must be an array buffer view");
          if (t.byteLength === 0)
            throw new TypeError("chunk must have non-zero byteLength");
          if (t.buffer.byteLength === 0)
            throw new TypeError("chunk's buffer must have non-zero byteLength");
          if (this._closeRequested)
            throw new TypeError("stream is closed or draining");
          const r = this._controlledReadableByteStream._state;
          if (r !== "readable")
            throw new TypeError(`The stream (in ${r} state) is not in the readable state and cannot be enqueued to`);
          _t(this, t);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(t = void 0) {
          if (!Ee(this))
            throw tt("error");
          Y(this, t);
        }
        /** @internal */
        [rr](t) {
          Rn(this), Se(this);
          const r = this._cancelAlgorithm(t);
          return St(this), r;
        }
        /** @internal */
        [nr](t) {
          const r = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            kn(this, t);
            return;
          }
          const i = this._autoAllocateChunkSize;
          if (i !== void 0) {
            let u;
            try {
              u = new ArrayBuffer(i);
            } catch (c) {
              t._errorSteps(c);
              return;
            }
            const f = {
              buffer: u,
              bufferByteLength: i,
              byteOffset: 0,
              byteLength: i,
              bytesFilled: 0,
              minimumFill: 1,
              elementSize: 1,
              viewConstructor: Uint8Array,
              readerType: "default"
            };
            this._pendingPullIntos.push(f);
          }
          un(r, t), Ae(this);
        }
        /** @internal */
        [or]() {
          if (this._pendingPullIntos.length > 0) {
            const t = this._pendingPullIntos.peek();
            t.readerType = "none", this._pendingPullIntos = new L(), this._pendingPullIntos.push(t);
          }
        }
      }
      Object.defineProperties(ue.prototype, {
        close: { enumerable: !0 },
        enqueue: { enumerable: !0 },
        error: { enumerable: !0 },
        byobRequest: { enumerable: !0 },
        desiredSize: { enumerable: !0 }
      }), d(ue.prototype.close, "close"), d(ue.prototype.enqueue, "enqueue"), d(ue.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ue.prototype, Symbol.toStringTag, {
        value: "ReadableByteStreamController",
        configurable: !0
      });
      function Ee(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledReadableByteStream") ? !1 : e instanceof ue;
      }
      function Sr(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_associatedReadableByteStreamController") ? !1 : e instanceof ve;
      }
      function Ae(e) {
        if (!hi(e))
          return;
        if (e._pulling) {
          e._pullAgain = !0;
          return;
        }
        e._pulling = !0;
        const r = e._pullAlgorithm();
        y(r, () => (e._pulling = !1, e._pullAgain && (e._pullAgain = !1, Ae(e)), null), (i) => (Y(e, i), null));
      }
      function Rn(e) {
        wr(e), e._pendingPullIntos = new L();
      }
      function _r(e, t) {
        let r = !1;
        e._state === "closed" && (r = !0);
        const i = Cn(t);
        t.readerType === "default" ? dr(e, i, r) : Si(e, i, r);
      }
      function Cn(e) {
        const t = e.bytesFilled, r = e.elementSize;
        return new e.viewConstructor(e.buffer, e.byteOffset, t / r);
      }
      function gt(e, t, r, i) {
        e._queue.push({ buffer: t, byteOffset: r, byteLength: i }), e._queueTotalSize += i;
      }
      function Tn(e, t, r, i) {
        let u;
        try {
          u = gn(t, r, r + i);
        } catch (f) {
          throw Y(e, f), f;
        }
        gt(e, u, 0, i);
      }
      function Pn(e, t) {
        t.bytesFilled > 0 && Tn(e, t.buffer, t.byteOffset, t.bytesFilled), ze(e);
      }
      function vn(e, t) {
        const r = Math.min(e._queueTotalSize, t.byteLength - t.bytesFilled), i = t.bytesFilled + r;
        let u = r, f = !1;
        const c = i % t.elementSize, p = i - c;
        p >= t.minimumFill && (u = p - t.bytesFilled, f = !0);
        const S = e._queue;
        for (; u > 0; ) {
          const b = S.peek(), R = Math.min(u, b.byteLength), C = t.byteOffset + t.bytesFilled;
          yn(t.buffer, C, b.buffer, b.byteOffset, R), b.byteLength === R ? S.shift() : (b.byteOffset += R, b.byteLength -= R), e._queueTotalSize -= R, En(e, R, t), u -= R;
        }
        return f;
      }
      function En(e, t, r) {
        r.bytesFilled += t;
      }
      function An(e) {
        e._queueTotalSize === 0 && e._closeRequested ? (St(e), st(e._controlledReadableByteStream)) : Ae(e);
      }
      function wr(e) {
        e._byobRequest !== null && (e._byobRequest._associatedReadableByteStreamController = void 0, e._byobRequest._view = null, e._byobRequest = null);
      }
      function Rr(e) {
        for (; e._pendingPullIntos.length > 0; ) {
          if (e._queueTotalSize === 0)
            return;
          const t = e._pendingPullIntos.peek();
          vn(e, t) && (ze(e), _r(e._controlledReadableByteStream, t));
        }
      }
      function ui(e) {
        const t = e._controlledReadableByteStream._reader;
        for (; t._readRequests.length > 0; ) {
          if (e._queueTotalSize === 0)
            return;
          const r = t._readRequests.shift();
          kn(e, r);
        }
      }
      function fi(e, t, r, i) {
        const u = e._controlledReadableByteStream, f = t.constructor, c = li(f), { byteOffset: p, byteLength: S } = t, b = r * c;
        let R;
        try {
          R = le(t.buffer);
        } catch (E) {
          i._errorSteps(E);
          return;
        }
        const C = {
          buffer: R,
          bufferByteLength: R.byteLength,
          byteOffset: p,
          byteLength: S,
          bytesFilled: 0,
          minimumFill: b,
          elementSize: c,
          viewConstructor: f,
          readerType: "byob"
        };
        if (e._pendingPullIntos.length > 0) {
          e._pendingPullIntos.push(C), On(u, i);
          return;
        }
        if (u._state === "closed") {
          const E = new f(C.buffer, C.byteOffset, 0);
          i._closeSteps(E);
          return;
        }
        if (e._queueTotalSize > 0) {
          if (vn(e, C)) {
            const E = Cn(C);
            An(e), i._chunkSteps(E);
            return;
          }
          if (e._closeRequested) {
            const E = new TypeError("Insufficient bytes to fill elements in the given buffer");
            Y(e, E), i._errorSteps(E);
            return;
          }
        }
        e._pendingPullIntos.push(C), On(u, i), Ae(e);
      }
      function ci(e, t) {
        t.readerType === "none" && ze(e);
        const r = e._controlledReadableByteStream;
        if (Pr(r))
          for (; Dn(r) > 0; ) {
            const i = ze(e);
            _r(r, i);
          }
      }
      function di(e, t, r) {
        if (En(e, t, r), r.readerType === "none") {
          Pn(e, r), Rr(e);
          return;
        }
        if (r.bytesFilled < r.minimumFill)
          return;
        ze(e);
        const i = r.bytesFilled % r.elementSize;
        if (i > 0) {
          const u = r.byteOffset + r.bytesFilled;
          Tn(e, r.buffer, u - i, i);
        }
        r.bytesFilled -= i, _r(e._controlledReadableByteStream, r), Rr(e);
      }
      function Bn(e, t) {
        const r = e._pendingPullIntos.peek();
        wr(e), e._controlledReadableByteStream._state === "closed" ? ci(e, r) : di(e, t, r), Ae(e);
      }
      function ze(e) {
        return e._pendingPullIntos.shift();
      }
      function hi(e) {
        const t = e._controlledReadableByteStream;
        return t._state !== "readable" || e._closeRequested || !e._started ? !1 : !!(fn(t) && pt(t) > 0 || Pr(t) && Dn(t) > 0 || Wn(e) > 0);
      }
      function St(e) {
        e._pullAlgorithm = void 0, e._cancelAlgorithm = void 0;
      }
      function et(e) {
        const t = e._controlledReadableByteStream;
        if (!(e._closeRequested || t._state !== "readable")) {
          if (e._queueTotalSize > 0) {
            e._closeRequested = !0;
            return;
          }
          if (e._pendingPullIntos.length > 0) {
            const r = e._pendingPullIntos.peek();
            if (r.bytesFilled % r.elementSize !== 0) {
              const i = new TypeError("Insufficient bytes to fill elements in the given buffer");
              throw Y(e, i), i;
            }
          }
          St(e), st(t);
        }
      }
      function _t(e, t) {
        const r = e._controlledReadableByteStream;
        if (e._closeRequested || r._state !== "readable")
          return;
        const { buffer: i, byteOffset: u, byteLength: f } = t;
        if (ge(i))
          throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
        const c = le(i);
        if (e._pendingPullIntos.length > 0) {
          const p = e._pendingPullIntos.peek();
          if (ge(p.buffer))
            throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
          wr(e), p.buffer = le(p.buffer), p.readerType === "none" && Pn(e, p);
        }
        if (fn(r))
          if (ui(e), pt(r) === 0)
            gt(e, c, u, f);
          else {
            e._pendingPullIntos.length > 0 && ze(e);
            const p = new Uint8Array(c, u, f);
            dr(r, p, !1);
          }
        else
          Pr(r) ? (gt(e, c, u, f), Rr(e)) : gt(e, c, u, f);
        Ae(e);
      }
      function Y(e, t) {
        const r = e._controlledReadableByteStream;
        r._state === "readable" && (Rn(e), Se(e), St(e), io(r, t));
      }
      function kn(e, t) {
        const r = e._queue.shift();
        e._queueTotalSize -= r.byteLength, An(e);
        const i = new Uint8Array(r.buffer, r.byteOffset, r.byteLength);
        t._chunkSteps(i);
      }
      function Cr(e) {
        if (e._byobRequest === null && e._pendingPullIntos.length > 0) {
          const t = e._pendingPullIntos.peek(), r = new Uint8Array(t.buffer, t.byteOffset + t.bytesFilled, t.byteLength - t.bytesFilled), i = Object.create(ve.prototype);
          pi(i, e, r), e._byobRequest = i;
        }
        return e._byobRequest;
      }
      function Wn(e) {
        const t = e._controlledReadableByteStream._state;
        return t === "errored" ? null : t === "closed" ? 0 : e._strategyHWM - e._queueTotalSize;
      }
      function wt(e, t) {
        const r = e._pendingPullIntos.peek();
        if (e._controlledReadableByteStream._state === "closed") {
          if (t !== 0)
            throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
        } else {
          if (t === 0)
            throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          if (r.bytesFilled + t > r.byteLength)
            throw new RangeError("bytesWritten out of range");
        }
        r.buffer = le(r.buffer), Bn(e, t);
      }
      function Rt(e, t) {
        const r = e._pendingPullIntos.peek();
        if (e._controlledReadableByteStream._state === "closed") {
          if (t.byteLength !== 0)
            throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
        } else if (t.byteLength === 0)
          throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
        if (r.byteOffset + r.bytesFilled !== t.byteOffset)
          throw new RangeError("The region specified by view does not match byobRequest");
        if (r.bufferByteLength !== t.buffer.byteLength)
          throw new RangeError("The buffer of view has different capacity than byobRequest");
        if (r.bytesFilled + t.byteLength > r.byteLength)
          throw new RangeError("The region specified by view is larger than byobRequest");
        const u = t.byteLength;
        r.buffer = le(t.buffer), Bn(e, u);
      }
      function qn(e, t, r, i, u, f, c) {
        t._controlledReadableByteStream = e, t._pullAgain = !1, t._pulling = !1, t._byobRequest = null, t._queue = t._queueTotalSize = void 0, Se(t), t._closeRequested = !1, t._started = !1, t._strategyHWM = f, t._pullAlgorithm = i, t._cancelAlgorithm = u, t._autoAllocateChunkSize = c, t._pendingPullIntos = new L(), e._readableStreamController = t;
        const p = r();
        y(w(p), () => (t._started = !0, Ae(t), null), (S) => (Y(t, S), null));
      }
      function mi(e, t, r) {
        const i = Object.create(ue.prototype);
        let u, f, c;
        t.start !== void 0 ? u = () => t.start(i) : u = () => {
        }, t.pull !== void 0 ? f = () => t.pull(i) : f = () => w(void 0), t.cancel !== void 0 ? c = (S) => t.cancel(S) : c = () => w(void 0);
        const p = t.autoAllocateChunkSize;
        if (p === 0)
          throw new TypeError("autoAllocateChunkSize must be greater than 0");
        qn(e, i, u, f, c, r, p);
      }
      function pi(e, t, r) {
        e._associatedReadableByteStreamController = t, e._view = r;
      }
      function Tr(e) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${e} can only be used on a ReadableStreamBYOBRequest`);
      }
      function tt(e) {
        return new TypeError(`ReadableByteStreamController.prototype.${e} can only be used on a ReadableByteStreamController`);
      }
      function bi(e, t) {
        te(e, t);
        const r = e?.mode;
        return {
          mode: r === void 0 ? void 0 : yi(r, `${t} has member 'mode' that`)
        };
      }
      function yi(e, t) {
        if (e = `${e}`, e !== "byob")
          throw new TypeError(`${t} '${e}' is not a valid enumeration value for ReadableStreamReaderMode`);
        return e;
      }
      function gi(e, t) {
        var r;
        te(e, t);
        const i = (r = e?.min) !== null && r !== void 0 ? r : 1;
        return {
          min: fr(i, `${t} has member 'min' that`)
        };
      }
      function In(e) {
        return new _e(e);
      }
      function On(e, t) {
        e._reader._readIntoRequests.push(t);
      }
      function Si(e, t, r) {
        const u = e._reader._readIntoRequests.shift();
        r ? u._closeSteps(t) : u._chunkSteps(t);
      }
      function Dn(e) {
        return e._reader._readIntoRequests.length;
      }
      function Pr(e) {
        const t = e._reader;
        return !(t === void 0 || !Be(t));
      }
      class _e {
        constructor(t) {
          if (se(t, 1, "ReadableStreamBYOBReader"), cr(t, "First parameter"), Ce(t))
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          if (!Ee(t._readableStreamController))
            throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          rn(this, t), this._readIntoRequests = new L();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          return Be(this) ? this._closedPromise : m(Ct("closed"));
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(t = void 0) {
          return Be(this) ? this._ownerReadableStream === void 0 ? m(mt("cancel")) : ir(this, t) : m(Ct("cancel"));
        }
        read(t, r = {}) {
          if (!Be(this))
            return m(Ct("read"));
          if (!ArrayBuffer.isView(t))
            return m(new TypeError("view must be an array buffer view"));
          if (t.byteLength === 0)
            return m(new TypeError("view must have non-zero byteLength"));
          if (t.buffer.byteLength === 0)
            return m(new TypeError("view's buffer must have non-zero byteLength"));
          if (ge(t.buffer))
            return m(new TypeError("view's buffer has been detached"));
          let i;
          try {
            i = gi(r, "options");
          } catch (b) {
            return m(b);
          }
          const u = i.min;
          if (u === 0)
            return m(new TypeError("options.min must be greater than 0"));
          if (si(t)) {
            if (u > t.byteLength)
              return m(new RangeError("options.min must be less than or equal to view's byteLength"));
          } else if (u > t.length)
            return m(new RangeError("options.min must be less than or equal to view's length"));
          if (this._ownerReadableStream === void 0)
            return m(mt("read from"));
          let f, c;
          const p = v((b, R) => {
            f = b, c = R;
          });
          return Fn(this, t, u, {
            _chunkSteps: (b) => f({ value: b, done: !1 }),
            _closeSteps: (b) => f({ value: b, done: !0 }),
            _errorSteps: (b) => c(b)
          }), p;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!Be(this))
            throw Ct("releaseLock");
          this._ownerReadableStream !== void 0 && _i(this);
        }
      }
      Object.defineProperties(_e.prototype, {
        cancel: { enumerable: !0 },
        read: { enumerable: !0 },
        releaseLock: { enumerable: !0 },
        closed: { enumerable: !0 }
      }), d(_e.prototype.cancel, "cancel"), d(_e.prototype.read, "read"), d(_e.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(_e.prototype, Symbol.toStringTag, {
        value: "ReadableStreamBYOBReader",
        configurable: !0
      });
      function Be(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_readIntoRequests") ? !1 : e instanceof _e;
      }
      function Fn(e, t, r, i) {
        const u = e._ownerReadableStream;
        u._disturbed = !0, u._state === "errored" ? i._errorSteps(u._storedError) : fi(u._readableStreamController, t, r, i);
      }
      function _i(e) {
        ae(e);
        const t = new TypeError("Reader was released");
        zn(e, t);
      }
      function zn(e, t) {
        const r = e._readIntoRequests;
        e._readIntoRequests = new L(), r.forEach((i) => {
          i._errorSteps(t);
        });
      }
      function Ct(e) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${e} can only be used on a ReadableStreamBYOBReader`);
      }
      function rt(e, t) {
        const { highWaterMark: r } = e;
        if (r === void 0)
          return t;
        if (bn(r) || r < 0)
          throw new RangeError("Invalid highWaterMark");
        return r;
      }
      function Tt(e) {
        const { size: t } = e;
        return t || (() => 1);
      }
      function Pt(e, t) {
        te(e, t);
        const r = e?.highWaterMark, i = e?.size;
        return {
          highWaterMark: r === void 0 ? void 0 : ur(r),
          size: i === void 0 ? void 0 : wi(i, `${t} has member 'size' that`)
        };
      }
      function wi(e, t) {
        return Q(e, t), (r) => ur(e(r));
      }
      function Ri(e, t) {
        te(e, t);
        const r = e?.abort, i = e?.close, u = e?.start, f = e?.type, c = e?.write;
        return {
          abort: r === void 0 ? void 0 : Ci(r, e, `${t} has member 'abort' that`),
          close: i === void 0 ? void 0 : Ti(i, e, `${t} has member 'close' that`),
          start: u === void 0 ? void 0 : Pi(u, e, `${t} has member 'start' that`),
          write: c === void 0 ? void 0 : vi(c, e, `${t} has member 'write' that`),
          type: f
        };
      }
      function Ci(e, t, r) {
        return Q(e, r), (i) => O(e, t, [i]);
      }
      function Ti(e, t, r) {
        return Q(e, r), () => O(e, t, []);
      }
      function Pi(e, t, r) {
        return Q(e, r), (i) => W(e, t, [i]);
      }
      function vi(e, t, r) {
        return Q(e, r), (i, u) => O(e, t, [i, u]);
      }
      function $n(e, t) {
        if (!$e(e))
          throw new TypeError(`${t} is not a WritableStream.`);
      }
      function Ei(e) {
        if (typeof e != "object" || e === null)
          return !1;
        try {
          return typeof e.aborted == "boolean";
        } catch {
          return !1;
        }
      }
      const Ai = typeof AbortController == "function";
      function Bi() {
        if (Ai)
          return new AbortController();
      }
      class we {
        constructor(t = {}, r = {}) {
          t === void 0 ? t = null : sn(t, "First parameter");
          const i = Pt(r, "Second parameter"), u = Ri(t, "First parameter");
          if (jn(this), u.type !== void 0)
            throw new RangeError("Invalid type is specified");
          const c = Tt(i), p = rt(i, 1);
          Ui(this, u, p, c);
        }
        /**
         * Returns whether or not the writable stream is locked to a writer.
         */
        get locked() {
          if (!$e(this))
            throw kt("locked");
          return Le(this);
        }
        /**
         * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
         * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
         * mechanism of the underlying sink.
         *
         * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
         * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
         * the stream) if the stream is currently locked.
         */
        abort(t = void 0) {
          return $e(this) ? Le(this) ? m(new TypeError("Cannot abort a stream that already has a writer")) : vt(this, t) : m(kt("abort"));
        }
        /**
         * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
         * close behavior. During this time any further attempts to write will fail (without erroring the stream).
         *
         * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
         * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
         * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
         */
        close() {
          return $e(this) ? Le(this) ? m(new TypeError("Cannot close a stream that already has a writer")) : re(this) ? m(new TypeError("Cannot close an already-closing stream")) : Mn(this) : m(kt("close"));
        }
        /**
         * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
         * is locked, no other writer can be acquired until this one is released.
         *
         * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
         * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
         * the same time, which would cause the resulting written data to be unpredictable and probably useless.
         */
        getWriter() {
          if (!$e(this))
            throw kt("getWriter");
          return Ln(this);
        }
      }
      Object.defineProperties(we.prototype, {
        abort: { enumerable: !0 },
        close: { enumerable: !0 },
        getWriter: { enumerable: !0 },
        locked: { enumerable: !0 }
      }), d(we.prototype.abort, "abort"), d(we.prototype.close, "close"), d(we.prototype.getWriter, "getWriter"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(we.prototype, Symbol.toStringTag, {
        value: "WritableStream",
        configurable: !0
      });
      function Ln(e) {
        return new fe(e);
      }
      function ki(e, t, r, i, u = 1, f = () => 1) {
        const c = Object.create(we.prototype);
        jn(c);
        const p = Object.create(je.prototype);
        return Qn(c, p, e, t, r, i, u, f), c;
      }
      function jn(e) {
        e._state = "writable", e._storedError = void 0, e._writer = void 0, e._writableStreamController = void 0, e._writeRequests = new L(), e._inFlightWriteRequest = void 0, e._closeRequest = void 0, e._inFlightCloseRequest = void 0, e._pendingAbortRequest = void 0, e._backpressure = !1;
      }
      function $e(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_writableStreamController") ? !1 : e instanceof we;
      }
      function Le(e) {
        return e._writer !== void 0;
      }
      function vt(e, t) {
        var r;
        if (e._state === "closed" || e._state === "errored")
          return w(void 0);
        e._writableStreamController._abortReason = t, (r = e._writableStreamController._abortController) === null || r === void 0 || r.abort(t);
        const i = e._state;
        if (i === "closed" || i === "errored")
          return w(void 0);
        if (e._pendingAbortRequest !== void 0)
          return e._pendingAbortRequest._promise;
        let u = !1;
        i === "erroring" && (u = !0, t = void 0);
        const f = v((c, p) => {
          e._pendingAbortRequest = {
            _promise: void 0,
            _resolve: c,
            _reject: p,
            _reason: t,
            _wasAlreadyErroring: u
          };
        });
        return e._pendingAbortRequest._promise = f, u || Er(e, t), f;
      }
      function Mn(e) {
        const t = e._state;
        if (t === "closed" || t === "errored")
          return m(new TypeError(`The stream (in ${t} state) is not in the writable state and cannot be closed`));
        const r = v((u, f) => {
          const c = {
            _resolve: u,
            _reject: f
          };
          e._closeRequest = c;
        }), i = e._writer;
        return i !== void 0 && e._backpressure && t === "writable" && Dr(i), xi(e._writableStreamController), r;
      }
      function Wi(e) {
        return v((r, i) => {
          const u = {
            _resolve: r,
            _reject: i
          };
          e._writeRequests.push(u);
        });
      }
      function vr(e, t) {
        if (e._state === "writable") {
          Er(e, t);
          return;
        }
        Ar(e);
      }
      function Er(e, t) {
        const r = e._writableStreamController;
        e._state = "erroring", e._storedError = t;
        const i = e._writer;
        i !== void 0 && Un(i, t), !Fi(e) && r._started && Ar(e);
      }
      function Ar(e) {
        e._state = "errored", e._writableStreamController[tn]();
        const t = e._storedError;
        if (e._writeRequests.forEach((u) => {
          u._reject(t);
        }), e._writeRequests = new L(), e._pendingAbortRequest === void 0) {
          Et(e);
          return;
        }
        const r = e._pendingAbortRequest;
        if (e._pendingAbortRequest = void 0, r._wasAlreadyErroring) {
          r._reject(t), Et(e);
          return;
        }
        const i = e._writableStreamController[ht](r._reason);
        y(i, () => (r._resolve(), Et(e), null), (u) => (r._reject(u), Et(e), null));
      }
      function qi(e) {
        e._inFlightWriteRequest._resolve(void 0), e._inFlightWriteRequest = void 0;
      }
      function Ii(e, t) {
        e._inFlightWriteRequest._reject(t), e._inFlightWriteRequest = void 0, vr(e, t);
      }
      function Oi(e) {
        e._inFlightCloseRequest._resolve(void 0), e._inFlightCloseRequest = void 0, e._state === "erroring" && (e._storedError = void 0, e._pendingAbortRequest !== void 0 && (e._pendingAbortRequest._resolve(), e._pendingAbortRequest = void 0)), e._state = "closed";
        const r = e._writer;
        r !== void 0 && Kn(r);
      }
      function Di(e, t) {
        e._inFlightCloseRequest._reject(t), e._inFlightCloseRequest = void 0, e._pendingAbortRequest !== void 0 && (e._pendingAbortRequest._reject(t), e._pendingAbortRequest = void 0), vr(e, t);
      }
      function re(e) {
        return !(e._closeRequest === void 0 && e._inFlightCloseRequest === void 0);
      }
      function Fi(e) {
        return !(e._inFlightWriteRequest === void 0 && e._inFlightCloseRequest === void 0);
      }
      function zi(e) {
        e._inFlightCloseRequest = e._closeRequest, e._closeRequest = void 0;
      }
      function $i(e) {
        e._inFlightWriteRequest = e._writeRequests.shift();
      }
      function Et(e) {
        e._closeRequest !== void 0 && (e._closeRequest._reject(e._storedError), e._closeRequest = void 0);
        const t = e._writer;
        t !== void 0 && Ir(t, e._storedError);
      }
      function Br(e, t) {
        const r = e._writer;
        r !== void 0 && t !== e._backpressure && (t ? Ki(r) : Dr(r)), e._backpressure = t;
      }
      class fe {
        constructor(t) {
          if (se(t, 1, "WritableStreamDefaultWriter"), $n(t, "First parameter"), Le(t))
            throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          this._ownerWritableStream = t, t._writer = this;
          const r = t._state;
          if (r === "writable")
            !re(t) && t._backpressure ? qt(this) : Zn(this), Wt(this);
          else if (r === "erroring")
            Or(this, t._storedError), Wt(this);
          else if (r === "closed")
            Zn(this), Gi(this);
          else {
            const i = t._storedError;
            Or(this, i), Jn(this, i);
          }
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the writer’s lock is released before the stream finishes closing.
         */
        get closed() {
          return ke(this) ? this._closedPromise : m(We("closed"));
        }
        /**
         * Returns the desired size to fill the stream’s internal queue. It can be negative, if the queue is over-full.
         * A producer can use this information to determine the right amount of data to write.
         *
         * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
         * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
         * the writer’s lock is released.
         */
        get desiredSize() {
          if (!ke(this))
            throw We("desiredSize");
          if (this._ownerWritableStream === void 0)
            throw ot("desiredSize");
          return Ni(this);
        }
        /**
         * Returns a promise that will be fulfilled when the desired size to fill the stream’s internal queue transitions
         * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
         * back to zero or below, the getter will return a new promise that stays pending until the next transition.
         *
         * If the stream becomes errored or aborted, or the writer’s lock is released, the returned promise will become
         * rejected.
         */
        get ready() {
          return ke(this) ? this._readyPromise : m(We("ready"));
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
         */
        abort(t = void 0) {
          return ke(this) ? this._ownerWritableStream === void 0 ? m(ot("abort")) : Li(this, t) : m(We("abort"));
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
         */
        close() {
          if (!ke(this))
            return m(We("close"));
          const t = this._ownerWritableStream;
          return t === void 0 ? m(ot("close")) : re(t) ? m(new TypeError("Cannot close an already-closing stream")) : Nn(this);
        }
        /**
         * Releases the writer’s lock on the corresponding stream. After the lock is released, the writer is no longer active.
         * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
         * now on; otherwise, the writer will appear closed.
         *
         * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
         * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
         * It’s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
         * other producers from writing in an interleaved manner.
         */
        releaseLock() {
          if (!ke(this))
            throw We("releaseLock");
          this._ownerWritableStream !== void 0 && xn(this);
        }
        write(t = void 0) {
          return ke(this) ? this._ownerWritableStream === void 0 ? m(ot("write to")) : Hn(this, t) : m(We("write"));
        }
      }
      Object.defineProperties(fe.prototype, {
        abort: { enumerable: !0 },
        close: { enumerable: !0 },
        releaseLock: { enumerable: !0 },
        write: { enumerable: !0 },
        closed: { enumerable: !0 },
        desiredSize: { enumerable: !0 },
        ready: { enumerable: !0 }
      }), d(fe.prototype.abort, "abort"), d(fe.prototype.close, "close"), d(fe.prototype.releaseLock, "releaseLock"), d(fe.prototype.write, "write"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(fe.prototype, Symbol.toStringTag, {
        value: "WritableStreamDefaultWriter",
        configurable: !0
      });
      function ke(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_ownerWritableStream") ? !1 : e instanceof fe;
      }
      function Li(e, t) {
        const r = e._ownerWritableStream;
        return vt(r, t);
      }
      function Nn(e) {
        const t = e._ownerWritableStream;
        return Mn(t);
      }
      function ji(e) {
        const t = e._ownerWritableStream, r = t._state;
        return re(t) || r === "closed" ? w(void 0) : r === "errored" ? m(t._storedError) : Nn(e);
      }
      function Mi(e, t) {
        e._closedPromiseState === "pending" ? Ir(e, t) : Ji(e, t);
      }
      function Un(e, t) {
        e._readyPromiseState === "pending" ? Xn(e, t) : Zi(e, t);
      }
      function Ni(e) {
        const t = e._ownerWritableStream, r = t._state;
        return r === "errored" || r === "erroring" ? null : r === "closed" ? 0 : Yn(t._writableStreamController);
      }
      function xn(e) {
        const t = e._ownerWritableStream, r = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
        Un(e, r), Mi(e, r), t._writer = void 0, e._ownerWritableStream = void 0;
      }
      function Hn(e, t) {
        const r = e._ownerWritableStream, i = r._writableStreamController, u = Hi(i, t);
        if (r !== e._ownerWritableStream)
          return m(ot("write to"));
        const f = r._state;
        if (f === "errored")
          return m(r._storedError);
        if (re(r) || f === "closed")
          return m(new TypeError("The stream is closing or closed and cannot be written to"));
        if (f === "erroring")
          return m(r._storedError);
        const c = Wi(r);
        return Vi(i, t, u), c;
      }
      const Vn = {};
      class je {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
         *
         * @deprecated
         *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
         *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
         */
        get abortReason() {
          if (!kr(this))
            throw qr("abortReason");
          return this._abortReason;
        }
        /**
         * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
         */
        get signal() {
          if (!kr(this))
            throw qr("signal");
          if (this._abortController === void 0)
            throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          return this._abortController.signal;
        }
        /**
         * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
         *
         * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
         * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
         * normal lifecycle of interactions with the underlying sink.
         */
        error(t = void 0) {
          if (!kr(this))
            throw qr("error");
          this._controlledWritableStream._state === "writable" && Gn(this, t);
        }
        /** @internal */
        [ht](t) {
          const r = this._abortAlgorithm(t);
          return At(this), r;
        }
        /** @internal */
        [tn]() {
          Se(this);
        }
      }
      Object.defineProperties(je.prototype, {
        abortReason: { enumerable: !0 },
        signal: { enumerable: !0 },
        error: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(je.prototype, Symbol.toStringTag, {
        value: "WritableStreamDefaultController",
        configurable: !0
      });
      function kr(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledWritableStream") ? !1 : e instanceof je;
      }
      function Qn(e, t, r, i, u, f, c, p) {
        t._controlledWritableStream = e, e._writableStreamController = t, t._queue = void 0, t._queueTotalSize = void 0, Se(t), t._abortReason = void 0, t._abortController = Bi(), t._started = !1, t._strategySizeAlgorithm = p, t._strategyHWM = c, t._writeAlgorithm = i, t._closeAlgorithm = u, t._abortAlgorithm = f;
        const S = Wr(t);
        Br(e, S);
        const b = r(), R = w(b);
        y(R, () => (t._started = !0, Bt(t), null), (C) => (t._started = !0, vr(e, C), null));
      }
      function Ui(e, t, r, i) {
        const u = Object.create(je.prototype);
        let f, c, p, S;
        t.start !== void 0 ? f = () => t.start(u) : f = () => {
        }, t.write !== void 0 ? c = (b) => t.write(b, u) : c = () => w(void 0), t.close !== void 0 ? p = () => t.close() : p = () => w(void 0), t.abort !== void 0 ? S = (b) => t.abort(b) : S = () => w(void 0), Qn(e, u, f, c, p, S, r, i);
      }
      function At(e) {
        e._writeAlgorithm = void 0, e._closeAlgorithm = void 0, e._abortAlgorithm = void 0, e._strategySizeAlgorithm = void 0;
      }
      function xi(e) {
        gr(e, Vn, 0), Bt(e);
      }
      function Hi(e, t) {
        try {
          return e._strategySizeAlgorithm(t);
        } catch (r) {
          return nt(e, r), 1;
        }
      }
      function Yn(e) {
        return e._strategyHWM - e._queueTotalSize;
      }
      function Vi(e, t, r) {
        try {
          gr(e, t, r);
        } catch (u) {
          nt(e, u);
          return;
        }
        const i = e._controlledWritableStream;
        if (!re(i) && i._state === "writable") {
          const u = Wr(e);
          Br(i, u);
        }
        Bt(e);
      }
      function Bt(e) {
        const t = e._controlledWritableStream;
        if (!e._started || t._inFlightWriteRequest !== void 0)
          return;
        if (t._state === "erroring") {
          Ar(t);
          return;
        }
        if (e._queue.length === 0)
          return;
        const i = ai(e);
        i === Vn ? Qi(e) : Yi(e, i);
      }
      function nt(e, t) {
        e._controlledWritableStream._state === "writable" && Gn(e, t);
      }
      function Qi(e) {
        const t = e._controlledWritableStream;
        zi(t), yr(e);
        const r = e._closeAlgorithm();
        At(e), y(r, () => (Oi(t), null), (i) => (Di(t, i), null));
      }
      function Yi(e, t) {
        const r = e._controlledWritableStream;
        $i(r);
        const i = e._writeAlgorithm(t);
        y(i, () => {
          qi(r);
          const u = r._state;
          if (yr(e), !re(r) && u === "writable") {
            const f = Wr(e);
            Br(r, f);
          }
          return Bt(e), null;
        }, (u) => (r._state === "writable" && At(e), Ii(r, u), null));
      }
      function Wr(e) {
        return Yn(e) <= 0;
      }
      function Gn(e, t) {
        const r = e._controlledWritableStream;
        At(e), Er(r, t);
      }
      function kt(e) {
        return new TypeError(`WritableStream.prototype.${e} can only be used on a WritableStream`);
      }
      function qr(e) {
        return new TypeError(`WritableStreamDefaultController.prototype.${e} can only be used on a WritableStreamDefaultController`);
      }
      function We(e) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${e} can only be used on a WritableStreamDefaultWriter`);
      }
      function ot(e) {
        return new TypeError("Cannot " + e + " a stream using a released writer");
      }
      function Wt(e) {
        e._closedPromise = v((t, r) => {
          e._closedPromise_resolve = t, e._closedPromise_reject = r, e._closedPromiseState = "pending";
        });
      }
      function Jn(e, t) {
        Wt(e), Ir(e, t);
      }
      function Gi(e) {
        Wt(e), Kn(e);
      }
      function Ir(e, t) {
        e._closedPromise_reject !== void 0 && (x(e._closedPromise), e._closedPromise_reject(t), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0, e._closedPromiseState = "rejected");
      }
      function Ji(e, t) {
        Jn(e, t);
      }
      function Kn(e) {
        e._closedPromise_resolve !== void 0 && (e._closedPromise_resolve(void 0), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0, e._closedPromiseState = "resolved");
      }
      function qt(e) {
        e._readyPromise = v((t, r) => {
          e._readyPromise_resolve = t, e._readyPromise_reject = r;
        }), e._readyPromiseState = "pending";
      }
      function Or(e, t) {
        qt(e), Xn(e, t);
      }
      function Zn(e) {
        qt(e), Dr(e);
      }
      function Xn(e, t) {
        e._readyPromise_reject !== void 0 && (x(e._readyPromise), e._readyPromise_reject(t), e._readyPromise_resolve = void 0, e._readyPromise_reject = void 0, e._readyPromiseState = "rejected");
      }
      function Ki(e) {
        qt(e);
      }
      function Zi(e, t) {
        Or(e, t);
      }
      function Dr(e) {
        e._readyPromise_resolve !== void 0 && (e._readyPromise_resolve(void 0), e._readyPromise_resolve = void 0, e._readyPromise_reject = void 0, e._readyPromiseState = "fulfilled");
      }
      function Xi() {
        if (typeof globalThis < "u")
          return globalThis;
        if (typeof self < "u")
          return self;
        if (typeof Ur < "u")
          return Ur;
      }
      const Fr = Xi();
      function ea(e) {
        if (!(typeof e == "function" || typeof e == "object") || e.name !== "DOMException")
          return !1;
        try {
          return new e(), !0;
        } catch {
          return !1;
        }
      }
      function ta() {
        const e = Fr?.DOMException;
        return ea(e) ? e : void 0;
      }
      function ra() {
        const e = function(r, i) {
          this.message = r || "", this.name = i || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        };
        return d(e, "DOMException"), e.prototype = Object.create(Error.prototype), Object.defineProperty(e.prototype, "constructor", { value: e, writable: !0, configurable: !0 }), e;
      }
      const na = ta() || ra();
      function eo(e, t, r, i, u, f) {
        const c = Fe(e), p = Ln(t);
        e._disturbed = !0;
        let S = !1, b = w(void 0);
        return v((R, C) => {
          let E;
          if (f !== void 0) {
            if (E = () => {
              const g = f.reason !== void 0 ? f.reason : new na("Aborted", "AbortError"), P = [];
              i || P.push(() => t._state === "writable" ? vt(t, g) : w(void 0)), u || P.push(() => e._state === "readable" ? K(e, g) : w(void 0)), M(() => Promise.all(P.map((A) => A())), !0, g);
            }, f.aborted) {
              E();
              return;
            }
            f.addEventListener("abort", E);
          }
          function Z() {
            return v((g, P) => {
              function A(H) {
                H ? g() : k(xe(), A, P);
              }
              A(!1);
            });
          }
          function xe() {
            return S ? w(!0) : k(p._readyPromise, () => v((g, P) => {
              Ze(c, {
                _chunkSteps: (A) => {
                  b = k(Hn(p, A), void 0, s), g(!1);
                },
                _closeSteps: () => g(!0),
                _errorSteps: P
              });
            }));
          }
          if (de(e, c._closedPromise, (g) => (i ? G(!0, g) : M(() => vt(t, g), !0, g), null)), de(t, p._closedPromise, (g) => (u ? G(!0, g) : M(() => K(e, g), !0, g), null)), j(e, c._closedPromise, () => (r ? G() : M(() => ji(p)), null)), re(t) || t._state === "closed") {
            const g = new TypeError("the destination writable stream closed before all data could be piped to it");
            u ? G(!0, g) : M(() => K(e, g), !0, g);
          }
          x(Z());
          function Pe() {
            const g = b;
            return k(b, () => g !== b ? Pe() : void 0);
          }
          function de(g, P, A) {
            g._state === "errored" ? A(g._storedError) : q(P, A);
          }
          function j(g, P, A) {
            g._state === "closed" ? A() : U(P, A);
          }
          function M(g, P, A) {
            if (S)
              return;
            S = !0, t._state === "writable" && !re(t) ? U(Pe(), H) : H();
            function H() {
              return y(g(), () => he(P, A), (He) => he(!0, He)), null;
            }
          }
          function G(g, P) {
            S || (S = !0, t._state === "writable" && !re(t) ? U(Pe(), () => he(g, P)) : he(g, P));
          }
          function he(g, P) {
            return xn(p), ae(c), f !== void 0 && f.removeEventListener("abort", E), g ? C(P) : R(void 0), null;
          }
        });
      }
      class ce {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!It(this))
            throw Dt("desiredSize");
          return zr(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!It(this))
            throw Dt("close");
          if (!Ne(this))
            throw new TypeError("The stream is not in a state that permits close");
          qe(this);
        }
        enqueue(t = void 0) {
          if (!It(this))
            throw Dt("enqueue");
          if (!Ne(this))
            throw new TypeError("The stream is not in a state that permits enqueue");
          return Me(this, t);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(t = void 0) {
          if (!It(this))
            throw Dt("error");
          J(this, t);
        }
        /** @internal */
        [rr](t) {
          Se(this);
          const r = this._cancelAlgorithm(t);
          return Ot(this), r;
        }
        /** @internal */
        [nr](t) {
          const r = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const i = yr(this);
            this._closeRequested && this._queue.length === 0 ? (Ot(this), st(r)) : it(this), t._chunkSteps(i);
          } else
            un(r, t), it(this);
        }
        /** @internal */
        [or]() {
        }
      }
      Object.defineProperties(ce.prototype, {
        close: { enumerable: !0 },
        enqueue: { enumerable: !0 },
        error: { enumerable: !0 },
        desiredSize: { enumerable: !0 }
      }), d(ce.prototype.close, "close"), d(ce.prototype.enqueue, "enqueue"), d(ce.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ce.prototype, Symbol.toStringTag, {
        value: "ReadableStreamDefaultController",
        configurable: !0
      });
      function It(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledReadableStream") ? !1 : e instanceof ce;
      }
      function it(e) {
        if (!to(e))
          return;
        if (e._pulling) {
          e._pullAgain = !0;
          return;
        }
        e._pulling = !0;
        const r = e._pullAlgorithm();
        y(r, () => (e._pulling = !1, e._pullAgain && (e._pullAgain = !1, it(e)), null), (i) => (J(e, i), null));
      }
      function to(e) {
        const t = e._controlledReadableStream;
        return !Ne(e) || !e._started ? !1 : !!(Ce(t) && pt(t) > 0 || zr(e) > 0);
      }
      function Ot(e) {
        e._pullAlgorithm = void 0, e._cancelAlgorithm = void 0, e._strategySizeAlgorithm = void 0;
      }
      function qe(e) {
        if (!Ne(e))
          return;
        const t = e._controlledReadableStream;
        e._closeRequested = !0, e._queue.length === 0 && (Ot(e), st(t));
      }
      function Me(e, t) {
        if (!Ne(e))
          return;
        const r = e._controlledReadableStream;
        if (Ce(r) && pt(r) > 0)
          dr(r, t, !1);
        else {
          let i;
          try {
            i = e._strategySizeAlgorithm(t);
          } catch (u) {
            throw J(e, u), u;
          }
          try {
            gr(e, t, i);
          } catch (u) {
            throw J(e, u), u;
          }
        }
        it(e);
      }
      function J(e, t) {
        const r = e._controlledReadableStream;
        r._state === "readable" && (Se(e), Ot(e), io(r, t));
      }
      function zr(e) {
        const t = e._controlledReadableStream._state;
        return t === "errored" ? null : t === "closed" ? 0 : e._strategyHWM - e._queueTotalSize;
      }
      function oa(e) {
        return !to(e);
      }
      function Ne(e) {
        const t = e._controlledReadableStream._state;
        return !e._closeRequested && t === "readable";
      }
      function ro(e, t, r, i, u, f, c) {
        t._controlledReadableStream = e, t._queue = void 0, t._queueTotalSize = void 0, Se(t), t._started = !1, t._closeRequested = !1, t._pullAgain = !1, t._pulling = !1, t._strategySizeAlgorithm = c, t._strategyHWM = f, t._pullAlgorithm = i, t._cancelAlgorithm = u, e._readableStreamController = t;
        const p = r();
        y(w(p), () => (t._started = !0, it(t), null), (S) => (J(t, S), null));
      }
      function ia(e, t, r, i) {
        const u = Object.create(ce.prototype);
        let f, c, p;
        t.start !== void 0 ? f = () => t.start(u) : f = () => {
        }, t.pull !== void 0 ? c = () => t.pull(u) : c = () => w(void 0), t.cancel !== void 0 ? p = (S) => t.cancel(S) : p = () => w(void 0), ro(e, u, f, c, p, r, i);
      }
      function Dt(e) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${e} can only be used on a ReadableStreamDefaultController`);
      }
      function aa(e, t) {
        return Ee(e._readableStreamController) ? la(e) : sa(e);
      }
      function sa(e, t) {
        const r = Fe(e);
        let i = !1, u = !1, f = !1, c = !1, p, S, b, R, C;
        const E = v((j) => {
          C = j;
        });
        function Z() {
          return i ? (u = !0, w(void 0)) : (i = !0, Ze(r, {
            _chunkSteps: (M) => {
              ie(() => {
                u = !1;
                const G = M, he = M;
                f || Me(b._readableStreamController, G), c || Me(R._readableStreamController, he), i = !1, u && Z();
              });
            },
            _closeSteps: () => {
              i = !1, f || qe(b._readableStreamController), c || qe(R._readableStreamController), (!f || !c) && C(void 0);
            },
            _errorSteps: () => {
              i = !1;
            }
          }), w(void 0));
        }
        function xe(j) {
          if (f = !0, p = j, c) {
            const M = Xe([p, S]), G = K(e, M);
            C(G);
          }
          return E;
        }
        function Pe(j) {
          if (c = !0, S = j, f) {
            const M = Xe([p, S]), G = K(e, M);
            C(G);
          }
          return E;
        }
        function de() {
        }
        return b = at(de, Z, xe), R = at(de, Z, Pe), q(r._closedPromise, (j) => (J(b._readableStreamController, j), J(R._readableStreamController, j), (!f || !c) && C(void 0), null)), [b, R];
      }
      function la(e) {
        let t = Fe(e), r = !1, i = !1, u = !1, f = !1, c = !1, p, S, b, R, C;
        const E = v((g) => {
          C = g;
        });
        function Z(g) {
          q(g._closedPromise, (P) => (g !== t || (Y(b._readableStreamController, P), Y(R._readableStreamController, P), (!f || !c) && C(void 0)), null));
        }
        function xe() {
          Be(t) && (ae(t), t = Fe(e), Z(t)), Ze(t, {
            _chunkSteps: (P) => {
              ie(() => {
                i = !1, u = !1;
                const A = P;
                let H = P;
                if (!f && !c)
                  try {
                    H = _n(P);
                  } catch (He) {
                    Y(b._readableStreamController, He), Y(R._readableStreamController, He), C(K(e, He));
                    return;
                  }
                f || _t(b._readableStreamController, A), c || _t(R._readableStreamController, H), r = !1, i ? de() : u && j();
              });
            },
            _closeSteps: () => {
              r = !1, f || et(b._readableStreamController), c || et(R._readableStreamController), b._readableStreamController._pendingPullIntos.length > 0 && wt(b._readableStreamController, 0), R._readableStreamController._pendingPullIntos.length > 0 && wt(R._readableStreamController, 0), (!f || !c) && C(void 0);
            },
            _errorSteps: () => {
              r = !1;
            }
          });
        }
        function Pe(g, P) {
          ye(t) && (ae(t), t = In(e), Z(t));
          const A = P ? R : b, H = P ? b : R;
          Fn(t, g, 1, {
            _chunkSteps: (Ve) => {
              ie(() => {
                i = !1, u = !1;
                const Qe = P ? c : f;
                if (P ? f : c)
                  Qe || Rt(A._readableStreamController, Ve);
                else {
                  let So;
                  try {
                    So = _n(Ve);
                  } catch (Nr) {
                    Y(A._readableStreamController, Nr), Y(H._readableStreamController, Nr), C(K(e, Nr));
                    return;
                  }
                  Qe || Rt(A._readableStreamController, Ve), _t(H._readableStreamController, So);
                }
                r = !1, i ? de() : u && j();
              });
            },
            _closeSteps: (Ve) => {
              r = !1;
              const Qe = P ? c : f, Ut = P ? f : c;
              Qe || et(A._readableStreamController), Ut || et(H._readableStreamController), Ve !== void 0 && (Qe || Rt(A._readableStreamController, Ve), !Ut && H._readableStreamController._pendingPullIntos.length > 0 && wt(H._readableStreamController, 0)), (!Qe || !Ut) && C(void 0);
            },
            _errorSteps: () => {
              r = !1;
            }
          });
        }
        function de() {
          if (r)
            return i = !0, w(void 0);
          r = !0;
          const g = Cr(b._readableStreamController);
          return g === null ? xe() : Pe(g._view, !1), w(void 0);
        }
        function j() {
          if (r)
            return u = !0, w(void 0);
          r = !0;
          const g = Cr(R._readableStreamController);
          return g === null ? xe() : Pe(g._view, !0), w(void 0);
        }
        function M(g) {
          if (f = !0, p = g, c) {
            const P = Xe([p, S]), A = K(e, P);
            C(A);
          }
          return E;
        }
        function G(g) {
          if (c = !0, S = g, f) {
            const P = Xe([p, S]), A = K(e, P);
            C(A);
          }
          return E;
        }
        function he() {
        }
        return b = oo(he, de, M), R = oo(he, j, G), Z(t), [b, R];
      }
      function ua(e) {
        return l(e) && typeof e.getReader < "u";
      }
      function fa(e) {
        return ua(e) ? da(e.getReader()) : ca(e);
      }
      function ca(e) {
        let t;
        const r = Sn(e, "async"), i = s;
        function u() {
          let c;
          try {
            c = ri(r);
          } catch (S) {
            return m(S);
          }
          const p = w(c);
          return I(p, (S) => {
            if (!l(S))
              throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
            if (ni(S))
              qe(t._readableStreamController);
            else {
              const R = oi(S);
              Me(t._readableStreamController, R);
            }
          });
        }
        function f(c) {
          const p = r.iterator;
          let S;
          try {
            S = yt(p, "return");
          } catch (C) {
            return m(C);
          }
          if (S === void 0)
            return w(void 0);
          let b;
          try {
            b = W(S, p, [c]);
          } catch (C) {
            return m(C);
          }
          const R = w(b);
          return I(R, (C) => {
            if (!l(C))
              throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
          });
        }
        return t = at(i, u, f, 0), t;
      }
      function da(e) {
        let t;
        const r = s;
        function i() {
          let f;
          try {
            f = e.read();
          } catch (c) {
            return m(c);
          }
          return I(f, (c) => {
            if (!l(c))
              throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
            if (c.done)
              qe(t._readableStreamController);
            else {
              const p = c.value;
              Me(t._readableStreamController, p);
            }
          });
        }
        function u(f) {
          try {
            return w(e.cancel(f));
          } catch (c) {
            return m(c);
          }
        }
        return t = at(r, i, u, 0), t;
      }
      function ha(e, t) {
        te(e, t);
        const r = e, i = r?.autoAllocateChunkSize, u = r?.cancel, f = r?.pull, c = r?.start, p = r?.type;
        return {
          autoAllocateChunkSize: i === void 0 ? void 0 : fr(i, `${t} has member 'autoAllocateChunkSize' that`),
          cancel: u === void 0 ? void 0 : ma(u, r, `${t} has member 'cancel' that`),
          pull: f === void 0 ? void 0 : pa(f, r, `${t} has member 'pull' that`),
          start: c === void 0 ? void 0 : ba(c, r, `${t} has member 'start' that`),
          type: p === void 0 ? void 0 : ya(p, `${t} has member 'type' that`)
        };
      }
      function ma(e, t, r) {
        return Q(e, r), (i) => O(e, t, [i]);
      }
      function pa(e, t, r) {
        return Q(e, r), (i) => O(e, t, [i]);
      }
      function ba(e, t, r) {
        return Q(e, r), (i) => W(e, t, [i]);
      }
      function ya(e, t) {
        if (e = `${e}`, e !== "bytes")
          throw new TypeError(`${t} '${e}' is not a valid enumeration value for ReadableStreamType`);
        return e;
      }
      function ga(e, t) {
        return te(e, t), { preventCancel: !!e?.preventCancel };
      }
      function no(e, t) {
        te(e, t);
        const r = e?.preventAbort, i = e?.preventCancel, u = e?.preventClose, f = e?.signal;
        return f !== void 0 && Sa(f, `${t} has member 'signal' that`), {
          preventAbort: !!r,
          preventCancel: !!i,
          preventClose: !!u,
          signal: f
        };
      }
      function Sa(e, t) {
        if (!Ei(e))
          throw new TypeError(`${t} is not an AbortSignal.`);
      }
      function _a(e, t) {
        te(e, t);
        const r = e?.readable;
        lr(r, "readable", "ReadableWritablePair"), cr(r, `${t} has member 'readable' that`);
        const i = e?.writable;
        return lr(i, "writable", "ReadableWritablePair"), $n(i, `${t} has member 'writable' that`), { readable: r, writable: i };
      }
      class F {
        constructor(t = {}, r = {}) {
          t === void 0 ? t = null : sn(t, "First parameter");
          const i = Pt(r, "Second parameter"), u = ha(t, "First parameter");
          if ($r(this), u.type === "bytes") {
            if (i.size !== void 0)
              throw new RangeError("The strategy for a byte stream cannot have a size function");
            const f = rt(i, 0);
            mi(this, u, f);
          } else {
            const f = Tt(i), c = rt(i, 1);
            ia(this, u, c, f);
          }
        }
        /**
         * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
         */
        get locked() {
          if (!Re(this))
            throw Ie("locked");
          return Ce(this);
        }
        /**
         * Cancels the stream, signaling a loss of interest in the stream by a consumer.
         *
         * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
         * method, which might or might not use it.
         */
        cancel(t = void 0) {
          return Re(this) ? Ce(this) ? m(new TypeError("Cannot cancel a stream that already has a reader")) : K(this, t) : m(Ie("cancel"));
        }
        getReader(t = void 0) {
          if (!Re(this))
            throw Ie("getReader");
          return bi(t, "First parameter").mode === void 0 ? Fe(this) : In(this);
        }
        pipeThrough(t, r = {}) {
          if (!Re(this))
            throw Ie("pipeThrough");
          se(t, 1, "pipeThrough");
          const i = _a(t, "First parameter"), u = no(r, "Second parameter");
          if (Ce(this))
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          if (Le(i.writable))
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          const f = eo(this, i.writable, u.preventClose, u.preventAbort, u.preventCancel, u.signal);
          return x(f), i.readable;
        }
        pipeTo(t, r = {}) {
          if (!Re(this))
            return m(Ie("pipeTo"));
          if (t === void 0)
            return m("Parameter 1 is required in 'pipeTo'.");
          if (!$e(t))
            return m(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
          let i;
          try {
            i = no(r, "Second parameter");
          } catch (u) {
            return m(u);
          }
          return Ce(this) ? m(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : Le(t) ? m(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : eo(this, t, i.preventClose, i.preventAbort, i.preventCancel, i.signal);
        }
        /**
         * Tees this readable stream, returning a two-element array containing the two resulting branches as
         * new {@link ReadableStream} instances.
         *
         * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
         * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
         * propagated to the stream's underlying source.
         *
         * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
         * this could allow interference between the two branches.
         */
        tee() {
          if (!Re(this))
            throw Ie("tee");
          const t = aa(this);
          return Xe(t);
        }
        values(t = void 0) {
          if (!Re(this))
            throw Ie("values");
          const r = ga(t, "First parameter");
          return ei(this, r.preventCancel);
        }
        [br](t) {
          return this.values(t);
        }
        /**
         * Creates a new ReadableStream wrapping the provided iterable or async iterable.
         *
         * This can be used to adapt various kinds of objects into a readable stream,
         * such as an array, an async generator, or a Node.js readable stream.
         */
        static from(t) {
          return fa(t);
        }
      }
      Object.defineProperties(F, {
        from: { enumerable: !0 }
      }), Object.defineProperties(F.prototype, {
        cancel: { enumerable: !0 },
        getReader: { enumerable: !0 },
        pipeThrough: { enumerable: !0 },
        pipeTo: { enumerable: !0 },
        tee: { enumerable: !0 },
        values: { enumerable: !0 },
        locked: { enumerable: !0 }
      }), d(F.from, "from"), d(F.prototype.cancel, "cancel"), d(F.prototype.getReader, "getReader"), d(F.prototype.pipeThrough, "pipeThrough"), d(F.prototype.pipeTo, "pipeTo"), d(F.prototype.tee, "tee"), d(F.prototype.values, "values"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(F.prototype, Symbol.toStringTag, {
        value: "ReadableStream",
        configurable: !0
      }), Object.defineProperty(F.prototype, br, {
        value: F.prototype.values,
        writable: !0,
        configurable: !0
      });
      function at(e, t, r, i = 1, u = () => 1) {
        const f = Object.create(F.prototype);
        $r(f);
        const c = Object.create(ce.prototype);
        return ro(f, c, e, t, r, i, u), f;
      }
      function oo(e, t, r) {
        const i = Object.create(F.prototype);
        $r(i);
        const u = Object.create(ue.prototype);
        return qn(i, u, e, t, r, 0, void 0), i;
      }
      function $r(e) {
        e._state = "readable", e._reader = void 0, e._storedError = void 0, e._disturbed = !1;
      }
      function Re(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_readableStreamController") ? !1 : e instanceof F;
      }
      function Ce(e) {
        return e._reader !== void 0;
      }
      function K(e, t) {
        if (e._disturbed = !0, e._state === "closed")
          return w(void 0);
        if (e._state === "errored")
          return m(e._storedError);
        st(e);
        const r = e._reader;
        if (r !== void 0 && Be(r)) {
          const u = r._readIntoRequests;
          r._readIntoRequests = new L(), u.forEach((f) => {
            f._closeSteps(void 0);
          });
        }
        const i = e._readableStreamController[rr](t);
        return I(i, s);
      }
      function st(e) {
        e._state = "closed";
        const t = e._reader;
        if (t !== void 0 && (on(t), ye(t))) {
          const r = t._readRequests;
          t._readRequests = new L(), r.forEach((i) => {
            i._closeSteps();
          });
        }
      }
      function io(e, t) {
        e._state = "errored", e._storedError = t;
        const r = e._reader;
        r !== void 0 && (sr(r, t), ye(r) ? cn(r, t) : zn(r, t));
      }
      function Ie(e) {
        return new TypeError(`ReadableStream.prototype.${e} can only be used on a ReadableStream`);
      }
      function ao(e, t) {
        te(e, t);
        const r = e?.highWaterMark;
        return lr(r, "highWaterMark", "QueuingStrategyInit"), {
          highWaterMark: ur(r)
        };
      }
      const so = (e) => e.byteLength;
      d(so, "size");
      class Ft {
        constructor(t) {
          se(t, 1, "ByteLengthQueuingStrategy"), t = ao(t, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = t.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!uo(this))
            throw lo("highWaterMark");
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by returning the value of its `byteLength` property.
         */
        get size() {
          if (!uo(this))
            throw lo("size");
          return so;
        }
      }
      Object.defineProperties(Ft.prototype, {
        highWaterMark: { enumerable: !0 },
        size: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Ft.prototype, Symbol.toStringTag, {
        value: "ByteLengthQueuingStrategy",
        configurable: !0
      });
      function lo(e) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${e} can only be used on a ByteLengthQueuingStrategy`);
      }
      function uo(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_byteLengthQueuingStrategyHighWaterMark") ? !1 : e instanceof Ft;
      }
      const fo = () => 1;
      d(fo, "size");
      class zt {
        constructor(t) {
          se(t, 1, "CountQueuingStrategy"), t = ao(t, "First parameter"), this._countQueuingStrategyHighWaterMark = t.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!ho(this))
            throw co("highWaterMark");
          return this._countQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by always returning 1.
         * This ensures that the total queue size is a count of the number of chunks in the queue.
         */
        get size() {
          if (!ho(this))
            throw co("size");
          return fo;
        }
      }
      Object.defineProperties(zt.prototype, {
        highWaterMark: { enumerable: !0 },
        size: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(zt.prototype, Symbol.toStringTag, {
        value: "CountQueuingStrategy",
        configurable: !0
      });
      function co(e) {
        return new TypeError(`CountQueuingStrategy.prototype.${e} can only be used on a CountQueuingStrategy`);
      }
      function ho(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_countQueuingStrategyHighWaterMark") ? !1 : e instanceof zt;
      }
      function wa(e, t) {
        te(e, t);
        const r = e?.cancel, i = e?.flush, u = e?.readableType, f = e?.start, c = e?.transform, p = e?.writableType;
        return {
          cancel: r === void 0 ? void 0 : Pa(r, e, `${t} has member 'cancel' that`),
          flush: i === void 0 ? void 0 : Ra(i, e, `${t} has member 'flush' that`),
          readableType: u,
          start: f === void 0 ? void 0 : Ca(f, e, `${t} has member 'start' that`),
          transform: c === void 0 ? void 0 : Ta(c, e, `${t} has member 'transform' that`),
          writableType: p
        };
      }
      function Ra(e, t, r) {
        return Q(e, r), (i) => O(e, t, [i]);
      }
      function Ca(e, t, r) {
        return Q(e, r), (i) => W(e, t, [i]);
      }
      function Ta(e, t, r) {
        return Q(e, r), (i, u) => O(e, t, [i, u]);
      }
      function Pa(e, t, r) {
        return Q(e, r), (i) => O(e, t, [i]);
      }
      class $t {
        constructor(t = {}, r = {}, i = {}) {
          t === void 0 && (t = null);
          const u = Pt(r, "Second parameter"), f = Pt(i, "Third parameter"), c = wa(t, "First parameter");
          if (c.readableType !== void 0)
            throw new RangeError("Invalid readableType specified");
          if (c.writableType !== void 0)
            throw new RangeError("Invalid writableType specified");
          const p = rt(f, 0), S = Tt(f), b = rt(u, 1), R = Tt(u);
          let C;
          const E = v((Z) => {
            C = Z;
          });
          va(this, E, b, R, p, S), Aa(this, c), c.start !== void 0 ? C(c.start(this._transformStreamController)) : C(void 0);
        }
        /**
         * The readable side of the transform stream.
         */
        get readable() {
          if (!mo(this))
            throw go("readable");
          return this._readable;
        }
        /**
         * The writable side of the transform stream.
         */
        get writable() {
          if (!mo(this))
            throw go("writable");
          return this._writable;
        }
      }
      Object.defineProperties($t.prototype, {
        readable: { enumerable: !0 },
        writable: { enumerable: !0 }
      }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty($t.prototype, Symbol.toStringTag, {
        value: "TransformStream",
        configurable: !0
      });
      function va(e, t, r, i, u, f) {
        function c() {
          return t;
        }
        function p(E) {
          return Wa(e, E);
        }
        function S(E) {
          return qa(e, E);
        }
        function b() {
          return Ia(e);
        }
        e._writable = ki(c, p, b, S, r, i);
        function R() {
          return Oa(e);
        }
        function C(E) {
          return Da(e, E);
        }
        e._readable = at(c, R, C, u, f), e._backpressure = void 0, e._backpressureChangePromise = void 0, e._backpressureChangePromise_resolve = void 0, Lt(e, !0), e._transformStreamController = void 0;
      }
      function mo(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_transformStreamController") ? !1 : e instanceof $t;
      }
      function po(e, t) {
        J(e._readable._readableStreamController, t), Lr(e, t);
      }
      function Lr(e, t) {
        Mt(e._transformStreamController), nt(e._writable._writableStreamController, t), jr(e);
      }
      function jr(e) {
        e._backpressure && Lt(e, !1);
      }
      function Lt(e, t) {
        e._backpressureChangePromise !== void 0 && e._backpressureChangePromise_resolve(), e._backpressureChangePromise = v((r) => {
          e._backpressureChangePromise_resolve = r;
        }), e._backpressure = t;
      }
      class Te {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the readable side’s internal queue. It can be negative, if the queue is over-full.
         */
        get desiredSize() {
          if (!jt(this))
            throw Nt("desiredSize");
          const t = this._controlledTransformStream._readable._readableStreamController;
          return zr(t);
        }
        enqueue(t = void 0) {
          if (!jt(this))
            throw Nt("enqueue");
          bo(this, t);
        }
        /**
         * Errors both the readable side and the writable side of the controlled transform stream, making all future
         * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
         */
        error(t = void 0) {
          if (!jt(this))
            throw Nt("error");
          Ba(this, t);
        }
        /**
         * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
         * transformer only needs to consume a portion of the chunks written to the writable side.
         */
        terminate() {
          if (!jt(this))
            throw Nt("terminate");
          ka(this);
        }
      }
      Object.defineProperties(Te.prototype, {
        enqueue: { enumerable: !0 },
        error: { enumerable: !0 },
        terminate: { enumerable: !0 },
        desiredSize: { enumerable: !0 }
      }), d(Te.prototype.enqueue, "enqueue"), d(Te.prototype.error, "error"), d(Te.prototype.terminate, "terminate"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Te.prototype, Symbol.toStringTag, {
        value: "TransformStreamDefaultController",
        configurable: !0
      });
      function jt(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledTransformStream") ? !1 : e instanceof Te;
      }
      function Ea(e, t, r, i, u) {
        t._controlledTransformStream = e, e._transformStreamController = t, t._transformAlgorithm = r, t._flushAlgorithm = i, t._cancelAlgorithm = u, t._finishPromise = void 0, t._finishPromise_resolve = void 0, t._finishPromise_reject = void 0;
      }
      function Aa(e, t) {
        const r = Object.create(Te.prototype);
        let i, u, f;
        t.transform !== void 0 ? i = (c) => t.transform(c, r) : i = (c) => {
          try {
            return bo(r, c), w(void 0);
          } catch (p) {
            return m(p);
          }
        }, t.flush !== void 0 ? u = () => t.flush(r) : u = () => w(void 0), t.cancel !== void 0 ? f = (c) => t.cancel(c) : f = () => w(void 0), Ea(e, r, i, u, f);
      }
      function Mt(e) {
        e._transformAlgorithm = void 0, e._flushAlgorithm = void 0, e._cancelAlgorithm = void 0;
      }
      function bo(e, t) {
        const r = e._controlledTransformStream, i = r._readable._readableStreamController;
        if (!Ne(i))
          throw new TypeError("Readable side is not in a state that permits enqueue");
        try {
          Me(i, t);
        } catch (f) {
          throw Lr(r, f), r._readable._storedError;
        }
        oa(i) !== r._backpressure && Lt(r, !0);
      }
      function Ba(e, t) {
        po(e._controlledTransformStream, t);
      }
      function yo(e, t) {
        const r = e._transformAlgorithm(t);
        return I(r, void 0, (i) => {
          throw po(e._controlledTransformStream, i), i;
        });
      }
      function ka(e) {
        const t = e._controlledTransformStream, r = t._readable._readableStreamController;
        qe(r);
        const i = new TypeError("TransformStream terminated");
        Lr(t, i);
      }
      function Wa(e, t) {
        const r = e._transformStreamController;
        if (e._backpressure) {
          const i = e._backpressureChangePromise;
          return I(i, () => {
            const u = e._writable;
            if (u._state === "erroring")
              throw u._storedError;
            return yo(r, t);
          });
        }
        return yo(r, t);
      }
      function qa(e, t) {
        const r = e._transformStreamController;
        if (r._finishPromise !== void 0)
          return r._finishPromise;
        const i = e._readable;
        r._finishPromise = v((f, c) => {
          r._finishPromise_resolve = f, r._finishPromise_reject = c;
        });
        const u = r._cancelAlgorithm(t);
        return Mt(r), y(u, () => (i._state === "errored" ? Ue(r, i._storedError) : (J(i._readableStreamController, t), Mr(r)), null), (f) => (J(i._readableStreamController, f), Ue(r, f), null)), r._finishPromise;
      }
      function Ia(e) {
        const t = e._transformStreamController;
        if (t._finishPromise !== void 0)
          return t._finishPromise;
        const r = e._readable;
        t._finishPromise = v((u, f) => {
          t._finishPromise_resolve = u, t._finishPromise_reject = f;
        });
        const i = t._flushAlgorithm();
        return Mt(t), y(i, () => (r._state === "errored" ? Ue(t, r._storedError) : (qe(r._readableStreamController), Mr(t)), null), (u) => (J(r._readableStreamController, u), Ue(t, u), null)), t._finishPromise;
      }
      function Oa(e) {
        return Lt(e, !1), e._backpressureChangePromise;
      }
      function Da(e, t) {
        const r = e._transformStreamController;
        if (r._finishPromise !== void 0)
          return r._finishPromise;
        const i = e._writable;
        r._finishPromise = v((f, c) => {
          r._finishPromise_resolve = f, r._finishPromise_reject = c;
        });
        const u = r._cancelAlgorithm(t);
        return Mt(r), y(u, () => (i._state === "errored" ? Ue(r, i._storedError) : (nt(i._writableStreamController, t), jr(e), Mr(r)), null), (f) => (nt(i._writableStreamController, f), jr(e), Ue(r, f), null)), r._finishPromise;
      }
      function Nt(e) {
        return new TypeError(`TransformStreamDefaultController.prototype.${e} can only be used on a TransformStreamDefaultController`);
      }
      function Mr(e) {
        e._finishPromise_resolve !== void 0 && (e._finishPromise_resolve(), e._finishPromise_resolve = void 0, e._finishPromise_reject = void 0);
      }
      function Ue(e, t) {
        e._finishPromise_reject !== void 0 && (x(e._finishPromise), e._finishPromise_reject(t), e._finishPromise_resolve = void 0, e._finishPromise_reject = void 0);
      }
      function go(e) {
        return new TypeError(`TransformStream.prototype.${e} can only be used on a TransformStream`);
      }
      o.ByteLengthQueuingStrategy = Ft, o.CountQueuingStrategy = zt, o.ReadableByteStreamController = ue, o.ReadableStream = F, o.ReadableStreamBYOBReader = _e, o.ReadableStreamBYOBRequest = ve, o.ReadableStreamDefaultController = ce, o.ReadableStreamDefaultReader = be, o.TransformStream = $t, o.TransformStreamDefaultController = Te, o.WritableStream = we, o.WritableStreamDefaultController = je, o.WritableStreamDefaultWriter = fe;
    });
  }(xt, xt.exports)), xt.exports;
}
const Ja = 65536;
if (!globalThis.ReadableStream)
  try {
    const a = require("node:process"), { emitWarning: n } = a;
    try {
      a.emitWarning = () => {
      }, Object.assign(globalThis, require("node:stream/web")), a.emitWarning = n;
    } catch (o) {
      throw a.emitWarning = n, o;
    }
  } catch {
    Object.assign(globalThis, Ga());
  }
try {
  const { Blob: a } = require("buffer");
  a && !a.prototype.stream && (a.prototype.stream = function(o) {
    let s = 0;
    const l = this;
    return new ReadableStream({
      type: "bytes",
      async pull(h) {
        const T = await l.slice(s, Math.min(l.size, s + Ja)).arrayBuffer();
        s += T.byteLength, h.enqueue(new Uint8Array(T)), s === l.size && h.close();
      }
    });
  });
} catch {
}
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
const Ro = 65536;
async function* xr(a, n = !0) {
  for (const o of a)
    if ("stream" in o)
      yield* (
        /** @type {AsyncIterableIterator<Uint8Array>} */
        o.stream()
      );
    else if (ArrayBuffer.isView(o))
      if (n) {
        let s = o.byteOffset;
        const l = o.byteOffset + o.byteLength;
        for (; s !== l; ) {
          const h = Math.min(l - s, Ro), d = o.buffer.slice(s, s + h);
          s += d.byteLength, yield new Uint8Array(d);
        }
      } else
        yield o;
    else {
      let s = 0, l = (
        /** @type {Blob} */
        o
      );
      for (; s !== l.size; ) {
        const d = await l.slice(s, Math.min(l.size, s + Ro)).arrayBuffer();
        s += d.byteLength, yield new Uint8Array(d);
      }
    }
}
const Oo = class Yr {
  /** @type {Array.<(Blob|Uint8Array)>} */
  #e = [];
  #t = "";
  #r = 0;
  #n = "transparent";
  /**
   * The Blob() constructor returns a new Blob object. The content
   * of the blob consists of the concatenation of the values given
   * in the parameter array.
   *
   * @param {*} blobParts
   * @param {{ type?: string, endings?: string }} [options]
   */
  constructor(n = [], o = {}) {
    if (typeof n != "object" || n === null)
      throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
    if (typeof n[Symbol.iterator] != "function")
      throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
    if (typeof o != "object" && typeof o != "function")
      throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
    o === null && (o = {});
    const s = new TextEncoder();
    for (const h of n) {
      let d;
      ArrayBuffer.isView(h) ? d = new Uint8Array(h.buffer.slice(h.byteOffset, h.byteOffset + h.byteLength)) : h instanceof ArrayBuffer ? d = new Uint8Array(h.slice(0)) : h instanceof Yr ? d = h : d = s.encode(`${h}`), this.#r += ArrayBuffer.isView(d) ? d.byteLength : d.size, this.#e.push(d);
    }
    this.#n = `${o.endings === void 0 ? "transparent" : o.endings}`;
    const l = o.type === void 0 ? "" : String(o.type);
    this.#t = /^[\x20-\x7E]*$/.test(l) ? l : "";
  }
  /**
   * The Blob interface's size property returns the
   * size of the Blob in bytes.
   */
  get size() {
    return this.#r;
  }
  /**
   * The type property of a Blob object returns the MIME type of the file.
   */
  get type() {
    return this.#t;
  }
  /**
   * The text() method in the Blob interface returns a Promise
   * that resolves with a string containing the contents of
   * the blob, interpreted as UTF-8.
   *
   * @return {Promise<string>}
   */
  async text() {
    const n = new TextDecoder();
    let o = "";
    for await (const s of xr(this.#e, !1))
      o += n.decode(s, { stream: !0 });
    return o += n.decode(), o;
  }
  /**
   * The arrayBuffer() method in the Blob interface returns a
   * Promise that resolves with the contents of the blob as
   * binary data contained in an ArrayBuffer.
   *
   * @return {Promise<ArrayBuffer>}
   */
  async arrayBuffer() {
    const n = new Uint8Array(this.size);
    let o = 0;
    for await (const s of xr(this.#e, !1))
      n.set(s, o), o += s.length;
    return n.buffer;
  }
  stream() {
    const n = xr(this.#e, !0);
    return new globalThis.ReadableStream({
      // @ts-ignore
      type: "bytes",
      async pull(o) {
        const s = await n.next();
        s.done ? o.close() : o.enqueue(s.value);
      },
      async cancel() {
        await n.return();
      }
    });
  }
  /**
   * The Blob interface's slice() method creates and returns a
   * new Blob object which contains data from a subset of the
   * blob on which it's called.
   *
   * @param {number} [start]
   * @param {number} [end]
   * @param {string} [type]
   */
  slice(n = 0, o = this.size, s = "") {
    const { size: l } = this;
    let h = n < 0 ? Math.max(l + n, 0) : Math.min(n, l), d = o < 0 ? Math.max(l + o, 0) : Math.min(o, l);
    const T = Math.max(d - h, 0), B = this.#e, _ = [];
    let v = 0;
    for (const m of B) {
      if (v >= T)
        break;
      const k = ArrayBuffer.isView(m) ? m.byteLength : m.size;
      if (h && k <= h)
        h -= k, d -= k;
      else {
        let y;
        ArrayBuffer.isView(m) ? (y = m.subarray(h, Math.min(k, d)), v += y.byteLength) : (y = m.slice(h, Math.min(k, d)), v += y.size), d -= k, _.push(y), h = 0;
      }
    }
    const w = new Yr([], { type: String(s).toLowerCase() });
    return w.#r = T, w.#e = _, w;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](n) {
    return n && typeof n == "object" && typeof n.constructor == "function" && (typeof n.stream == "function" || typeof n.arrayBuffer == "function") && /^(Blob|File)$/.test(n[Symbol.toStringTag]);
  }
};
Object.defineProperties(Oo.prototype, {
  size: { enumerable: !0 },
  type: { enumerable: !0 },
  slice: { enumerable: !0 }
});
const Ka = Oo, Gt = Ka, Za = class extends Gt {
  #e = 0;
  #t = "";
  /**
   * @param {*[]} fileBits
   * @param {string} fileName
   * @param {{lastModified?: number, type?: string}} options
   */
  // @ts-ignore
  constructor(n, o, s = {}) {
    if (arguments.length < 2)
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
    super(n, s), s === null && (s = {});
    const l = s.lastModified === void 0 ? Date.now() : Number(s.lastModified);
    Number.isNaN(l) || (this.#e = l), this.#t = String(o);
  }
  get name() {
    return this.#t;
  }
  get lastModified() {
    return this.#e;
  }
  get [Symbol.toStringTag]() {
    return "File";
  }
  static [Symbol.hasInstance](n) {
    return !!n && n instanceof Gt && /^(File)$/.test(n[Symbol.toStringTag]);
  }
}, Xa = Za;
/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
var { toStringTag: ut, iterator: es, hasInstance: ts } = Symbol, Co = Math.random, rs = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(","), To = (a, n, o) => (a += "", /^(Blob|File)$/.test(n && n[ut]) ? [(o = o !== void 0 ? o + "" : n[ut] == "File" ? n.name : "blob", a), n.name !== o || n[ut] == "blob" ? new Xa([n], o, n) : n] : [a, n + ""]), Hr = (a, n) => (n ? a : a.replace(/\r?\n|\r/g, `\r
`)).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22"), Oe = (a, n, o) => {
  if (n.length < o)
    throw new TypeError(`Failed to execute '${a}' on 'FormData': ${o} arguments required, but only ${n.length} present.`);
};
const Gr = class {
  #e = [];
  constructor(...n) {
    if (n.length)
      throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.");
  }
  get [ut]() {
    return "FormData";
  }
  [es]() {
    return this.entries();
  }
  static [ts](n) {
    return n && typeof n == "object" && n[ut] === "FormData" && !rs.some((o) => typeof n[o] != "function");
  }
  append(...n) {
    Oe("append", arguments, 2), this.#e.push(To(...n));
  }
  delete(n) {
    Oe("delete", arguments, 1), n += "", this.#e = this.#e.filter(([o]) => o !== n);
  }
  get(n) {
    Oe("get", arguments, 1), n += "";
    for (var o = this.#e, s = o.length, l = 0; l < s; l++)
      if (o[l][0] === n)
        return o[l][1];
    return null;
  }
  getAll(n, o) {
    return Oe("getAll", arguments, 1), o = [], n += "", this.#e.forEach((s) => s[0] === n && o.push(s[1])), o;
  }
  has(n) {
    return Oe("has", arguments, 1), n += "", this.#e.some((o) => o[0] === n);
  }
  forEach(n, o) {
    Oe("forEach", arguments, 1);
    for (var [s, l] of this)
      n.call(o, l, s, this);
  }
  set(...n) {
    Oe("set", arguments, 2);
    var o = [], s = !0;
    n = To(...n), this.#e.forEach((l) => {
      l[0] === n[0] ? s && (s = !o.push(n)) : o.push(l);
    }), s && o.push(n), this.#e = o;
  }
  *entries() {
    yield* this.#e;
  }
  *keys() {
    for (var [n] of this)
      yield n;
  }
  *values() {
    for (var [, n] of this)
      yield n;
  }
};
function ns(a, n = Gt) {
  var o = `${Co()}${Co()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), s = [], l = `--${o}\r
Content-Disposition: form-data; name="`;
  return a.forEach((h, d) => typeof h == "string" ? s.push(l + Hr(d) + `"\r
\r
${h.replace(/\r(?!\n)|(?<!\r)\n/g, `\r
`)}\r
`) : s.push(l + Hr(d) + `"; filename="${Hr(h.name, 1)}"\r
Content-Type: ${h.type || "application/octet-stream"}\r
\r
`, h, `\r
`)), s.push(`--${o}--`), new n(s, { type: "multipart/form-data; boundary=" + o });
}
class er extends Error {
  constructor(n, o) {
    super(n), Error.captureStackTrace(this, this.constructor), this.type = o;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class ee extends er {
  /**
   * @param  {string} message -      Error message for human
   * @param  {string} [type] -        Error type for machine
   * @param  {SystemError} [systemError] - For Node.js system error
   */
  constructor(n, o, s) {
    super(n, o), s && (this.code = this.errno = s.code, this.erroredSysCall = s.syscall);
  }
}
const Jt = Symbol.toStringTag, Do = (a) => typeof a == "object" && typeof a.append == "function" && typeof a.delete == "function" && typeof a.get == "function" && typeof a.getAll == "function" && typeof a.has == "function" && typeof a.set == "function" && typeof a.sort == "function" && a[Jt] === "URLSearchParams", Kt = (a) => a && typeof a == "object" && typeof a.arrayBuffer == "function" && typeof a.type == "string" && typeof a.stream == "function" && typeof a.constructor == "function" && /^(Blob|File)$/.test(a[Jt]), os = (a) => typeof a == "object" && (a[Jt] === "AbortSignal" || a[Jt] === "EventTarget"), is = (a, n) => {
  const o = new URL(n).hostname, s = new URL(a).hostname;
  return o === s || o.endsWith(`.${s}`);
}, as = (a, n) => {
  const o = new URL(n).protocol, s = new URL(a).protocol;
  return o === s;
}, ss = za(ne.pipeline), N = Symbol("Body internals");
class ct {
  constructor(n, {
    size: o = 0
  } = {}) {
    let s = null;
    n === null ? n = null : Do(n) ? n = z.from(n.toString()) : Kt(n) || z.isBuffer(n) || (Yt.isAnyArrayBuffer(n) ? n = z.from(n) : ArrayBuffer.isView(n) ? n = z.from(n.buffer, n.byteOffset, n.byteLength) : n instanceof ne || (n instanceof Gr ? (n = ns(n), s = n.type.split("=")[1]) : n = z.from(String(n))));
    let l = n;
    z.isBuffer(n) ? l = ne.Readable.from(n) : Kt(n) && (l = ne.Readable.from(n.stream())), this[N] = {
      body: n,
      stream: l,
      boundary: s,
      disturbed: !1,
      error: null
    }, this.size = o, n instanceof ne && n.on("error", (h) => {
      const d = h instanceof er ? h : new ee(`Invalid response body while trying to fetch ${this.url}: ${h.message}`, "system", h);
      this[N].error = d;
    });
  }
  get body() {
    return this[N].stream;
  }
  get bodyUsed() {
    return this[N].disturbed;
  }
  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */
  async arrayBuffer() {
    const { buffer: n, byteOffset: o, byteLength: s } = await Vr(this);
    return n.slice(o, o + s);
  }
  async formData() {
    const n = this.headers.get("content-type");
    if (n.startsWith("application/x-www-form-urlencoded")) {
      const s = new Gr(), l = new URLSearchParams(await this.text());
      for (const [h, d] of l)
        s.append(h, d);
      return s;
    }
    const { toFormData: o } = await import("./multipart-parser-f4ff47d0.js");
    return o(this.body, n);
  }
  /**
   * Return raw response as Blob
   *
   * @return Promise
   */
  async blob() {
    const n = this.headers && this.headers.get("content-type") || this[N].body && this[N].body.type || "", o = await this.arrayBuffer();
    return new Gt([o], {
      type: n
    });
  }
  /**
   * Decode response as json
   *
   * @return  Promise
   */
  async json() {
    const n = await this.text();
    return JSON.parse(n);
  }
  /**
   * Decode response as text
   *
   * @return  Promise
   */
  async text() {
    const n = await Vr(this);
    return new TextDecoder().decode(n);
  }
  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */
  buffer() {
    return Vr(this);
  }
}
ct.prototype.buffer = Xt(ct.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer");
Object.defineProperties(ct.prototype, {
  body: { enumerable: !0 },
  bodyUsed: { enumerable: !0 },
  arrayBuffer: { enumerable: !0 },
  blob: { enumerable: !0 },
  json: { enumerable: !0 },
  text: { enumerable: !0 },
  data: { get: Xt(
    () => {
    },
    "data doesn't exist, use json(), text(), arrayBuffer(), or body instead",
    "https://github.com/node-fetch/node-fetch/issues/1000 (response)"
  ) }
});
async function Vr(a) {
  if (a[N].disturbed)
    throw new TypeError(`body used already for: ${a.url}`);
  if (a[N].disturbed = !0, a[N].error)
    throw a[N].error;
  const { body: n } = a;
  if (n === null)
    return z.alloc(0);
  if (!(n instanceof ne))
    return z.alloc(0);
  const o = [];
  let s = 0;
  try {
    for await (const l of n) {
      if (a.size > 0 && s + l.length > a.size) {
        const h = new ee(`content size at ${a.url} over limit: ${a.size}`, "max-size");
        throw n.destroy(h), h;
      }
      s += l.length, o.push(l);
    }
  } catch (l) {
    throw l instanceof er ? l : new ee(`Invalid response body while trying to fetch ${a.url}: ${l.message}`, "system", l);
  }
  if (n.readableEnded === !0 || n._readableState.ended === !0)
    try {
      return o.every((l) => typeof l == "string") ? z.from(o.join("")) : z.concat(o, s);
    } catch (l) {
      throw new ee(`Could not create Buffer from response body for ${a.url}: ${l.message}`, "system", l);
    }
  else
    throw new ee(`Premature close of server response while trying to fetch ${a.url}`);
}
const Xr = (a, n) => {
  let o, s, { body: l } = a[N];
  if (a.bodyUsed)
    throw new Error("cannot clone body after it is used");
  return l instanceof ne && typeof l.getBoundary != "function" && (o = new Qt({ highWaterMark: n }), s = new Qt({ highWaterMark: n }), l.pipe(o), l.pipe(s), a[N].stream = o, l = s), l;
}, ls = Xt(
  (a) => a.getBoundary(),
  "form-data doesn't follow the spec and requires special treatment. Use alternative package",
  "https://github.com/node-fetch/node-fetch/issues/1167"
), Fo = (a, n) => a === null ? null : typeof a == "string" ? "text/plain;charset=UTF-8" : Do(a) ? "application/x-www-form-urlencoded;charset=UTF-8" : Kt(a) ? a.type || null : z.isBuffer(a) || Yt.isAnyArrayBuffer(a) || ArrayBuffer.isView(a) ? null : a instanceof Gr ? `multipart/form-data; boundary=${n[N].boundary}` : a && typeof a.getBoundary == "function" ? `multipart/form-data;boundary=${ls(a)}` : a instanceof ne ? null : "text/plain;charset=UTF-8", us = (a) => {
  const { body: n } = a[N];
  return n === null ? 0 : Kt(n) ? n.size : z.isBuffer(n) ? n.length : n && typeof n.getLengthSync == "function" && n.hasKnownLength && n.hasKnownLength() ? n.getLengthSync() : null;
}, fs = async (a, { body: n }) => {
  n === null ? a.end() : await ss(n, a);
}, Ht = typeof ft.validateHeaderName == "function" ? ft.validateHeaderName : (a) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(a)) {
    const n = new TypeError(`Header name must be a valid HTTP token [${a}]`);
    throw Object.defineProperty(n, "code", { value: "ERR_INVALID_HTTP_TOKEN" }), n;
  }
}, Jr = typeof ft.validateHeaderValue == "function" ? ft.validateHeaderValue : (a, n) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(n)) {
    const o = new TypeError(`Invalid character in header content ["${a}"]`);
    throw Object.defineProperty(o, "code", { value: "ERR_INVALID_CHAR" }), o;
  }
};
class me extends URLSearchParams {
  /**
   * Headers class
   *
   * @constructor
   * @param {HeadersInit} [init] - Response headers
   */
  constructor(n) {
    let o = [];
    if (n instanceof me) {
      const s = n.raw();
      for (const [l, h] of Object.entries(s))
        o.push(...h.map((d) => [l, d]));
    } else if (n != null)
      if (typeof n == "object" && !Yt.isBoxedPrimitive(n)) {
        const s = n[Symbol.iterator];
        if (s == null)
          o.push(...Object.entries(n));
        else {
          if (typeof s != "function")
            throw new TypeError("Header pairs must be iterable");
          o = [...n].map((l) => {
            if (typeof l != "object" || Yt.isBoxedPrimitive(l))
              throw new TypeError("Each header pair must be an iterable object");
            return [...l];
          }).map((l) => {
            if (l.length !== 2)
              throw new TypeError("Each header pair must be a name/value tuple");
            return [...l];
          });
        }
      } else
        throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    return o = o.length > 0 ? o.map(([s, l]) => (Ht(s), Jr(s, String(l)), [String(s).toLowerCase(), String(l)])) : void 0, super(o), new Proxy(this, {
      get(s, l, h) {
        switch (l) {
          case "append":
          case "set":
            return (d, T) => (Ht(d), Jr(d, String(T)), URLSearchParams.prototype[l].call(
              s,
              String(d).toLowerCase(),
              String(T)
            ));
          case "delete":
          case "has":
          case "getAll":
            return (d) => (Ht(d), URLSearchParams.prototype[l].call(
              s,
              String(d).toLowerCase()
            ));
          case "keys":
            return () => (s.sort(), new Set(URLSearchParams.prototype.keys.call(s)).keys());
          default:
            return Reflect.get(s, l, h);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(n) {
    const o = this.getAll(n);
    if (o.length === 0)
      return null;
    let s = o.join(", ");
    return /^content-encoding$/i.test(n) && (s = s.toLowerCase()), s;
  }
  forEach(n, o = void 0) {
    for (const s of this.keys())
      Reflect.apply(n, o, [this.get(s), s, this]);
  }
  *values() {
    for (const n of this.keys())
      yield this.get(n);
  }
  /**
   * @type {() => IterableIterator<[string, string]>}
   */
  *entries() {
    for (const n of this.keys())
      yield [n, this.get(n)];
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * Node-fetch non-spec method
   * returning all headers and their values as array
   * @returns {Record<string, string[]>}
   */
  raw() {
    return [...this.keys()].reduce((n, o) => (n[o] = this.getAll(o), n), {});
  }
  /**
   * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((n, o) => {
      const s = this.getAll(o);
      return o === "host" ? n[o] = s[0] : n[o] = s.length > 1 ? s : s[0], n;
    }, {});
  }
}
Object.defineProperties(
  me.prototype,
  ["get", "entries", "forEach", "values"].reduce((a, n) => (a[n] = { enumerable: !0 }, a), {})
);
function cs(a = []) {
  return new me(
    a.reduce((n, o, s, l) => (s % 2 === 0 && n.push(l.slice(s, s + 2)), n), []).filter(([n, o]) => {
      try {
        return Ht(n), Jr(n, String(o)), !0;
      } catch {
        return !1;
      }
    })
  );
}
const ds = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]), zo = (a) => ds.has(a), X = Symbol("Response internals");
class V extends ct {
  constructor(n = null, o = {}) {
    super(n, o);
    const s = o.status != null ? o.status : 200, l = new me(o.headers);
    if (n !== null && !l.has("Content-Type")) {
      const h = Fo(n, this);
      h && l.append("Content-Type", h);
    }
    this[X] = {
      type: "default",
      url: o.url,
      status: s,
      statusText: o.statusText || "",
      headers: l,
      counter: o.counter,
      highWaterMark: o.highWaterMark
    };
  }
  get type() {
    return this[X].type;
  }
  get url() {
    return this[X].url || "";
  }
  get status() {
    return this[X].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */
  get ok() {
    return this[X].status >= 200 && this[X].status < 300;
  }
  get redirected() {
    return this[X].counter > 0;
  }
  get statusText() {
    return this[X].statusText;
  }
  get headers() {
    return this[X].headers;
  }
  get highWaterMark() {
    return this[X].highWaterMark;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */
  clone() {
    return new V(Xr(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark
    });
  }
  /**
   * @param {string} url    The URL that the new response is to originate from.
   * @param {number} status An optional status code for the response (e.g., 302.)
   * @returns {Response}    A Response object.
   */
  static redirect(n, o = 302) {
    if (!zo(o))
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    return new V(null, {
      headers: {
        location: new URL(n).toString()
      },
      status: o
    });
  }
  static error() {
    const n = new V(null, { status: 0, statusText: "" });
    return n[X].type = "error", n;
  }
  static json(n = void 0, o = {}) {
    const s = JSON.stringify(n);
    if (s === void 0)
      throw new TypeError("data is not JSON serializable");
    const l = new me(o && o.headers);
    return l.has("content-type") || l.set("content-type", "application/json"), new V(s, {
      ...o,
      headers: l
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(V.prototype, {
  type: { enumerable: !0 },
  url: { enumerable: !0 },
  status: { enumerable: !0 },
  ok: { enumerable: !0 },
  redirected: { enumerable: !0 },
  statusText: { enumerable: !0 },
  headers: { enumerable: !0 },
  clone: { enumerable: !0 }
});
const hs = (a) => {
  if (a.search)
    return a.search;
  const n = a.href.length - 1, o = a.hash || (a.href[n] === "#" ? "#" : "");
  return a.href[n - o.length] === "?" ? "?" : "";
};
function Po(a, n = !1) {
  return a == null || (a = new URL(a), /^(about|blob|data):$/.test(a.protocol)) ? "no-referrer" : (a.username = "", a.password = "", a.hash = "", n && (a.pathname = "", a.search = ""), a);
}
const $o = /* @__PURE__ */ new Set([
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
]), ms = "strict-origin-when-cross-origin";
function ps(a) {
  if (!$o.has(a))
    throw new TypeError(`Invalid referrerPolicy: ${a}`);
  return a;
}
function bs(a) {
  if (/^(http|ws)s:$/.test(a.protocol))
    return !0;
  const n = a.host.replace(/(^\[)|(]$)/g, ""), o = La(n);
  return o === 4 && /^127\./.test(n) || o === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(n) ? !0 : a.host === "localhost" || a.host.endsWith(".localhost") ? !1 : a.protocol === "file:";
}
function Je(a) {
  return /^about:(blank|srcdoc)$/.test(a) || a.protocol === "data:" || /^(blob|filesystem):$/.test(a.protocol) ? !0 : bs(a);
}
function ys(a, { referrerURLCallback: n, referrerOriginCallback: o } = {}) {
  if (a.referrer === "no-referrer" || a.referrerPolicy === "")
    return null;
  const s = a.referrerPolicy;
  if (a.referrer === "about:client")
    return "no-referrer";
  const l = a.referrer;
  let h = Po(l), d = Po(l, !0);
  h.toString().length > 4096 && (h = d), n && (h = n(h)), o && (d = o(d));
  const T = new URL(a.url);
  switch (s) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return d;
    case "unsafe-url":
      return h;
    case "strict-origin":
      return Je(h) && !Je(T) ? "no-referrer" : d.toString();
    case "strict-origin-when-cross-origin":
      return h.origin === T.origin ? h : Je(h) && !Je(T) ? "no-referrer" : d;
    case "same-origin":
      return h.origin === T.origin ? h : "no-referrer";
    case "origin-when-cross-origin":
      return h.origin === T.origin ? h : d;
    case "no-referrer-when-downgrade":
      return Je(h) && !Je(T) ? "no-referrer" : h;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${s}`);
  }
}
function gs(a) {
  const n = (a.get("referrer-policy") || "").split(/[,\s]+/);
  let o = "";
  for (const s of n)
    s && $o.has(s) && (o = s);
  return o;
}
const D = Symbol("Request internals"), lt = (a) => typeof a == "object" && typeof a[D] == "object", Ss = Xt(
  () => {
  },
  ".data is not a valid RequestInit property, use .body instead",
  "https://github.com/node-fetch/node-fetch/issues/1000 (request)"
);
class dt extends ct {
  constructor(n, o = {}) {
    let s;
    if (lt(n) ? s = new URL(n.url) : (s = new URL(n), n = {}), s.username !== "" || s.password !== "")
      throw new TypeError(`${s} is an url with embedded credentials.`);
    let l = o.method || n.method || "GET";
    if (/^(delete|get|head|options|post|put)$/i.test(l) && (l = l.toUpperCase()), !lt(o) && "data" in o && Ss(), (o.body != null || lt(n) && n.body !== null) && (l === "GET" || l === "HEAD"))
      throw new TypeError("Request with GET/HEAD method cannot have body");
    const h = o.body ? o.body : lt(n) && n.body !== null ? Xr(n) : null;
    super(h, {
      size: o.size || n.size || 0
    });
    const d = new me(o.headers || n.headers || {});
    if (h !== null && !d.has("Content-Type")) {
      const _ = Fo(h, this);
      _ && d.set("Content-Type", _);
    }
    let T = lt(n) ? n.signal : null;
    if ("signal" in o && (T = o.signal), T != null && !os(T))
      throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
    let B = o.referrer == null ? n.referrer : o.referrer;
    if (B === "")
      B = "no-referrer";
    else if (B) {
      const _ = new URL(B);
      B = /^about:(\/\/)?client$/.test(_) ? "client" : _;
    } else
      B = void 0;
    this[D] = {
      method: l,
      redirect: o.redirect || n.redirect || "follow",
      headers: d,
      parsedURL: s,
      signal: T,
      referrer: B
    }, this.follow = o.follow === void 0 ? n.follow === void 0 ? 20 : n.follow : o.follow, this.compress = o.compress === void 0 ? n.compress === void 0 ? !0 : n.compress : o.compress, this.counter = o.counter || n.counter || 0, this.agent = o.agent || n.agent, this.highWaterMark = o.highWaterMark || n.highWaterMark || 16384, this.insecureHTTPParser = o.insecureHTTPParser || n.insecureHTTPParser || !1, this.referrerPolicy = o.referrerPolicy || n.referrerPolicy || "";
  }
  /** @returns {string} */
  get method() {
    return this[D].method;
  }
  /** @returns {string} */
  get url() {
    return $a(this[D].parsedURL);
  }
  /** @returns {Headers} */
  get headers() {
    return this[D].headers;
  }
  get redirect() {
    return this[D].redirect;
  }
  /** @returns {AbortSignal} */
  get signal() {
    return this[D].signal;
  }
  // https://fetch.spec.whatwg.org/#dom-request-referrer
  get referrer() {
    if (this[D].referrer === "no-referrer")
      return "";
    if (this[D].referrer === "client")
      return "about:client";
    if (this[D].referrer)
      return this[D].referrer.toString();
  }
  get referrerPolicy() {
    return this[D].referrerPolicy;
  }
  set referrerPolicy(n) {
    this[D].referrerPolicy = ps(n);
  }
  /**
   * Clone this request
   *
   * @return  Request
   */
  clone() {
    return new dt(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(dt.prototype, {
  method: { enumerable: !0 },
  url: { enumerable: !0 },
  headers: { enumerable: !0 },
  redirect: { enumerable: !0 },
  clone: { enumerable: !0 },
  signal: { enumerable: !0 },
  referrer: { enumerable: !0 },
  referrerPolicy: { enumerable: !0 }
});
const _s = (a) => {
  const { parsedURL: n } = a[D], o = new me(a[D].headers);
  o.has("Accept") || o.set("Accept", "*/*");
  let s = null;
  if (a.body === null && /^(post|put)$/i.test(a.method) && (s = "0"), a.body !== null) {
    const T = us(a);
    typeof T == "number" && !Number.isNaN(T) && (s = String(T));
  }
  s && o.set("Content-Length", s), a.referrerPolicy === "" && (a.referrerPolicy = ms), a.referrer && a.referrer !== "no-referrer" ? a[D].referrer = ys(a) : a[D].referrer = "no-referrer", a[D].referrer instanceof URL && o.set("Referer", a.referrer), o.has("User-Agent") || o.set("User-Agent", "node-fetch"), a.compress && !o.has("Accept-Encoding") && o.set("Accept-Encoding", "gzip, deflate, br");
  let { agent: l } = a;
  typeof l == "function" && (l = l(n));
  const h = hs(n), d = {
    // Overwrite search to retain trailing ? (issue #776)
    path: n.pathname + h,
    // The following options are not expressed in the URL
    method: a.method,
    headers: o[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: a.insecureHTTPParser,
    agent: l
  };
  return {
    /** @type {URL} */
    parsedURL: n,
    options: d
  };
};
class ws extends er {
  constructor(n, o = "aborted") {
    super(n, o);
  }
}
/*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
if (!globalThis.DOMException)
  try {
    const { MessageChannel: a } = require("worker_threads"), n = new a().port1, o = new ArrayBuffer();
    n.postMessage(o, [o, o]);
  } catch (a) {
    a.constructor.name === "DOMException" && (globalThis.DOMException = a.constructor);
  }
const Rs = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
async function Lo(a, n) {
  return new Promise((o, s) => {
    const l = new dt(a, n), { parsedURL: h, options: d } = _s(l);
    if (!Rs.has(h.protocol))
      throw new TypeError(`node-fetch cannot load ${a}. URL scheme "${h.protocol.replace(/:$/, "")}" is not supported.`);
    if (h.protocol === "data:") {
      const y = Ya(l.url), U = new V(y, { headers: { "Content-Type": y.typeFull } });
      o(U);
      return;
    }
    const T = (h.protocol === "https:" ? Fa : ft).request, { signal: B } = l;
    let _ = null;
    const v = () => {
      const y = new ws("The operation was aborted.");
      s(y), l.body && l.body instanceof ne.Readable && l.body.destroy(y), !(!_ || !_.body) && _.body.emit("error", y);
    };
    if (B && B.aborted) {
      v();
      return;
    }
    const w = () => {
      v(), k();
    }, m = T(h.toString(), d);
    B && B.addEventListener("abort", w);
    const k = () => {
      m.abort(), B && B.removeEventListener("abort", w);
    };
    m.on("error", (y) => {
      s(new ee(`request to ${l.url} failed, reason: ${y.message}`, "system", y)), k();
    }), Cs(m, (y) => {
      _ && _.body && _.body.destroy(y);
    }), process.version < "v14" && m.on("socket", (y) => {
      let U;
      y.prependListener("end", () => {
        U = y._eventsCount;
      }), y.prependListener("close", (q) => {
        if (_ && U < y._eventsCount && !q) {
          const I = new Error("Premature close");
          I.code = "ERR_STREAM_PREMATURE_CLOSE", _.body.emit("error", I);
        }
      });
    }), m.on("response", (y) => {
      m.setTimeout(0);
      const U = cs(y.rawHeaders);
      if (zo(y.statusCode)) {
        const W = U.get("Location");
        let O = null;
        try {
          O = W === null ? null : new URL(W, l.url);
        } catch {
          if (l.redirect !== "manual") {
            s(new ee(`uri requested responds with an invalid redirect URL: ${W}`, "invalid-redirect")), k();
            return;
          }
        }
        switch (l.redirect) {
          case "error":
            s(new ee(`uri requested responds with a redirect, redirect mode is set to error: ${l.url}`, "no-redirect")), k();
            return;
          case "manual":
            break;
          case "follow": {
            if (O === null)
              break;
            if (l.counter >= l.follow) {
              s(new ee(`maximum redirect reached at: ${l.url}`, "max-redirect")), k();
              return;
            }
            const $ = {
              headers: new me(l.headers),
              follow: l.follow,
              counter: l.counter + 1,
              agent: l.agent,
              compress: l.compress,
              method: l.method,
              body: Xr(l),
              signal: l.signal,
              size: l.size,
              referrer: l.referrer,
              referrerPolicy: l.referrerPolicy
            };
            if (!is(l.url, O) || !as(l.url, O))
              for (const ht of ["authorization", "www-authenticate", "cookie", "cookie2"])
                $.headers.delete(ht);
            if (y.statusCode !== 303 && l.body && n.body instanceof ne.Readable) {
              s(new ee("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), k();
              return;
            }
            (y.statusCode === 303 || (y.statusCode === 301 || y.statusCode === 302) && l.method === "POST") && ($.method = "GET", $.body = void 0, $.headers.delete("content-length"));
            const L = gs(U);
            L && ($.referrerPolicy = L), o(Lo(new dt(O, $))), k();
            return;
          }
          default:
            return s(new TypeError(`Redirect option '${l.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      B && y.once("end", () => {
        B.removeEventListener("abort", w);
      });
      let q = Ge(y, new Qt(), (W) => {
        W && s(W);
      });
      process.version < "v12.10" && y.on("aborted", w);
      const I = {
        url: l.url,
        status: y.statusCode,
        statusText: y.statusMessage,
        headers: U,
        size: l.size,
        counter: l.counter,
        highWaterMark: l.highWaterMark
      }, x = U.get("Content-Encoding");
      if (!l.compress || l.method === "HEAD" || x === null || y.statusCode === 204 || y.statusCode === 304) {
        _ = new V(q, I), o(_);
        return;
      }
      const ie = {
        flush: Ye.Z_SYNC_FLUSH,
        finishFlush: Ye.Z_SYNC_FLUSH
      };
      if (x === "gzip" || x === "x-gzip") {
        q = Ge(q, Ye.createGunzip(ie), (W) => {
          W && s(W);
        }), _ = new V(q, I), o(_);
        return;
      }
      if (x === "deflate" || x === "x-deflate") {
        const W = Ge(y, new Qt(), (O) => {
          O && s(O);
        });
        W.once("data", (O) => {
          (O[0] & 15) === 8 ? q = Ge(q, Ye.createInflate(), ($) => {
            $ && s($);
          }) : q = Ge(q, Ye.createInflateRaw(), ($) => {
            $ && s($);
          }), _ = new V(q, I), o(_);
        }), W.once("end", () => {
          _ || (_ = new V(q, I), o(_));
        });
        return;
      }
      if (x === "br") {
        q = Ge(q, Ye.createBrotliDecompress(), (W) => {
          W && s(W);
        }), _ = new V(q, I), o(_);
        return;
      }
      _ = new V(q, I), o(_);
    }), fs(m, l).catch(s);
  });
}
function Cs(a, n) {
  const o = z.from(`0\r
\r
`);
  let s = !1, l = !1, h;
  a.on("response", (d) => {
    const { headers: T } = d;
    s = T["transfer-encoding"] === "chunked" && !T["content-length"];
  }), a.on("socket", (d) => {
    const T = () => {
      if (s && !l) {
        const _ = new Error("Premature close");
        _.code = "ERR_STREAM_PREMATURE_CLOSE", n(_);
      }
    }, B = (_) => {
      l = z.compare(_.slice(-5), o) === 0, !l && h && (l = z.compare(h.slice(-3), o.slice(0, 3)) === 0 && z.compare(_.slice(-2), o.slice(3)) === 0), h = _;
    };
    d.prependListener("close", T), d.on("data", B), a.on("close", () => {
      d.removeListener("close", T), d.removeListener("data", B);
    });
  });
}
const Ts = Wo(import.meta.url), vo = Ke.dirname(Ts), Eo = process.env.NODE_ENV === "production", De = {
  isProduction: Eo,
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
  // Development Local: '../../../client/dist' (relative to source index.js)
  clientPath: Eo ? Ke.join(vo, "public") : Ke.join(vo, "../../../client/dist"),
  // Webhook for remote monitoring
  webhook: {
    // For local testing, this points to the remote service running on port 4000.
    // Change this to the public URL of your deployed remote service in production.
    url: "http://localhost:3001/api/webhook",
    interval: 1e4
    // Send status every 10 seconds for faster testing
  }
  // Future: Google AppScript Configuration
  // cloudApiUrl: 'https://script.google.com/macros/s/...'
};
var en = {}, tr = {};
Object.defineProperty(tr, "__esModule", { value: !0 });
tr.DelimiterParser = void 0;
const Ps = Ua;
class vs extends Ps.Transform {
  includeDelimiter;
  delimiter;
  buffer;
  constructor({ delimiter: n, includeDelimiter: o = !1, ...s }) {
    if (super(s), n === void 0)
      throw new TypeError('"delimiter" is not a bufferable object');
    if (n.length === 0)
      throw new TypeError('"delimiter" has a 0 or undefined length');
    this.includeDelimiter = o, this.delimiter = Buffer.from(n), this.buffer = Buffer.alloc(0);
  }
  _transform(n, o, s) {
    let l = Buffer.concat([this.buffer, n]), h;
    for (; (h = l.indexOf(this.delimiter)) !== -1; )
      this.push(l.slice(0, h + (this.includeDelimiter ? this.delimiter.length : 0))), l = l.slice(h + this.delimiter.length);
    this.buffer = l, s();
  }
  _flush(n) {
    this.push(this.buffer), this.buffer = Buffer.alloc(0), n();
  }
}
tr.DelimiterParser = vs;
Object.defineProperty(en, "__esModule", { value: !0 });
var jo = en.ReadlineParser = void 0;
const Es = tr;
class As extends Es.DelimiterParser {
  constructor(n) {
    const o = {
      delimiter: Buffer.from(`
`, "utf8"),
      encoding: "utf8",
      ...n
    };
    typeof o.delimiter == "string" && (o.delimiter = Buffer.from(o.delimiter, o.encoding)), super(o);
  }
}
jo = en.ReadlineParser = As;
function Bs(a) {
  const n = a instanceof URL ? qo(a) : a.toString();
  return Zr(Io(n), `.${ja(n)}.tmp`);
}
async function ks(a, n, o) {
  for (let s = 0; s < n; s++)
    try {
      return await a();
    } catch (l) {
      if (s < n - 1)
        await new Promise((h) => setTimeout(h, o));
      else
        throw l;
    }
}
class Ws {
  #e;
  #t;
  #r = !1;
  #n = null;
  #i = null;
  #a = null;
  #o = null;
  // File is locked, add data for later
  #s(n) {
    return this.#o = n, this.#a ||= new Promise((o, s) => {
      this.#i = [o, s];
    }), new Promise((o, s) => {
      this.#a?.then(o).catch(s);
    });
  }
  // File isn't locked, write data
  async #l(n) {
    this.#r = !0;
    try {
      await xa(this.#t, n, "utf-8"), await ks(async () => {
        await Ha(this.#t, this.#e);
      }, 10, 100), this.#n?.[0]();
    } catch (o) {
      throw o instanceof Error && this.#n?.[1](o), o;
    } finally {
      if (this.#r = !1, this.#n = this.#i, this.#i = this.#a = null, this.#o !== null) {
        const o = this.#o;
        this.#o = null, await this.write(o);
      }
    }
  }
  constructor(n) {
    this.#e = n, this.#t = Bs(n);
  }
  async write(n) {
    return this.#r ? this.#s(n) : this.#l(n);
  }
}
class qs {
  #e;
  #t;
  constructor(n) {
    this.#e = n, this.#t = new Ws(n);
  }
  async read() {
    let n;
    try {
      n = await Va(this.#e, "utf-8");
    } catch (o) {
      if (o.code === "ENOENT")
        return null;
      throw o;
    }
    return n;
  }
  write(n) {
    return this.#t.write(n);
  }
}
class Is {
  #e;
  #t;
  #r;
  constructor(n, { parse: o, stringify: s }) {
    this.#e = new qs(n), this.#t = o, this.#r = s;
  }
  async read() {
    const n = await this.#e.read();
    return n === null ? null : this.#t(n);
  }
  write(n) {
    return this.#e.write(this.#r(n));
  }
}
class Mo extends Is {
  constructor(n) {
    super(n, {
      parse: JSON.parse,
      stringify: (o) => JSON.stringify(o, null, 2)
    });
  }
}
const Os = Io(qo(import.meta.url)), No = process.env.NODE_ENV === "production" ? "/var/lib/kiln-controller" : Os, Ds = Zr(No, "history.json"), Fs = Zr(No, "config.json"), zs = new Mo(Ds), $s = new Mo(Fs), Uo = { sessions: [] }, xo = { profiles: [], preferences: {} };
class Ls {
  constructor(n, o, s, l) {
    this.historyDb = new _o(n, s), this.configDb = new _o(o, l), this.lastWrite = null;
  }
  async init() {
    return await this.historyDb.read(), await this.configDb.read(), this.historyDb.data || (this.historyDb.data = Uo), this.configDb.data || (this.configDb.data = xo), await this.historyDb.write(), await this.configDb.write(), this;
  }
  /**
   * Creates a new session in the history database.
   * @returns {object} The new session object.
   */
  async createSession() {
    const n = {
      id: Date.now(),
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      endTime: null,
      status: "RUNNING",
      events: []
    };
    return this.historyDb.data.sessions.unshift(n), await this.historyDb.write(), n;
  }
  // --- Profile Management (in configDb) ---
  async getProfiles() {
    return this.configDb.data.profiles || [];
  }
  async addProfile(n) {
    this.configDb.data.profiles || (this.configDb.data.profiles = []);
    const o = { ...n, id: Date.now() };
    return this.configDb.data.profiles.push(o), await this.configDb.write(), o;
  }
  async updateProfile(n, o) {
    if (!this.configDb.data.profiles)
      return null;
    const s = this.configDb.data.profiles.findIndex((l) => l.id === n);
    return s === -1 ? null : (this.configDb.data.profiles[s] = { ...o, id: n }, await this.configDb.write(), this.configDb.data.profiles[s]);
  }
  async deleteProfile(n) {
    this.configDb.data.profiles && (this.configDb.data.profiles = this.configDb.data.profiles.filter((o) => o.id !== n), await this.configDb.write());
  }
  // --- Preference Management (in configDb) ---
  async getPreferences() {
    return this.configDb.data.preferences || {};
  }
  async updatePreferences(n) {
    return this.configDb.data.preferences = { ...this.configDb.data.preferences, ...n }, await this.configDb.write(), this.configDb.data.preferences;
  }
  /**
   * Adds a status event to an active session in the history database.
   * @param {number} sessionId The ID of the session to add the event to.
   * @param {object} eventData The status data to record.
   */
  async addSessionEvent(n, o) {
    const s = this.historyDb.data.sessions.find((l) => l.id === n);
    if (s) {
      const l = new Date(s.startTime), h = /* @__PURE__ */ new Date(), d = Math.round((h - l) / 1e3);
      s.events.push({
        ...o,
        elapsedTime: d
      }), (!this.lastWrite || h - this.lastWrite > De.dbWriteInterval) && (await this.historyDb.write(), this.lastWrite = h);
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
  async endSession(n, o) {
    const s = this.historyDb.data.sessions.find((l) => l.id === n);
    s && s.status === "RUNNING" && (s.endTime = (/* @__PURE__ */ new Date()).toISOString(), s.status = o, await this.flush());
  }
  /**
   * Clears all sessions from the history database.
   */
  async clearHistory() {
    this.historyDb.data.sessions = [], await this.historyDb.write();
  }
}
const Qr = await new Ls(
  zs,
  $s,
  Uo,
  xo
).init();
class js {
  constructor(n, o = 9600) {
    this.portPath = n, this.baudRate = o, this.port = null, this.parser = null, this.onStatusCallback = null, this.lastState = null, this.activeSessionId = null, this.isConnecting = !1, this.reconnectInterval = null;
  }
  connect() {
    return this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), this.isConnecting || this.port && this.port.isOpen ? Promise.resolve() : (this.isConnecting = !0, console.log(`Attempting to connect to kiln on ${this.portPath}...`), new Promise((n, o) => {
      this.port = new Na({ path: this.portPath, baudRate: this.baudRate }, (s) => {
        if (this.isConnecting = !1, s)
          return console.error(`Failed to open port ${this.portPath}:`, s.message), this.scheduleReconnect(), o(s);
      }), this.port.on("error", (s) => {
        console.error("Serial Port Error:", s.message);
      }), this.port.on("close", () => {
        console.log("Serial port closed. Attempting to reconnect..."), this.port = null, this.scheduleReconnect();
      }), this.parser = this.port.pipe(new jo({ delimiter: `\r
` })), this.parser.on("data", (s) => {
        if (!(!s || s.trim() === ""))
          try {
            const l = JSON.parse(s);
            this.handleData(l);
          } catch {
            console.log("Raw Serial Data:", s);
          }
      }), this.port.on("open", () => {
        this.isConnecting = !1, console.log(`Connected to kiln on ${this.portPath}`), this.reconnectInterval && (clearInterval(this.reconnectInterval), this.reconnectInterval = null), setTimeout(n, 2e3);
      });
    }));
  }
  scheduleReconnect() {
    this.reconnectInterval || (this.onStatusCallback && this.onStatusCallback({ state: "RECONNECTING", message: "Attempting to reconnect to Arduino..." }), this.reconnectInterval = setInterval(() => {
      this.connect().catch(() => {
      });
    }, 5e3));
  }
  async handleData(n) {
    if (n.status === "ok" || n.status === "error") {
      this.onStatusCallback ? this.onStatusCallback(n) : console.log("Received Command Response:", n);
      return;
    }
    this.onStatusCallback ? this.onStatusCallback(n) : console.log("Received:", n);
    const o = n.state;
    if (o && o !== this.lastState) {
      if (o === "STARTING") {
        const l = await Qr.createSession();
        this.activeSessionId = l.id, console.log(`[SESSION] Started new session: ${this.activeSessionId}`);
      }
      const s = o === "COMPLETED" || o === "ABORTED" || o === "EMERGENCY_STOP";
      if (this.activeSessionId && s) {
        const l = o;
        console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${l}`), await Qr.endSession(this.activeSessionId, l), this.activeSessionId = null;
      }
    }
    this.activeSessionId && n.state && await Qr.addSessionEvent(this.activeSessionId, n), this.lastState = o;
  }
  onStatus(n) {
    this.onStatusCallback = n;
  }
  sendCommand(n) {
    if (!this.port || !this.port.isOpen) {
      console.error("Port not open, cannot send command:", n), this.onStatusCallback && this.onStatusCallback({ state: "ERROR", message: "Cannot send command. Port is not open." });
      return;
    }
    const o = JSON.stringify(n);
    console.log("Sending:", o), this.port.write(o + `
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
    this.sendCommand("STOP");
  }
  setTargetTemperature(n) {
    const o = `SET_TEMP,${n}`;
    this.sendCommand(o);
  }
  /**
   * Set the kiln profile
   * @param {Object} profile - Full profile object with steps
   */
  setProfile(n) {
    console.log("Setting profile:", JSON.stringify(n, null, 2));
    const o = {
      command: "profile",
      id: n.id,
      name: n.name,
      steps: n.steps.map((s) => ({
        type: s.type || s.mode || "IDLE",
        targetTemperature: s.targetTemperature,
        duration: s.duration,
        rate: s.rate
      }))
    };
    this.sendCommand(o);
  }
  getStatus() {
    this.sendCommand({ command: "status" });
  }
  testInput(n, o, s) {
    const l = {
      command: "testInput",
      temperature: n
    };
    o !== void 0 && (l.duration = o), s !== void 0 && (l.setPoint = s), this.sendCommand(l);
  }
}
class Ms extends Qa {
  constructor() {
    super(), this.status = {
      state: "IDLE",
      input: 25,
      setpoint: 25,
      targetTemperature: 0,
      ssrUpper: !1,
      ssrLower: !1,
      isSimulated: !0,
      timeRemaining: 0
    }, this.interval = null, this.startSimulation();
  }
  connect() {
    return console.log("SIM: Connect method called (no-op)."), Promise.resolve();
  }
  startSimulation() {
    this.interval && clearInterval(this.interval), this.interval = setInterval(() => {
      const n = this.status.targetTemperature - this.status.input;
      if (Math.abs(n) > 1) {
        const o = n * 0.1 + (Math.random() * 2 - 1);
        this.status.input += o;
      } else
        this.status.input += Math.random() * 0.5 - 0.25;
      this.status.setpoint = this.status.input, this.emit("status", { ...this.status });
    }, 2e3);
  }
  onStatus(n) {
    this.on("status", n);
  }
  // Mock methods to be called by the API
  start() {
    this.status.state = "RAMP", this.status.timeRemaining = 36e5, console.log("SIM: Start command received");
  }
  stop() {
    this.status.state = "IDLE", this.status.timeRemaining = 0, console.log("SIM: Stop command received");
  }
  setProfile(n) {
    this.status.targetTemperature = n.steps[0]?.targetTemperature || 0, console.log("SIM: Profile set", n);
  }
  setTargetTemperature(n) {
    this.status.targetTemperature = n, console.log(`SIM: Target temperature set to ${n}`);
  }
  testInput(n) {
    this.status.input = n, console.log(`SIM: Test temperature set to ${n}`);
  }
}
const Ns = new js(De.serialPort, De.baudRate), Us = Wo(import.meta.url), xs = Ke.dirname(Us), pe = Kr();
pe.use(Kr.json());
const Hs = process.argv.includes("--simulate"), Ao = process.argv.find((a) => a.startsWith("--port=")), Bo = Ao ? parseInt(Ao.split("=")[1], 10) : De.serverPort;
let Vt = [], Zt = { state: "UNKNOWN", timestamp: 0 };
const ko = (a) => {
  Zt = { ...a, timestamp: Date.now() }, Vt.forEach((n) => n.res.write(`data: ${JSON.stringify(Zt)}

`));
};
let oe;
Hs ? (console.log("Starting in simulation mode."), oe = new Ms(), oe.on("status", (a) => {
  ko(a);
})) : (console.log("Starting in hardware mode."), oe = Ns, oe.on("status", (a) => {
  ko(a);
}));
oe.connect();
pe.get("/api/events", (a, n) => {
  n.setHeader("Content-Type", "text/event-stream"), n.setHeader("Cache-Control", "no-cache"), n.setHeader("Connection", "keep-alive"), n.flushHeaders();
  const o = Date.now(), s = { id: o, res: n };
  Vt.push(s), console.log(`Client ${o} connected`), n.write(`data: ${JSON.stringify(Zt)}

`), a.on("close", () => {
    console.log(`Client ${o} disconnected`), Vt = Vt.filter((l) => l.id !== o);
  });
});
pe.post("/api/command", (a, n) => {
  const { command: o, payload: s } = a.body;
  if (!o)
    return n.status(400).send({ message: "Command not provided." });
  try {
    switch (o) {
      case "set-temperature":
        if (typeof s.temp != "number")
          return n.status(400).send({ message: "Invalid temperature payload." });
        oe.setTargetTemperature(s.temp), n.status(200).send({ message: `Temperature set to ${s.temp}` });
        break;
      case "start":
        oe.start(), n.status(200).send({ message: "Kiln run started." });
        break;
      case "stop":
        oe.stop(), n.status(200).send({ message: "Kiln run stopped." });
        break;
      default:
        n.status(400).send({ message: `Unknown command: ${o}` });
    }
  } catch (l) {
    console.error(`Error executing command '${o}':`, l), n.status(500).send({ message: "An error occurred while executing the command." });
  }
});
setInterval(async () => {
  try {
    const a = await Lo(De.webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Zt)
    });
    if (a.ok) {
      const { pendingCommand: n } = await a.json();
      n && console.log("Received command from remote service:", n);
    } else
      console.error(`Webhook failed: ${a.statusText}`);
  } catch (a) {
    a instanceof ee && a.type === "invalid-json" ? console.log("Remote service responded with invalid JSON. No command to process.") : console.error(`Error sending webhook: ${a.message}`);
  }
}, De.webhook.interval);
pe.get("/api/profiles", async (a, n) => {
  try {
    const o = Ke.join(xs, "config.json"), s = Ma.readFileSync(o, "utf8"), l = JSON.parse(s).profiles;
    n.json(l || []);
  } catch (o) {
    console.error("Error reading profiles from config.json:", o), n.status(500).json({ error: "Could not load profiles" });
  }
});
pe.post("/api/start", (a, n) => {
  const { profileId: o } = a.body;
  console.log(`Start command received for profile ${o}`), oe.start(o), n.status(200).send("Start command sent");
});
pe.post("/api/stop", (a, n) => {
  console.log("Stop command received"), oe.stop(), n.status(200).send("Stop command sent");
});
const Ho = De.clientPath;
pe.use(Kr.static(Ho));
pe.get("*", (a, n) => {
  n.sendFile(Ke.join(Ho, "index.html"));
});
pe.listen(Bo, () => {
  console.log(`Local kiln service running on http://localhost:${Bo}`);
});
export {
  Gr as F,
  Xa as a
};
