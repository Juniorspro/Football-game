// ============================================================================
//  babylon-three-shim.js  —  THREE.js compatibility layer backed by Babylon.js
//  PART 1 / N : math (Vector2, Vector3, Quaternion, Euler, Color, Box3)
//
//  This file is auto-assembled from shim_partN.js — do not edit the parts and
//  the bundle independently. Everything renders through Babylon.js; this layer
//  reproduces the subset of the THREE.js API the game uses.
// ============================================================================
if (typeof BABYLON === 'undefined') {
  throw new Error('[shim] Babylon.js must be loaded (CDN <script>) before the THREE shim.');
}

// ---- constants -------------------------------------------------------------
export const FrontSide = 0, BackSide = 1, DoubleSide = 2;
export const SRGBColorSpace = 'srgb', LinearSRGBColorSpace = 'srgb-linear', NoColorSpace = '';
export const ACESFilmicToneMapping = 4, NoToneMapping = 0, LinearToneMapping = 1;
export const PCFShadowMap = 1, PCFSoftShadowMap = 2, BasicShadowMap = 0;
export const LoopOnce = 2200, LoopRepeat = 2201, LoopPingPong = 2202;
export const RepeatWrapping = 1000, ClampToEdgeWrapping = 1001, MirroredRepeatWrapping = 1002;
export const LinearMipmapLinearFilter = 1008, LinearFilter = 1006, NearestFilter = 1003;
export const UnsignedShortType = 1012, UnsignedIntType = 1014, FloatType = 1015;
export const NormalBlending = 1, AdditiveBlending = 2;

const DEG2RAD = Math.PI / 180;
const _EPS = 1e-6;

// forward-declared scratch (assigned at the bottom of the bundle, after all
// classes exist). Methods reference these module-scope bindings at run time.
let _m1;   // Matrix4 scratch (defined in part 2)
let _q1;   // Quaternion scratch

// ---- Vector2 ---------------------------------------------------------------
export class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y) { this.x = x; this.y = y; return this; }
  copy(v) { this.x = v.x; this.y = v.y; return this; }
  clone() { return new Vector2(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; return this; }
  length() { return Math.hypot(this.x, this.y); }
  lengthSq() { return this.x * this.x + this.y * this.y; }
  normalize() { const l = this.length() || 1; this.x /= l; this.y /= l; return this; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  dot(v) { return this.x * v.x + this.y * v.y; }
}

// ---- Vector3 ---------------------------------------------------------------
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { this.x = s; this.y = s; this.z = s; return this; }
  setX(x){ this.x = x; return this; } setY(y){ this.y = y; return this; } setZ(z){ this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  addScalar(s) { this.x += s; this.y += s; this.z += s; return this; }
  addVectors(a, b) { this.x = a.x + b.x; this.y = a.y + b.y; this.z = a.z + b.z; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; }
  multiply(v) { this.x *= v.x; this.y *= v.y; this.z *= v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  divideScalar(s) { return this.multiplyScalar(1 / (s || 1)); }
  negate() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
  normalize() { return this.divideScalar(this.length() || 1); }
  setLength(l) { return this.normalize().multiplyScalar(l); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) { return this.crossVectors(this, v); }
  crossVectors(a, b) {
    const ax = a.x, ay = a.y, az = a.z, bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by; this.y = az * bx - ax * bz; this.z = ax * by - ay * bx;
    return this;
  }
  distanceTo(v) { return Math.sqrt(this.distanceToSquared(v)); }
  distanceToSquared(v) { const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z; return dx * dx + dy * dy + dz * dz; }
  lerp(v, a) { this.x += (v.x - this.x) * a; this.y += (v.y - this.y) * a; this.z += (v.z - this.z) * a; return this; }
  lerpVectors(a, b, t) { this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; return this; }
  min(v) { this.x = Math.min(this.x, v.x); this.y = Math.min(this.y, v.y); this.z = Math.min(this.z, v.z); return this; }
  max(v) { this.x = Math.max(this.x, v.x); this.y = Math.max(this.y, v.y); this.z = Math.max(this.z, v.z); return this; }
  equals(v) { return v.x === this.x && v.y === this.y && v.z === this.z; }
  applyQuaternion(q) {
    const { x, y, z } = this; const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
  }
  applyAxisAngle(axis, angle) { return this.applyQuaternion(_q1.setFromAxisAngle(axis, angle)); }
  applyMatrix4(m) {
    const { x, y, z } = this; const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15] || 1);
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return this;
  }
  setFromMatrixPosition(m) { const e = m.elements; this.x = e[12]; this.y = e[13]; this.z = e[14]; return this; }
  setFromMatrixColumn(m, i) { const e = m.elements, o = i * 4; this.x = e[o]; this.y = e[o + 1]; this.z = e[o + 2]; return this; }
  angleTo(v) {
    const denom = Math.sqrt(this.lengthSq() * v.lengthSq());
    if (denom === 0) return Math.PI / 2;
    return Math.acos(Math.min(1, Math.max(-1, this.dot(v) / denom)));
  }
  project(camera) { return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix); }
  toArray(a = [], o = 0) { a[o] = this.x; a[o + 1] = this.y; a[o + 2] = this.z; return a; }
}

// ---- Quaternion ------------------------------------------------------------
export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) { this._x = x; this._y = y; this._z = z; this._w = w; this._onChangeCb = null; }
  get x() { return this._x; } set x(v) { this._x = v; this._fire(); }
  get y() { return this._y; } set y(v) { this._y = v; this._fire(); }
  get z() { return this._z; } set z(v) { this._z = v; this._fire(); }
  get w() { return this._w; } set w(v) { this._w = v; this._fire(); }
  _fire() { if (this._onChangeCb) this._onChangeCb(); }
  _onChange(cb) { this._onChangeCb = cb; return this; }
  set(x, y, z, w) { this._x = x; this._y = y; this._z = z; this._w = w; this._fire(); return this; }
  copy(q) { this._x = q.x; this._y = q.y; this._z = q.z; this._w = q.w; this._fire(); return this; }
  clone() { return new Quaternion(this._x, this._y, this._z, this._w); }
  identity() { return this.set(0, 0, 0, 1); }
  setFromAxisAngle(axis, angle) {
    const h = angle / 2, s = Math.sin(h);
    this._x = axis.x * s; this._y = axis.y * s; this._z = axis.z * s; this._w = Math.cos(h);
    this._fire(); return this;
  }
  setFromEuler(euler, fire = true) {
    const x = euler._x, y = euler._y, z = euler._z, order = euler._order;
    const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
    switch (order) {
      case 'XYZ':
        this._x = s1 * c2 * c3 + c1 * s2 * s3; this._y = c1 * s2 * c3 - s1 * c2 * s3;
        this._z = c1 * c2 * s3 + s1 * s2 * c3; this._w = c1 * c2 * c3 - s1 * s2 * s3; break;
      case 'YXZ':
        this._x = s1 * c2 * c3 + c1 * s2 * s3; this._y = c1 * s2 * c3 - s1 * c2 * s3;
        this._z = c1 * c2 * s3 - s1 * s2 * c3; this._w = c1 * c2 * c3 + s1 * s2 * s3; break;
      case 'ZXY':
        this._x = s1 * c2 * c3 - c1 * s2 * s3; this._y = c1 * s2 * c3 + s1 * c2 * s3;
        this._z = c1 * c2 * s3 + s1 * s2 * c3; this._w = c1 * c2 * c3 - s1 * s2 * s3; break;
      case 'ZYX':
        this._x = s1 * c2 * c3 - c1 * s2 * s3; this._y = c1 * s2 * c3 + s1 * c2 * s3;
        this._z = c1 * c2 * s3 - s1 * s2 * c3; this._w = c1 * c2 * c3 + s1 * s2 * s3; break;
      case 'YZX':
        this._x = s1 * c2 * c3 + c1 * s2 * s3; this._y = c1 * s2 * c3 + s1 * c2 * s3;
        this._z = c1 * c2 * s3 - s1 * s2 * c3; this._w = c1 * c2 * c3 - s1 * s2 * s3; break;
      case 'XZY':
        this._x = s1 * c2 * c3 - c1 * s2 * s3; this._y = c1 * s2 * c3 - s1 * c2 * s3;
        this._z = c1 * c2 * s3 + s1 * s2 * c3; this._w = c1 * c2 * c3 + s1 * s2 * s3; break;
    }
    if (fire) this._fire(); return this;
  }
  setFromRotationMatrix(m) {
    const te = m.elements;
    const m11 = te[0], m12 = te[4], m13 = te[8];
    const m21 = te[1], m22 = te[5], m23 = te[9];
    const m31 = te[2], m32 = te[6], m33 = te[10];
    const trace = m11 + m22 + m33;
    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      this._w = 0.25 / s; this._x = (m32 - m23) * s; this._y = (m13 - m31) * s; this._z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
      this._w = (m32 - m23) / s; this._x = 0.25 * s; this._y = (m12 + m21) / s; this._z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      this._w = (m13 - m31) / s; this._x = (m12 + m21) / s; this._y = 0.25 * s; this._z = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
      this._w = (m21 - m12) / s; this._x = (m13 + m31) / s; this._y = (m23 + m32) / s; this._z = 0.25 * s;
    }
    this._fire(); return this;
  }
  setFromUnitVectors(vFrom, vTo) {
    let r = vFrom.dot(vTo) + 1;
    if (r < _EPS) {
      r = 0;
      if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) { this._x = -vFrom.y; this._y = vFrom.x; this._z = 0; }
      else { this._x = 0; this._y = -vFrom.z; this._z = vFrom.y; }
    } else {
      this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
      this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
      this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
    }
    this._w = r; return this.normalize();
  }
  multiply(q) { return this.multiplyQuaternions(this, q); }
  premultiply(q) { return this.multiplyQuaternions(q, this); }
  multiplyQuaternions(a, b) {
    const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
    this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
    this._fire(); return this;
  }
  normalize() {
    let l = Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
    if (l === 0) { this._x = 0; this._y = 0; this._z = 0; this._w = 1; }
    else { l = 1 / l; this._x *= l; this._y *= l; this._z *= l; this._w *= l; }
    this._fire(); return this;
  }
  invert() { this._x *= -1; this._y *= -1; this._z *= -1; this._fire(); return this; }
  dot(q) { return this._x * q.x + this._y * q.y + this._z * q.z + this._w * q.w; }
  angleTo(q) { return 2 * Math.acos(Math.min(1, Math.abs(Math.max(-1, this.dot(q))))); }
  slerp(qb, t) {
    if (t === 0) return this; if (t === 1) return this.copy(qb);
    const x = this._x, y = this._y, z = this._z, w = this._w;
    let cosHalf = w * qb.w + x * qb.x + y * qb.y + z * qb.z;
    let bx = qb.x, by = qb.y, bz = qb.z, bw = qb.w;
    if (cosHalf < 0) { bw = -bw; bx = -bx; by = -by; bz = -bz; cosHalf = -cosHalf; }
    if (cosHalf >= 1.0) { this._x = x; this._y = y; this._z = z; this._w = w; this._fire(); return this; }
    const sqr = 1 - cosHalf * cosHalf;
    if (sqr <= Number.EPSILON) {
      const s = 1 - t;
      this._w = s * w + t * bw; this._x = s * x + t * bx; this._y = s * y + t * by; this._z = s * z + t * bz;
      return this.normalize();
    }
    const sinHalf = Math.sqrt(sqr), halfTheta = Math.atan2(sinHalf, cosHalf);
    const ra = Math.sin((1 - t) * halfTheta) / sinHalf, rb = Math.sin(t * halfTheta) / sinHalf;
    this._w = w * ra + bw * rb; this._x = x * ra + bx * rb; this._y = y * ra + by * rb; this._z = z * ra + bz * rb;
    this._fire(); return this;
  }
  copyRaw(x, y, z, w) { this._x = x; this._y = y; this._z = z; this._w = w; this._fire(); return this; }
}

// ---- Euler -----------------------------------------------------------------
export class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') { this._x = x; this._y = y; this._z = z; this._order = order; this._onChangeCb = null; }
  get x() { return this._x; } set x(v) { this._x = v; this._fire(); }
  get y() { return this._y; } set y(v) { this._y = v; this._fire(); }
  get z() { return this._z; } set z(v) { this._z = v; this._fire(); }
  get order() { return this._order; } set order(v) { this._order = v; this._fire(); }
  _fire() { if (this._onChangeCb) this._onChangeCb(); }
  _onChange(cb) { this._onChangeCb = cb; return this; }
  set(x, y, z, order) { this._x = x; this._y = y; this._z = z; if (order) this._order = order; this._fire(); return this; }
  copy(e) { this._x = e._x; this._y = e._y; this._z = e._z; this._order = e._order; this._fire(); return this; }
  clone() { return new Euler(this._x, this._y, this._z, this._order); }
  setFromQuaternion(q, order, fire = true) {
    _m1.makeRotationFromQuaternion(q);
    return this.setFromRotationMatrix(_m1, order || this._order, fire);
  }
  setFromRotationMatrix(m, order = this._order, fire = true) {
    const te = m.elements;
    const m11 = te[0], m12 = te[4], m13 = te[8];
    const m21 = te[1], m22 = te[5], m23 = te[9];
    const m31 = te[2], m32 = te[6], m33 = te[10];
    const clamp = (v) => Math.min(1, Math.max(-1, v));
    switch (order) {
      case 'XYZ':
        this._y = Math.asin(clamp(m13));
        if (Math.abs(m13) < 0.9999999) { this._x = Math.atan2(-m23, m33); this._z = Math.atan2(-m12, m11); }
        else { this._x = Math.atan2(m32, m22); this._z = 0; } break;
      case 'YXZ':
        this._x = Math.asin(-clamp(m23));
        if (Math.abs(m23) < 0.9999999) { this._y = Math.atan2(m13, m33); this._z = Math.atan2(m21, m22); }
        else { this._y = Math.atan2(-m31, m11); this._z = 0; } break;
      case 'ZXY':
        this._x = Math.asin(clamp(m32));
        if (Math.abs(m32) < 0.9999999) { this._y = Math.atan2(-m31, m33); this._z = Math.atan2(-m12, m22); }
        else { this._y = 0; this._z = Math.atan2(m21, m11); } break;
      case 'ZYX':
        this._y = Math.asin(-clamp(m31));
        if (Math.abs(m31) < 0.9999999) { this._x = Math.atan2(m32, m33); this._z = Math.atan2(m21, m11); }
        else { this._x = 0; this._z = Math.atan2(-m12, m22); } break;
      case 'YZX':
        this._z = Math.asin(clamp(m21));
        if (Math.abs(m21) < 0.9999999) { this._x = Math.atan2(-m23, m22); this._y = Math.atan2(-m31, m11); }
        else { this._x = 0; this._y = Math.atan2(m13, m33); } break;
      case 'XZY':
        this._z = Math.asin(-clamp(m12));
        if (Math.abs(m12) < 0.9999999) { this._x = Math.atan2(m32, m22); this._y = Math.atan2(m13, m11); }
        else { this._x = Math.atan2(-m23, m33); this._y = 0; } break;
    }
    this._order = order;
    if (fire) this._fire(); return this;
  }
}

// ---- Color -----------------------------------------------------------------
export class Color {
  constructor(r, g, b) { this.r = 1; this.g = 1; this.b = 1; if (r !== undefined) this.set(r, g, b); }
  set(r, g, b) {
    if (g === undefined && b === undefined) {
      if (r instanceof Color) { this.r = r.r; this.g = r.g; this.b = r.b; }
      else if (typeof r === 'number') this.setHex(r);
      else if (typeof r === 'string') this.setStyle(r);
    } else { this.r = r; this.g = g; this.b = b; }
    return this;
  }
  setHex(hex) { hex = Math.floor(hex); this.r = ((hex >> 16) & 255) / 255; this.g = ((hex >> 8) & 255) / 255; this.b = (hex & 255) / 255; return this; }
  setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
  setStyle(s) {
    if (s[0] === '#') {
      if (s.length === 7) return this.setHex(parseInt(s.slice(1), 16));
      if (s.length === 4) { const h = s.slice(1); return this.setHex(parseInt(h[0] + h[0] + h[1] + h[1] + h[2] + h[2], 16)); }
    }
    return this;
  }
  copy(c) { this.r = c.r; this.g = c.g; this.b = c.b; return this; }
  clone() { return new Color(this.r, this.g, this.b); }
  getHex() { return (Math.round(this.r * 255) << 16) ^ (Math.round(this.g * 255) << 8) ^ Math.round(this.b * 255); }
  toBabylon() { return new BABYLON.Color3(this.r, this.g, this.b); }
}

// ---- Box3 ------------------------------------------------------------------
export class Box3 {
  constructor(min, max) {
    this.min = min || new Vector3(Infinity, Infinity, Infinity);
    this.max = max || new Vector3(-Infinity, -Infinity, -Infinity);
  }
  makeEmpty() { this.min.set(Infinity, Infinity, Infinity); this.max.set(-Infinity, -Infinity, -Infinity); return this; }
  isEmpty() { return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z; }
  expandByPoint(p) { this.min.min(p); this.max.max(p); return this; }
  setFromCenterAndSize(center, size) {
    const hx = size.x / 2, hy = size.y / 2, hz = size.z / 2;
    this.min.set(center.x - hx, center.y - hy, center.z - hz);
    this.max.set(center.x + hx, center.y + hy, center.z + hz);
    return this;
  }
  setFromObject(obj) {
    this.makeEmpty();
    // Defers to the renderer-aware world AABB collector (set up in part 5).
    if (typeof globalThis.__shimBox3FromObject === 'function') globalThis.__shimBox3FromObject(obj, this);
    return this;
  }
  getCenter(t = new Vector3()) { return this.isEmpty() ? t.set(0, 0, 0) : t.addVectors(this.min, this.max).multiplyScalar(0.5); }
  getSize(t = new Vector3()) { return this.isEmpty() ? t.set(0, 0, 0) : t.subVectors(this.max, this.min); }
  containsPoint(p) {
    return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y && p.z >= this.min.z && p.z <= this.max.z;
  }
  intersectsBox(b) {
    return b.max.x >= this.min.x && b.min.x <= this.max.x && b.max.y >= this.min.y && b.min.y <= this.max.y && b.max.z >= this.min.z && b.min.z <= this.max.z;
  }
  expandByScalar(s) { this.min.addScalar(-s); this.max.addScalar(s); return this; }
  expandByVector(v) { this.min.sub(v); this.max.add(v); return this; }
  union(b) { this.min.min(b.min); this.max.max(b.max); return this; }
  translate(o) { this.min.add(o); this.max.add(o); return this; }
  applyMatrix4(m) {
    if (this.isEmpty()) return this;
    const mn = this.min, mx = this.max;
    _bp[0].set(mn.x, mn.y, mn.z); _bp[1].set(mn.x, mn.y, mx.z);
    _bp[2].set(mn.x, mx.y, mn.z); _bp[3].set(mn.x, mx.y, mx.z);
    _bp[4].set(mx.x, mn.y, mn.z); _bp[5].set(mx.x, mn.y, mx.z);
    _bp[6].set(mx.x, mx.y, mn.z); _bp[7].set(mx.x, mx.y, mx.z);
    this.makeEmpty();
    for (let i = 0; i < 8; i++) this.expandByPoint(_bp[i].applyMatrix4(m));
    return this;
  }
  copy(b) { this.min.copy(b.min); this.max.copy(b.max); return this; }
  clone() { return new Box3(this.min.clone(), this.max.clone()); }
}
const _bp = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];

_q1 = new Quaternion();   // Matrix4 scratch _m1 is assigned at the end of part 2
// ============================================================================
//  PART 2 / N : Matrix4 (scene-graph transforms)
// ============================================================================

export class Matrix4 {
  constructor() { this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  identity() { this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); return this; }
  set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    const te = this.elements;
    te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
    te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
    te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
    te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;
    return this;
  }
  copy(m) { for (let i = 0; i < 16; i++) this.elements[i] = m.elements[i]; return this; }
  clone() { return new Matrix4().copy(this); }
  makeTranslation(x, y, z) { return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1); }
  makeRotationY(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
  }
  makeRotationX(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
  }
  makeRotationFromQuaternion(q) { return this.compose(_zero3, q, _one3); }
  multiply(m) { return this.multiplyMatrices(this, m); }
  premultiply(m) { return this.multiplyMatrices(m, this); }
  multiplyMatrices(a, b) {
    const ae = a.elements, be = b.elements, te = this.elements;
    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];
    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];
    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
    return this;
  }
  compose(position, quaternion, scale) {
    const te = this.elements;
    const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = scale.x, sy = scale.y, sz = scale.z;
    te[0] = (1 - (yy + zz)) * sx; te[1] = (xy + wz) * sx; te[2] = (xz - wy) * sx; te[3] = 0;
    te[4] = (xy - wz) * sy; te[5] = (1 - (xx + zz)) * sy; te[6] = (yz + wx) * sy; te[7] = 0;
    te[8] = (xz + wy) * sz; te[9] = (yz - wx) * sz; te[10] = (1 - (xx + yy)) * sz; te[11] = 0;
    te[12] = position.x; te[13] = position.y; te[14] = position.z; te[15] = 1;
    return this;
  }
  decompose(position, quaternion, scale) {
    const te = this.elements;
    let sx = _v1.set(te[0], te[1], te[2]).length();
    const sy = _v1.set(te[4], te[5], te[6]).length();
    const sz = _v1.set(te[8], te[9], te[10]).length();
    const det = this.determinant();
    if (det < 0) sx = -sx;
    position.x = te[12]; position.y = te[13]; position.z = te[14];
    _m2.copy(this);
    const invSX = 1 / sx, invSY = 1 / sy, invSZ = 1 / sz;
    const me = _m2.elements;
    me[0] *= invSX; me[1] *= invSX; me[2] *= invSX;
    me[4] *= invSY; me[5] *= invSY; me[6] *= invSY;
    me[8] *= invSZ; me[9] *= invSZ; me[10] *= invSZ;
    quaternion.setFromRotationMatrix(_m2);
    scale.x = sx; scale.y = sy; scale.z = sz;
    return this;
  }
  determinant() {
    const te = this.elements;
    const n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
    const n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
    const n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
    const n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];
    return (
      n41 * (n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) +
      n42 * (n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) +
      n43 * (n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) +
      n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31)
    );
  }
  invert() {
    const te = this.elements,
      n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
      n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
      n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
      n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],
      t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
      t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
      t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
      t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const idet = 1 / det;
    te[0] = t11 * idet;
    te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * idet;
    te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * idet;
    te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * idet;
    te[4] = t12 * idet;
    te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * idet;
    te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * idet;
    te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * idet;
    te[8] = t13 * idet;
    te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * idet;
    te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * idet;
    te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * idet;
    te[12] = t14 * idet;
    te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * idet;
    te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * idet;
    te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * idet;
    return this;
  }
  extractRotation(m) {
    const te = this.elements, me = m.elements;
    const sx = 1 / _v1.set(me[0], me[1], me[2]).length();
    const sy = 1 / _v1.set(me[4], me[5], me[6]).length();
    const sz = 1 / _v1.set(me[8], me[9], me[10]).length();
    te[0] = me[0] * sx; te[1] = me[1] * sx; te[2] = me[2] * sx; te[3] = 0;
    te[4] = me[4] * sy; te[5] = me[5] * sy; te[6] = me[6] * sy; te[7] = 0;
    te[8] = me[8] * sz; te[9] = me[9] * sz; te[10] = me[10] * sz; te[11] = 0;
    te[12] = 0; te[13] = 0; te[14] = 0; te[15] = 1;
    return this;
  }
  lookAt(eye, target, up) {
    _z.subVectors(eye, target);
    if (_z.lengthSq() === 0) _z.z = 1;
    _z.normalize();
    _x.crossVectors(up, _z);
    if (_x.lengthSq() === 0) { _z.z += 0.0001; _z.normalize(); _x.crossVectors(up, _z); }
    _x.normalize();
    _y.crossVectors(_z, _x);
    const te = this.elements;
    te[0] = _x.x; te[4] = _y.x; te[8] = _z.x;
    te[1] = _x.y; te[5] = _y.y; te[9] = _z.y;
    te[2] = _x.z; te[6] = _y.z; te[10] = _z.z;
    return this;
  }
  setPosition(x, y, z) {
    const te = this.elements;
    if (x.x !== undefined) { te[12] = x.x; te[13] = x.y; te[14] = x.z; }
    else { te[12] = x; te[13] = y; te[14] = z; }
    return this;
  }
  scale(v) {
    const te = this.elements, x = v.x, y = v.y, z = v.z;
    te[0] *= x; te[4] *= y; te[8] *= z;
    te[1] *= x; te[5] *= y; te[9] *= z;
    te[2] *= x; te[6] *= y; te[10] *= z;
    return this;
  }
}

// scratch for Matrix4 internals (Vector3/Quaternion come from part 1, same module scope)
const _v1 = new Vector3();
const _zero3 = new Vector3(0, 0, 0);
const _one3 = new Vector3(1, 1, 1);
const _x = new Vector3(), _y = new Vector3(), _z = new Vector3();
const _m2 = new Matrix4();
// assign the forward-declared scratch Matrix4 used by Euler.setFromQuaternion (part 1)
_m1 = new Matrix4();
// ============================================================================
//  PART 3 / N : scene graph (Object3D, Group, Mesh, Bone, Line, Scene, camera)
// ============================================================================

let _object3DId = 0;

export class Object3D {
  constructor() {
    this.id = _object3DId++;
    this.uuid = 'o' + this.id;
    this.name = '';
    this.type = 'Object3D';
    this.parent = null;
    this.children = [];
    this.up = new Vector3(0, 1, 0);
    this.position = new Vector3(0, 0, 0);
    this.rotation = new Euler(0, 0, 0, 'XYZ');
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.matrixAutoUpdate = true;
    this.matrixWorldNeedsUpdate = false;
    this.visible = true;
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true;
    this.renderOrder = 0;
    this.userData = {};
    this.isObject3D = true;
    // keep euler <-> quaternion in sync exactly like THREE
    this.rotation._onChange(() => this.quaternion.setFromEuler(this.rotation, false));
    this.quaternion._onChange(() => this.rotation.setFromQuaternion(this.quaternion, undefined, false));
  }
  add(...objs) {
    for (const o of objs) {
      if (o === this || !o) continue;
      if (o.parent) o.parent.remove(o);
      o.parent = this;
      this.children.push(o);
    }
    return this;
  }
  remove(...objs) {
    for (const o of objs) {
      const i = this.children.indexOf(o);
      if (i !== -1) { o.parent = null; this.children.splice(i, 1); }
    }
    return this;
  }
  removeFromParent() { if (this.parent) this.parent.remove(this); return this; }
  clear() { for (const c of this.children) c.parent = null; this.children.length = 0; return this; }
  attach(o) { this.add(o); return this; }
  traverse(cb) { cb(this); for (const c of this.children) c.traverse(cb); }
  traverseVisible(cb) { if (!this.visible) return; cb(this); for (const c of this.children) c.traverseVisible(cb); }
  getObjectByName(name) {
    if (this.name === name) return this;
    for (const c of this.children) { const r = c.getObjectByName(name); if (r) return r; }
    return undefined;
  }
  getObjectByProperty(prop, val) {
    if (this[prop] === val) return this;
    for (const c of this.children) { const r = c.getObjectByProperty(prop, val); if (r) return r; }
    return undefined;
  }
  updateMatrix() { this.matrix.compose(this.position, this.quaternion, this.scale); this.matrixWorldNeedsUpdate = true; }
  updateMatrixWorld(force) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.parent === null) this.matrixWorld.copy(this.matrix);
    else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    for (const c of this.children) c.updateMatrixWorld(force);
  }
  updateWorldMatrix(updateParents, updateChildren) {
    if (updateParents && this.parent) this.parent.updateWorldMatrix(true, false);
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.parent === null) this.matrixWorld.copy(this.matrix);
    else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    if (updateChildren) for (const c of this.children) c.updateWorldMatrix(false, true);
  }
  getWorldPosition(t = new Vector3()) { this.updateWorldMatrix(true, false); return t.setFromMatrixPosition(this.matrixWorld); }
  getWorldQuaternion(t = new Quaternion()) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_posScratch, t, _scaleScratch);
    return t;
  }
  getWorldScale(t = new Vector3()) { this.updateWorldMatrix(true, false); this.matrixWorld.decompose(_posScratch, _quatScratch, t); return t; }
  getWorldDirection(t = new Vector3()) {
    this.updateWorldMatrix(true, false);
    const e = this.matrixWorld.elements;
    return t.set(e[8], e[9], e[10]).normalize();
  }
  localToWorld(v) { this.updateWorldMatrix(true, false); return v.applyMatrix4(this.matrixWorld); }
  worldToLocal(v) { this.updateWorldMatrix(true, false); return v.applyMatrix4(_m3.copy(this.matrixWorld).invert()); }
  lookAt(x, y, z) {
    if (x.isVector3 || x instanceof Vector3 || (x && x.x !== undefined && y === undefined)) _target.copy(x);
    else _target.set(x, y, z);
    this.updateWorldMatrix(true, false);
    _position.setFromMatrixPosition(this.matrixWorld);
    if (this.isCamera || this.isLight) _m3.lookAt(_position, _target, this.up);
    else _m3.lookAt(_target, _position, this.up);
    this.quaternion.setFromRotationMatrix(_m3);
    if (this.parent) {
      _m4.extractRotation(this.parent.matrixWorld);
      _q2.setFromRotationMatrix(_m4);
      this.quaternion.premultiply(_q2.invert());
    }
  }
  rotateOnAxis(axis, angle) { _q2.setFromAxisAngle(axis, angle); this.quaternion.multiply(_q2); return this; }
  rotateX(a) { return this.rotateOnAxis(_xAxis, a); }
  rotateY(a) { return this.rotateOnAxis(_yAxis, a); }
  rotateZ(a) { return this.rotateOnAxis(_zAxis, a); }
  translateOnAxis(axis, distance) { _v2.copy(axis).applyQuaternion(this.quaternion); this.position.add(_v2.multiplyScalar(distance)); return this; }
  setRotationFromQuaternion(q) { this.quaternion.copy(q); return this; }
  applyQuaternion(q) { this.quaternion.premultiply(q); return this; }
}

export class Group extends Object3D { constructor() { super(); this.type = 'Group'; this.isGroup = true; } }

export class Bone extends Object3D { constructor() { super(); this.type = 'Bone'; this.isBone = true; } }

export class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.type = 'Mesh';
    this.isMesh = true;
    this.geometry = geometry || null;
    this.material = material || null;
    this._bjs = null;        // backing Babylon mesh
    this._bjsScene = null;
  }
}

export class Line extends Object3D {
  constructor(geometry, material) {
    super();
    this.type = 'Line';
    this.isLine = true;
    this.geometry = geometry || null;
    this.material = material || null;
    this._bjs = null; this._bjsScene = null;
  }
}

export class LineSegments extends Line {
  constructor(geometry, material) { super(geometry, material); this.type = 'LineSegments'; this.isLineSegments = true; }
}

export class Scene extends Object3D {
  constructor() {
    super();
    this.type = 'Scene';
    this.isScene = true;
    this.background = null;   // Texture | Color | null
    this.fog = null;
    this.environment = null;
    this.overrideMaterial = null;
    this._bjsScene = null;    // bound Babylon scene (set by the renderer)
  }
}

export class Fog {
  constructor(color, near = 1, far = 1000) { this.color = new Color(color); this.near = near; this.far = far; this.isFog = true; }
}

export class FogExp2 {
  constructor(color, density = 0.00025) { this.color = new Color(color); this.density = density; this.isFogExp2 = true; }
}

export class Clock {
  constructor(autoStart = true) { this.autoStart = autoStart; this.startTime = 0; this.oldTime = 0; this.elapsedTime = 0; this.running = false; }
  _now() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); }
  start() { this.startTime = this._now(); this.oldTime = this.startTime; this.elapsedTime = 0; this.running = true; }
  getDelta() {
    let diff = 0;
    if (this.autoStart && !this.running) { this.start(); return 0; }
    if (this.running) {
      const now = this._now();
      diff = (now - this.oldTime) / 1000;
      this.oldTime = now;
      this.elapsedTime += diff;
    }
    return diff;
  }
  getElapsedTime() { this.getDelta(); return this.elapsedTime; }
}

export class PerspectiveCamera extends Object3D {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.type = 'PerspectiveCamera';
    this.isCamera = true;
    this.isPerspectiveCamera = true;
    this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
    this.zoom = 1; this.filmGauge = 35; this.focus = 10;
    this.projectionMatrix = new Matrix4();
    this.matrixWorldInverse = new Matrix4();
    this.updateProjectionMatrix();
  }
  updateProjectionMatrix() {
    const near = this.near;
    let top = near * Math.tan(DEG2RAD * 0.5 * this.fov) / this.zoom;
    let height = 2 * top;
    let width = this.aspect * height;
    let left = -0.5 * width;
    const right = left + width, bottom = top - height;
    const x = 2 * near / (right - left);
    const y = 2 * near / (top - bottom);
    const a = (right + left) / (right - left);
    const b = (top + bottom) / (top - bottom);
    const c = -(this.far + near) / (this.far - near);
    const d = -2 * this.far * near / (this.far - near);
    this.projectionMatrix.set(x, 0, a, 0, 0, y, b, 0, 0, 0, c, d, 0, 0, -1, 0);
    return this;
  }
  updateMatrixWorld(force) { super.updateMatrixWorld(force); this.matrixWorldInverse.copy(this.matrixWorld).invert(); }
  getWorldDirection(t = new Vector3()) {
    this.updateWorldMatrix(true, false);
    const e = this.matrixWorld.elements;
    return t.set(-e[8], -e[9], -e[10]).normalize();
  }
}

// scratch (DEG2RAD already declared in part 1, same module scope)
const _target = new Vector3(), _position = new Vector3();
const _posScratch = new Vector3(), _scaleScratch = new Vector3(), _quatScratch = new Quaternion();
const _v2 = new Vector3();
const _q2 = new Quaternion();
const _m3 = new Matrix4(), _m4 = new Matrix4();
const _xAxis = new Vector3(1, 0, 0), _yAxis = new Vector3(0, 1, 0), _zAxis = new Vector3(0, 0, 1);
// ============================================================================
//  PART 4 / N : geometry (BufferGeometry, BufferAttribute, primitives)
//  Primitives are generated through Babylon VertexData so the resulting vertex
//  buffers are real arrays the game can read/edit (it squashes some cylinders
//  and spheres per-vertex and recomputes normals).
// ============================================================================

export class BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    this.array = array; this.itemSize = itemSize; this.normalized = normalized;
    this.count = array !== undefined ? array.length / itemSize : 0;
    this.needsUpdate = false;
    this.isBufferAttribute = true;
    this.version = 0;
  }
  set needsUpdateFlag(v) { if (v) this.version++; }
  getX(i) { return this.array[i * this.itemSize]; }
  getY(i) { return this.array[i * this.itemSize + 1]; }
  getZ(i) { return this.array[i * this.itemSize + 2]; }
  getW(i) { return this.array[i * this.itemSize + 3]; }
  setX(i, v) { this.array[i * this.itemSize] = v; return this; }
  setY(i, v) { this.array[i * this.itemSize + 1] = v; return this; }
  setZ(i, v) { this.array[i * this.itemSize + 2] = v; return this; }
  setW(i, v) { this.array[i * this.itemSize + 3] = v; return this; }
  setXYZ(i, x, y, z) { const o = i * this.itemSize; this.array[o] = x; this.array[o + 1] = y; this.array[o + 2] = z; return this; }
  setXY(i, x, y) { const o = i * this.itemSize; this.array[o] = x; this.array[o + 1] = y; return this; }
  clone() { return new BufferAttribute(this.array.slice(0), this.itemSize, this.normalized); }
}
export class Float32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize) { super(array instanceof Float32Array ? array : new Float32Array(array), itemSize); }
}

let _geomId = 0;
export class BufferGeometry {
  constructor() {
    this.id = _geomId++;
    this.uuid = 'g' + this.id;
    this.attributes = {};
    this.index = null;
    this.boundingBox = null;
    this.boundingSphere = null;
    this.groups = [];
    this.isBufferGeometry = true;
    this._bjsDirty = true;   // renderer rebuilds backing when true
  }
  setAttribute(name, attr) { this.attributes[name] = attr; this._bjsDirty = true; return this; }
  getAttribute(name) { return this.attributes[name]; }
  deleteAttribute(name) { delete this.attributes[name]; return this; }
  setIndex(index) {
    if (Array.isArray(index)) this.index = new BufferAttribute(new Uint32Array(index), 1);
    else this.index = index;
    this._bjsDirty = true; return this;
  }
  setFromPoints(points) {
    const pos = [];
    for (const p of points) pos.push(p.x, p.y, p.z || 0);
    this.setAttribute('position', new Float32BufferAttribute(pos, 3));
    return this;
  }
  computeVertexNormals() {
    const pos = this.attributes.position; if (!pos) return;
    const count = pos.count;
    const normals = new Float32Array(count * 3);
    const idx = this.index ? this.index.array : null;
    const cA = new Vector3(), cB = new Vector3(), cC = new Vector3();
    const ab = new Vector3(), cb = new Vector3();
    const tri = (ia, ib, ic) => {
      cA.set(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
      cB.set(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
      cC.set(pos.getX(ic), pos.getY(ic), pos.getZ(ic));
      cb.subVectors(cC, cB); ab.subVectors(cA, cB); cb.cross(ab);
      normals[ia * 3] += cb.x; normals[ia * 3 + 1] += cb.y; normals[ia * 3 + 2] += cb.z;
      normals[ib * 3] += cb.x; normals[ib * 3 + 1] += cb.y; normals[ib * 3 + 2] += cb.z;
      normals[ic * 3] += cb.x; normals[ic * 3 + 1] += cb.y; normals[ic * 3 + 2] += cb.z;
    };
    if (idx) { for (let i = 0; i < idx.length; i += 3) tri(idx[i], idx[i + 1], idx[i + 2]); }
    else { for (let i = 0; i < count; i += 3) tri(i, i + 1, i + 2); }
    // normalize
    const n = new Vector3();
    for (let i = 0; i < count; i++) {
      n.set(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]).normalize();
      normals[i * 3] = n.x; normals[i * 3 + 1] = n.y; normals[i * 3 + 2] = n.z;
    }
    this.setAttribute('normal', new BufferAttribute(normals, 3));
    this._bjsDirty = true;
  }
  applyMatrix4(m) {
    const pos = this.attributes.position; if (!pos) return this;
    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) { v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(m); pos.setXYZ(i, v.x, v.y, v.z); }
    this.computeVertexNormals(); this._bjsDirty = true; return this;
  }
  rotateX(angle) { _mm.makeRotationX(angle); return this.applyMatrix4(_mm); }
  rotateY(angle) { _mm.makeRotationY(angle); return this.applyMatrix4(_mm); }
  translate(x, y, z) { _mm.makeTranslation(x, y, z); return this.applyMatrix4(_mm); }
  scale(x, y, z) { _mm.identity().scale(new Vector3(x, y, z)); return this.applyMatrix4(_mm); }
  center() {
    this.computeBoundingBox();
    const c = this.boundingBox.getCenter(new Vector3());
    this.translate(-c.x, -c.y, -c.z);
    return this;
  }
  computeBoundingBox() {
    if (!this.boundingBox) this.boundingBox = new Box3();
    this.boundingBox.makeEmpty();
    const pos = this.attributes.position; if (!pos) return;
    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) { v.set(pos.getX(i), pos.getY(i), pos.getZ(i)); this.boundingBox.expandByPoint(v); }
  }
  computeBoundingSphere() {
    this.computeBoundingBox();
    if (!this.boundingSphere) this.boundingSphere = { center: new Vector3(), radius: 0 };
    const c = this.boundingBox.getCenter(this.boundingSphere.center);
    const pos = this.attributes.position; let maxSq = 0; const v = new Vector3();
    if (pos) for (let i = 0; i < pos.count; i++) { v.set(pos.getX(i), pos.getY(i), pos.getZ(i)); maxSq = Math.max(maxSq, c.distanceToSquared(v)); }
    this.boundingSphere.radius = Math.sqrt(maxSq);
  }
  toNonIndexed() {
    if (!this.index) return this;
    const idx = this.index.array;
    const out = new BufferGeometry();
    for (const name in this.attributes) {
      const a = this.attributes[name], is = a.itemSize;
      const arr = new Float32Array(idx.length * is);
      for (let i = 0; i < idx.length; i++) { const s = idx[i] * is; for (let k = 0; k < is; k++) arr[i * is + k] = a.array[s + k]; }
      out.setAttribute(name, new BufferAttribute(arr, is));
    }
    return out;
  }
  clone() {
    const g = new BufferGeometry();
    for (const name in this.attributes) g.setAttribute(name, this.attributes[name].clone());
    if (this.index) g.index = this.index.clone();
    return g;
  }
  dispose() { if (this._bjsVD) this._bjsVD = null; }
  // build a Babylon VertexData snapshot from current attributes
  toBabylonVertexData() {
    const vd = new BABYLON.VertexData();
    const p = this.attributes.position;
    vd.positions = p ? Array.from(p.array) : [];
    if (this.attributes.normal) vd.normals = Array.from(this.attributes.normal.array);
    if (this.attributes.uv) vd.uvs = Array.from(this.attributes.uv.array);
    if (this.index) vd.indices = Array.from(this.index.array);
    else { const n = (p ? p.count : 0); const ind = new Array(n); for (let i = 0; i < n; i++) ind[i] = i; vd.indices = ind; }
    if (!vd.normals && vd.positions.length) { vd.normals = []; BABYLON.VertexData.ComputeNormals(vd.positions, vd.indices, vd.normals); }
    return vd;
  }
}

// ---- helper: load a Babylon VertexData factory into a BufferGeometry --------
function fromVD(geo, vd) {
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vd.positions), 3));
  if (vd.normals) geo.setAttribute('normal', new BufferAttribute(new Float32Array(vd.normals), 3));
  if (vd.uvs) geo.setAttribute('uv', new BufferAttribute(new Float32Array(vd.uvs), 2));
  geo.setIndex(new BufferAttribute(new Uint32Array(vd.indices), 1));
  return geo;
}
function VD(name, options) {
  const fn = BABYLON.VertexData['Create' + name];
  return fn(options);
}

// ---- primitives ------------------------------------------------------------
export class BoxGeometry extends BufferGeometry {
  constructor(w = 1, h = 1, d = 1) { super(); fromVD(this, VD('Box', { width: w, height: h, depth: d })); }
}
export class PlaneGeometry extends BufferGeometry {
  constructor(w = 1, h = 1) { super(); fromVD(this, VD('Plane', { width: w, height: h, sideOrientation: BABYLON.Mesh.DOUBLESIDE })); }
}
export class SphereGeometry extends BufferGeometry {
  constructor(r = 1, wSeg = 16, hSeg = 12, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    super();
    const slice = Math.min(1, thetaLength / Math.PI);
    const arc = Math.min(1, phiLength / (Math.PI * 2));
    fromVD(this, VD('Sphere', { diameter: 2 * r, segments: Math.max(3, Math.round((wSeg + hSeg) / 2)), slice, arc, sideOrientation: BABYLON.Mesh.DOUBLESIDE }));
  }
}
export class CylinderGeometry extends BufferGeometry {
  constructor(rTop = 1, rBottom = 1, h = 1, radialSeg = 16, heightSeg = 1, openEnded = false) {
    super();
    fromVD(this, VD('Cylinder', {
      height: h, diameterTop: 2 * rTop, diameterBottom: 2 * rBottom,
      tessellation: radialSeg, subdivisions: Math.max(1, heightSeg),
      cap: openEnded ? BABYLON.Mesh.NO_CAP : BABYLON.Mesh.CAP_ALL,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }));
  }
}
export class ConeGeometry extends CylinderGeometry {
  constructor(r = 1, h = 1, radialSeg = 16, heightSeg = 1, openEnded = false) { super(0, r, h, radialSeg, heightSeg, openEnded); }
}
export class TorusGeometry extends BufferGeometry {
  constructor(r = 1, tube = 0.4, radialSeg = 8, tubularSeg = 24) {
    super();
    fromVD(this, VD('Torus', { diameter: 2 * r, thickness: 2 * tube, tessellation: tubularSeg, sideOrientation: BABYLON.Mesh.DOUBLESIDE }));
  }
}
export class RingGeometry extends BufferGeometry {
  constructor(innerR = 0.5, outerR = 1, thetaSeg = 32) {
    super();
    // build a flat annulus in the XY plane (matches THREE RingGeometry orientation)
    const pos = [], norm = [], uv = [], idx = [];
    for (let i = 0; i <= thetaSeg; i++) {
      const a = (i / thetaSeg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(innerR * c, innerR * s, 0); norm.push(0, 0, 1); uv.push(0, i / thetaSeg);
      pos.push(outerR * c, outerR * s, 0); norm.push(0, 0, 1); uv.push(1, i / thetaSeg);
    }
    for (let i = 0; i < thetaSeg; i++) {
      const a = i * 2, b = a + 1, cc = a + 2, d = a + 3;
      idx.push(a, b, d, a, d, cc);
    }
    this.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(norm), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    this.setIndex(new BufferAttribute(new Uint32Array(idx), 1));
  }
}
export class IcosahedronGeometry extends BufferGeometry {
  constructor(r = 1, detail = 0) { super(); fromVD(this, VD('IcoSphere', { radius: r, subdivisions: Math.max(1, detail + 1), flat: detail === 0 })); }
}
export class DodecahedronGeometry extends BufferGeometry {
  constructor(r = 1) { super(); fromVD(this, BABYLON.VertexData.CreatePolyhedron ? BABYLON.VertexData.CreatePolyhedron({ type: 2, size: r }) : VD('IcoSphere', { radius: r, subdivisions: 1 })); }
}

// ---- CapsuleGeometry (manual: cylinder body + 2 hemispherical caps) --------
export class CapsuleGeometry extends BufferGeometry {
  constructor(radius = 0.5, length = 1, capSeg = 4, radialSeg = 12) {
    super();
    const rs = Math.max(3, radialSeg), cs = Math.max(1, capSeg);
    const half = length / 2;
    const pos = [], norm = [], uv = [], idx = [];
    // total rings: bottom cap (cs) + cylinder seam + top cap (cs)
    const rings = [];
    // bottom hemisphere: phi from -PI/2 .. 0
    for (let i = 0; i <= cs; i++) { const phi = -Math.PI / 2 + (i / cs) * (Math.PI / 2); rings.push({ y: -half + radius * Math.sin(phi), r: radius * Math.cos(phi), ny: Math.sin(phi), nrScale: Math.cos(phi), cap: 'b' }); }
    // top hemisphere: phi 0 .. PI/2
    for (let i = 0; i <= cs; i++) { const phi = (i / cs) * (Math.PI / 2); rings.push({ y: half + radius * Math.sin(phi), r: radius * Math.cos(phi), ny: Math.sin(phi), nrScale: Math.cos(phi), cap: 't' }); }
    const ringCount = rings.length;
    for (let ri = 0; ri < ringCount; ri++) {
      const R = rings[ri];
      for (let s = 0; s <= rs; s++) {
        const a = (s / rs) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        pos.push(R.r * c, R.y, R.r * sn);
        norm.push(R.nrScale * c, R.ny, R.nrScale * sn);
        uv.push(s / rs, ri / (ringCount - 1));
      }
    }
    const vpr = rs + 1;
    for (let ri = 0; ri < ringCount - 1; ri++) {
      for (let s = 0; s < rs; s++) {
        const a = ri * vpr + s, b = a + 1, cc = a + vpr, d = cc + 1;
        idx.push(a, cc, b, b, cc, d);
      }
    }
    this.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(norm), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    this.setIndex(new BufferAttribute(new Uint32Array(idx), 1));
  }
}

// ---- BufferGeometryUtils.mergeGeometries -----------------------------------
export function mergeGeometries(geometries, useGroups = false) {
  const out = new BufferGeometry();
  const names = ['position', 'normal', 'uv'];
  const merged = {}; const sizes = { position: 3, normal: 3, uv: 2 };
  for (const nm of names) merged[nm] = [];
  const indices = []; let vertexOffset = 0;
  for (const g of geometries) {
    const pos = g.attributes.position; if (!pos) continue;
    const vcount = pos.count;
    for (const nm of names) {
      const a = g.attributes[nm]; const is = sizes[nm];
      if (a) { for (let i = 0; i < a.array.length; i++) merged[nm].push(a.array[i]); }
      else if (nm !== 'position') { for (let i = 0; i < vcount * is; i++) merged[nm].push(0); }
    }
    if (g.index) { for (let i = 0; i < g.index.array.length; i++) indices.push(g.index.array[i] + vertexOffset); }
    else { for (let i = 0; i < vcount; i++) indices.push(i + vertexOffset); }
    vertexOffset += vcount;
  }
  out.setAttribute('position', new BufferAttribute(new Float32Array(merged.position), 3));
  out.setAttribute('normal', new BufferAttribute(new Float32Array(merged.normal), 3));
  out.setAttribute('uv', new BufferAttribute(new Float32Array(merged.uv), 2));
  out.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
  return out;
}
// alias used by some THREE versions
export const mergeBufferGeometries = mergeGeometries;

const _mm = new Matrix4();
// ============================================================================
//  PART 5 / N : materials, textures, lights
//  These are plain descriptors; the renderer (part 6) lazily builds the
//  matching Babylon material/texture/light the first time it sees the object.
// ============================================================================

let _matId = 0;
class Material {
  constructor() {
    this.id = _matId++;
    this.uuid = 'm' + this.id;
    this.color = new Color(0xffffff);
    this.opacity = 1;
    this.transparent = false;
    this.visible = true;
    this.side = FrontSide;
    this.depthTest = true;
    this.depthWrite = true;
    this.map = null;
    this.alphaMap = null;
    this.wireframe = false;
    this.vertexColors = false;
    this.toneMapped = true;
    this.blending = NormalBlending;
    this.needsUpdate = true;
    this._bjs = null; this._bjsScene = null; this._bjsVersion = 0;
    this.isMaterial = true;
  }
  _touch() { this._bjsVersion++; }
  dispose() { if (this._bjs) { try { this._bjs.dispose(); } catch (e) {} this._bjs = null; } }
  copyProps(src) {
    this.color.copy(src.color); this.opacity = src.opacity; this.transparent = src.transparent;
    this.side = src.side; this.depthTest = src.depthTest; this.depthWrite = src.depthWrite;
    this.map = src.map; this.wireframe = src.wireframe; this.vertexColors = src.vertexColors;
    this.blending = src.blending; this.toneMapped = src.toneMapped;
  }
}

export class MeshStandardMaterial extends Material {
  constructor(p = {}) {
    super();
    this.type = 'MeshStandardMaterial'; this.isMeshStandardMaterial = true;
    this.roughness = 1; this.metalness = 0;
    this.emissive = new Color(0x000000); this.emissiveIntensity = 1; this.emissiveMap = null;
    this.envMapIntensity = 1;
    this._apply(p);
  }
  _apply(p) {
    for (const k in p) {
      if (k === 'color' || k === 'emissive') this[k] = (p[k] instanceof Color) ? p[k].clone() : new Color(p[k]);
      else this[k] = p[k];
    }
    this._touch();
  }
  clone() { const m = new MeshStandardMaterial(); m.copyProps(this); m.roughness = this.roughness; m.metalness = this.metalness; m.emissive.copy(this.emissive); m.emissiveIntensity = this.emissiveIntensity; return m; }
}

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  constructor(p = {}) {
    super({});
    this.type = 'MeshPhysicalMaterial'; this.isMeshPhysicalMaterial = true;
    this.clearcoat = 0; this.clearcoatRoughness = 0;
    this.sheen = 0; this.sheenColor = new Color(0x000000); this.sheenRoughness = 1;
    this.transmission = 0; this.ior = 1.5; this.reflectivity = 0.5; this.specularIntensity = 1;
    this._apply(p);
  }
  clone() { const m = new MeshPhysicalMaterial(); m.copyProps(this); m.roughness = this.roughness; m.metalness = this.metalness; m.emissive.copy(this.emissive); m.clearcoat = this.clearcoat; m.sheen = this.sheen; m.sheenColor.copy(this.sheenColor); return m; }
}

export class MeshBasicMaterial extends Material {
  constructor(p = {}) {
    super();
    this.type = 'MeshBasicMaterial'; this.isMeshBasicMaterial = true;
    for (const k in p) { if (k === 'color') this.color = (p[k] instanceof Color) ? p[k].clone() : new Color(p[k]); else this[k] = p[k]; }
    this._touch();
  }
  clone() { const m = new MeshBasicMaterial(); m.copyProps(this); return m; }
}

export class MeshLambertMaterial extends MeshStandardMaterial {
  constructor(p = {}) { super(p); this.type = 'MeshLambertMaterial'; this.roughness = 1; this.metalness = 0; }
}
export class MeshPhongMaterial extends MeshStandardMaterial {
  constructor(p = {}) { super(p); this.type = 'MeshPhongMaterial'; }
}

export class LineBasicMaterial extends Material {
  constructor(p = {}) {
    super();
    this.type = 'LineBasicMaterial'; this.isLineBasicMaterial = true; this.linewidth = 1;
    for (const k in p) { if (k === 'color') this.color = (p[k] instanceof Color) ? p[k].clone() : new Color(p[k]); else this[k] = p[k]; }
    this._touch();
  }
  clone() { const m = new LineBasicMaterial(); m.copyProps(this); return m; }
}

// ---- textures --------------------------------------------------------------
let _texId = 0;
export class Texture {
  constructor(image) {
    this.id = _texId++;
    this.uuid = 't' + this.id;
    this.image = image || null;
    this.wrapS = ClampToEdgeWrapping; this.wrapT = ClampToEdgeWrapping;
    this.repeat = new Vector2(1, 1);
    this.offset = new Vector2(0, 0);
    this.magFilter = LinearFilter; this.minFilter = LinearMipmapLinearFilter;
    this.colorSpace = NoColorSpace;
    this.flipY = true;
    this.anisotropy = 1;
    this._needsUpdate = true;
    this._bjs = null; this._bjsScene = null; this._version = 0;
    this.isTexture = true;
  }
  get needsUpdate() { return this._needsUpdate; }
  set needsUpdate(v) { this._needsUpdate = v; if (v) this._version++; }
  clone() { const t = new Texture(this.image); t.wrapS = this.wrapS; t.wrapT = this.wrapT; t.repeat.copy(this.repeat); t.colorSpace = this.colorSpace; t._version++; return t; }
  dispose() { if (this._bjs) { try { this._bjs.dispose(); } catch (e) {} this._bjs = null; } }
}
export class CanvasTexture extends Texture {
  constructor(canvas) { super(canvas); this.isCanvasTexture = true; this._needsUpdate = true; }
}
export class DepthTexture extends Texture {
  constructor(width, height) { super(null); this.image = { width, height }; this.type = UnsignedShortType; this.isDepthTexture = true; }
}

// ---- render targets (only used by the removed outline pass → minimal) ------
export class WebGLRenderTarget {
  constructor(width = 1, height = 1, options = {}) { this.width = width; this.height = height; this.depthTexture = options.depthTexture || null; this.texture = new Texture(); }
  setSize(w, h) { this.width = w; this.height = h; }
  dispose() {}
}

// ---- lights ----------------------------------------------------------------
class Light extends Object3D {
  constructor(color = 0xffffff, intensity = 1) {
    super();
    this.isLight = true;
    this.color = new Color(color);
    this.intensity = intensity;
  }
}
export class AmbientLight extends Light {
  constructor(color, intensity = 1) { super(color, intensity); this.type = 'AmbientLight'; this.isAmbientLight = true; }
}
export class HemisphereLight extends Light {
  constructor(skyColor = 0xffffff, groundColor = 0xffffff, intensity = 1) {
    super(skyColor, intensity);
    this.type = 'HemisphereLight'; this.isHemisphereLight = true;
    this.groundColor = new Color(groundColor);
    this.position.set(0, 1, 0);
  }
}
function makeShadow() {
  return {
    mapSize: new Vector2(512, 512),
    bias: 0, normalBias: 0, radius: 1, blurSamples: 8,
    camera: { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 500, fov: 50, updateProjectionMatrix() {} },
    map: null
  };
}
export class DirectionalLight extends Light {
  constructor(color, intensity = 1) {
    super(color, intensity);
    this.type = 'DirectionalLight'; this.isDirectionalLight = true;
    this.position.set(0, 1, 0);
    this.target = new Object3D();
    this.castShadow = false;
    this.shadow = makeShadow();
  }
}
export class SpotLight extends Light {
  constructor(color, intensity = 1, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 2) {
    super(color, intensity);
    this.type = 'SpotLight'; this.isSpotLight = true;
    this.distance = distance; this.angle = angle; this.penumbra = penumbra; this.decay = decay;
    this.target = new Object3D();
    this.castShadow = false; this.shadow = makeShadow();
  }
}
export class PointLight extends Light {
  constructor(color, intensity = 1, distance = 0, decay = 2) {
    super(color, intensity);
    this.type = 'PointLight'; this.isPointLight = true;
    this.distance = distance; this.decay = decay;
    this.castShadow = false; this.shadow = makeShadow();
  }
}
// ============================================================================
//  PART 6 / N : WebGLRenderer (Babylon engine), scene materialization, raycaster
// ============================================================================

// active context shared with loaders / Box3 / Raycaster
export let __activeBabylonScene = null;
export let __activeRenderer = null;

function _toBVec(v) { return new BABYLON.Vector3(v.x, v.y, v.z); }

// build / update a Babylon StandardMaterial from a THREE material descriptor
function buildBabylonMaterial(mat, scene) {
  if (mat && mat._babylonMat) return mat._babylonMat;   // GLB material: reuse PBR (keeps textures)
  if (mat._bjs && mat._bjsScene === scene && mat._bjsBuiltVersion === mat._bjsVersion) return mat._bjs;
  let bm = mat._bjs && mat._bjsScene === scene ? mat._bjs : null;
  if (!bm) {
    bm = new BABYLON.StandardMaterial(mat.type + '_' + mat.id, scene);
    mat._bjs = bm; mat._bjsScene = scene;
  }
  bm.backFaceCulling = false;            // robust: avoid inside-out culling under RH
  bm.alpha = mat.transparent ? (mat.opacity != null ? mat.opacity : 1) : 1;
  bm.disableDepthWrite = (mat.depthWrite === false);
  bm.separateCullingPass = false;
  bm.maxSimultaneousLights = 8;
  const c = mat.color || { r: 1, g: 1, b: 1 };
  if (mat.isMeshBasicMaterial || mat.isLineBasicMaterial) {
    bm.disableLighting = true;
    bm.emissiveColor = new BABYLON.Color3(c.r, c.g, c.b);
    bm.diffuseColor = new BABYLON.Color3(0, 0, 0);
    bm.specularColor = new BABYLON.Color3(0, 0, 0);
  } else {
    const rough = mat.roughness != null ? mat.roughness : 0.8;
    const metal = mat.metalness != null ? mat.metalness : 0;
    bm.diffuseColor = new BABYLON.Color3(c.r * (1 - metal * 0.6), c.g * (1 - metal * 0.6), c.b * (1 - metal * 0.6));
    bm.ambientColor = new BABYLON.Color3(1, 1, 1);
    const specBase = 0.04 + metal * 0.96;
    const spec = metal > 0.2 ? c : { r: 1, g: 1, b: 1 };
    bm.specularColor = new BABYLON.Color3(spec.r * specBase, spec.g * specBase, spec.b * specBase);
    bm.specularPower = Math.max(1, Math.pow(1 - rough, 2) * 128);
    if (mat.emissive) bm.emissiveColor = new BABYLON.Color3(mat.emissive.r * (mat.emissiveIntensity || 1), mat.emissive.g * (mat.emissiveIntensity || 1), mat.emissive.b * (mat.emissiveIntensity || 1));
  }
  // texture
  if (mat.map) {
    const tex = buildBabylonTexture(mat.map, scene, mat.transparent);
    if (mat.isMeshBasicMaterial) { bm.diffuseTexture = tex; bm.useAlphaFromDiffuseTexture = !!mat.transparent; bm.diffuseColor = new BABYLON.Color3(0, 0, 0); bm.emissiveColor = new BABYLON.Color3(1, 1, 1); }
    else { bm.diffuseTexture = tex; if (mat.transparent) bm.useAlphaFromDiffuseTexture = true; }
    if (tex && mat.transparent) tex.hasAlpha = true;
  }
  bm.wireframe = !!mat.wireframe;
  mat._bjsBuiltVersion = mat._bjsVersion;
  return bm;
}

function buildBabylonTexture(tex, scene, wantAlpha) {
  if (tex._bjs && tex._bjsScene === scene && tex._bjsBuiltVersion === tex._version) return tex._bjs;
  const img = tex.image;
  let dt = tex._bjs && tex._bjsScene === scene ? tex._bjs : null;
  if (img && img.getContext) {
    if (!dt || dt.getSize().width !== img.width || dt.getSize().height !== img.height) {
      if (dt) try { dt.dispose(); } catch (e) {}
      dt = new BABYLON.DynamicTexture('ct' + tex.id, { width: img.width, height: img.height }, scene, true);
    }
    const ctx = dt.getContext();
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    dt.update(true);
  } else if (!dt) {
    dt = new BABYLON.DynamicTexture('ct' + tex.id, { width: 4, height: 4 }, scene, true);
  }
  dt.hasAlpha = !!wantAlpha;
  dt.wrapU = (tex.wrapS === RepeatWrapping) ? BABYLON.Texture.WRAP_ADDRESSMODE : BABYLON.Texture.CLAMP_ADDRESSMODE;
  dt.wrapV = (tex.wrapT === RepeatWrapping) ? BABYLON.Texture.WRAP_ADDRESSMODE : BABYLON.Texture.CLAMP_ADDRESSMODE;
  dt.uScale = tex.repeat.x; dt.vScale = tex.repeat.y;
  tex._bjs = dt; tex._bjsScene = scene; tex._bjsBuiltVersion = tex._version;
  return dt;
}

export class WebGLRenderer {
  constructor(params = {}) {
    this.domElement = params.canvas || document.createElement('canvas');
    const opts = { preserveDrawingBuffer: !!params.preserveDrawingBuffer, stencil: true, antialias: params.antialias !== false, alpha: !!params.alpha, disableWebGL2Support: false };
    this.engine = new BABYLON.Engine(this.domElement, params.antialias !== false, opts, false);
    this.outputColorSpace = SRGBColorSpace;
    this.toneMapping = NoToneMapping;
    this.toneMappingExposure = 1;
    this.shadowMap = { enabled: false, type: PCFShadowMap, autoUpdate: true, needsUpdate: false };
    this.info = { render: { calls: 0, triangles: 0, frame: 0, points: 0, lines: 0 }, memory: { geometries: 0, textures: 0 }, programs: [], reset() {}, autoReset: true };
    this._scenes = new Map();           // THREE.Scene -> babylon scene wrapper
    this._currentTarget = null;
    this._pixelRatio = 1;
    this._alphaCanvas = !!params.alpha;
    this.capabilities = { isWebGL2: this.engine.webGLVersion >= 2, getMaxAnisotropy: () => 8 };
    __activeRenderer = this;
    // create the Babylon scene eagerly so loaders (GLTFLoader) have a target
    // before the first frame is rendered. It is bound to the first THREE.Scene
    // that gets rendered.
    this._bootWrap = this._makeScene();
    __activeBabylonScene = this._bootWrap.scene;
  }
  setSize(w, h, updateStyle) {
    this.domElement.width = Math.floor(w * this._pixelRatio);
    this.domElement.height = Math.floor(h * this._pixelRatio);
    if (updateStyle !== false) { this.domElement.style.width = w + 'px'; this.domElement.style.height = h + 'px'; }
    this.engine.resize();
  }
  setPixelRatio(r) { this._pixelRatio = r || 1; this.engine.setHardwareScalingLevel(1 / this._pixelRatio); }
  getPixelRatio() { return this._pixelRatio; }
  setClearColor(c, a = 1) { const col = c instanceof Color ? c : new Color(c); this._clear = new BABYLON.Color4(col.r, col.g, col.b, a); }
  setRenderTarget(rt) { this._currentTarget = rt; }
  getRenderTarget() { return this._currentTarget; }
  clear() {}
  dispose() { for (const [, bs] of this._scenes) try { bs.scene.dispose(); } catch (e) {} try { this.engine.dispose(); } catch (e) {} }

  _makeScene() {
    const scene = new BABYLON.Scene(this.engine);
    scene.useRightHandedSystem = true;          // match THREE coordinate system
    scene.clearColor = this._clear || new BABYLON.Color4(0.02, 0.03, 0.06, this._alphaCanvas ? 0 : 1);
    scene.autoClear = true;
    scene.imageProcessingConfiguration.toneMappingEnabled = (this.toneMapping !== NoToneMapping);
    scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.imageProcessingConfiguration.exposure = this.toneMappingExposure;
    const cam = new BABYLON.FreeCamera('shimCam', new BABYLON.Vector3(0, 0, 0), scene);
    cam.minZ = 0.1; cam.maxZ = 2000; cam.fov = 0.8; cam.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
    scene.activeCamera = cam;
    const w = { scene, cam, reg: new Map(), seen: new Set(), casters: [], lights: new Map(), shadowGen: null, bgLayer: null, bloom: null, _bound: false };
    scene.__shimWrap = w;
    return w;
  }
  _ensureScene(threeScene) {
    let w = this._scenes.get(threeScene);
    if (w) return w;
    // bind the eagerly-created boot scene to the first THREE.Scene rendered
    if (this._bootWrap && !this._bootWrap._bound) { w = this._bootWrap; w._bound = true; }
    else { w = this._makeScene(); w._bound = true; }
    this._scenes.set(threeScene, w);
    threeScene._bjsScene = w.scene;
    return w;
  }

  render(threeScene, camera) {
    if (this._currentTarget) return;          // depth-RT prepass (unused) → skip
    this._renderInternal(threeScene, camera, false);
  }
  _renderInternal(threeScene, camera, bloom) {
    const w = this._ensureScene(threeScene);
    const scene = w.scene;
    __activeBabylonScene = scene; __activeRenderer = this;
    threeScene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    w.seen.clear(); w.casters.length = 0;
    this._syncBackground(threeScene, w);
    this._syncFog(threeScene, scene);
    this._walk(threeScene, true, w);
    // GC backings for removed objects
    for (const [id, b] of w.reg) { if (!w.seen.has(id)) { try { if (b.node) b.node.dispose(); } catch (e) {} w.reg.delete(id); } }
    this._syncCamera(camera, w);
    this._syncShadows(w);
    // tone mapping live
    scene.imageProcessingConfiguration.toneMappingEnabled = (this.toneMapping !== NoToneMapping);
    scene.imageProcessingConfiguration.exposure = this.toneMappingExposure;
    if (bloom) this._ensureBloom(w, true); else if (w.bloom) w.bloom.bloomEnabled = false;
    try { scene.render(); } catch (e) { console.error('[shim] render error', e); }
    const r = this.info.render; r.calls = this.engine._drawCalls ? this.engine._drawCalls.current : (scene.getActiveMeshes().length || 0);
    r.triangles = scene._activeIndices ? scene._activeIndices.current / 3 : 0; r.frame++;
  }

  _walk(obj, parentVisible, w) {
    const vis = parentVisible && obj.visible;
    if (obj.isLight) this._syncLight(obj, w, vis);
    else if (obj.isMesh || obj.isLine) this._syncRenderable(obj, w, vis);
    else if (obj._native && obj._bjs && !obj._bjsRenderSkip) this._syncNative(obj, w, vis);
    for (const c of obj.children) this._walk(c, vis, w);
  }

  _syncRenderable(obj, w, vis) {
    let entry = w.reg.get(obj.id);
    const scene = w.scene;
    if (!entry) {
      let node;
      if (obj.isLine) {
        const pts = this._linePoints(obj.geometry);
        node = BABYLON.MeshBuilder.CreateLines('line' + obj.id, { points: pts, updatable: true }, scene);
        const lc = obj.material && obj.material.color ? obj.material.color : { r: 1, g: 1, b: 1 };
        node.color = new BABYLON.Color3(lc.r, lc.g, lc.b);
        node.isPickable = false;
      } else {
        node = new BABYLON.Mesh('mesh' + obj.id, scene);
        const vd = obj.geometry.toBabylonVertexData();
        vd.applyToMesh(node, true);
        obj.geometry._bjsDirty = false;
        node.material = buildBabylonMaterial(obj.material, scene);
        node.isPickable = true;
        node.receiveShadows = !!obj.receiveShadow;
        node.alwaysSelectAsActiveMesh = obj.frustumCulled === false;
      }
      node.rotationQuaternion = new BABYLON.Quaternion();
      entry = { node, geomVer: -1, _line: !!obj.isLine };
      w.reg.set(obj.id, entry);
      obj._bjs = node;
    }
    w.seen.add(obj.id);
    const node = entry.node;
    node.setEnabled(vis);
    if (!vis) return;
    if (obj.isLine) {
      if (obj.geometry._bjsDirty || (obj.geometry.attributes.position && obj.geometry.attributes.position.needsUpdate)) {
        const pts = this._linePoints(obj.geometry);
        try { BABYLON.MeshBuilder.CreateLines('line' + obj.id, { points: pts, instance: node }); } catch (e) {}
        obj.geometry._bjsDirty = false;
        if (obj.geometry.attributes.position) obj.geometry.attributes.position.needsUpdate = false;
      }
    } else {
      if (obj.geometry._bjsDirty) { const vd = obj.geometry.toBabylonVertexData(); vd.applyToMesh(node, true); obj.geometry._bjsDirty = false; }
      const pa = obj.geometry.attributes.position;
      if (pa && pa.needsUpdate) { node.updateVerticesData(BABYLON.VertexBuffer.PositionKind, Array.from(pa.array)); if (obj.geometry.attributes.normal) node.updateVerticesData(BABYLON.VertexBuffer.NormalKind, Array.from(obj.geometry.attributes.normal.array)); pa.needsUpdate = false; }
      // material refresh
      if (obj.material && obj.material._bjsBuiltVersion !== obj.material._bjsVersion) node.material = buildBabylonMaterial(obj.material, scene);
      node.receiveShadows = !!obj.receiveShadow;
      if (obj.castShadow) w.casters.push(node);
    }
    // world transform
    obj.matrixWorld.decompose(_dp, _dq, _ds);
    node.position.set(_dp.x, _dp.y, _dp.z);
    node.rotationQuaternion.set(_dq.x, _dq.y, _dq.z, _dq.w);
    node.scaling.set(_ds.x, _ds.y, _ds.z);
    node.renderingGroupId = obj.renderOrder > 100 ? 1 : 0;
  }

  _linePoints(geom) {
    const p = geom.attributes.position; const pts = [];
    if (p) for (let i = 0; i < p.count; i++) pts.push(new BABYLON.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
    if (pts.length === 0) pts.push(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0));
    return pts;
  }

  _syncNative(obj, w, vis) {
    w.seen.add(obj.id);
    const node = obj._bjs;
    node.setEnabled(vis);
    if (!vis) return;
    obj.matrixWorld.decompose(_dp, _dq, _ds);
    if (!node.rotationQuaternion) node.rotationQuaternion = new BABYLON.Quaternion();
    node.position.set(_dp.x, _dp.y, _dp.z);
    node.rotationQuaternion.set(_dq.x, _dq.y, _dq.z, _dq.w);
    node.scaling.set(_ds.x, _ds.y, _ds.z);
    if (obj._glbCasters) for (const m of obj._glbCasters) w.casters.push(m);
  }

  _syncLight(obj, w, vis) {
    w.seen.add(obj.id);
    let L = w.lights.get(obj.id);
    const scene = w.scene;
    if (!L) {
      if (obj.isHemisphereLight) {
        L = new BABYLON.HemisphericLight('hemi' + obj.id, new BABYLON.Vector3(0, 1, 0), scene);
      } else if (obj.isAmbientLight) {
        L = new BABYLON.HemisphericLight('amb' + obj.id, new BABYLON.Vector3(0, 1, 0), scene);
        L._isAmbient = true;
      } else if (obj.isDirectionalLight) {
        L = new BABYLON.DirectionalLight('dir' + obj.id, new BABYLON.Vector3(0, -1, 0), scene);
      } else if (obj.isSpotLight) {
        L = new BABYLON.SpotLight('spot' + obj.id, new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, -1, 0), obj.angle * 2, obj.decay || 2, scene);
      } else if (obj.isPointLight) {
        L = new BABYLON.PointLight('point' + obj.id, new BABYLON.Vector3(0, 0, 0), scene);
      } else { L = new BABYLON.HemisphericLight('l' + obj.id, new BABYLON.Vector3(0, 1, 0), scene); }
      w.lights.set(obj.id, L);
    }
    L.setEnabled(vis);
    if (!vis) return;
    L.intensity = obj.intensity * (obj.isDirectionalLight || obj.isSpotLight || obj.isPointLight ? 1.0 : 1.0);
    L.diffuse = new BABYLON.Color3(obj.color.r, obj.color.g, obj.color.b);
    L.specular = (obj.isAmbientLight || obj.isHemisphereLight) ? new BABYLON.Color3(0, 0, 0) : new BABYLON.Color3(obj.color.r, obj.color.g, obj.color.b);
    if (obj.isHemisphereLight) { L.groundColor = new BABYLON.Color3(obj.groundColor.r, obj.groundColor.g, obj.groundColor.b); L.direction = new BABYLON.Vector3(0, 1, 0); }
    if (obj._isAmbient) { L.groundColor = L.diffuse; }
    // world position
    obj.getWorldPosition(_wp);
    if (obj.isDirectionalLight || obj.isSpotLight) {
      obj.target.getWorldPosition(_wt);
      _wd.subVectors(_wt, _wp).normalize();
      L.direction = new BABYLON.Vector3(_wd.x, _wd.y, _wd.z);
    }
    if (L.position) L.position.set(_wp.x, _wp.y, _wp.z);
    if (obj.isDirectionalLight && obj.castShadow && this.shadowMap.enabled && !w._shadowSource) {
      w._shadowSource = obj; w._shadowLight = L;
    }
  }

  _syncShadows(w) {
    if (!this.shadowMap.enabled || !w._shadowLight) { return; }
    try {
      if (!w.shadowGen) {
        const mapSize = (w._shadowSource.shadow && w._shadowSource.shadow.mapSize) ? w._shadowSource.shadow.mapSize.x : 1024;
        w.shadowGen = new BABYLON.ShadowGenerator(mapSize, w._shadowLight);
        w.shadowGen.usePercentageCloserFiltering = true;
        w.shadowGen.bias = 0.0008;
        w._shadowLight.autoCalcShadowZBounds = true;
        w._shadowLight.shadowMinZ = 0.5; w._shadowLight.shadowMaxZ = 120;
      }
      const sm = w.shadowGen.getShadowMap();
      sm.renderList = w.casters.slice();
      sm.refreshRate = (this.shadowMap.autoUpdate || this.shadowMap.needsUpdate) ? BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE * 0 + 1 : 0;
    } catch (e) {}
  }

  _syncCamera(camera, w) {
    const cam = w.cam;
    camera.getWorldPosition(_wp);
    camera.getWorldDirection(_wd);   // THREE: -Z forward
    cam.position.set(_wp.x, _wp.y, _wp.z);
    cam.setTarget(new BABYLON.Vector3(_wp.x + _wd.x, _wp.y + _wd.y, _wp.z + _wd.z));
    // up vector from camera world matrix
    const e = camera.matrixWorld.elements;
    cam.upVector = new BABYLON.Vector3(e[4], e[5], e[6]).normalize();
    cam.fov = camera.fov * Math.PI / 180;
    cam.minZ = camera.near; cam.maxZ = camera.far;
  }

  _syncFog(threeScene, scene) {
    const f = threeScene.fog;
    if (f && f.isFog) {
      scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
      scene.fogColor = new BABYLON.Color3(f.color.r, f.color.g, f.color.b);
      scene.fogStart = f.near; scene.fogEnd = f.far;
    } else if (f && f.isFogExp2) {
      scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      scene.fogColor = new BABYLON.Color3(f.color.r, f.color.g, f.color.b);
      scene.fogDensity = f.density;
    } else { scene.fogMode = BABYLON.Scene.FOGMODE_NONE; }
  }

  _syncBackground(threeScene, w) {
    const bg = threeScene.background;
    const scene = w.scene;
    if (bg && bg.isColor) { scene.clearColor = new BABYLON.Color4(bg.r, bg.g, bg.b, 1); if (w.bgLayer) { w.bgLayer.dispose(); w.bgLayer = null; } return; }
    if (bg && bg.isTexture) {
      const tex = buildBabylonTexture(bg, scene, false);
      if (!w.bgLayer) { w.bgLayer = new BABYLON.Layer('bg', null, scene, true); }
      w.bgLayer.texture = tex;
      return;
    }
    if (w.bgLayer) { w.bgLayer.dispose(); w.bgLayer = null; }
  }

  _ensureBloom(w, enabled) {
    if (!w.bloom) {
      try {
        const p = new BABYLON.DefaultRenderingPipeline('shimBloom', false, w.scene, [w.cam]);
        p.imageProcessingEnabled = false;     // tone mapping handled at scene level
        p.bloomEnabled = true;
        p.bloomThreshold = 0.85; p.bloomWeight = 0.35; p.bloomKernel = 48; p.bloomScale = 0.5;
        w.bloom = p;
      } catch (e) { w.bloom = null; }
    }
    if (w.bloom) w.bloom.bloomEnabled = enabled;
  }
}

// ---- Raycaster (delegates to Babylon picking) ------------------------------
export class Raycaster {
  constructor(origin, direction, near = 0, far = Infinity) {
    this.ray = { origin: origin ? origin.clone() : new Vector3(), direction: direction ? direction.clone() : new Vector3(0, 0, -1) };
    this.near = near; this.far = far;
    this.camera = null;
  }
  set(origin, direction) { this.ray.origin.copy(origin); this.ray.direction.copy(direction).normalize(); return this; }
  setFromCamera(coords, camera) {
    this.camera = camera;
    camera.updateWorldMatrix(true, false);
    this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
    _rc.set(coords.x, coords.y, 0.5).applyMatrix4(_im.copy(camera.projectionMatrix).invert()).applyMatrix4(camera.matrixWorld);
    this.ray.direction.copy(_rc).sub(this.ray.origin).normalize();
    return this;
  }
  intersectObjects(objects, recursive = true, optionalTarget) {
    const scene = __activeBabylonScene;
    const results = optionalTarget || [];
    if (!scene) return results;
    const targets = new Set();
    const collect = (o) => { if (o._bjs) targets.add(o._bjs); if (recursive) for (const c of o.children || []) collect(c); };
    for (const o of objects) collect(o);
    if (targets.size === 0) return results;
    const far = isFinite(this.far) ? this.far : 1000;
    const ray = new BABYLON.Ray(new BABYLON.Vector3(this.ray.origin.x, this.ray.origin.y, this.ray.origin.z),
      new BABYLON.Vector3(this.ray.direction.x, this.ray.direction.y, this.ray.direction.z), far);
    const picks = scene.multiPickWithRay(ray, (m) => targets.has(m));
    if (picks) {
      for (const pk of picks) {
        if (!pk.hit) continue;
        results.push({ distance: pk.distance, point: new Vector3(pk.pickedPoint.x, pk.pickedPoint.y, pk.pickedPoint.z), object: null, face: null });
      }
    }
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }
  intersectObject(object, recursive = true, optionalTarget) { return this.intersectObjects([object], recursive, optionalTarget); }
}

// ---- Box3.setFromObject world-AABB collector -------------------------------
globalThis.__shimBox3FromObject = function (obj, box) {
  obj.updateWorldMatrix(true, true);
  const corner = new Vector3();
  const handle = (o) => {
    if ((o.isMesh) && o.geometry) {
      const g = o.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
        corner.applyMatrix4(o.matrixWorld); box.expandByPoint(corner);
      }
    } else if (o._native && o._bjs && o._nativeBounds) {
      // GLB facade: bounds are baked min/max in the model's local space → transform
      const bnd = o._nativeBounds;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? bnd.max.x : bnd.min.x, i & 2 ? bnd.max.y : bnd.min.y, i & 4 ? bnd.max.z : bnd.min.z);
        corner.applyMatrix4(o.matrixWorld); box.expandByPoint(corner);
      }
    }
    for (const c of o.children) handle(c);
  };
  handle(obj);
  if (box.isEmpty()) box.min.set(0, 0, 0), box.max.set(0, 0, 0);
};

// scratch
const _dp = new Vector3(), _ds = new Vector3(), _dq = new Quaternion();
const _wp = new Vector3(), _wt = new Vector3(), _wd = new Vector3();
const _rc = new Vector3(), _im = new Matrix4();
// ============================================================================
//  PART 7 / N : animation (KeyframeTrack, AnimationClip, AnimationMixer/Action)
//  A compact re-implementation of THREE's mixer: tracks are bound to bones by
//  name ("Bone.quaternion"), sampled per frame and blended across active
//  actions (normalised weighted slerp for rotations, lerp for vectors).
// ============================================================================

export class KeyframeTrack {
  constructor(name, times, values) {
    this.name = name;
    this.times = times instanceof Float32Array ? times : new Float32Array(times);
    this.values = values instanceof Float32Array ? values : new Float32Array(values);
    this.ValueTypeName = 'number';
  }
  getValueSize() { return this.times.length === 0 ? 0 : this.values.length / this.times.length; }
}
export class VectorKeyframeTrack extends KeyframeTrack {
  constructor(name, times, values) { super(name, times, values); this.ValueTypeName = 'vector'; this.isVector = true; }
}
export class QuaternionKeyframeTrack extends KeyframeTrack {
  constructor(name, times, values) { super(name, times, values); this.ValueTypeName = 'quaternion'; this.isQuaternion = true; }
}
export class NumberKeyframeTrack extends KeyframeTrack {
  constructor(name, times, values) { super(name, times, values); this.ValueTypeName = 'number'; }
}

let _clipUuid = 0;
export class AnimationClip {
  constructor(name = '', duration = -1, tracks = []) {
    this.name = name; this.tracks = tracks; this.uuid = 'clip' + _clipUuid++;
    this.duration = duration;
    if (this.duration < 0) this.resetDuration();
  }
  resetDuration() {
    let d = 0;
    for (const t of this.tracks) { const tt = t.times; if (tt.length) d = Math.max(d, tt[tt.length - 1]); }
    this.duration = d; return this;
  }
}

// --- sampling helpers --------------------------------------------------------
function findKey(times, t) {
  // returns index i such that times[i] <= t < times[i+1]
  const n = times.length;
  if (t <= times[0]) return 0;
  if (t >= times[n - 1]) return n - 1;
  let lo = 0, hi = n - 1;
  while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (times[mid] <= t) lo = mid; else hi = mid; }
  return lo;
}

class AnimationAction {
  constructor(mixer, clip) {
    this.mixer = mixer; this._clip = clip;
    this.time = 0; this.timeScale = 1; this.weight = 1;
    this.enabled = true; this.paused = false;
    this.loop = LoopRepeat; this.repetitions = Infinity;
    this.clampWhenFinished = false;
    this._fadeFactor = 1;
    this._ramp = null;          // {from,to,dur,elapsed}
    this._stopAtZero = false;
    this._active = false;
    this._finished = false;
    this._bindings = null;      // resolved [{bone, prop, track, stride}]
  }
  getClip() { return this._clip; }
  reset() { this.time = 0; this.enabled = true; this.paused = false; this._finished = false; this._fadeFactor = 1; this._ramp = null; this._stopAtZero = false; return this; }
  play() { this._active = true; this.enabled = true; this._finished = false; if (this.mixer._actions.indexOf(this) < 0) this.mixer._actions.push(this); return this; }
  stop() { this._active = false; this.reset(); const i = this.mixer._actions.indexOf(this); if (i >= 0) this.mixer._actions.splice(i, 1); return this; }
  halt() { this._ramp = null; this.paused = true; return this; }
  isRunning() { return this._active && this.enabled && !this.paused; }
  setLoop(mode, reps) { this.loop = mode; this.repetitions = reps == null ? Infinity : reps; return this; }
  setEffectiveWeight(w) { this.weight = w; this._fadeFactor = 1; this._ramp = null; return this; }
  getEffectiveWeight() { return this.enabled ? this.weight * this._fadeFactor : 0; }
  setEffectiveTimeScale(s) { this.timeScale = s; return this; }
  setDuration(d) { this.timeScale = this._clip.duration / d; return this; }
  fadeIn(dur) { this._fadeFactor = 0; this._ramp = { from: 0, to: 1, dur: Math.max(1e-4, dur), elapsed: 0 }; this._stopAtZero = false; return this.play(); }
  fadeOut(dur) { this._ramp = { from: this._fadeFactor, to: 0, dur: Math.max(1e-4, dur), elapsed: 0 }; this._stopAtZero = true; return this; }
  crossFadeFrom(from, dur) { from.fadeOut(dur); this.fadeIn(dur); return this; }
  crossFadeTo(to, dur) { this.fadeOut(dur); to.crossFadeFrom(this, dur); return this; }
  _resolve(root) {
    if (this._bindings) return this._bindings;
    const b = [];
    for (const tr of this._clip.tracks) {
      const dot = tr.name.lastIndexOf('.');
      if (dot < 0) continue;
      const boneName = tr.name.substring(0, dot);
      const prop = tr.name.substring(dot + 1);
      const bone = root.getObjectByName(boneName);
      if (!bone) continue;
      b.push({ bone, prop, track: tr, stride: tr.getValueSize() });
    }
    this._bindings = b; return b;
  }
  _advance(dt) {
    if (this.paused || !this.enabled) return;
    const dur = this._clip.duration || 1;
    this.time += dt * this.timeScale * this.mixer.timeScale;
    if (this.loop === LoopOnce) {
      if (this.time >= dur) {
        this.time = dur; this._finished = true;   // stays enabled this frame so the
        // final clamped pose is applied; the mixer removes it afterwards unless
        // clampWhenFinished keeps it pinned at the end.
      } else if (this.time < 0) this.time = 0;
    } else { // LoopRepeat / pingpong treated as repeat
      this.time = ((this.time % dur) + dur) % dur;
    }
    if (this._ramp) {
      this._ramp.elapsed += dt;
      const f = Math.min(1, this._ramp.elapsed / this._ramp.dur);
      this._fadeFactor = this._ramp.from + (this._ramp.to - this._ramp.from) * f;
      if (f >= 1) { this._fadeFactor = this._ramp.to; this._ramp = null; if (this._stopAtZero) this.enabled = false; }
    }
  }
}

export class AnimationMixer {
  constructor(root) {
    this._root = root;
    this._actions = [];
    this._cache = new Map();
    this.time = 0;
    this.timeScale = 1;
  }
  clipAction(clip) {
    let a = this._cache.get(clip);
    if (!a) { a = new AnimationAction(this, clip); this._cache.set(clip, a); }
    return a;
  }
  existingAction(clip) { return this._cache.get(clip) || null; }
  stopAllAction() { for (const a of this._actions.slice()) a.stop(); this._actions.length = 0; return this; }
  update(dt) {
    this.time += dt;
    const acc = new Map();   // bone -> {q,qW,p,pW,s,sW}
    for (const a of this._actions) {
      if (!a._active) continue;
      a._advance(dt);
      const w = a.getEffectiveWeight();
      if (w <= 0) continue;
      const binds = a._resolve(this._root);
      for (const bd of binds) {
        const tr = bd.track, times = tr.times, vals = tr.values, stride = bd.stride;
        if (times.length === 0) continue;
        const i = findKey(times, a.time);
        const j = Math.min(i + 1, times.length - 1);
        let alpha = 0;
        if (j !== i) { const span = times[j] - times[i]; alpha = span > 1e-9 ? (a.time - times[i]) / span : 0; }
        let e = acc.get(bd.bone); if (!e) { e = { q: null, qW: 0, p: null, pW: 0, s: null, sW: 0 }; acc.set(bd.bone, e); }
        if (bd.prop === 'quaternion') {
          _sa.set(vals[i * 4], vals[i * 4 + 1], vals[i * 4 + 2], vals[i * 4 + 3]);
          _sb.set(vals[j * 4], vals[j * 4 + 1], vals[j * 4 + 2], vals[j * 4 + 3]);
          _sa.slerp(_sb, alpha);
          if (!e.q) { e.q = _sa.clone(); e.qW = w; }
          else { e.q.slerp(_sa, w / (e.qW + w)); e.qW += w; }
        } else if (bd.prop === 'position') {
          _va.set(vals[i * stride], vals[i * stride + 1], vals[i * stride + 2]);
          _vb.set(vals[j * stride], vals[j * stride + 1], vals[j * stride + 2]);
          _va.lerp(_vb, alpha);
          if (!e.p) { e.p = _va.clone(); e.pW = w; } else { e.p.lerp(_va, w / (e.pW + w)); e.pW += w; }
        } else if (bd.prop === 'scale') {
          _va.set(vals[i * stride], vals[i * stride + 1], vals[i * stride + 2]);
          _vb.set(vals[j * stride], vals[j * stride + 1], vals[j * stride + 2]);
          _va.lerp(_vb, alpha);
          if (!e.s) { e.s = _va.clone(); e.sW = w; } else { e.s.lerp(_va, w / (e.sW + w)); e.sW += w; }
        }
      }
    }
    // write accumulated pose to bones
    for (const [bone, e] of acc) {
      if (e.q) bone.quaternion.copyRaw(e.q.x, e.q.y, e.q.z, e.q.w);
      if (e.p) bone.position.copy(e.p);
      if (e.s) bone.scale.copy(e.s);
    }
    // after applying the final pose, retire finished one-shot actions (unless clamping)
    for (let k = this._actions.length - 1; k >= 0; k--) {
      const a = this._actions[k];
      if (a._finished && !a.clampWhenFinished) { a.enabled = false; a._active = false; this._actions.splice(k, 1); }
    }
    return this;
  }
}

const _sa = new Quaternion(), _sb = new Quaternion();
const _va = new Vector3(), _vb = new Vector3();
// ============================================================================
//  PART 8 / N : loaders (GLTFLoader, BVHLoader), post-FX passes, helpers
// ============================================================================

// ---- GLTFLoader (Babylon SceneLoader) --------------------------------------
export class GLTFLoader {
  constructor(manager) { this.manager = manager || null; }
  setDRACOLoader() { return this; }
  setPath(p) { this._path = p || ''; return this; }
  load(url, onLoad, onProgress, onError) {
    const scene = __activeBabylonScene;
    if (!scene) { if (onError) onError(new Error('[shim] no active Babylon scene for GLTFLoader')); return; }
    const slash = url.lastIndexOf('/');
    const root = url.substring(0, slash + 1);
    const file = url.substring(slash + 1);
    BABYLON.SceneLoader.ImportMeshAsync(null, root, file, scene, onProgress ? (ev) => { try { onProgress({ loaded: ev.loaded, total: ev.total }); } catch (e) {} } : null)
      .then((result) => {
        // stop any auto-playing animation groups (player anim comes from BVH)
        if (result.animationGroups) for (const g of result.animationGroups) { try { g.stop(); } catch (e) {} }

        // Re-expose the imported model as a normal THREE scene graph: each Babylon
        // mesh becomes a primitive THREE.Mesh whose geometry is extracted (so all
        // the game's CPU logic — bounding boxes, merging, culling — works) and whose
        // material REUSES the original Babylon PBR material (so textures survive).
        const matCache = scene.__glbMatWrap || (scene.__glbMatWrap = new Map());
        function materialWrap(bmat) {
          if (!bmat) return { isMaterial: true, uuid: 'glbnull', color: new Color(0xffffff), map: null, transparent: false, opacity: 1, needsUpdate: true, clone() { return this; } };
          let w = matCache.get(bmat); if (w) return w;
          const col = new Color(0xffffff);
          if (bmat.albedoColor) col.setRGB(bmat.albedoColor.r, bmat.albedoColor.g, bmat.albedoColor.b);
          else if (bmat.diffuseColor) col.setRGB(bmat.diffuseColor.r, bmat.diffuseColor.g, bmat.diffuseColor.b);
          w = { isMaterial: true, _babylonMat: bmat, uuid: 'glbmat_' + (bmat.uniqueId != null ? bmat.uniqueId : bmat.name), color: col, map: null, transparent: (bmat.alpha != null && bmat.alpha < 1), opacity: bmat.alpha != null ? bmat.alpha : 1, needsUpdate: true, clone() { return this; } };
          matCache.set(bmat, w); return w;
        }
        function meshToFacade(bmesh) {
          const pos = bmesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
          if (!pos || pos.length === 0) return null;
          const geo = new BufferGeometry();
          geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
          const nor = bmesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
          if (nor) geo.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
          const uv = bmesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
          if (uv) geo.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
          const ind = bmesh.getIndices();
          if (ind) geo.setIndex(new BufferAttribute(new Uint32Array(ind), 1));
          if (!nor) geo.computeVertexNormals();
          const fm = new Mesh(geo, materialWrap(bmesh.material));
          fm.name = bmesh.name || '';
          fm.matrixAutoUpdate = false;
          bmesh.computeWorldMatrix(true);
          const arr = bmesh.getWorldMatrix().m;   // column-major, same layout as THREE
          for (let i = 0; i < 16; i++) fm.matrix.elements[i] = arr[i];
          return fm;
        }

        const group = new Group();
        group.name = 'glb';
        for (const m of result.meshes) {
          if (!(m instanceof BABYLON.Mesh) || m.getTotalVertices() === 0) { continue; }
          const fm = meshToFacade(m);
          if (fm) group.add(fm);
          m.setEnabled(false);          // original hidden; the facade renders instead
        }
        const gltf = { scene: group, scenes: [group], animations: [], cameras: [], asset: {}, parser: null, userData: {} };
        if (onLoad) onLoad(gltf);
      })
      .catch((err) => { console.error('[shim] GLB load failed', url, err); if (onError) onError(err); });
  }
  parse() { throw new Error('[shim] GLTFLoader.parse not supported'); }
}

// ---- BVHLoader -------------------------------------------------------------
export class BVHLoader {
  constructor(manager) { this.manager = manager || null; this.animateBonePositions = true; this.animateBoneRotations = true; }
  parse(text) {
    const lines = text.split(/[\r\n]+/g).map(l => l.trim()).filter(l => l.length);
    let li = 0;
    const bones = [];        // DFS order, each {name, channels:[], parent}
    const tokensOf = (s) => s.split(/\s+/);

    function readNode(parent) {
      let tok = tokensOf(lines[li++]);
      const kind = tok[0];                          // ROOT / JOINT / End
      const isEnd = (kind === 'End');
      const name = isEnd ? (parent ? parent.name + '_End' : 'End') : tok[1];
      const node = { name, channels: [], parent, isEnd };
      if (!isEnd) bones.push(node);
      // expect '{'
      if (lines[li] === '{') li++;
      while (li < lines.length && lines[li] !== '}') {
        const t = tokensOf(lines[li]);
        if (t[0] === 'OFFSET') { node.offset = [parseFloat(t[1]), parseFloat(t[2]), parseFloat(t[3])]; li++; }
        else if (t[0] === 'CHANNELS') { const n = parseInt(t[1], 10); node.channels = t.slice(2, 2 + n); li++; }
        else if (t[0] === 'JOINT' || t[0] === 'ROOT') { readNode(node); }
        else if (t[0] === 'End') { readNode(node); }
        else { li++; }
      }
      if (lines[li] === '}') li++;
      return node;
    }

    // HIERARCHY
    if (lines[li] === 'HIERARCHY') li++;
    readNode(null);

    // MOTION
    while (li < lines.length && lines[li] !== 'MOTION') li++;
    li++; // skip 'MOTION'
    let frames = 0, frameTime = 1 / 30;
    if (lines[li] && lines[li].startsWith('Frames')) { frames = parseInt(tokensOf(lines[li])[1], 10); li++; }
    if (lines[li] && lines[li].startsWith('Frame Time')) { frameTime = parseFloat(lines[li].split(':')[1]); li++; }

    // prepare per-bone accumulators
    const animBones = bones.filter(b => b.channels.length > 0);
    for (const b of animBones) {
      b._rotOrder = b.channels.filter(c => c.endsWith('rotation')).map(c => c[0]).join('');
      b._hasPos = b.channels.some(c => c.endsWith('position'));
      b._quat = [];      // flat x,y,z,w per frame
      b._pos = [];       // flat x,y,z per frame
    }
    const times = new Float32Array(frames);
    const q = new Quaternion(), e = new Euler();

    for (let f = 0; f < frames; f++) {
      times[f] = f * frameTime;
      const data = tokensOf(lines[li++]).map(parseFloat);
      let p = 0;
      for (const b of animBones) {
        let rx = 0, ry = 0, rz = 0, px = 0, py = 0, pz = 0;
        for (const ch of b.channels) {
          const v = data[p++];
          switch (ch) {
            case 'Xposition': px = v; break;
            case 'Yposition': py = v; break;
            case 'Zposition': pz = v; break;
            case 'Xrotation': rx = v * Math.PI / 180; break;
            case 'Yrotation': ry = v * Math.PI / 180; break;
            case 'Zrotation': rz = v * Math.PI / 180; break;
          }
        }
        e.set(rx, ry, rz, b._rotOrder || 'ZYX');
        q.setFromEuler(e);
        b._quat.push(q.x, q.y, q.z, q.w);
        if (b._hasPos) b._pos.push(px, py, pz);
      }
    }

    // build clip tracks
    const tracks = [];
    for (const b of animBones) {
      tracks.push(new QuaternionKeyframeTrack(b.name + '.quaternion', times.slice(0), new Float32Array(b._quat)));
      if (b._hasPos) tracks.push(new VectorKeyframeTrack(b.name + '.position', times.slice(0), new Float32Array(b._pos)));
    }
    const clip = new AnimationClip('bvh', frames > 0 ? (frames - 1) * frameTime : 0, tracks);

    // minimal skeleton (THREE consumers usually only read .clip here)
    const skelBones = bones.map(b => { const ob = new Bone(); ob.name = b.name; if (b.offset) ob.position.set(b.offset[0], b.offset[1], b.offset[2]); return ob; });
    return { skeleton: { bones: skelBones }, clip };
  }
}

// ---- post-processing facades ----------------------------------------------
export class EffectComposer {
  constructor(renderer, renderTarget) { this.renderer = renderer; this.passes = []; this._scene = null; this._camera = null; this._bloom = false; }
  setSize() {}
  setPixelRatio() {}
  addPass(pass) {
    this.passes.push(pass);
    if (pass && pass.isRenderPass) { this._scene = pass.scene; this._camera = pass.camera; }
    if (pass && pass.isBloomPass) this._bloom = true;
  }
  insertPass(pass, index) { this.passes.splice(index, 0, pass); }
  removePass(pass) { const i = this.passes.indexOf(pass); if (i >= 0) this.passes.splice(i, 1); }
  render() {
    if (!this._scene || !this._camera) return;
    this.renderer._renderInternal(this._scene, this._camera, this._bloom);
  }
}
export class RenderPass {
  constructor(scene, camera) { this.scene = scene; this.camera = camera; this.isRenderPass = true; this.enabled = true; this.clear = true; }
  setSize() {}
}
export class ShaderPass {
  constructor(shader, textureID) { this.uniforms = (shader && shader.uniforms) ? shader.uniforms : {}; this.material = { uniforms: this.uniforms }; this.enabled = true; this.isShaderPass = true; this.textureID = textureID || 'tDiffuse'; }
  setSize() {}
}
export class UnrealBloomPass {
  constructor(resolution, strength = 1, radius = 0, threshold = 0) {
    this.resolution = resolution || new Vector2(256, 256);
    this.strength = strength; this.radius = radius; this.threshold = threshold;
    this.enabled = true; this.isBloomPass = true;
  }
  setSize() {}
}
export class OutputPass { constructor() { this.enabled = true; } setSize() {} }

// ---- helpers ---------------------------------------------------------------
export class Box3Helper extends Object3D {
  constructor(box, color = 0xffff00) { super(); this.box = box; this.type = 'Box3Helper'; this.isBox3Helper = true; }
  updateMatrixWorld(force) { super.updateMatrixWorld(force); }
}
export class AxesHelper extends Object3D { constructor(size = 1) { super(); this.size = size; } }
export class GridHelper extends Object3D { constructor() { super(); } }

export const MathUtils = {
  DEG2RAD: Math.PI / 180, RAD2DEG: 180 / Math.PI,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  degToRad: (d) => d * Math.PI / 180,
  radToDeg: (r) => r * 180 / Math.PI,
  randFloat: (a, b) => a + Math.random() * (b - a),
  euclideanModulo: (n, m) => ((n % m) + m) % m,
  generateUUID: () => 'xxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16))
};

export const REVISION = '160-babylon-shim';
