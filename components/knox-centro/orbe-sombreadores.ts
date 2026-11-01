// Los sombreadores del orbe (orbe-escena.ts): los del orbe que eligió Ale el 1/11 (Bralto-redes/knox-centro/orbe/
// capas.html), solo con sus capas: 1 aura, 3 cuerpo, 4 rayos de plasma en partículas, 5 núcleo, 6 espectro, 8 malla de
// puntos y Phosphor 30 (10 brillo naranja, 11 humo blanco y 13 fuego rojo). Los números son los de esa página: cambiar
// uno cambia lo que él aprobó.

// Ruido simplex 3D (Ashima Arts y Stefan Gustavson, licencia MIT)
const RUIDO = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`

// Un cuadrado en la escena (la esfera)
export const PLANO = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

// Un cuadrado que llena todo el dibujo (Phosphor 30 y las copias)
export const PANTALLA = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`

// La esfera: el cuerpo (3), una neblina naranja muy suave, y el núcleo (5), la luz del centro que late con la voz. Se
// recorre por dentro en 14 pasos. Escribe profundidad: las partículas que pasan por detrás se esconden
export const ESFERA = `
  uniform float uNivel;
  uniform vec3 uColor, uLuz;
  varying vec2 vUv;
  void main(){
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    if (r > 1.0) discard;
    float h = sqrt(1.0 - r * r);
    float nucleo = 0.0;
    for (int i = 0; i < 14; i++) {
      vec3 p = vec3(q, mix(h, -h, (float(i) + 0.5) / 14.0));
      nucleo += exp(-dot(p, p) * 16.0);
    }
    nucleo *= 2.0 * h / 14.0 * (0.7 + 0.9 * uNivel);
    vec3 col = uColor * 0.05 * h + uLuz * nucleo;
    gl_FragColor = vec4(col * (1.0 - smoothstep(0.97, 1.0, r)), 1.0);
  }`

// Capa 1, el aura: partículas que giran como una galaxia, más rápido cerca de la esfera, y se abren con la voz
export const AURA = `
  uniform float uTiempo, uNivel, uPix, uTam, uGiro;
  attribute float aAzar;
  attribute float aRadio;
  varying float vAlfa, vCanto;
  ${RUIDO}
  void main(){
    vec3 p = normalize(position);
    float t = uTiempo;
    float ang = uGiro * (1.3 - aRadio);
    float c = cos(ang), s = sin(ang);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    float rad = 1.1 + aRadio * (0.5 + 0.35 * uNivel);
    vec3 mueve = 0.08 * vec3(snoise(p * 2.0 + t * 0.2), snoise(p * 2.0 + 5.0 + t * 0.2), snoise(p * 2.0 + 9.0 + t * 0.2));
    vec4 mv = modelViewMatrix * vec4(p * rad + mueve * (1.0 + uNivel), 1.0);
    vCanto = 1.0 - aRadio;
    vAlfa = (1.0 - aRadio) * (0.35 + 0.65 * fract(aAzar * 3.1)) * (0.55 + 0.8 * uNivel);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uTam * uPix * (0.4 + fract(aAzar * 5.3)) * (3.2 / -mv.z);
  }`

// Capa 6, el espectro: como el aura, pero cada dirección se estira distinto (picos, rayos cortos y huecos que cambian
// solos) y la voz hace crecer los picos por franjas alrededor, como un ecualizador. Gira al revés que el aura
export const ESPECTRO = `
  uniform float uTiempo, uNivel, uPix, uTam, uGiro;
  uniform float uBandas[12];
  attribute float aAzar;
  attribute float aLargo;
  varying float vAlfa, vCanto;
  ${RUIDO}
  void main(){
    vec3 d = normalize(position);
    float t = uTiempo;
    float ang = -uGiro;
    float c = cos(ang), s = sin(ang);
    d = vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z);
    float lon = atan(d.z, d.x) / 6.28318 + 0.5;
    float voz = 0.0;
    for (int k = 0; k < 12; k++) {
      float e = abs(lon - (float(k) + 0.5) / 12.0);
      e = min(e, 1.0 - e) * 12.0;
      voz += uBandas[k] * exp(-e * e * 0.8);
    }
    float forma = snoise(d * 1.6 + vec3(0.0, t * 0.12, 0.0)) * 0.5 + 0.5;
    float picos = pow(snoise(d * 4.5 + vec3(t * 0.08)) * 0.5 + 0.5, 2.5);
    float largo = min(0.06 + 0.5 * forma * forma + 0.8 * picos + 0.45 * voz, 0.9);
    float r = 1.1 + aLargo * largo;
    vec3 temblor = 0.015 * vec3(snoise(d * 9.0 + aAzar * 40.0 + t * 0.3), snoise(d * 9.0 + 3.0 + aAzar * 40.0 + t * 0.3), snoise(d * 9.0 + 7.0 + aAzar * 40.0 + t * 0.3));
    vec4 mv = modelViewMatrix * vec4(d * r + temblor * (0.5 + aLargo), 1.0);
    float densidad = smoothstep(0.25, 0.6, snoise(d * 2.6 + vec3(11.0, 0.0, t * 0.05)) * 0.5 + 0.5 + 0.25 * (aAzar - 0.5));
    vCanto = 1.0 - aLargo;
    vAlfa = 1.3 * densidad * (1.0 - 0.7 * aLargo) * (0.45 + 0.55 * fract(aAzar * 3.7)) * (0.6 + 0.8 * uNivel);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uTam * uPix * (0.4 + fract(aAzar * 5.3)) * (3.2 / -mv.z);
  }`

// Capa 4, los rayos de plasma en partículas: cada partícula parte de un lugar dentro de la esfera y da dos pasos hacia
// la superficie donde el ruido vale cero; vistas de canto, esas superficies forman los filamentos. El ruido avanza con
// uFase (que se suma de a poco), así que las partículas se deslizan sin brincos
export const RAYOS = `
  uniform float uNivel, uPix, uTam, uFase;
  uniform vec3 uColor, uLuz;
  attribute float aAzar;
  varying float vAlfa;
  varying vec3 vColor;
  ${RUIDO}
  float campo(vec3 q, float t){ return snoise(q * 1.6 + vec3(0.0, t * 0.45, t * 0.2)); }
  vec3 gradiente(vec3 q, float t, float n){
    float e = 0.02;
    return vec3(campo(q + vec3(e, 0.0, 0.0), t) - n, campo(q + vec3(0.0, e, 0.0), t) - n, campo(q + vec3(0.0, 0.0, e), t) - n) / e;
  }
  void main(){
    vec3 b = position;
    float t = uFase;
    float ang = t * 0.55 + length(b) * 2.4;
    float c = cos(ang), s = sin(ang);
    vec3 q = vec3(c * b.x + s * b.z, b.y, -s * b.x + c * b.z);
    float n = campo(q, t);
    vec3 g = gradiente(q, t, n);
    vec3 paso = -n * g / max(dot(g, g), 0.001);
    float largo = length(paso);
    if (largo > 0.25) paso *= 0.25 / largo;
    q += paso;
    float n2 = campo(q, t);
    vec3 g2 = gradiente(q, t, n2);
    vec3 paso2 = -n2 * g2 / max(dot(g2, g2), 0.001);
    if (length(paso2) > 0.08) paso2 *= 0.08 / length(paso2);
    q += paso2 + normalize(g2) * (aAzar - 0.5) * 0.012;
    vec3 p = vec3(c * q.x - s * q.z, q.y, s * q.x + c * q.z);
    float r = length(p);
    float cerca = 1.0 - smoothstep(0.0, 0.25, largo);
    float borde = (1.0 - smoothstep(0.55, 1.0, r)) * step(r, 0.98);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 nrm = normalize(normalMatrix * vec3(c * g2.x - s * g2.z, g2.y, s * g2.x + c * g2.z));
    float canto = pow(1.0 - abs(dot(nrm, normalize(-mv.xyz))), 2.5);
    vColor = mix(uColor, uLuz, step(0.9, fract(aAzar * 13.7)) * 0.7);
    vAlfa = 1.3 * cerca * borde * (0.15 + 0.85 * canto) * (0.5 + 0.5 * fract(aAzar * 5.1)) * (0.7 + 0.9 * uNivel);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uTam * uPix * (0.6 + 0.6 * fract(aAzar * 9.7)) * (3.2 / -mv.z);
  }`

// Capa 8, la malla de puntos: puntitos en filas y columnas sobre una esfera que ondula como si respirara. Brilla en
// las orillas y va de rojo naranja abajo a ámbar arriba; con la voz las ondas crecen por franjas y algunos puntos se
// sueltan de la orilla
export const MALLA = `
  uniform float uNivel, uPix, uTam, uOla;
  uniform float uBandas[12];
  uniform vec3 uAbajo, uArriba, uLuz;
  attribute float aAzar;
  varying float vAlfa;
  varying vec3 vColor;
  ${RUIDO}
  void main(){
    vec3 p = normalize(position);
    float lat = acos(clamp(p.y, -1.0, 1.0)) / 3.14159;
    float voz = 0.0;
    for (int k = 0; k < 12; k++) {
      float d = (lat - (float(k) + 0.5) / 12.0) * 12.0;
      voz += uBandas[k] * exp(-d * d * 0.9);
    }
    float n = snoise(p * 1.8 + vec3(0.0, uOla * 0.6, uOla * 0.3));
    float n2 = snoise(p * 4.0 - vec3(uOla * 0.4));
    float r = 0.98 + 0.08 * n + 0.03 * n2 + 0.1 * voz * (0.5 + 0.5 * sin(lat * 30.0 - uOla * 4.0));
    float suelto = step(0.93, aAzar);
    r += suelto * aAzar * 0.25 * (0.4 + uNivel);
    vec4 mv = modelViewMatrix * vec4(p * r, 1.0);
    vec3 nrm = normalize(normalMatrix * p);
    float canto = pow(1.0 - abs(dot(nrm, normalize(-mv.xyz))), 2.0);
    vColor = mix(uAbajo, uArriba, p.y * 0.5 + 0.5) + uLuz * canto * 0.35;
    vAlfa = (0.35 + 0.65 * canto) * (0.6 + 0.4 * fract(aAzar * 7.0)) * (0.8 + 0.5 * uNivel);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uTam * uPix * (0.85 + 0.3 * fract(aAzar * 3.3)) * (3.2 / -mv.z);
  }`

// Un punto redondo y suave del color de la capa (aura y espectro: más claro el que está más cerca de la esfera)
export const PUNTO = `
  uniform vec3 uColor, uLuz;
  varying float vAlfa, vCanto;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(uColor, uLuz, smoothstep(0.45, 1.0, vCanto)), a * vAlfa);
  }`

// Un punto redondo y suave con su propio color (rayos y malla)
export const PUNTO_COLOR = `
  varying float vAlfa;
  varying vec3 vColor;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vAlfa);
  }`

// Capas 10, 11 y 13: Phosphor 30 de XorDev (el código de 21st.dev/@xordev/components/phosphor-30), separado por color:
// brillo naranja (uFuego), humo blanco (uBlanco) y fuego rojo (uRojo); la neblina azul del original (12) no va. Tres
// cambios contra el original, pedidos por Ale: la cámara no depende del reloj (en 21st el anillo se achicaba con los
// minutos) sino de uCampo; gira muy despacio hacia la derecha (uGiro alrededor de uEje) mientras ese eje da vueltas
// como las agujas del reloj; y el eje de los remolinos avanza con uTiempoEje, tan lento que no se nota (el original
// cambiaba de dirección cada 6 s). Además el fuego rojo completa el aro (en el original ardía de un solo lado)
export const PHOSPHOR = `
  uniform float uTiempo, uFuego, uBlanco, uRojo, uCampo, uGiro, uTiempoEje;
  uniform vec3 uEje;
  uniform vec2 uResolucion;
  vec4 tanh4(vec4 x){ vec4 e = exp(2.0 * clamp(x, -10.0, 10.0)); return (e - 1.0) / (e + 1.0); }
  vec3 girar(vec3 v, vec3 eje, float ang){
    float c = cos(ang), s = sin(ang);
    return v * c + cross(eje, v) * s + eje * dot(eje, v) * (1.0 - c);
  }
  void main(){
    vec2 r = uResolucion;
    float t = uTiempo;
    vec3 dir = normalize(vec3(gl_FragCoord.xy * 2.0 - r, -uCampo * r.y));
    vec4 o = vec4(0.0);
    float z = 0.0;
    float d = 0.0;
    float s = 0.0;
    for (int i = 0; i < 80; i++) {
      vec3 p = z * dir;
      vec3 a = normalize(cos(vec3(5.0, 0.0, 1.0) + uTiempoEje - d * 4.0));
      p.z += 5.0;
      p = girar(p, uEje, -uGiro);
      a = a * dot(a, p) - cross(a, p);
      for (int k = 2; k <= 9; k++) {
        float kf = float(k);
        a -= sin(a * kf + t).zxy / kf;
      }
      s = a.y;
      d = 0.1 * abs(length(p) - 3.0) + 0.07 * abs(cos(s));
      z += d;
      // Las partes del color suman 1: brillo naranja, neblina azul y, en medio, el humo blanco y el fuego rojo
      float c = cos(s);
      float fuego = smoothstep(0.0, 0.6, c);
      float azul = smoothstep(0.0, 0.6, -c);
      float medio = 1.0 - fuego - azul;
      float rojo = medio * smoothstep(-0.3, 0.3, sin(s));
      float parte = uFuego * fuego + uBlanco * (medio - rojo) + uRojo * rojo;
      o += (cos(s + vec4(0.0, 1.0, 8.0, 0.0)) + 1.0) / d * parte;
      // Del lado donde el original no tiene fuego rojo, las llamas pegadas al anillo también se pintan de rojo (más
      // tenue): así se lee un aro completo
      float cascaron = (length(p) - 3.0) / 0.35;
      o += vec4(1.0, 0.16, 0.01, 0.0) * (uRojo * 0.6 * exp(-cascaron * cascaron) * (medio - rojo)) / d;
    }
    o = tanh4(o / 5e3);
    gl_FragColor = vec4(o.rgb, 1.0);
  }`

// Una imagen ya dibujada (Phosphor 30, que se dibuja más chico para que no pese), puesta tal cual
export const IMAGEN = `
  uniform sampler2D uImagen;
  varying vec2 vUv;
  void main(){ gl_FragColor = vec4(texture2D(uImagen, vUv).rgb, 1.0); }`

// El orbe se dibuja sobre negro, como en la página donde Ale lo eligió; al pasarlo al panel, lo negro queda
// transparente y la luz se suma a lo que hay detrás (alfa = el canal más brillante, con el color premultiplicado)
export const LUZ = `
  uniform sampler2D uImagen;
  varying vec2 vUv;
  void main(){
    vec3 c = texture2D(uImagen, vUv).rgb;
    gl_FragColor = vec4(c, max(max(c.r, c.g), c.b));
  }`
