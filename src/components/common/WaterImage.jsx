import { useEffect, useRef, useState } from "react";

/*
  Image with a soft "water ripple" on mouse move (Springs-style), drawn with a tiny WebGL shader.
  - Desktop only (mouse + hover). Phones/tablets and "reduce motion" users get the plain image.
  - If WebGL or the image's CORS headers are not available it silently falls back to the plain image.
  - The <img> is always rendered underneath (SEO, first paint); the canvas sits on top once ready.
  props: src, alt, position ("center" | "top" | "bottom" | "left" | "right"), className, imgClassName, strength (0.5–2)
*/
const FOCUS = { center: [0.5, 0.5], top: [0.5, 0], bottom: [0.5, 1], left: [0, 0.5], right: [1, 0.5] };
const MAX_DROPS = 12;
const LIFE = 2.6; // seconds a ripple lives

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() {
  vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); // top-left origin
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;      // canvas size (px)
uniform vec2 uImg;      // image size (px)
uniform vec2 uFocus;    // object-position as 0..1
uniform float uTime;
uniform float uStrength;
uniform vec3 uDrops[${MAX_DROPS}]; // x, y (0..1), start time

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 disp = vec2(0.0);
  float shine = 0.0;
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    vec3 d = uDrops[i];
    float age = uTime - d.z;
    if (d.z < 0.0 || age < 0.0 || age > ${LIFE.toFixed(1)}) continue;
    vec2 dv = (vUv - d.xy) * vec2(aspect, 1.0);
    float dist = length(dv);
    float front = age * 0.32;                                   // ring radius grows
    float ring = exp(-pow((dist - front) * 14.0, 2.0));          // thin expanding ring
    float wave = sin(dist * 70.0 - age * 10.0) * ring * exp(-age * 1.4);
    disp += normalize(dv + 1e-5) * wave * 0.014 * uStrength;
    shine += wave * 0.07 * uStrength;
  }
  // object-fit: cover mapping
  float s = max(uRes.x / uImg.x, uRes.y / uImg.y);
  vec2 size = uImg * s;
  vec2 offset = (uRes - size) * uFocus;
  vec2 tuv = (vUv * uRes - offset) / size + disp;
  vec4 col = texture2D(uTex, clamp(tuv, 0.001, 0.999));
  gl_FragColor = vec4(col.rgb + shine, 1.0);
}`;

function canUseWater() {
  if (typeof window === "undefined") return false;
  const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return fine && !calm;
}

export function WaterImage({ src, srcSet, alt = "", position = "center", className = "", imgClassName = "", strength = 1, enabled = true }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!enabled || !src || !canUseWater()) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const gl = canvas?.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    let disposed = false;
    let raf = 0;
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;
    const drops = new Float32Array(MAX_DROPS * 3).fill(-1);
    let dropIndex = 0;
    let last = { x: -1, y: -1 };
    let imgSize = [1, 1];

    // --- program
    const compile = (type, code) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, code);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      console.warn("Water effect disabled:", e?.message);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    const U = { res: u("uRes"), img: u("uImg"), focus: u("uFocus"), time: u("uTime"), strength: u("uStrength"), drops: u("uDrops"), tex: u("uTex") };

    // --- texture (needs CORS headers on the image host)
    const tex = gl.createTexture();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (disposed) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch (e) {
        console.warn("Water effect disabled (image needs CORS headers):", e?.message);
        return;
      }
      imgSize = [img.naturalWidth, img.naturalHeight];
      resize();
      draw();
      setReady(true);
    };
    img.onerror = () => console.warn("Water effect disabled: image could not be loaded with CORS.");
    img.src = src;

    // --- sizing
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(wrap);

    // --- render (only animates while ripples are alive)
    const alive = () => {
      const t = now();
      for (let i = 0; i < MAX_DROPS; i++) if (drops[i * 3 + 2] >= 0 && t - drops[i * 3 + 2] < LIFE) return true;
      return false;
    };
    const draw = () => {
      const [fx, fy] = FOCUS[position] || FOCUS.center;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform2f(U.img, imgSize[0], imgSize[1]);
      gl.uniform2f(U.focus, fx, fy);
      gl.uniform1f(U.time, now());
      gl.uniform1f(U.strength, strength);
      gl.uniform3fv(U.drops, drops);
      gl.uniform1i(U.tex, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = () => {
      draw();
      raf = alive() ? requestAnimationFrame(loop) : 0;
    };

    // --- mouse → ripples (listen on window so text/buttons on top don't block it)
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      const dx = (x - last.x) * r.width;
      const dy = (y - last.y) * r.height;
      if (last.x >= 0 && dx * dx + dy * dy < 45 * 45) return; // one drop every ~45px of movement
      last = { x, y };
      drops[dropIndex * 3] = x;
      drops[dropIndex * 3 + 1] = y;
      drops[dropIndex * 3 + 2] = now();
      dropIndex = (dropIndex + 1) % MAX_DROPS;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [src, position, strength, enabled]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes="100vw"
        alt={alt}
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover ${imgClassName}`}
        style={{ objectPosition: `${(FOCUS[position] || FOCUS.center)[0] * 100}% ${(FOCUS[position] || FOCUS.center)[1] * 100}%` }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
