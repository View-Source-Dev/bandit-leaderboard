
#define PI 3.14159265359
#define TWO_PI 6.28318530718

#ifdef GL_ES
precision highp float;
#endif

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_foreground_color;
uniform vec3 u_background_color;

float random(in vec2 _st) {
  return fract(sin(dot(_st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float random(in float x) {
  return fract(sin(x) * 1e4);
}
mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}
vec2 rotate(vec2 uv, float angle) {
  return ((uv - vec2(0.5)) * rotate2d(angle)) + vec2(0.5);
}
float d(vec2 p0, vec2 pf) {
  return sqrt((pf.x - p0.x) * (pf.x - p0.x) + (pf.y - p0.y) * (pf.y - p0.y));
}
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}
vec2 hash2(float n) {
  return fract(sin(vec2(n, n + 1.0)) * vec2(13.5453123, 31.1459123));
}

float waveValue(float feedVal, float time, float frequency, float amplitude) {
  float waveOffset = sin(feedVal * frequency) + sin(feedVal * frequency * 2.1 + time) * 4.5;
  waveOffset += sin(feedVal * frequency * 1.872 + time * 1.121) * 4.0;
  waveOffset += sin(feedVal * frequency * 2.221 + time * -0.011) * 5.0;
  waveOffset += sin(feedVal * frequency * 3.1122 + time * 4.269) * 2.5;
  waveOffset *= amplitude;
  return waveOffset;
}

float getTexture(vec2 uv, float time) {
  float specs = random(uv * (sin(time * 0.03) * 0.760 + 1.952)) * 0.55;
  float specYOffset = waveValue(uv.x, u_time, 100.127, 2.513);
  return specs;
}

const float scale = 512.0;
float noise(in vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float a = texture2D(uSampler, (p + vec2(0.5, 0.5)) / scale).x;
  float b = texture2D(uSampler, (p + vec2(1.5, 0.5)) / scale).x;
  float c = texture2D(uSampler, (p + vec2(0.5, 1.5)) / scale).x;
  float d = texture2D(uSampler, (p + vec2(1.5, 1.5)) / scale).x;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

const mat2 mtx = mat2(0.20, 0.20, -0.20, 0.20);
float fbm(vec2 p) {
  float f = 0.0;
  f += 0.500000 * noise(p);
  p = mtx * p * 2.02;
  f += 0.250000 * noise(p);
  p = mtx * p * 2.03;
  f += 0.125000 * noise(p);
  p = mtx * p * 2.01;
  f += 0.062500 * noise(p);
  p = mtx * p * 2.04;
  f += 0.031250 * noise(p);
  p = mtx * p * 2.01;
  f += 0.015625 * noise(p);
  return f / 0.96875;
}

float pattern(in vec2 p, in float t, in vec2 uv, out vec2 q, out vec2 r, out vec2 g) {
  q = vec2(fbm(p), fbm(p + vec2(10, 1.3)));
  r = vec2(fbm(p + 4.0 * q + vec2(t) + vec2(1.7, 9.2)), fbm(p + 4.0 * q + vec2(t) + vec2(8.3, 2.8)));
  g = vec2(fbm(p + 2.0 * r + vec2(t * 20.0) + vec2(2, 6)), fbm(p + 2.0 * r + vec2(t * 10.0) + vec2(5, 3)));
  return fbm(p + 5.5 * g + vec2(-t * 7.0));
}

// --------------- LAVA ---------------

// Simplex Noise from Patricio Gonzalez Vivo:
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83#simplex-noise
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Interpolate between Simplex Noise frames
float CONTRAST = 2.7;
float FLOOR = -.0;
float lava(vec2 st, float time) {
  st = st * 0.516 - vec2(time * 0.005, time * .005);
  st.x += time * 0.05;
  vec2 pos = vec2(st * 1.5);
  float DF = 0.0;
  float a = 0.0;
  vec2 vel = vec2(time * .1);
  DF += snoise(pos + vel) * .25 + .25;
  a = snoise(pos * vec2(cos(time * 0.005), sin(time * 0.005)) * 0.1) * 3.1415;
  vel = vec2(cos(a), sin(a));
  DF += snoise(pos + vel) * 0.25 + .25;
  float value = smoothstep(-0.492, 1.446, fract(DF));
  float inverted = 0.456 - (cos(value * CONTRAST) + FLOOR);
  return inverted;
}

vec3 orange = vec3(209.0 / 255.0, 82.0 / 255.0, 6.0 / 255.0);
vec3 purple = vec3(160.0 / 255.0, 60.0 / 255.0, 142.0 / 255.0);

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  uv += vec2(0.35, -0.35);

  uv -= vec2(0.5);
  uv *= 0.35;
  uv += vec2(0.5);

  // apply rotation
  uv = rotate(uv, sin(-u_time * 0.05) * 0.5);

  // apply swirl 1
  float yOffset1 = waveValue(uv.y + 100., -u_time * 0.1, 1.127, .01);
  vec2 point1 = vec2(-0.0, -0.1 + yOffset1);
  uv -= point1;
  float point1Distance = d(uv, vec2(0.5));
  float maxRadius1 = 0.51;
  float inverted1 = maxRadius1 - min(maxRadius1, point1Distance);
  uv = rotate(uv, pow(inverted1, 5.) * 130. + u_time * 0.05);
  uv += point1;

  // apply swirl 2
  float yOffset2 = waveValue(uv.y, u_time * 0.1, 1.127, .01);
  vec2 point2 = vec2(0.25, -0.1 + yOffset2);
  uv -= point2;
  float point2Distance = d(uv, vec2(0.5));
  float maxRadius2 = 0.51;
  float inverted2 = maxRadius2 - min(maxRadius2, point2Distance);
  uv = rotate(uv, pow(inverted2, 5.) * 130. - u_time * 0.05);
  uv += point2;

  // add noise
  vec2 q, r, g;
  float noise = pattern(uv * u_resolution.xy * vec2(.004), u_time * -0.015, uv, q, r, g);
  noise = noise * noise * noise * 2.5;
  float noiseFrameRate = 20.;
  float specs = getTexture(uv, floor(0. * noiseFrameRate) / noiseFrameRate);
  specs = (specs * 2.5 - .75);
  specs *= 0.5;

  // apply color 
  float value = (noise * 1.1) + specs;
  vec3 color = mix(u_background_color, u_foreground_color, smoothstep(0.0, 1.0, value));

  gl_FragColor = vec4(color, 1.0);
}