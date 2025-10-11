import {
  r as m,
  j as i,
  u as se,
  d as U,
  p as X,
  D as ne,
  a as Z,
  b as oe,
  P as ie,
  V as R,
  e as re,
  C as ae,
  O as de,
  S as ce,
  G as J,
  f as le,
  g as ue,
} from "./three-vendor-DPEqJ2wL.js";
import { W as he, c as O } from "./state-vendor-BrbsoCBz.js";
import "./react-vendor-Bzgz95E1.js";
(function () {
  const e = document.createElement("link").relList;
  if (e && e.supports && e.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) t(o);
  new MutationObserver((o) => {
    for (const r of o)
      if (r.type === "childList")
        for (const c of r.addedNodes)
          c.tagName === "LINK" && c.rel === "modulepreload" && t(c);
  }).observe(document, { childList: !0, subtree: !0 });
  function s(o) {
    const r = {};
    return (
      o.integrity && (r.integrity = o.integrity),
      o.referrerPolicy && (r.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === "use-credentials"
        ? (r.credentials = "include")
        : o.crossOrigin === "anonymous"
          ? (r.credentials = "omit")
          : (r.credentials = "same-origin"),
      r
    );
  }
  function t(o) {
    if (o.ep) return;
    o.ep = !0;
    const r = s(o);
    fetch(o.href, r);
  }
})();
const me = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let P = (n = 21) => {
  let e = "",
    s = crypto.getRandomValues(new Uint8Array((n |= 0)));
  for (; n--; ) e += me[s[n] & 63];
  return e;
};
const H = m.createContext(null),
  $ = () => {
    const n = m.useContext(H);
    if (!n) throw new Error("useWorld must be used within WorldProvider");
    return n;
  },
  ge = ({ children: n }) => {
    const e = m.useMemo(() => new he(), []);
    return i.jsx(H.Provider, { value: e, children: n });
  },
  V = 1 / 60;
function fe(n) {
  const e = m.useRef(0),
    s = m.useRef(null);
  se(({ clock: t }) => {
    const o = t.elapsedTime,
      r = s.current ?? o,
      c = o - r;
    for (s.current = o, e.current += c; e.current >= V; )
      (pe(n, V), (e.current -= V));
  });
}
function pe(n, e) {
  for (const s of n.with("Vehicle", "Transform")) {
    const t = s.Vehicle,
      o = s.Transform;
    !t ||
      !o ||
      ((t.speed = Math.min(t.maxSpeed, t.speed + t.accel * e)),
      (o.position[0] += t.speed * e));
  }
}
function ye() {
  const e = $().with("Transform", "Renderable"),
    s = {
      track: "#6f7a8a",
      road: "#505050",
      station: "#d1a054",
      depot: "#8c6239",
      vehicle: "#c0392b",
      tree: "#2d8659",
    };
  return i.jsx(i.Fragment, {
    children: [...e].map((t) => {
      const o = t.Transform,
        r = t.Renderable,
        c = r.dimensions ?? [1, 1, 1],
        v = r.color ?? s[r.kind] ?? "#888888";
      return i.jsxs(
        "mesh",
        {
          position: o.position,
          rotation: o.rotation,
          scale: o.scale,
          castShadow: !0,
          receiveShadow: !0,
          children: [
            i.jsx("boxGeometry", { args: c }),
            i.jsx("meshStandardMaterial", { color: v }),
          ],
        },
        t.id,
      );
    }),
  });
}
const E = O()(
  U(
    X(
      (n) => ({
        tool: "none",
        showGrid: !1,
        isConstructing: !1,
        ghostPosition: null,
        isValidPlacement: !1,
        setTool: (e) => {
          (n({ tool: e }),
            n(
              e !== "none" && e !== "query"
                ? { showGrid: !0, isConstructing: !0 }
                : { isConstructing: !1, ghostPosition: null },
            ));
        },
        toggleGrid: () => n((e) => ({ showGrid: !e.showGrid })),
        setGhostPosition: (e) => n({ ghostPosition: e }),
        setValidPlacement: (e) => n({ isValidPlacement: e }),
        startConstruction: () => n({ isConstructing: !0 }),
        endConstruction: () =>
          n({ isConstructing: !1, ghostPosition: null, tool: "none" }),
      }),
      {
        name: "construction-store",
        partialize: (n) => ({ showGrid: n.showGrid }),
      },
    ),
    { name: "ConstructionStore" },
  ),
);
function xe() {
  const n = m.useMemo(
    () => ({ color: "#2d5016", roughness: 0.8, metalness: 0 }),
    [],
  );
  return i.jsxs("mesh", {
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.1, 0],
    receiveShadow: !0,
    children: [
      i.jsx("planeGeometry", { args: [500, 500, 50, 50] }),
      i.jsx("meshStandardMaterial", { ...n, side: ne }),
    ],
  });
}
function ve() {
  const n = E((l) => l.tool),
    e = E((l) => l.ghostPosition),
    s = E((l) => l.isValidPlacement);
  if (n === "none" || n === "query" || !e) return null;
  const [t, o, r] = e,
    c = s ? "#4a7c59" : "#c24747",
    v = () => {
      switch (n) {
        case "rail":
          return i.jsxs("mesh", {
            position: [t, o + 0.1, r],
            children: [
              i.jsx("boxGeometry", { args: [10, 0.2, 2] }),
              i.jsx("meshStandardMaterial", {
                color: c,
                transparent: !0,
                opacity: 0.6,
                emissive: c,
                emissiveIntensity: 0.3,
              }),
            ],
          });
        case "road":
          return i.jsxs("mesh", {
            position: [t, o + 0.05, r],
            children: [
              i.jsx("boxGeometry", { args: [10, 0.1, 4] }),
              i.jsx("meshStandardMaterial", {
                color: c,
                transparent: !0,
                opacity: 0.6,
                emissive: c,
                emissiveIntensity: 0.3,
              }),
            ],
          });
        case "station":
          return i.jsxs("mesh", {
            position: [t, o + 2, r],
            children: [
              i.jsx("boxGeometry", { args: [20, 4, 10] }),
              i.jsx("meshStandardMaterial", {
                color: c,
                transparent: !0,
                opacity: 0.6,
                emissive: c,
                emissiveIntensity: 0.3,
              }),
            ],
          });
        case "depot":
          return i.jsxs("mesh", {
            position: [t, o + 2, r],
            children: [
              i.jsx("boxGeometry", { args: [15, 4, 15] }),
              i.jsx("meshStandardMaterial", {
                color: c,
                transparent: !0,
                opacity: 0.6,
                emissive: c,
                emissiveIntensity: 0.3,
              }),
            ],
          });
        case "demolish":
          return i.jsxs("group", {
            position: [t, o + 1, r],
            children: [
              i.jsxs("mesh", {
                rotation: [0, 0, Math.PI / 4],
                children: [
                  i.jsx("boxGeometry", { args: [8, 0.5, 0.5] }),
                  i.jsx("meshStandardMaterial", {
                    color: "#ff0000",
                    transparent: !0,
                    opacity: 0.8,
                  }),
                ],
              }),
              i.jsxs("mesh", {
                rotation: [0, 0, -Math.PI / 4],
                children: [
                  i.jsx("boxGeometry", { args: [8, 0.5, 0.5] }),
                  i.jsx("meshStandardMaterial", {
                    color: "#ff0000",
                    transparent: !0,
                    opacity: 0.8,
                  }),
                ],
              }),
            ],
          });
        default:
          return null;
      }
    };
  return i.jsx(i.Fragment, { children: v() });
}
function Ne() {
  const { camera: n } = Z(),
    e = m.useRef(new oe()),
    s = m.useRef(new ie(new R(0, 1, 0), 0));
  return m.useCallback(
    (o) => {
      e.current.setFromCamera(o, n);
      const r = new R();
      return e.current.ray.intersectPlane(s.current, r) ? r : null;
    },
    [n],
  );
}
function we(n, e = 10) {
  return new R(
    Math.round(n.x / e) * e,
    Math.round(n.y / e) * e,
    Math.round(n.z / e) * e,
  );
}
class D {
  nodes;
  edges;
  constructor() {
    ((this.nodes = new Map()), (this.edges = new Map()));
  }
  addNode(e) {
    if (this.nodes.has(e.id))
      throw new Error(`Node with id ${e.id} already exists`);
    this.nodes.set(e.id, { ...e, connections: [] });
  }
  getNode(e) {
    return this.nodes.get(e);
  }
  removeNode(e) {
    const s = this.nodes.get(e);
    if (s) {
      for (const t of s.connections) this.edges.delete(t);
      for (const t of this.edges.values())
        (t.fromNode === e || t.toNode === e) && this.removeEdge(t.id);
      this.nodes.delete(e);
    }
  }
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
  getNodesByType(e) {
    return this.getAllNodes().filter((s) => s.type === e);
  }
  addEdge(e) {
    if (this.edges.has(e.id))
      throw new Error(`Edge with id ${e.id} already exists`);
    const s = this.nodes.get(e.fromNode),
      t = this.nodes.get(e.toNode);
    if (!s) throw new Error(`Source node ${e.fromNode} does not exist`);
    if (!t) throw new Error(`Destination node ${e.toNode} does not exist`);
    (this.edges.set(e.id, { ...e, occupied: e.occupied ?? [] }),
      s.connections.includes(e.id) || s.connections.push(e.id),
      t.connections.includes(e.id) || t.connections.push(e.id));
  }
  getEdge(e) {
    return this.edges.get(e);
  }
  removeEdge(e) {
    const s = this.edges.get(e);
    if (!s) return;
    const t = this.nodes.get(s.fromNode),
      o = this.nodes.get(s.toNode);
    (t && (t.connections = t.connections.filter((r) => r !== e)),
      o && (o.connections = o.connections.filter((r) => r !== e)),
      this.edges.delete(e));
  }
  getAllEdges() {
    return Array.from(this.edges.values());
  }
  getConnectedEdges(e) {
    const s = this.nodes.get(e);
    return s
      ? s.connections.map((t) => this.edges.get(t)).filter((t) => t !== void 0)
      : [];
  }
  getEdgesBetweenNodes(e, s) {
    return this.getAllEdges().filter(
      (t) =>
        (t.fromNode === e && t.toNode === s) ||
        (t.fromNode === s && t.toNode === e),
    );
  }
  getNeighbors(e) {
    const s = this.getConnectedEdges(e),
      t = new Set();
    for (const o of s)
      (o.fromNode === e && t.add(o.toNode),
        o.toNode === e && t.add(o.fromNode));
    return Array.from(t)
      .map((o) => this.nodes.get(o))
      .filter((o) => o !== void 0);
  }
  getNeighborsWithEdges(e) {
    const s = this.getConnectedEdges(e),
      t = [];
    for (const o of s)
      (o.fromNode === e && t.push({ nodeId: o.toNode, edgeId: o.id }),
        o.toNode === e && t.push({ nodeId: o.fromNode, edgeId: o.id }));
    return t;
  }
  areNodesConnected(e, s) {
    return this.getEdgesBetweenNodes(e, s).length > 0;
  }
  getStats() {
    const e = this.getAllNodes(),
      s = this.getAllEdges();
    return {
      nodeCount: e.length,
      edgeCount: s.length,
      totalLength: s.reduce((t, o) => t + o.length, 0),
      railLength: s
        .filter((t) => t.trackType === "rail")
        .reduce((t, o) => t + o.length, 0),
      roadLength: s
        .filter((t) => t.trackType === "road")
        .reduce((t, o) => t + o.length, 0),
      stationCount: e.filter((t) => t.type === "station").length,
      depotCount: e.filter((t) => t.type === "depot").length,
      junctionCount: e.filter((t) => t.type === "junction").length,
    };
  }
  clear() {
    (this.nodes.clear(), this.edges.clear());
  }
  toJSON() {
    return { version: 1, nodes: this.getAllNodes(), edges: this.getAllEdges() };
  }
  static fromJSON(e, s = !0) {
    const t = new D();
    for (const o of e.nodes)
      try {
        t.addNode(o);
      } catch (r) {
        console.warn(`Failed to add node ${o.id}:`, r);
      }
    for (const o of e.edges)
      try {
        t.addEdge(o);
      } catch (r) {
        console.warn(`Failed to add edge ${o.id}:`, r);
      }
    return (s && t.validateIntegrity(), t);
  }
  validateIntegrity() {
    let e = 0;
    for (const s of this.edges.values())
      (this.nodes.has(s.fromNode) ||
        (console.warn(
          `Edge ${s.id} references non-existent fromNode ${s.fromNode}`,
        ),
        e++),
        this.nodes.has(s.toNode) ||
          (console.warn(
            `Edge ${s.id} references non-existent toNode ${s.toNode}`,
          ),
          e++));
    for (const s of this.nodes.values())
      s.type !== "waypoint" &&
        s.connections.length === 0 &&
        (console.warn(`Node ${s.id} (${s.type}) has no connections`), e++);
    e === 0
      ? console.log("✓ Network graph integrity validated - no issues found")
      : console.warn(`⚠ Network graph has ${e} integrity issues`);
  }
}
function Q(n, e) {
  const s = e[0] - n[0],
    t = e[1] - n[1],
    o = e[2] - n[2];
  return Math.sqrt(s * s + t * t + o * o);
}
function Ee(n, e, s = 0.1) {
  return Q(n, e) < s;
}
const j = new D(),
  w = O()((n, e) => ({
    graph: j,
    version: 0,
    visualEntities: {},
    addNode: (s) => {
      (j.addNode(s), n((t) => ({ version: t.version + 1 })));
    },
    removeNode: (s) => {
      (j.removeNode(s), n((t) => ({ version: t.version + 1 })));
    },
    addEdge: (s) => {
      (j.addEdge(s), n((t) => ({ version: t.version + 1 })));
    },
    removeEdge: (s) => {
      (j.removeEdge(s), n((t) => ({ version: t.version + 1 })));
    },
    findNodeAtPosition: (s, t = 0.1) =>
      j.getAllNodes().find((r) => Ee(r.position, s, t)) ?? null,
    registerVisualEntity: (s, t) => {
      n((o) => ({ visualEntities: { ...o.visualEntities, [s]: t } }));
    },
    unregisterVisualEntity: (s) => {
      const t = e().visualEntities[s];
      if (t)
        return (
          n((o) => {
            const { [s]: r, ...c } = o.visualEntities;
            return { visualEntities: c };
          }),
          t
        );
    },
    getVisualEntity: (s) => e().visualEntities[s],
    incrementVersion: () => n((s) => ({ version: s.version + 1 })),
  })),
  A = 10,
  C = 0.5,
  be = {
    rail: {
      nodeType: "junction",
      trackType: "rail",
      segment: {
        renderKind: "track",
        thickness: 0.3,
        width: 2,
        speedLimit: 60,
        capacity: 1,
      },
    },
    road: {
      nodeType: "junction",
      trackType: "road",
      segment: {
        renderKind: "road",
        thickness: 0.2,
        width: 4,
        speedLimit: 40,
        capacity: 2,
      },
    },
    station: {
      nodeType: "station",
      trackType: "rail",
      segment: {
        renderKind: "track",
        thickness: 0.3,
        width: 2,
        speedLimit: 40,
        capacity: 1,
      },
      building: {
        renderKind: "station",
        dimensions: [20, 4, 10],
        color: "#d1a054",
      },
    },
    depot: {
      nodeType: "depot",
      trackType: "rail",
      segment: {
        renderKind: "track",
        thickness: 0.3,
        width: 2,
        speedLimit: 40,
        capacity: 1,
      },
      building: {
        renderKind: "depot",
        dimensions: [15, 4, 15],
        color: "#8c6239",
      },
    },
  };
function L(n, e) {
  switch (n) {
    case "demolish":
      return !!e;
    case "rail":
    case "road":
    case "station":
    case "depot":
      return !e;
    default:
      return !1;
  }
}
function je(n, e, s) {
  const t = n.metadata?.trackType ?? null;
  if (t && t !== s) return !1;
  const o = Math.abs(n.position[0] - e[0]),
    r = Math.abs(n.position[2] - e[2]);
  return (
    Math.abs(n.position[1] - e[1]) < C &&
    ((o === A && r === 0) || (r === A && o === 0))
  );
}
function Pe() {
  const n = E((a) => a.tool),
    e = E((a) => a.setGhostPosition),
    s = E((a) => a.setValidPlacement),
    { gl: t } = Z(),
    o = Ne(),
    r = $(),
    c = w((a) => a.graph),
    v = w((a) => a.addNode),
    l = w((a) => a.addEdge),
    B = w((a) => a.removeNode),
    N = w((a) => a.findNodeAtPosition),
    S = w((a) => a.registerVisualEntity),
    F = w((a) => a.unregisterVisualEntity),
    ee = w((a) => a.version),
    [f, M] = m.useState(null),
    [te, T] = m.useState(!0),
    b = n !== "none" && n !== "query",
    K = m.useCallback(
      (a, h, d) => {
        const x = Q(a, h),
          u = P(),
          p = [(a[0] + h[0]) / 2, a[1] + d.thickness / 2, (a[2] + h[2]) / 2],
          y = Math.abs(h[2] - a[2]) > Math.abs(h[0] - a[0]) ? Math.PI / 2 : 0,
          k = r.add({
            id: u,
            Transform: { position: p, rotation: [0, y, 0] },
            Renderable: {
              kind: d.renderKind,
              dimensions: [x, d.thickness, d.width],
            },
          });
        return (S(u, k), { visualEntityId: u, length: x });
      },
      [S, r],
    ),
    z = m.useCallback(
      (a, h, d) => {
        const x = c
          .getAllNodes()
          .filter((u) => u.id !== a && je(u, h, d.trackType));
        for (const u of x) {
          if (c.getEdgesBetweenNodes(a, u.id).length > 0) continue;
          const { visualEntityId: p, length: g } = K(h, u.position, d.segment),
            y = {
              trackType: d.trackType,
              length: g,
              speedLimit: d.segment.speedLimit,
              capacity: d.segment.capacity,
              occupied: [],
              visualEntityId: p,
            };
          (l({ id: P(), fromNode: a, toNode: u.id, ...y }),
            l({ id: P(), fromNode: u.id, toNode: a, ...y }));
        }
      },
      [l, K, c],
    ),
    W = m.useCallback(
      (a, h) => {
        const d = be[a],
          x = P(),
          u = [h.x, h.y, h.z];
        u[1] = 0;
        const p = { trackType: d.trackType };
        if (d.building) {
          const g = P(),
            y = d.building.dimensions,
            k = r.add({
              id: g,
              Transform: { position: [u[0], u[1] + y[1] / 2, u[2]] },
              Renderable: {
                kind: d.building.renderKind,
                dimensions: y,
                color: d.building.color,
              },
            });
          (S(g, k), (p.visualEntityId = g));
        }
        (v({
          id: x,
          position: u,
          type: d.nodeType,
          connections: [],
          metadata: p,
        }),
          z(x, u, d));
      },
      [v, z, S, r],
    ),
    q = m.useCallback(
      (a) => {
        const h = [a.x, a.y, a.z],
          d = N(h, C);
        if (!d) return;
        const x = c.getConnectedEdges(d.id),
          u = new Set();
        for (const g of x) g.visualEntityId && u.add(g.visualEntityId);
        const p = d.metadata?.visualEntityId;
        typeof p == "string" && u.add(p);
        for (const g of u) {
          const y = F(g);
          y && r.remove(y);
        }
        B(d.id);
      },
      [N, c, B, F, r],
    ),
    I = m.useCallback(
      (a) => {
        if (!b) {
          (M(null), e(null), T(!1), s(!1));
          return;
        }
        const h = t.domElement.getBoundingClientRect(),
          d = ((a.clientX - h.left) / h.width) * 2 - 1,
          x = -((a.clientY - h.top) / h.height) * 2 + 1,
          u = new re(d, x),
          p = o(u);
        if (p) {
          const g = we(p, A);
          (M(g), e([g.x, g.y, g.z]));
          const y = [g.x, g.y, g.z],
            k = N(y, C),
            _ = L(n, k);
          (T(_), s(_));
        } else (M(null), e(null), T(!1), s(!1));
      },
      [N, t.domElement, b, o, e, s, n],
    ),
    G = m.useCallback(
      (a) => {
        if (!b || !f) return;
        const h = [f.x, f.y, f.z],
          d = N(h, C);
        if (L(n, d)) {
          if ((a.stopPropagation(), n === "demolish")) {
            q(f);
            return;
          }
          (n === "rail" || n === "road" || n === "station" || n === "depot") &&
            W(n, f);
        }
      },
      [q, N, f, b, W, n],
    );
  return (
    m.useEffect(() => {
      if (!b || !f) return;
      const a = [f.x, f.y, f.z],
        h = N(a, C),
        d = L(n, h);
      (T(d), s(d));
    }, [N, f, b, s, n, ee]),
    m.useEffect(() => {
      const a = t.domElement;
      return (
        a.addEventListener("mousemove", I),
        a.addEventListener("click", G),
        () => {
          (a.removeEventListener("mousemove", I),
            a.removeEventListener("click", G));
        }
      );
    }, [t.domElement, G, I]),
    { hoverPosition: f, isValid: te, isActive: b }
  );
}
function ke() {
  const n = $(),
    e = E((s) => s.showGrid);
  return (
    fe(n),
    Pe(),
    m.useEffect(() => {
      n.add({
        id: P(),
        Transform: { position: [0, 0.5, 0] },
        Renderable: { kind: "vehicle" },
        Vehicle: { speed: 0, accel: 0.5, maxSpeed: 2, type: "train" },
      });
    }, [n]),
    i.jsxs(i.Fragment, {
      children: [
        i.jsx(xe, {}),
        i.jsx(ye, {}),
        i.jsx(ve, {}),
        i.jsx(J, {
          visible: e,
          args: [1e3, 1e3],
          cellSize: 10,
          cellThickness: 0.5,
          cellColor: "#888888",
          sectionSize: 50,
          sectionThickness: 1,
          sectionColor: "#666666",
          fadeDistance: 500,
          fadeStrength: 1,
        }),
        i.jsx(J, {
          infiniteGrid: !0,
          cellSize: 1,
          cellThickness: 0.5,
          sectionSize: 5,
          fadeDistance: 50,
        }),
      ],
    })
  );
}
function Ce() {
  return i.jsx(ge, {
    children: i.jsxs(ae, {
      shadows: !0,
      camera: { position: [12, 12, 12], fov: 50 },
      style: { position: "absolute", inset: 0 },
      children: [
        i.jsx("color", { attach: "background", args: ["#1a1a1a"] }),
        i.jsx("ambientLight", { intensity: 0.5 }),
        i.jsx("directionalLight", {
          position: [10, 20, 10],
          intensity: 1.1,
          castShadow: !0,
        }),
        i.jsx(ke, {}),
        i.jsx(de, {
          makeDefault: !0,
          enableDamping: !0,
          minPolarAngle: Math.PI / 6,
          maxPolarAngle: Math.PI / 3,
          minDistance: 10,
          maxDistance: 200,
        }),
        i.jsx(ce, {}),
      ],
    }),
  });
}
const Se = O()(
    U(
      X(
        (n, e) => ({
          speed: 1,
          paused: !1,
          setSpeed: (s) => n({ speed: s }),
          togglePause: () => n({ paused: !e().paused }),
        }),
        {
          name: "clock-storage",
          storage: le(() => localStorage),
          partialize: (n) => ({ speed: n.speed }),
        },
      ),
    ),
  ),
  Te = [
    { id: "rail", label: "Build Rails", icon: "🛤️", hotkey: "R" },
    { id: "road", label: "Build Roads", icon: "🛣️", hotkey: "O" },
    { id: "station", label: "Build Station", icon: "🚉", hotkey: "S" },
    { id: "depot", label: "Build Depot", icon: "🏭", hotkey: "D" },
    { id: "demolish", label: "Demolish", icon: "💣", hotkey: "X" },
    { id: "query", label: "Query Tool", icon: "❓", hotkey: "Q" },
  ],
  Me = [1, 2, 4, 8];
function Ie() {
  const { tool: n, setTool: e, showGrid: s, toggleGrid: t } = E(),
    { speed: o, paused: r, setSpeed: c, togglePause: v } = Se();
  return i.jsxs("header", {
    className: "top-menu-bar",
    children: [
      i.jsxs("div", {
        className: "menu-section tools",
        children: [
          i.jsx("h3", { children: "Construction" }),
          i.jsx("div", {
            className: "tool-buttons",
            children: Te.map((l) =>
              i.jsxs(
                "button",
                {
                  className: `tool-btn ${n === l.id ? "active" : ""}`,
                  onClick: () => e(n === l.id ? "none" : l.id),
                  title: `${l.label} (${l.hotkey})`,
                  children: [
                    i.jsx("span", { className: "icon", children: l.icon }),
                    i.jsx("span", { className: "label", children: l.label }),
                  ],
                },
                l.id,
              ),
            ),
          }),
        ],
      }),
      i.jsx("div", {
        className: "menu-section time-display",
        children: i.jsxs("div", {
          className: "game-date",
          children: [
            i.jsx("span", { className: "date", children: "Jan 1950" }),
            i.jsx("span", { className: "day", children: "Mon" }),
          ],
        }),
      }),
      i.jsxs("div", {
        className: "menu-section controls",
        children: [
          i.jsxs("button", {
            className: `control-btn ${r ? "active" : ""}`,
            onClick: v,
            title: "Pause (Space)",
            "aria-label": r ? "Play" : "Pause",
            "data-testid": "pause-button",
            children: [
              i.jsx("span", { className: "icon", children: r ? "▶️" : "⏸️" }),
              i.jsx("span", {
                className: "label-text",
                children: r ? "Play" : "Pause",
              }),
            ],
          }),
          Me.map((l) =>
            i.jsx(
              "button",
              {
                className: `control-btn ${!r && o === l ? "active" : ""}`,
                onClick: () => {
                  (c(l), r && v());
                },
                title: `Speed ${l}x`,
                "aria-label": `×${l} Speed ${l}x`,
                children: i.jsxs("span", {
                  className: "label-text",
                  children: ["×", l],
                }),
              },
              l,
            ),
          ),
          i.jsx("button", {
            className: `control-btn ${s ? "active" : ""}`,
            onClick: t,
            title: "Toggle Grid (G)",
            children: "🔲",
          }),
        ],
      }),
    ],
  });
}
function Ge() {
  return i.jsx(i.Fragment, { children: i.jsx(Ie, {}) });
}
function Ve() {
  return i.jsxs("div", {
    style: { width: "100vw", height: "100vh" },
    children: [i.jsx(Ce, {}), i.jsx(Ge, {})],
  });
}
const Y = document.getElementById("root");
if (!Y) throw new Error("Root element not found");
ue.createRoot(Y).render(i.jsx(m.StrictMode, { children: i.jsx(Ve, {}) }));
//# sourceMappingURL=index-BDFnqgi3.js.map
