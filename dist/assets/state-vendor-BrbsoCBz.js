import { c as te, R as P } from "./three-vendor-DPEqJ2wL.js";
const re = (e) => e;
function ne(e, r = re) {
  const t = P.useSyncExternalStore(
    e.subscribe,
    P.useCallback(() => r(e.getState()), [e, r]),
    P.useCallback(() => r(e.getInitialState()), [e, r]),
  );
  return (P.useDebugValue(t), t);
}
const ie = (e) => {
    const r = te(e),
      t = (n) => ne(r, n);
    return (Object.assign(t, r), t);
  },
  Ee = (e) => ie;
var I = { exports: {} },
  j = {},
  q;
function ue() {
  if (q) return j;
  ((q = 1), Object.defineProperty(j, "__esModule", { value: !0 }));
  function e(o, f) {
    (f == null || f > o.length) && (f = o.length);
    for (var s = 0, c = new Array(f); s < f; s++) c[s] = o[s];
    return c;
  }
  function r(o) {
    if (Array.isArray(o)) return e(o);
  }
  function t(o) {
    if (
      (typeof Symbol < "u" && o[Symbol.iterator] != null) ||
      o["@@iterator"] != null
    )
      return Array.from(o);
  }
  function n(o, f) {
    if (o) {
      if (typeof o == "string") return e(o, f);
      var s = Object.prototype.toString.call(o).slice(8, -1);
      if (
        (s === "Object" && o.constructor && (s = o.constructor.name),
        s === "Map" || s === "Set")
      )
        return Array.from(o);
      if (
        s === "Arguments" ||
        /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(s)
      )
        return e(o, f);
    }
  }
  function i() {
    throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
  }
  function u(o) {
    return r(o) || t(o) || n(o) || i();
  }
  function a(o, f) {
    var s = (typeof Symbol < "u" && o[Symbol.iterator]) || o["@@iterator"];
    if (!s) {
      if (Array.isArray(o) || (s = n(o)) || f) {
        s && (o = s);
        var c = 0,
          y = function () {};
        return {
          s: y,
          n: function () {
            return c >= o.length ? { done: !0 } : { done: !1, value: o[c++] };
          },
          e: function (p) {
            throw p;
          },
          f: y,
        };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    var v = !0,
      k = !1,
      R;
    return {
      s: function () {
        s = s.call(o);
      },
      n: function () {
        var p = s.next();
        return ((v = p.done), p);
      },
      e: function (p) {
        ((k = !0), (R = p));
      },
      f: function () {
        try {
          !v && s.return != null && s.return();
        } finally {
          if (k) throw R;
        }
      },
    };
  }
  function l(o, f) {
    if (!(o instanceof f))
      throw new TypeError("Cannot call a class as a function");
  }
  function h(o, f) {
    if (typeof o != "object" || o === null) return o;
    var s = o[Symbol.toPrimitive];
    if (s !== void 0) {
      var c = s.call(o, f);
      if (typeof c != "object") return c;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (f === "string" ? String : Number)(o);
  }
  function d(o) {
    var f = h(o, "string");
    return typeof f == "symbol" ? f : String(f);
  }
  function O(o, f) {
    for (var s = 0; s < f.length; s++) {
      var c = f[s];
      ((c.enumerable = c.enumerable || !1),
        (c.configurable = !0),
        "value" in c && (c.writable = !0),
        Object.defineProperty(o, d(c.key), c));
    }
  }
  function E(o, f, s) {
    return (
      f && O(o.prototype, f),
      Object.defineProperty(o, "prototype", { writable: !1 }),
      o
    );
  }
  function Z(o, f, s) {
    return (
      (f = d(f)),
      f in o
        ? Object.defineProperty(o, f, {
            value: s,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (o[f] = s),
      o
    );
  }
  var ee = (function () {
    function o() {
      (l(this, o), Z(this, "subscribers", new Set()));
    }
    return (
      E(o, [
        {
          key: "onSubscribe",
          get: function () {
            return (
              this._onSubscribe || (this._onSubscribe = new o()),
              this._onSubscribe
            );
          },
        },
        {
          key: "onUnsubscribe",
          get: function () {
            return (
              this._onUnsubscribe || (this._onUnsubscribe = new o()),
              this._onUnsubscribe
            );
          },
        },
        {
          key: "subscribe",
          value: function (s) {
            var c,
              y = this;
            return (
              this.subscribers.add(s),
              (c = this._onSubscribe) === null || c === void 0 || c.emit(s),
              function () {
                return y.unsubscribe(s);
              }
            );
          },
        },
        {
          key: "unsubscribe",
          value: function (s) {
            var c;
            (this.subscribers.delete(s),
              (c = this._onUnsubscribe) === null || c === void 0 || c.emit(s));
          },
        },
        {
          key: "clear",
          value: function () {
            if (this._onUnsubscribe) {
              var s = a(this.subscribers),
                c;
              try {
                for (s.s(); !(c = s.n()).done; ) {
                  var y = c.value;
                  this._onUnsubscribe.emit(y);
                }
              } catch (v) {
                s.e(v);
              } finally {
                s.f();
              }
            }
            this.subscribers.clear();
          },
        },
        {
          key: "emit",
          value: function () {
            for (var s = arguments.length, c = new Array(s), y = 0; y < s; y++)
              c[y] = arguments[y];
            this.subscribers.forEach(function (v) {
              return v.apply(void 0, c);
            });
          },
        },
        {
          key: "emitAsync",
          value: function () {
            for (var s = arguments.length, c = new Array(s), y = 0; y < s; y++)
              c[y] = arguments[y];
            return Promise.all(
              u(this.subscribers).map(function (v) {
                return v.apply(void 0, c);
              }),
            );
          },
        },
      ]),
      o
    );
  })();
  return ((j.Event = ee), j);
}
var $;
function oe() {
  return ($ || (($ = 1), (I.exports = ue())), I.exports);
}
var U = oe();
function M(e, r) {
  (r == null || r > e.length) && (r = e.length);
  for (var t = 0, n = new Array(r); t < r; t++) n[t] = e[t];
  return n;
}
function ae(e, r) {
  if (e) {
    if (typeof e == "string") return M(e, r);
    var t = Object.prototype.toString.call(e).slice(8, -1);
    if (
      (t === "Object" && e.constructor && (t = e.constructor.name),
      t === "Map" || t === "Set")
    )
      return Array.from(e);
    if (t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))
      return M(e, r);
  }
}
function se(e, r) {
  var t = (typeof Symbol < "u" && e[Symbol.iterator]) || e["@@iterator"];
  if (!t) {
    if (Array.isArray(e) || (t = ae(e)) || r) {
      t && (e = t);
      var n = 0,
        i = function () {};
      return {
        s: i,
        n: function () {
          return n >= e.length ? { done: !0 } : { done: !1, value: e[n++] };
        },
        e: function (h) {
          throw h;
        },
        f: i,
      };
    }
    throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
  }
  var u = !0,
    a = !1,
    l;
  return {
    s: function () {
      t = t.call(e);
    },
    n: function () {
      var h = t.next();
      return ((u = h.done), h);
    },
    e: function (h) {
      ((a = !0), (l = h));
    },
    f: function () {
      try {
        !u && t.return != null && t.return();
      } finally {
        if (a) throw l;
      }
    },
  };
}
function fe(e, r) {
  if (!(e instanceof r))
    throw new TypeError("Cannot call a class as a function");
}
function ce(e, r) {
  if (typeof e != "object" || e === null) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var n = t.call(e, r);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function H(e) {
  var r = ce(e, "string");
  return typeof r == "symbol" ? r : String(r);
}
function le(e, r) {
  for (var t = 0; t < r.length; t++) {
    var n = r[t];
    ((n.enumerable = n.enumerable || !1),
      (n.configurable = !0),
      "value" in n && (n.writable = !0),
      Object.defineProperty(e, H(n.key), n));
  }
}
function he(e, r, t) {
  return (
    r && le(e.prototype, r),
    Object.defineProperty(e, "prototype", { writable: !1 }),
    e
  );
}
function A(e, r, t) {
  return (
    (r = H(r)),
    r in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
var K;
K = Symbol.iterator;
var N = (function () {
    function e() {
      var r =
        arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      (fe(this, e),
        A(this, "_version", 0),
        A(this, "onEntityAdded", new U.Event()),
        A(this, "onEntityRemoved", new U.Event()),
        A(this, "entityPositions", new Map()),
        (this._entities = r),
        (this.add = this.add.bind(this)),
        (this.remove = this.remove.bind(this)));
      for (var t = 0; t < r.length; t++) this.entityPositions.set(r[t], t);
    }
    return (
      he(e, [
        {
          key: "version",
          get: function () {
            return this._version;
          },
        },
        {
          key: "entities",
          get: function () {
            return this._entities;
          },
        },
        {
          key: K,
          value: function () {
            var t = this,
              n = this._entities.length,
              i = { value: void 0, done: !1 };
            return {
              next: function () {
                return ((i.value = t._entities[--n]), (i.done = n < 0), i);
              },
            };
          },
        },
        {
          key: "size",
          get: function () {
            return this.entities.length;
          },
        },
        {
          key: "first",
          get: function () {
            return this.entities[0];
          },
        },
        {
          key: "has",
          value: function (t) {
            return this.entityPositions.has(t);
          },
        },
        {
          key: "add",
          value: function (t) {
            return (
              t &&
                !this.has(t) &&
                (this.entities.push(t),
                this.entityPositions.set(t, this.entities.length - 1),
                this._version++,
                this.onEntityAdded.emit(t)),
              t
            );
          },
        },
        {
          key: "remove",
          value: function (t) {
            if (this.has(t)) {
              this.onEntityRemoved.emit(t);
              var n = this.entityPositions.get(t);
              this.entityPositions.delete(t);
              var i = this.entities[this.entities.length - 1];
              (i !== t &&
                ((this.entities[n] = i), this.entityPositions.set(i, n)),
                this.entities.pop(),
                this._version++);
            }
            return t;
          },
        },
        {
          key: "clear",
          value: function () {
            var t = se(this),
              n;
            try {
              for (t.s(); !(n = t.n()).done; ) {
                var i = n.value;
                this.remove(i);
              }
            } catch (u) {
              t.e(u);
            } finally {
              t.f();
            }
          },
        },
      ]),
      e
    );
  })(),
  z = new WeakMap(),
  D = 0,
  ye = function (r) {
    var t = z.get(r);
    return t !== void 0 ? t : (z.set(r, D), D++);
  };
function ve() {
  var e = new Array();
  function r(i) {
    e.push(i);
  }
  function t() {
    e.length = 0;
  }
  function n() {
    (e.forEach(function (i) {
      return i();
    }),
      t());
  }
  return ((r.clear = t), (r.flush = n), r);
}
function T(e, r) {
  (r == null || r > e.length) && (r = e.length);
  for (var t = 0, n = new Array(r); t < r; t++) n[t] = e[t];
  return n;
}
function de(e) {
  if (Array.isArray(e)) return T(e);
}
function be(e) {
  if (
    (typeof Symbol < "u" && e[Symbol.iterator] != null) ||
    e["@@iterator"] != null
  )
    return Array.from(e);
}
function Q(e, r) {
  if (e) {
    if (typeof e == "string") return T(e, r);
    var t = Object.prototype.toString.call(e).slice(8, -1);
    if (
      (t === "Object" && e.constructor && (t = e.constructor.name),
      t === "Map" || t === "Set")
    )
      return Array.from(e);
    if (t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))
      return T(e, r);
  }
}
function me() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function _(e) {
  return de(e) || be(e) || Q(e) || me();
}
function m(e) {
  return (
    (m = Object.setPrototypeOf
      ? Object.getPrototypeOf.bind()
      : function (t) {
          return t.__proto__ || Object.getPrototypeOf(t);
        }),
    m(e)
  );
}
function pe(e, r) {
  for (
    ;
    !Object.prototype.hasOwnProperty.call(e, r) && ((e = m(e)), e !== null);

  );
  return e;
}
function S() {
  return (
    typeof Reflect < "u" && Reflect.get
      ? (S = Reflect.get.bind())
      : (S = function (r, t, n) {
          var i = pe(r, t);
          if (i) {
            var u = Object.getOwnPropertyDescriptor(i, t);
            return u.get ? u.get.call(arguments.length < 3 ? r : n) : u.value;
          }
        }),
    S.apply(this, arguments)
  );
}
function C(e, r) {
  var t = (typeof Symbol < "u" && e[Symbol.iterator]) || e["@@iterator"];
  if (!t) {
    if (Array.isArray(e) || (t = Q(e)) || r) {
      t && (e = t);
      var n = 0,
        i = function () {};
      return {
        s: i,
        n: function () {
          return n >= e.length ? { done: !0 } : { done: !1, value: e[n++] };
        },
        e: function (h) {
          throw h;
        },
        f: i,
      };
    }
    throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
  }
  var u = !0,
    a = !1,
    l;
  return {
    s: function () {
      t = t.call(e);
    },
    n: function () {
      var h = t.next();
      return ((u = h.done), h);
    },
    e: function (h) {
      ((a = !0), (l = h));
    },
    f: function () {
      try {
        !u && t.return != null && t.return();
      } finally {
        if (a) throw l;
      }
    },
  };
}
function ge(e, r) {
  if (typeof e != "object" || e === null) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var n = t.call(e, r);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function V(e) {
  var r = ge(e, "string");
  return typeof r == "symbol" ? r : String(r);
}
function g(e, r, t) {
  return (
    (r = V(r)),
    r in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
function B(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    (r &&
      (n = n.filter(function (i) {
        return Object.getOwnPropertyDescriptor(e, i).enumerable;
      })),
      t.push.apply(t, n));
  }
  return t;
}
function b(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2
      ? B(Object(t), !0).forEach(function (n) {
          g(e, n, t[n]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : B(Object(t)).forEach(function (n) {
            Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(t, n));
          });
  }
  return e;
}
function F(e, r) {
  if (!(e instanceof r))
    throw new TypeError("Cannot call a class as a function");
}
function we(e, r) {
  for (var t = 0; t < r.length; t++) {
    var n = r[t];
    ((n.enumerable = n.enumerable || !1),
      (n.configurable = !0),
      "value" in n && (n.writable = !0),
      Object.defineProperty(e, V(n.key), n));
  }
}
function G(e, r, t) {
  return (
    r && we(e.prototype, r),
    Object.defineProperty(e, "prototype", { writable: !1 }),
    e
  );
}
function w(e) {
  if (e === void 0)
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  return e;
}
function x(e, r) {
  return (
    (x = Object.setPrototypeOf
      ? Object.setPrototypeOf.bind()
      : function (n, i) {
          return ((n.__proto__ = i), n);
        }),
    x(e, r)
  );
}
function J(e, r) {
  if (typeof r != "function" && r !== null)
    throw new TypeError("Super expression must either be null or a function");
  ((e.prototype = Object.create(r && r.prototype, {
    constructor: { value: e, writable: !0, configurable: !0 },
  })),
    Object.defineProperty(e, "prototype", { writable: !1 }),
    r && x(e, r));
}
function _e() {
  if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham)
    return !1;
  if (typeof Proxy == "function") return !0;
  try {
    return (
      Boolean.prototype.valueOf.call(
        Reflect.construct(Boolean, [], function () {}),
      ),
      !0
    );
  } catch {
    return !1;
  }
}
function Se(e, r) {
  if (r && (typeof r == "object" || typeof r == "function")) return r;
  if (r !== void 0)
    throw new TypeError(
      "Derived constructors may only return object or undefined",
    );
  return w(e);
}
function L(e) {
  var r = _e();
  return function () {
    var n = m(e),
      i;
    if (r) {
      var u = m(this).constructor;
      i = Reflect.construct(n, arguments, u);
    } else i = n.apply(this, arguments);
    return Se(this, i);
  };
}
var X,
  Ie = (function (e) {
    J(t, e);
    var r = L(t);
    function t() {
      var n,
        i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      return (
        F(this, t),
        (n = r.call(this, i)),
        g(w(n), "queries", new Set()),
        g(w(n), "entityToId", new Map()),
        g(w(n), "idToEntity", new Map()),
        g(w(n), "nextId", 0),
        n.onEntityAdded.subscribe(function (u) {
          n.reindex(u);
        }),
        n.onEntityRemoved.subscribe(function (u) {
          if (
            (n.queries.forEach(function (l) {
              return l.remove(u);
            }),
            n.entityToId.has(u))
          ) {
            var a = n.entityToId.get(u);
            (n.idToEntity.delete(a), n.entityToId.delete(u));
          }
        }),
        n
      );
    }
    return (
      G(t, [
        {
          key: "update",
          value: (function (n) {
            function i(u, a, l) {
              return n.apply(this, arguments);
            }
            return (
              (i.toString = function () {
                return n.toString();
              }),
              i
            );
          })(function (n, i, u) {
            if (typeof i == "function") {
              var a = i(n);
              a && Object.assign(n, a);
            } else typeof i == "string" ? (n[i] = u) : i && Object.assign(n, i);
            return (this.reindex(n), n);
          }),
        },
        {
          key: "addComponent",
          value: function (i, u, a) {
            i[u] === void 0 && ((i[u] = a), this.reindex(i));
          },
        },
        {
          key: "removeComponent",
          value: function (i, u) {
            if (i[u] !== void 0) {
              if (this.has(i)) {
                var a = b({}, i);
                (delete a[u], this.reindex(i, a));
              }
              delete i[u];
            }
          },
        },
        {
          key: "query",
          value: function (i) {
            var u = je(i),
              a = Y(u),
              l = C(this.queries),
              h;
            try {
              for (l.s(); !(h = l.n()).done; ) {
                var d = h.value;
                if (d.key === a) return d;
              }
            } catch (E) {
              l.e(E);
            } finally {
              l.f();
            }
            var O = new Oe(this, u);
            return (this.queries.add(O), O);
          },
        },
        {
          key: "with",
          value: function () {
            for (var i = arguments.length, u = new Array(i), a = 0; a < i; a++)
              u[a] = arguments[a];
            return this.query({ with: u, without: [], predicates: [] });
          },
        },
        {
          key: "without",
          value: function () {
            for (var i = arguments.length, u = new Array(i), a = 0; a < i; a++)
              u[a] = arguments[a];
            return this.query({ with: [], without: u, predicates: [] });
          },
        },
        {
          key: "where",
          value: function (i) {
            return this.query({ with: [], without: [], predicates: [i] });
          },
        },
        {
          key: "reindex",
          value: function (i) {
            var u =
              arguments.length > 1 && arguments[1] !== void 0
                ? arguments[1]
                : i;
            if (this.has(i)) {
              var a = C(this.queries),
                l;
              try {
                for (a.s(); !(l = a.n()).done; ) {
                  var h = l.value;
                  h.evaluate(i, u);
                }
              } catch (d) {
                a.e(d);
              } finally {
                a.f();
              }
            }
          },
        },
        {
          key: "id",
          value: function (i) {
            if (this.has(i)) {
              if (!this.entityToId.has(i)) {
                var u = this.nextId++;
                (this.entityToId.set(i, u), this.idToEntity.set(u, i));
              }
              return this.entityToId.get(i);
            }
          },
        },
        {
          key: "entity",
          value: function (i) {
            return this.idToEntity.get(i);
          },
        },
      ]),
      t
    );
  })(N);
X = Symbol.iterator;
var Oe = (function (e) {
    J(t, e);
    var r = L(t);
    function t(n, i) {
      var u;
      return (
        F(this, t),
        (u = r.call(this)),
        g(w(u), "_isConnected", !1),
        (u.world = n),
        (u.config = i),
        (u.key = Y(i)),
        u.onEntityAdded.onSubscribe.subscribe(function () {
          return u.connect();
        }),
        u.onEntityRemoved.onSubscribe.subscribe(function () {
          return u.connect();
        }),
        u
      );
    }
    return (
      G(t, [
        {
          key: "isConnected",
          get: function () {
            return this._isConnected;
          },
        },
        {
          key: "entities",
          get: function () {
            return (
              this._isConnected || this.connect(),
              S(m(t.prototype), "entities", this)
            );
          },
        },
        {
          key: X,
          value: function () {
            return (
              this._isConnected || this.connect(),
              S(m(t.prototype), Symbol.iterator, this).call(this)
            );
          },
        },
        {
          key: "connect",
          value: function () {
            if (!this._isConnected) {
              this._isConnected = !0;
              var i = C(this.world),
                u;
              try {
                for (i.s(); !(u = i.n()).done; ) {
                  var a = u.value;
                  this.evaluate(a);
                }
              } catch (l) {
                i.e(l);
              } finally {
                i.f();
              }
            }
            return this;
          },
        },
        {
          key: "disconnect",
          value: function () {
            return ((this._isConnected = !1), this);
          },
        },
        {
          key: "with",
          value: function () {
            for (var i = arguments.length, u = new Array(i), a = 0; a < i; a++)
              u[a] = arguments[a];
            return this.world.query(
              b(
                b({}, this.config),
                {},
                { with: [].concat(_(this.config.with), u) },
              ),
            );
          },
        },
        {
          key: "without",
          value: function () {
            for (var i = arguments.length, u = new Array(i), a = 0; a < i; a++)
              u[a] = arguments[a];
            return this.world.query(
              b(
                b({}, this.config),
                {},
                { without: [].concat(_(this.config.without), u) },
              ),
            );
          },
        },
        {
          key: "where",
          value: function (i) {
            return this.world.query(
              b(
                b({}, this.config),
                {},
                { predicates: [].concat(_(this.config.predicates), [i]) },
              ),
            );
          },
        },
        {
          key: "want",
          value: function (i) {
            return (
              this.config.with.every(function (u) {
                return i[u] !== void 0;
              }) &&
              this.config.without.every(function (u) {
                return i[u] === void 0;
              }) &&
              this.config.predicates.every(function (u) {
                return u(i);
              })
            );
          },
        },
        {
          key: "evaluate",
          value: function (i) {
            var u =
              arguments.length > 1 && arguments[1] !== void 0
                ? arguments[1]
                : i;
            if (this.isConnected) {
              var a = this.want(u),
                l = this.has(i);
              a && !l ? this.add(i) : !a && l && this.remove(i);
            }
          },
        },
      ]),
      t
    );
  })(N),
  W = function (r) {
    return _(
      new Set(
        r.sort().filter(function (t) {
          return !!t && t !== "";
        }),
      ),
    );
  };
function Pe(e) {
  return _(new Set(e));
}
function je(e) {
  return {
    with: W(e.with),
    without: W(e.without),
    predicates: Pe(e.predicates),
  };
}
function Y(e) {
  return ""
    .concat(e.with.join(","), ":")
    .concat(e.without.join(","), ":")
    .concat(
      e.predicates
        .map(function (r) {
          return ye(r);
        })
        .join(","),
    );
}
ve();
export { Ie as W, Ee as c };
//# sourceMappingURL=state-vendor-BrbsoCBz.js.map
