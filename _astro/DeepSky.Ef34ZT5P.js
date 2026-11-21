import{a as e,t}from"./hooks.module.Drp3Zv3q.js";import{r as n}from"./themes.729cs9P-.js";import{a as r,t as i}from"./design.D3ZXW7Nd.js";import{t as a}from"./jsxRuntime.module.DAvpkkkg.js";import{t as o}from"./preload-helper.DHhhL8Zf.js";var s=`
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`,c=`
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform float uDepth;   // 0 = just below the header, 1 = the footer
uniform float uScroll;  // scroll in viewport heights (star parallax)
uniform vec3 uBg;
uniform vec3 uA1;
uniform vec3 uA2;
uniform vec3 uA3;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
#ifdef LITE
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
#else
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
#endif
  return v;
}
vec3 stars(vec2 px, float cell, float density, float radius, float seed) {
  vec2 id = floor(px / cell);
  float h = hash(id + seed);
  if (h < 1.0 - density) return vec3(0.0);
  vec2 centre = (id + 0.2 + 0.6 * vec2(hash(id + seed + 1.7), hash(id + seed + 4.3))) * cell;
  float d = length(px - centre);
  float r = radius * mix(0.6, 1.4, hash(id + seed + 9.1));
  float core = exp(-(d * d) / (r * r));
  float halo = exp(-d / (r * 2.5)) * 0.2 * smoothstep(0.2 * cell, 0.0, d);
  float twinkle = 0.65 + 0.35 * sin(uTime * (1.2 + 2.0 * hash(id + seed + 2.9)) + h * 60.0);
  vec3 tint = mix(vec3(1.0), mix(uA3, uA1, hash(id + seed + 6.1)), 0.35);
  return tint * (core + halo) * twinkle * mix(0.5, 1.0, hash(id + seed + 3.3));
}
// 1 inside [a, b] with soft edges of width e
float window(float x, float a, float b, float e) { return smoothstep(a - e, a + e, x) * smoothstep(b + e, b - e, x); }

vec3 nebula(vec2 p, float t) {
  float n = fbm(p * 1.5 + vec2(t * 0.25, -t * 0.15));
  float n2 = fbm(p * 2.8 + n * 1.6 + 4.0);
  vec3 c = mix(uA1, uA2, n2) * smoothstep(0.38, 0.9, n) * 0.75;
  c += uA3 * smoothstep(0.62, 0.95, n2) * 0.2;
  // a few bright knots where the gas is thickest
  c += vec3(1.0) * pow(smoothstep(0.7, 1.0, n * n2 * 1.6), 3.0) * 0.25;
  return c;
}

vec3 galaxy(vec2 p, vec2 at, float t) {
  vec2 g = p - at;
  // tilt and incline the disc
  float c = 0.86, s = 0.5;
  g = vec2(c * g.x + s * g.y, -s * g.x + c * g.y);
  g.y /= 0.42;
  float r = length(g);
  float a = atan(g.y, g.x);
  float arms = 0.5 + 0.5 * cos(2.0 * (a - log(r + 1e-3) * 2.4 - t * 0.4));
  float dust = noise(g * 16.0 + 3.0);
  float disc = exp(-r * 2.6) * (0.25 + 0.75 * pow(arms, 3.0)) * (0.65 + 0.35 * dust);
  float core = exp(-r * r * 70.0);
  vec3 col = mix(uA1, uA3, smoothstep(0.05, 0.5, r)) * disc * 0.9;
  col += mix(vec3(1.0, 0.92, 1.0), uA2, 0.2) * (core * 0.9 + exp(-r * 12.0) * 0.25);
  // scattered young stars along the arms
  col += vec3(1.0) * step(0.985, hash(floor(g * 90.0))) * pow(arms, 4.0) * exp(-r * 2.5) * 0.8;
  return col;
}

// ringed planet: lit sphere with bands; the ring passes behind and in front of it
vec3 planet(vec2 p, vec2 at, float rad, vec3 col) {
  vec2 v = p - at;
  vec2 md = v / rad;
  float ml = length(md);
  float aa = 1.5 / (rad * uRes.y);
  float disc = smoothstep(1.0, 1.0 - aa, ml);
  // ring geometry (tilted ellipse)
  float c = 0.94, s = 0.34;
  vec2 q = vec2(c * v.x + s * v.y, -s * v.x + c * v.y);
  float rr = length(q / vec2(1.9, 0.42)) / rad;
  float band = smoothstep(1.28, 1.33, rr) * smoothstep(1.8, 1.72, rr) * (0.6 + 0.4 * sin(rr * 46.0));
  vec3 ringCol = mix(uA1, vec3(1.0, 0.9, 0.95), 0.45) * band * 0.32;
  bool front = q.y < 0.0;
  if (!front) col += ringCol * (1.0 - disc);
  if (ml < 1.0 + aa) {
    float z = sqrt(max(0.0, 1.0 - dot(md, md)));
    vec3 n = vec3(md, z);
    float lam = smoothstep(-0.1, 0.5, dot(n, normalize(vec3(-0.6, 0.45, 0.65))));
    float stripes = sin(md.y * 13.0 + noise(md * vec2(2.0, 9.0)) * 2.4);
    vec3 surf = mix(uA2, uA1, 0.5 + 0.5 * stripes);
    surf = mix(surf, vec3(1.0, 0.85, 0.95), 0.25);
    vec3 pcol = surf * (0.08 + 0.92 * lam);
    col = mix(col, pcol, disc);
  }
  // thin atmosphere on the lit limb
  col += mix(uA3, uA1, 0.4) * exp(-max(ml - 1.0, 0.0) * 22.0) * 0.35 * (1.0 - disc) * smoothstep(0.2, -0.6, md.x);
  if (front) col += ringCol;
  return col;
}

vec3 earthrise(vec2 p, vec3 col, float amt) {
  // a huge planet rising from the bottom with a dawn rim
  vec2 c = vec2(0.0, -1.62);
  float R = 1.25;
  float d = length(p - c) - R;
  float body = smoothstep(0.002, -0.002, d);
  vec3 land = mix(uBg * 0.6, uA1 * 0.18, smoothstep(-0.5, 0.0, d) * fbm((p - c) * 6.0));
  vec3 rim = mix(uA3, vec3(1.0, 0.86, 0.95), 0.35) * (exp(-abs(d) * 90.0) * 1.1 + exp(-max(d, 0.0) * 9.0) * 0.35);
  vec3 dawn = mix(uA2, uA3, 0.5 + 0.5 * p.x) * exp(-max(d, 0.0) * 4.0) * 0.25;
  vec3 e = mix(col + dawn, land, body) + rim * (0.4 + 0.6 * smoothstep(-0.6, 0.4, -p.x));
  return mix(col, e, amt);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.05;
  float d = uDepth;

  // each scene drifts upward as it passes, so moving between them feels like travel
  float wN = window(d, -0.2, 0.3, 0.12);
  float wG = window(d, 0.3, 0.58, 0.12);
  float wP = window(d, 0.6, 0.86, 0.1);
  float wE = smoothstep(0.82, 0.98, d);

  vec3 col = uBg * 0.92;

  // the header's "space fog" carries on all the way down: a slow, domain-warped aurora
  vec2 fp = p + vec2(0.0, uScroll * 0.12);
  vec2 fq = vec2(fbm(fp * 1.2 + t), fbm(fp * 1.2 - t + vec2(5.2, 1.3)));
  float fog = fbm(fp * 1.0 + 2.2 * fq);
  col = mix(col, uA1, smoothstep(0.45, 0.95, fog) * 0.32);
  col = mix(col, uA2, smoothstep(0.55, 1.0, length(fq)) * 0.18);

#ifndef LITE
  // the perspective star grid returns as a faint floor along the bottom of the view
  if (uv.y < 0.3) {
    float gd = (0.3 - uv.y) / 0.3;
    vec2 g = vec2(p.x / (1.0 - gd * 0.86 + 0.04), 1.0 / (gd + 0.04) + uTime * 0.4 + uScroll * 2.0);
    vec2 cell = abs(fract(g * vec2(8.0, 1.0)) - 0.5);
    col += uA1 * smoothstep(0.035, 0.0, min(cell.x, cell.y * 0.35)) * gd * 0.16 * (1.0 - wE);
  }
#endif


  if (wN > 0.01) col += nebula(p + vec2(0.0, (d - 0.05) * 0.6), t) * wN;
  if (wG > 0.01) col += galaxy(p, vec2(0.32, 0.02 - (d - 0.44) * 0.9), t) * wG;

  // stars with parallax, two depths
  float unit = uRes.y / 500.0;
  vec2 px = gl_FragCoord.xy / unit;
  vec3 sky = stars(px + vec2(0.0, uScroll * 60.0), 9.0, 0.1, 0.6, 0.0) * 0.8 + stars(px + vec2(37.0, 37.0 + uScroll * 140.0), 26.0, 0.14, 1.0, 11.0) * 1.5;
  col += sky;

  if (wP > 0.01) col = mix(col, planet(p, vec2(-0.48, 0.08 - (d - 0.73) * 0.9), 0.15, col), wP);
  if (wE > 0.01) col = earthrise(p + vec2(0.0, (1.0 - d) * -0.5), col, wE);

  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.015;
  gl_FragColor = vec4(col, 1.0);
}
`,l=.5,u=1e3/31;function d(e,t,n){let r=t*.5,i=Math.min(1,Math.max(0,(e-t*.15)/(t*.45))),a=Math.max(1,n-t-r);return[i,Math.min(1,Math.max(0,(e-r)/a)),e/t]}function f(){let f=t(null);return e(()=>{let e=!1,t=()=>{},a=document.documentElement,p=()=>a.dataset.mode===`cinematic`&&i(`universe`),m=async()=>{if(e||!f.current||!p())return;let{Renderer:i,Program:a,Mesh:m,Triangle:h}=await o(async()=>{let{Renderer:e,Program:t,Mesh:n,Triangle:r}=await import(`./src.DxqySC6n.js`);return{Renderer:e,Program:t,Mesh:n,Triangle:r}},[]);if(e||!f.current)return;let g;try{g=new i({dpr:Math.min(devicePixelRatio,1.5)*l,alpha:!1,antialias:!1,powerPreference:`low-power`})}catch{return}let _=g.gl,v=_.canvas;v.setAttribute(`aria-hidden`,`true`),f.current.appendChild(v);let y=_.getExtension(`WEBGL_debug_renderer_info`),b=String(y?_.getParameter(y.UNMASKED_RENDERER_WEBGL):_.getParameter(_.RENDERER)),x=/swiftshader|llvmpipe|softpipe|software|basic render/i.test(b),S=x||matchMedia(`(prefers-reduced-motion: reduce)`).matches;x&&(g.dpr=Math.min(devicePixelRatio,1)*.35);let C=r.cinematic.palette,w=new URLSearchParams(location.search).get(`depth`),T=new a(_,{vertex:s,fragment:(x?`#define LITE
`:``)+c,uniforms:{uTime:{value:18},uRes:{value:[1,1]},uDepth:{value:0},uScroll:{value:0},uBg:{value:n(C.bg)},uA1:{value:n(C.accent)},uA2:{value:n(C.accent2)},uA3:{value:n(C.accent3)}}}),E=new m(_,{geometry:new h(_),program:T}),D=f.current,O=!1,k=document.querySelector(`.fun-shell`),A=k?new IntersectionObserver(([e])=>{O=!!e?.isIntersecting&&e.intersectionRatio>.15,I()},{threshold:[0,.15,.5]}):null;k&&A.observe(k);let j={depth:0,scroll:0,opacity:0},M={depth:0,scroll:0,opacity:0},N=0,P=0,F=()=>{T.uniforms.uDepth.value=M.depth,T.uniforms.uScroll.value=M.scroll,N=M.opacity,D.style.opacity=M.opacity.toFixed(3)},I=()=>{let[e,t,n]=d(scrollY,innerHeight,document.documentElement.scrollHeight);j.depth=w===null?t:Number(w),j.scroll=n,j.opacity=(w===null?e:1)*(O?.15:1),P=performance.now(),S?(Object.assign(M,j),F(),R()):(N<=0&&j.opacity>0&&(M.opacity=.001,F()),W())},L=0,R=()=>{L||N<=0||(L=requestAnimationFrame(()=>{L=0,g.render({scene:E})}))},z=()=>{g.setSize(D.clientWidth,D.clientHeight),T.uniforms.uRes.value=[_.canvas.width,_.canvas.height],I(),R()},B=0,V=performance.now(),H=18,U=e=>{if(B=0,document.hidden||!p())return;let t=e-P<400||Math.abs(j.depth-M.depth)>1e-4||Math.abs(j.scroll-M.scroll)>1e-4||Math.abs(j.opacity-M.opacity)>.001;if(t||e-V>=u){let t=Math.min(.05,(e-V)/1e3);V=e;let n=1-Math.exp(-t*9);if(M.depth+=(j.depth-M.depth)*n,M.scroll+=(j.scroll-M.scroll)*n,M.opacity+=(j.opacity-M.opacity)*Math.min(1,n*.6),F(),M.opacity<=.002&&j.opacity<=0)return;O||(H+=t),T.uniforms.uTime.value=H,g.render({scene:E})}(!O||t)&&(B=requestAnimationFrame(U))},W=()=>{!B&&!S&&(N>0||j.opacity>0)&&(V=performance.now(),B=requestAnimationFrame(U))},G=0,K=()=>{if(!S)return I();clearTimeout(G),G=window.setTimeout(I,150)},q=()=>{D.hidden=!p(),I()},J=new ResizeObserver(z);J.observe(D),addEventListener(`scroll`,K,{passive:!0}),addEventListener(`mb:design`,q),addEventListener(`mb:mode`,q),document.addEventListener(`visibilitychange`,W),z(),t=()=>{cancelAnimationFrame(B),cancelAnimationFrame(L),clearTimeout(G),J.disconnect(),A?.disconnect(),removeEventListener(`scroll`,K),removeEventListener(`mb:design`,q),removeEventListener(`mb:mode`,q),document.removeEventListener(`visibilitychange`,W),_.getExtension(`WEBGL_lose_context`)?.loseContext(),v.remove()}},h=()=>{(scrollY>innerHeight*.2||new URLSearchParams(location.search).has(`depth`))&&(removeEventListener(`scroll`,h),m())};addEventListener(`scroll`,h,{passive:!0}),h();let g=()=>{p()&&!f.current?.querySelector(`canvas`)&&h()};return addEventListener(`mb:mode`,g),()=>{e=!0,removeEventListener(`scroll`,h),removeEventListener(`mb:mode`,g),t()}},[]),a(`div`,{ref:f,class:`deep-sky`,"aria-hidden":`true`,style:`opacity:0`})}export{f as default,d as skyProgress};