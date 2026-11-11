/**
 * The picture tube.
 *
 * Everything behind the text is drawn here, in plain WebGL with no library:
 *
 *   1. a mosaic — one photograph broken into raised blocks on a grid, used
 *      behind the title and again behind About;
 *   2. the room — every photograph as a flat print hanging in a white void,
 *      which the camera travels through as the page scrolls;
 *   3. the tube — the finished frame bent, scanned and smeared the way a
 *      monitor playing back tape would show it.
 *
 * The scene never reads the page. js/main.js tells it where the visitor is
 * (`set`), and asks it what is under the pointer (`pick`).
 */
import { SIZES } from './sizes.js';

const VERT_FULL = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

/* One photograph as blocks. Each cell takes the colour at its centre and is
   drawn as a square whose size follows how bright that colour is, so the
   dark of the frame opens up into the grid behind it. */
const FRAG_MOSAIC = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes, uTexRes, uShift;
uniform float uCell, uTime, uAlpha, uZoom;
uniform vec3 uTint;
void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cell = floor(frag / uCell);
  vec2 f = fract(frag / uCell);
  vec2 uv = ((cell + 0.5) * uCell) / uRes - 0.5;
  float sa = uRes.x / uRes.y, ta = uTexRes.x / uTexRes.y;
  if (sa > ta) uv.y *= ta / sa; else uv.x *= sa / ta;
  uv = uv * uZoom + 0.5 + uShift;
  vec3 c = texture2D(uTex, uv).rgb * uTint;
  float l = dot(c, vec3(0.299, 0.587, 0.114));

  float wave = 0.06 * sin(cell.y * 0.35 - uTime * 1.4) * sin(cell.x * 0.11 + uTime * 0.5);
  float size = mix(0.0, 0.94, smoothstep(0.035, 0.5, l)) + wave * step(0.05, l);
  vec2 d = abs(f - 0.5) * 2.0;
  float block = step(max(d.x, d.y), size);
  float bevel = 0.82 + 0.36 * (f.y - 0.5) + 0.18 * (0.5 - f.x);
  vec3 col = c * 1.35 * bevel * block;

  /* The grid shows only where the photograph is dark. */
  float big = uCell * 6.0;
  vec2 g = mod(frag, big);
  float line = max(step(g.x, 1.5), step(g.y, 1.5));
  col += vec3(0.42, 0.45, 0.46) * line * (1.0 - smoothstep(0.03, 0.09, l));

  gl_FragColor = vec4(col, uAlpha);
}`;

const VERT_PRINT = `
attribute vec2 aPos;
uniform mat4 uMvp;
varying vec2 vUv;
void main() { vUv = aPos + 0.5; gl_Position = uMvp * vec4(aPos, 0.0, 1.0); }`;

/* A print in the room. `uFog` is how far it has dissolved into the void;
   until its file arrives it is a blank sheet of the right shape. */
const FRAG_PRINT = `
precision mediump float;
uniform sampler2D uTex;
uniform float uHas, uFog, uAlpha, uNear;
uniform vec3 uVoid, uFlat;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uTex, vUv);
  vec3 c = mix(uFlat, t.rgb, uHas);
  float a = mix(1.0, t.a * (1.0 - uFog), uAlpha);
  gl_FragColor = vec4(mix(c, uVoid, uFog), a * uNear);
}`;

/* The tube. `bend` is shared with pick() below — keep the two in step. */
const FRAG_TUBE = `
precision highp float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTime, uTear, uBend, uStill;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 bend(vec2 uv) {
  vec2 c = uv - 0.5;
  return 0.5 + c * (1.0 + uBend * dot(c, c)) / (1.0 + uBend * 0.25);
}
void main() {
  vec2 uv = bend(vUv);
  float line = floor(gl_FragCoord.y / 2.0);
  float tick = floor(uTime * 24.0);

  /* A band of tracking error that drifts up the screen, and tears harder
     while the page is moving. */
  float at = fract(uTime * 0.06);
  float band = smoothstep(0.05, 0.0, abs(uv.y - at));
  float tear = (hash(vec2(line, tick)) - 0.5) * band * (0.012 + uTear * 0.05);
  tear += (hash(vec2(line * 0.37, tick)) - 0.5) * uTear * 0.006;
  uv.x += tear * (1.0 - uStill);

  vec2 off = (uv - 0.5) * (0.004 + uTear * 0.01) + vec2(band * 0.004 * (1.0 - uStill), 0.0);
  vec3 col = vec3(
    texture2D(uScene, uv + off).r,
    texture2D(uScene, uv).g,
    texture2D(uScene, uv - off).b);

  float scan = 0.94 + 0.06 * sin(gl_FragCoord.y * 2.094);
  col *= scan;
  col += (hash(gl_FragCoord.xy + tick * (1.0 - uStill)) - 0.5) * 0.055;
  col += band * 0.035 * (1.0 - uStill);

  vec2 c = vUv - 0.5;
  col *= 1.0 - 0.55 * dot(c, c);

  /* Past the edge of the glass there is only the case. */
  vec2 e = smoothstep(vec2(0.0), vec2(0.004), uv) * smoothstep(vec2(0.0), vec2(0.004), 1.0 - uv);
  col = mix(vec3(0.012), col, e.x * e.y);
  gl_FragColor = vec4(col, 1.0);
}`;

const BEND = 0.2;
const FOV = 0.9;          // radians, vertical
const GAP = 3.2;          // distance between one slot and the next
export const AHEAD = 4.4; // how far in front of the camera the current slot sits

/* --- Small matrix kit: column-major, just what the room needs ----------- */
function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function multiply(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}
/** Translate · rotateY · rotateZ · scale(w, h). */
function place(x, y, z, ry, rz, w, h) {
  const cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  return [
    cy * cz * w, sz * w, -sy * cz * w, 0,
    -cy * sz * h, cz * h, sy * sz * h, 0,
    sy, 0, cy, 0,
    x, y, z, 1,
  ];
}
function view(x, y, z, roll) {
  const c = Math.cos(-roll), s = Math.sin(-roll);
  const r = [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return multiply(r, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1]);
}

const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
/** A fixed scatter per index, so the hang is the same on every visit. */
const scatter = (i, salt) => { const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return v - Math.floor(v); };

/** The derivative nearest the size a print is actually drawn at. */
function fileFor(src, want) {
  const widths = SIZES[src]?.widths;
  if (!widths?.length) return src;
  const w = widths.find((x) => x >= want) ?? widths[widths.length - 1];
  return `images/r/${src.replace(/^images\//, '').replace(/\.[^.]+$/, '')}-${w}.webp`;
}

/**
 * @param canvas
 * @param items  the room, in order: { kind: 'label', text, sub } or
 *               { kind: 'print', src, ratio }. One item per slot.
 * @param backdrops { title: src, about: src }
 * @returns null where WebGL is not available — the page then stays as text.
 */
export function createScene(canvas, { items, backdrops, still = false }) {
  const opts = { antialias: false, alpha: false, powerPreference: 'high-performance' };
  const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts);
  if (!gl) return null;
  const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

  function program(vs, fs) {
    const p = gl.createProgram();
    for (const [type, text] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, text);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const { name } = gl.getActiveUniform(p, i);
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  let mosaic, print, tube;
  try {
    mosaic = program(VERT_FULL, FRAG_MOSAIC);
    print = program(VERT_PRINT, FRAG_PRINT);
    tube = program(VERT_FULL, FRAG_TUBE);
  } catch (err) {
    console.warn('Scene disabled:', err.message);
    return null;
  }

  const quad = (data) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return b;
  };
  const full = quad([-1, -1, 1, -1, -1, 1, 1, 1]);
  const unit = quad([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);
  gl.enableVertexAttribArray(0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  /* --- Textures -------------------------------------------------------- */
  function upload(source, { mips = true } = {}) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (gl2 && mips) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    return t;
  }
  function load(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /* Bound for a print whose file has not arrived, so the sampler never
     points at the frame being drawn into. */
  const blank = upload(new ImageData(new Uint8ClampedArray([214, 215, 214, 255]), 1, 1), { mips: false });

  let lost = false;
  const want = () => (Math.min(innerWidth, innerHeight) < 700 ? 480 : 960);

  const back = {};
  const ready = Object.entries(backdrops).map(([key, src]) =>
    load(fileFor(src, Math.max(want(), 960))).then((img) => {
      back[key] = { tex: upload(img, { mips: false }), w: img.naturalWidth, h: img.naturalHeight };
    }).catch(() => {}));

  /* A label is type set on a 2D canvas and hung like a print. */
  function labelTexture(item) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 384;
    const x = c.getContext('2d');
    /* A card, not loose type: prints further down the room pass behind it. */
    x.fillStyle = '#f6f6f3';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#0a0a0a';
    x.textBaseline = 'alphabetic';
    let size = 190;
    x.font = `900 ${size}px Doto, monospace`;
    const w = x.measureText(item.text).width;
    if (w > 940) { size *= 940 / w; x.font = `900 ${size}px Doto, monospace`; }
    x.fillText(item.text, 40, 215);
    x.font = '500 44px "IBM Plex Mono", monospace';
    x.fillText(item.sub, 44, 310);
    return upload(c);
  }

  const slots = items.map((item, i) => {
    const side = i % 2 ? 1 : -1;
    const base = { item, i, tex: null, state: 'none', side, jx: scatter(i, 1) - 0.5, jy: scatter(i, 2) - 0.5, jr: scatter(i, 3) - 0.5 };
    if (item.kind === 'label') return { ...base, w: 3.8, h: 3.8 * 384 / 1024 };
    const w = Math.min(3.5, Math.sqrt(5.2 * item.ratio));
    return { ...base, w, h: w / item.ratio };
  });
  /* Where each slot hangs along the room. A label gets a little more air
     behind it than a print does. */
  let run = 0;
  for (const s of slots) { s.pos = run; run += s.item.kind === 'label' ? 1.4 : 1; }
  /** Position along the room for a fractional slot number. */
  const posAt = (slot) => {
    if (slot <= 0) return slot;
    const last = slots.length - 1;
    if (slot >= last) return slots[last].pos + (slot - last);
    const i = Math.floor(slot);
    return mix(slots[i].pos, slots[i + 1].pos, slot - i);
  };

  function ensure(slot) {
    if (slot.state !== 'none' || lost) return;
    slot.state = 'loading';
    if (slot.item.kind === 'label') {
      slot.tex = labelTexture(slot.item);
      slot.state = 'ready';
      return;
    }
    load(fileFor(slot.item.src, want())).then((img) => {
      if (slot.state !== 'loading' || lost) return;
      slot.tex = upload(img);
      slot.state = 'ready';
    }).catch(() => { slot.state = 'failed'; });
  }
  function release(slot) {
    if (slot.tex) gl.deleteTexture(slot.tex);
    slot.tex = null;
    if (slot.state !== 'failed') slot.state = 'none';
  }

  /* --- The frame the room is drawn into, before the tube bends it ------ */
  let fbo = null, fboTex = null, fboDepth = null, W = 0, H = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    if (fbo) { gl.deleteFramebuffer(fbo); gl.deleteTexture(fboTex); gl.deleteRenderbuffer(fboDepth); }
    fboTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    fboDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, fboDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W, H);
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fboDepth);
  }

  /* --- Where the visitor is ------------------------------------------- */
  const target = { title: 1, room: 0, about: 0, slot: -2, tear: 0 };
  const now = { ...target };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let time = 0, last = 0, raf = 0, vp = null, drawn = [];

  const DARK = [0.02, 0.02, 0.022];
  const VOID = [0.93, 0.935, 0.93];
  const NIGHT = [0.016, 0.03, 0.05];

  /** Where slot `s` hangs, for the current shape of the screen. */
  function hang(s, aspect) {
    const wide = clamp01((aspect - 0.7) / 0.9);
    const fit = mix(Math.min(1, aspect * 1.05), 1, wide);
    const centre = mix(0, 0.55, wide);
    const reach = mix(0.16, 1.05, wide);
    const label = s.item.kind === 'label';
    const x = label ? mix(0, 0.5, wide) : centre + s.side * reach + s.jx * 0.3 * wide;
    const y = label ? 0 : s.jy * 0.5;
    const ry = label ? 0 : -s.side * mix(0.12, 0.36, wide) + s.jr * 0.1;
    const rz = label ? 0 : s.jr * 0.07;
    return place(x, y, -s.pos * GAP, ry, rz, s.w * fit, s.h * fit);
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (lost) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (!still) time += dt;
    resize();

    const ease = still ? 1 : 1 - Math.exp(-dt * 7);
    for (const k of Object.keys(now)) now[k] += (target[k] - now[k]) * ease;
    target.tear *= Math.exp(-dt * 5);
    pointer.x += (pointer.tx - pointer.x) * ease;
    pointer.y += (pointer.ty - pointer.y) * ease;

    const aspect = W / H;
    const bg = [0, 1, 2].map((i) => mix(mix(DARK[i], VOID[i], now.room), NIGHT[i], now.about));

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Mosaics */
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(mosaic.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, full);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const cell = Math.max(9, Math.round(Math.min(W, H) / 62));
    const drawMosaic = (b, alpha, tint, zoom) => {
      if (!b || alpha < 0.004) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.uniform1i(mosaic.u.uTex, 0);
      gl.uniform2f(mosaic.u.uRes, W, H);
      gl.uniform2f(mosaic.u.uTexRes, b.w, b.h);
      gl.uniform2f(mosaic.u.uShift, pointer.x * 0.012, pointer.y * 0.012);
      gl.uniform1f(mosaic.u.uCell, cell);
      gl.uniform1f(mosaic.u.uTime, time);
      gl.uniform1f(mosaic.u.uAlpha, alpha);
      gl.uniform1f(mosaic.u.uZoom, zoom);
      gl.uniform3fv(mosaic.u.uTint, tint);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    /* On a narrow screen the title's type sits over the picture rather than
       beside it, so the picture is turned down to keep the type readable. */
    const dim = mix(0.5, 1, clamp01((aspect - 0.7) / 0.6));
    drawMosaic(back.title, now.title, [dim, dim, dim], 0.96 - 0.1 * (1 - now.title));
    drawMosaic(back.about, now.about * 0.3, [0.5, 0.78, 1.0], 0.9);

    /* The room */
    drawn = [];
    if (now.room > 0.01) {
      const proj = perspective(FOV, aspect, 0.1, 80);
      const camPos = posAt(now.slot);
      const camZ = -camPos * GAP + AHEAD;
      const roll = still ? 0 : Math.sin(time * 0.4) * 0.008 + pointer.x * 0.012;
      vp = multiply(proj, view(pointer.x * 0.18, pointer.y * 0.12, camZ, roll));

      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(print.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, unit);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(print.u.uVoid, bg);
      gl.uniform3f(print.u.uFlat, 0.84, 0.845, 0.84);
      gl.uniform1i(print.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);

      const visible = [];
      for (const s of slots) {
        const ahead = s.pos - camPos;          // 0 is the one being looked at
        if (Math.abs(ahead) < 7) ensure(s);
        else if (Math.abs(ahead) > 14 && s.tex) release(s);
        if (ahead < -2 || ahead > 6.5) continue;
        visible.push(s);
      }
      /* Far to near, so a print fading out as the camera passes it blends
         over what is behind it. */
      visible.sort((a, b) => b.i - a.i);
      for (const s of visible) {
        const ahead = s.pos - camPos;
        const fog = Math.max(smooth(2.2, 6.2, ahead), 1 - now.room);
        const label = s.item.kind === 'label';
        if (label && s.state !== 'ready') continue;
        /* A print the camera has walked past lets go before it fills the
           glass, so the one being looked at is never hidden behind it. */
        const near = 1 - smooth(0.35, 0.8, -ahead);
        if (near < 0.01) continue;
        const model = hang(s, aspect);
        const mvp = multiply(vp, model);
        gl.uniformMatrix4fv(print.u.uMvp, false, mvp);
        gl.uniform1f(print.u.uHas, s.state === 'ready' ? 1 : 0);
        gl.uniform1f(print.u.uFog, fog);
        gl.uniform1f(print.u.uAlpha, 0);
        gl.uniform1f(print.u.uNear, near);
        gl.bindTexture(gl.TEXTURE_2D, s.tex || blank);
        gl.depthMask(near > 0.99);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!label && fog < 0.75 && near > 0.5) drawn.push({ index: s.item.index, mvp });
      }
      gl.depthMask(true);
    }

    /* The tube */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(tube.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, full);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.uniform1i(tube.u.uScene, 0);
    gl.uniform2f(tube.u.uRes, W, H);
    gl.uniform1f(tube.u.uTime, time);
    gl.uniform1f(tube.u.uTear, Math.min(1, now.tear));
    gl.uniform1f(tube.u.uBend, BEND);
    gl.uniform1f(tube.u.uStill, still ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  return {
    /** Resolves once the two backdrops are on the card (or have failed). */
    ready: Promise.all(ready),
    start() { last = performance.now(); raf = requestAnimationFrame(frame); },
    set(state) { Object.assign(target, state); },
    /** Jump rather than glide — after a deep link or a resize. */
    snap() { Object.assign(now, target, { tear: 0 }); },
    tear(amount) { target.tear = Math.min(1.2, target.tear + amount); },
    point(x, y) { pointer.tx = x; pointer.ty = y; },
    /**
     * The photograph under a point on the glass, nearest first, or -1.
     * (x, y) are 0–1 from the top left of the canvas.
     */
    pick(x, y) {
      /* Undo the tube: the same bend the shader applies. */
      const cx = x - 0.5, cy = (1 - y) - 0.5;
      const k = (1 + BEND * (cx * cx + cy * cy)) / (1 + BEND * 0.25);
      const px = cx * k * 2, py = cy * k * 2;
      for (let n = drawn.length - 1; n >= 0; n--) {
        const m = drawn[n].mvp;
        const pts = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([a, b]) => {
          const w = m[3] * a + m[7] * b + m[15];
          return w <= 0 ? null : [(m[0] * a + m[4] * b + m[12]) / w, (m[1] * a + m[5] * b + m[13]) / w];
        });
        if (pts.includes(null)) continue;
        let sign = 0, inside = true;
        for (let i = 0; i < 4; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 4];
          const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
          if (cross !== 0) {
            if (sign && Math.sign(cross) !== sign) { inside = false; break; }
            sign = Math.sign(cross);
          }
        }
        if (inside) return drawn[n].index;
      }
      return -1;
    },
  };
}
