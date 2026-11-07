import{a as e,t}from"./hooks.module.Drp3Zv3q.js";import{r as n}from"./themes.729cs9P-.js";import{a as r,t as i}from"./design.DkhjxlAz.js";import{n as a}from"./moon.BK6Bx_3M.js";import{t as o}from"./jsxRuntime.module.DAvpkkkg.js";import{t as s}from"./preload-helper.DHhhL8Zf.js";var c=`
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`,l=`
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec3 uBg;
uniform vec3 uA1;
uniform vec3 uA2;
uniform vec3 uA3;
uniform float uPhase;   // moon phase 0..1 (0 new, 0.5 full)
uniform vec3 uMoon;     // moon centre (uv) and radius (fraction of height)
uniform vec2 uFocus;    // constellation focus (uv)
uniform float uFocusAmt;
uniform vec4 uShoot;    // shooting star: start time, angle, start point (p-space)
uniform float uHour;    // visitor's local hour, 0..24
uniform float uEclipse; // eclipse start time

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// One layer of round stars: each cell holds at most one, jittered inside it,
// with a soft core (radius in canvas pixels), a faint halo and a twinkle.
vec3 stars(vec2 px, float cell, float density, float radius, float seed) {
  vec2 id = floor(px / cell);
  float h = hash(id + seed);
  if (h < 1.0 - density) return vec3(0.0);
  vec2 centre = (id + 0.2 + 0.6 * vec2(hash(id + seed + 1.7), hash(id + seed + 4.3))) * cell;
  float d = length(px - centre);
  float r = radius * mix(0.6, 1.4, hash(id + seed + 9.1));
  float core = exp(-(d * d) / (r * r));
  // the halo fades out before the cell edge (the centre is at least 0.2 cells in), so no seams
  float halo = exp(-d / (r * 2.5)) * 0.2 * smoothstep(0.2 * cell, 0.0, d);
  float twinkle = 0.65 + 0.35 * sin(uTime * (1.2 + 2.0 * hash(id + seed + 2.9)) + h * 60.0);
  vec3 tint = mix(vec3(1.0), mix(uA3, uA1, hash(id + seed + 6.1)), 0.35);
  return tint * (core + halo) * twinkle * mix(0.5, 1.0, hash(id + seed + 3.3));
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Constellation layer: stars that appear near the focus and link to their neighbours.
vec3 cStar(vec2 id, float cell) {
  vec2 c = (id + 0.2 + 0.6 * vec2(hash(id + 24.7), hash(id + 27.3))) * cell;
  return vec3(c, step(0.6, hash(id + 23.0)));
}
float cWeight(vec2 c, vec2 f) { return smoothstep(170.0, 50.0, length(c - f)); }
vec3 constellation(vec2 px, vec2 fpx, float amt) {
  if (amt < 0.01) return vec3(0.0);
  float cell = 34.0;
  vec2 id = floor(px / cell);
  float lines = 0.0, dots = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 a = id + vec2(float(i), float(j));
      vec3 sa = cStar(a, cell);
      float wa = cWeight(sa.xy, fpx) * sa.z;
      if (wa <= 0.0) continue;
      float d = length(px - sa.xy);
      dots += wa * exp(-d * d / 2.5);
      for (int k = 0; k < 3; k++) {
        vec2 o = k == 0 ? vec2(1.0, 0.0) : (k == 1 ? vec2(0.0, 1.0) : vec2(1.0, 1.0));
        vec3 sb = cStar(a + o, cell);
        float w = min(wa, cWeight(sb.xy, fpx) * sb.z);
        if (w <= 0.0) continue;
        lines += w * smoothstep(0.9, 0.0, segDist(px, sa.xy, sb.xy));
      }
    }
  }
  return (mix(uA3, uA1, 0.35) * lines * 0.9 + vec3(1.0) * dots * 1.6) * amt;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.05;
  vec2 m = (uMouse - 0.5) * 0.2;

  vec2 q = vec2(fbm(p * 1.3 + t + m), fbm(p * 1.3 - t + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p * 1.7 + 3.0 * q + vec2(1.7, 9.2) + 0.5 * t), fbm(p * 1.7 + 3.0 * q + vec2(8.3, 2.8) - 0.3 * t));
  float f = fbm(p * 1.1 + 2.4 * r);

  vec3 col = uBg;
  col = mix(col, uA1, smoothstep(0.35, 0.95, f) * 0.55);
  col = mix(col, uA2, smoothstep(0.45, 1.0, length(q)) * 0.35);
  col = mix(col, uA3, smoothstep(0.6, 1.0, r.x) * 0.22);

  float band = exp(-pow((uv.y - 0.78 - 0.07 * sin(p.x * 2.4 + t * 6.0)) * 4.5, 2.0));
  col += mix(uA1, uA3, uv.x) * band * 0.16;

  // time of day: warmer at dusk, lighter at dawn, a little deeper late at night
  float dusk = exp(-pow((uHour - 18.5) / 1.6, 2.0));
  float dawn = exp(-pow((uHour - 6.5) / 1.6, 2.0));
  float night = clamp(smoothstep(21.0, 23.5, uHour) + 1.0 - smoothstep(3.0, 5.0, uHour), 0.0, 1.0);
  col += uA2 * (band * 0.12 + uv.y * 0.035) * dusk;
  col += uA3 * 0.05 * dawn * uv.y;
  col *= 1.0 - 0.1 * night;

  // eclipse envelope (the easter egg): the sky dims while it lasts
  float et = uTime - uEclipse;
  float ecl = smoothstep(0.0, 0.7, et) * smoothstep(3.4, 2.5, et);
  col *= 1.0 - 0.5 * ecl;

  // perspective grid on the horizon
  float horizon = 0.34;
  if (uv.y < horizon) {
    float depth = (horizon - uv.y) / horizon;
    vec2 g = vec2(p.x / (1.0 - depth * 0.86 + 0.04), 1.0 / (depth + 0.04) + uTime * 0.4);
    vec2 cell = abs(fract(g * vec2(8.0, 1.0)) - 0.5);
    float line = smoothstep(0.035, 0.0, min(cell.x, cell.y * 0.35));
    col += uA1 * line * depth * 0.28;
  }

  // stars: a dense layer of faint pin-pricks and a sparse layer of bright ones, sized
  // relative to the canvas height so they look the same at any resolution
  float unit = uRes.y / 500.0;
  vec2 px = gl_FragCoord.xy / unit;
  vec3 sky = stars(px, 9.0, 0.1, 0.6, 0.0) * 0.8 + stars(px + 37.0, 26.0, 0.14, 1.0, 11.0) * 1.6;
  vec2 fpx = uFocus * uRes / unit;
  float near = exp(-pow(length(px - fpx) / 160.0, 2.0)) * uFocusAmt;
  col += sky * (smoothstep(0.35, 1.0, uv.y) + near) * (1.0 + 1.4 * near + 0.8 * ecl);
#ifndef LITE
  col += constellation(px, fpx, uFocusAmt);
#endif

  // the moon: a lit sphere with the real phase, its orbit ring and a comet, like the logo
  // (radius 0 = switched off in the dashboard's Design settings)
  if (uMoon.z > 0.0) {
  vec2 mc = (uMoon.xy * uRes - 0.5 * uRes) / uRes.y + vec2(sin(uTime * 0.07), cos(uTime * 0.05)) * 0.004;
  float mr = uMoon.z;
  vec2 md = (p - mc) / mr;
  float ml = length(md);
  float aa = 1.5 / (mr * uRes.y);
  float disc = smoothstep(1.0, 1.0 - aa, ml);
  float illum = 0.5 - 0.5 * cos(uPhase * 6.2831853);
  float outside = max(ml - 1.0, 0.0);
  col += mix(uA1, vec3(1.0), 0.5) * exp(-outside * 2.6) * 0.12 * (0.35 + illum) * (1.0 - ecl) * (1.0 - disc);
  if (ml < 1.0 + aa) {
    float z = sqrt(max(0.0, 1.0 - dot(md, md)));
    vec3 n = vec3(md, z);
    float ang = uPhase * 6.2831853;
    vec3 L = normalize(vec3(sin(ang), 0.12, -cos(ang)));
    float lam = smoothstep(-0.05, 0.14, dot(n, L));
#ifdef LITE
    float maria = noise(md * 2.4 + 7.0);
#else
    float maria = fbm(md * 2.4 + 7.0);
#endif
    vec3 surf = mix(vec3(0.97, 0.95, 1.0), mix(uA1, vec3(0.75), 0.55), smoothstep(0.42, 0.72, maria) * 0.6);
    surf *= 0.8 + 0.2 * z;
    vec3 earthshine = mix(col, uA1 * 0.35 + vec3(0.06), 0.55);
    vec3 mcol = surf * lam * (1.0 - ecl) + earthshine * (1.0 - lam * (1.0 - ecl));
    col = mix(col, mcol, disc);
  }
  // eclipse corona
  col += mix(uA3, vec3(1.0), 0.45) * (exp(-outside * 9.0) * 1.1 + exp(-outside * 2.5) * 0.25) * ecl * (1.0 - disc);

  // orbit ring, tilted like the logo; its far side passes behind the moon
  float c24 = 0.9135, s24 = 0.4067;
  vec2 v = p - mc;
  vec2 oq = vec2(c24 * v.x + s24 * v.y, -s24 * v.x + c24 * v.y);
  vec2 oR = vec2(2.15, 0.56) * mr;
  float og = length(oq / oR);
  vec2 grad = (oq / (oR * oR)) / max(og, 1e-4);
  float ed = abs(og - 1.0) / max(length(grad), 1e-4);
  float ring = smoothstep(1.8 / uRes.y, 0.0, ed) * (oq.y < 0.0 ? 1.0 : 1.0 - disc);
  col += mix(uA1, uA3, 0.5 + 0.5 * oq.x / oR.x) * ring * 0.55;
  float th = uTime * 0.22;
  vec2 cl = vec2(oR.x * cos(th), oR.y * sin(th));
  vec2 comet = mc + vec2(c24 * cl.x - s24 * cl.y, s24 * cl.x + c24 * cl.y);
  float cd = length(p - comet) * uRes.y;
  float behind = sin(th) > 0.0 ? 1.0 - disc : 1.0;
  col += mix(uA3, vec3(1.0), 0.5) * (exp(-cd * cd / 9.0) + exp(-cd / 6.0) * 0.25) * behind;

  }

  // shooting star
  float st = uTime - uShoot.x;
  if (st > 0.0 && st < 0.9) {
    vec2 dir = vec2(cos(uShoot.y), sin(uShoot.y));
    vec2 head = uShoot.zw + dir * st * 1.1;
    float len = 0.24 * min(1.0, st * 5.0);
    vec2 tail = head - dir * len;
    float along = clamp(dot(p - tail, dir) / max(len, 1e-3), 0.0, 1.0);
    float fade = sin(3.14159 * st / 0.9);
    col += mix(uA3, vec3(1.0), 0.6) * smoothstep(2.2 / uRes.y, 0.0, segDist(p, tail, head)) * along * along * fade * 1.5;
    col += vec3(1.0) * exp(-length(p - head) * uRes.y * 0.3) * fade * 0.9;
  }

  float glow = exp(-length(uv - uMouse) * 4.0);
  col += uA2 * glow * 0.07;
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.015;
  gl_FragColor = vec4(col, 1.0);
}
`,ee=.55,u=1e3/31;function d(e){let t=document.createElement(`div`);t.className=`mb-toast`,t.setAttribute(`role`,`status`),t.textContent=e,document.body.appendChild(t),window.setTimeout(()=>t.remove(),5e3)}function f({variant:f=`home`,dim:p=!1}){let m=t(null),h=f===`home`;return e(()=>{let e=!1,t=0,o=()=>{},f=async()=>{if(await new Promise(e=>`requestIdleCallback`in window?requestIdleCallback(()=>e(),{timeout:2e3}):setTimeout(e,900)),e||!m.current||document.documentElement.dataset.mode!==`cinematic`||!h&&!i(`allPages`))return;let{Renderer:f,Program:p,Mesh:g,Triangle:_}=await s(async()=>{let{Renderer:e,Program:t,Mesh:n,Triangle:r}=await import(`./src.DxqySC6n.js`);return{Renderer:e,Program:t,Mesh:n,Triangle:r}},[]);if(e||!m.current)return;let v;try{v=new f({dpr:Math.min(devicePixelRatio,1.5)*ee,alpha:!1,antialias:!1,powerPreference:`low-power`})}catch{return}let y=v.gl,b=y.canvas;b.setAttribute(`aria-hidden`,`true`),m.current.appendChild(b);let x=y.getExtension(`WEBGL_debug_renderer_info`),te=String(x?y.getParameter(x.UNMASKED_RENDERER_WEBGL):y.getParameter(y.RENDERER)),S=/swiftshader|llvmpipe|softpipe|software|basic render/i.test(te),C=S||matchMedia(`(prefers-reduced-motion: reduce)`).matches;S&&(v.dpr=Math.min(devicePixelRatio,1)*.35);let w=r.cinematic.palette,T=new URLSearchParams(location.search),E=new Date,D=T.has(`phase`)?Number(T.get(`phase`))%1:a(E).phase,O=new p(y,{vertex:c,fragment:(S?`#define LITE
`:``)+l,uniforms:{uTime:{value:18},uRes:{value:[1,1]},uMouse:{value:[.5,.7]},uBg:{value:n(w.bg)},uA1:{value:n(w.accent)},uA2:{value:n(w.accent2)},uA3:{value:n(w.accent3)},uPhase:{value:D},uMoon:{value:[.84,.8,.08]},uFocus:{value:[.5,.3]},uFocusAmt:{value:0},uShoot:{value:[-100,-.4,0,.4]},uHour:{value:E.getHours()+E.getMinutes()/60},uEclipse:{value:-100}}}),k=new g(y,{geometry:new _(y),program:O}),A=0,j=()=>{A||=requestAnimationFrame(()=>{A=0,v.render({scene:k}),m.current?.classList.add(`ready`)})},M=()=>{let e=m.current;if(!e)return;v.setSize(e.clientWidth,e.clientHeight),O.uniforms.uRes.value=[y.canvas.width,y.canvas.height];let t=e.clientWidth,n=h?t>=1e3?[.84,.74,.052]:t>=640?[.86,.8,.045]:[.84,.86,.038]:t>=1e3?[.86,.66,.085]:t>=640?[.88,.7,.075]:[.86,.76,.06];i(`moon`)||(n[2]=0),O.uniforms.uMoon.value=n,j()};M();let N=new ResizeObserver(M);N.observe(m.current);let P=performance.now(),F=18,I=()=>v.render({scene:k}),L=(e,t)=>{let n=m.current.getBoundingClientRect();return[(e-n.left)/n.width,1-(t-n.top)/n.height]},R={amt:0,target:0},z=e=>{let t=i(`constellations`)?e.detail:null;R.target=+!!t,t&&(O.uniforms.uFocus.value=L(t.x,t.y)),C?(R.amt=R.target,O.uniforms.uFocusAmt.value=R.amt,I()):Q()};h&&window.addEventListener(`mb:focus`,z);let B=()=>M();window.addEventListener(`mb:design`,B);let V=0,H=(e=F)=>{let t=y.canvas.width/y.canvas.height;O.uniforms.uShoot.value=[e,-.3-Math.random()*.35,-t*(.15+Math.random()*.3),.3+Math.random()*.15]},U=()=>{V=window.setTimeout(()=>{!C&&J&&!document.hidden&&i(`shootingStars`)&&H(F+.05),U()},2e4+Math.random()*2e4)};T.has(`shoot`)?H(F-.4):U();let W=[],ne=(e=F)=>{O.uniforms.uEclipse.value=e,C?I():Q(),window.setTimeout(()=>d(`You found the eclipse. Booking is still open.`),C?300:3200)},G=e=>{if(!i(`eclipse`)||e.target.closest(`a, button, input, select, textarea, label, [role="combobox"]`))return;let[t,n]=L(e.clientX,e.clientY),[r,a,o]=O.uniforms.uMoon.value,s=y.canvas.width,c=y.canvas.height;if(Math.hypot((t-r)*s/c,n-a)>o*1.4)return;let l=performance.now();W=[...W.filter(e=>l-e<2e3),l],W.length>=3&&(W=[],ne())};h&&window.addEventListener(`pointerdown`,G),T.has(`eclipse`)&&(O.uniforms.uEclipse.value=F-1.6);let K={x:.5,y:.7,tx:.5,ty:.7},q=e=>{let t=m.current?.getBoundingClientRect();t&&(K.tx=(e.clientX-t.left)/t.width,K.ty=1-(e.clientY-t.top)/t.height)};window.addEventListener(`pointermove`,q,{passive:!0});let J=!0,Y=new IntersectionObserver(([e])=>{J=!!e?.isIntersecting,J&&Q()});Y.observe(m.current);let X=0,Z=e=>{if(t=0,document.hidden||!J||document.documentElement.dataset.mode!==`cinematic`)return;if(e-P<u){t=requestAnimationFrame(Z);return}let n=e-P;P=e,X=n>70?X+1:Math.max(0,X-1),X>24&&(C=!0),F+=Math.min(.05,n/1e3),R.amt+=(R.target-R.amt)*.08,O.uniforms.uFocusAmt.value=R.amt,K.x+=(K.tx-K.x)*.05,K.y+=(K.ty-K.y)*.05,O.uniforms.uTime.value=F,O.uniforms.uMouse.value=[K.x,K.y],v.render({scene:k}),C||(t=requestAnimationFrame(Z))},Q=()=>{!t&&!C&&(P=performance.now(),t=requestAnimationFrame(Z))},$=()=>{document.documentElement.dataset.mode===`cinematic`&&(M(),Q())};window.addEventListener(`mb:mode`,$),document.addEventListener(`visibilitychange`,Q),Q(),o=()=>{cancelAnimationFrame(t),cancelAnimationFrame(A),N.disconnect(),Y.disconnect(),window.removeEventListener(`pointermove`,q),window.removeEventListener(`mb:focus`,z),window.removeEventListener(`mb:design`,B),window.removeEventListener(`pointerdown`,G),clearTimeout(V),window.removeEventListener(`mb:mode`,$),document.removeEventListener(`visibilitychange`,Q),y.getExtension(`WEBGL_lose_context`)?.loseContext(),b.remove()}},p=e=>{e.detail===`cinematic`&&!m.current?.querySelector(`canvas`)&&f()};return window.addEventListener(`mb:mode`,p),f(),()=>{e=!0,window.removeEventListener(`mb:mode`,p),o()}},[h]),o(`div`,{ref:m,class:`hero-bg${h?``:` page-sky`}${p?` dim`:``}`,"aria-hidden":`true`})}export{f as default};