// O fio, por dentro: cena 3D (Three.js) conduzida pela rolagem (GSAP ScrollTrigger).
// Duas cenas: a cabeça inteira (capítulo 1) e o close do couro cabeludo em corte (capítulos 2 a 9).
// Tudo é geometria procedural, sem modelos para baixar. Sombras em tempo real; no desktop, desfoque de lente.
// Os fios da cabeça usam sombreamento de cabelo (Kajiya-Kay): o brilho corre ao longo do fio conforme a câmera se move.
// Sem WebGL, sem GSAP ou com movimento reduzido, a seção continua como texto corrido (ver fio3d.css).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const secao = document.querySelector('[data-fio3d]');
const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
const temGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
if (secao && !reduz && temGL && window.gsap && window.ScrollTrigger) iniciar();

function iniciar() {
  const COR = {
    tinta: 0x0f1c2e, pele: 0xd8a183, derme: 0xc9806f, hipo: 0xe9d29b, fio: 0x24180f, bainha: 0xf0d9c6,
    bulbo: 0xe8b49b, papila: 0xb3404a, glandula: 0xefd07a, musculo: 0xa24a4c, latao: 0xc2a04a, metal: 0xcfd2d8,
  };
  const leve = innerWidth < 900 || navigator.hardwareConcurrency <= 4;   // celular/máquina modesta: sem pós-processamento
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const suave = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const cima = v(0, 1, 0);

  // ---------- renderizador ----------
  const canvas = secao.querySelector('[data-fio3d-canvas]');
  const palco = secao.querySelector('[data-fio3d-palco]');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, leve ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Uma câmera por cena: na passagem da cabeça para o close, as duas se movem ao mesmo tempo e as imagens se fundem.
  const camCab = new THREE.PerspectiveCamera(35, 1, 0.005, 40);
  const camPele = new THREE.PerspectiveCamera(35, 1, 0.05, 120);
  const ambiente = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  // fundo: vinheta escura no tom da marca (em vez de cor chapada)
  const fundo = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), gr = g.createRadialGradient(256, 230, 20, 256, 256, 360);
    gr.addColorStop(0, '#22344d'); gr.addColorStop(0.55, '#132238'); gr.addColorStop(1, '#0a1320');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  // texturas pintadas em canvas
  function textura(tam, pintar, rep = [1, 1], cor = true) {
    const c = document.createElement('canvas'); c.width = c.height = tam;
    pintar(c.getContext('2d'), tam);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
    if (cor) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4; return t;
  }
  const ruido = (g, n, a, b, cor) => { for (let i = 0; i < n; i++) { g.fillStyle = cor(); g.globalAlpha = rnd(a, b); g.beginPath(); g.arc(Math.random() * g.canvas.width, Math.random() * g.canvas.height, rnd(1, 4), 0, 7); g.fill(); } g.globalAlpha = 1; };
  const poros = (rep) => textura(256, (g, s) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
    ruido(g, 2500, 0.05, 0.25, () => (Math.random() < 0.5 ? '#000' : '#fff'));
    g.fillStyle = '#000'; for (let i = 0; i < 70; i++) { g.globalAlpha = 0.6; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, rnd(1.2, 2.6), 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }, rep, false);

  // ---------- capítulo 1: a cabeça (1 unidade ≈ 9 cm), em luz baixa de estúdio ----------
  const cabeca = (() => {
    const cena = new THREE.Scene();
    cena.background = fundo; cena.environment = ambiente; cena.environmentIntensity = 0.25;
    cena.fog = new THREE.Fog(0x0c1626, 4.8, 8.5);                         // pescoço e ombros somem no escuro
    cena.add(new THREE.HemisphereLight(0xffeedd, 0x0b1420, 0.25));
    const chave = new THREE.DirectionalLight(0xffe6cc, 3.2); chave.position.set(2.5, 5, -3); chave.castShadow = true;
    chave.shadow.mapSize.set(1024, 1024); Object.assign(chave.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 12 }); chave.shadow.bias = -0.0005;
    cena.add(chave);
    const contorno = new THREE.DirectionalLight(0x8fb0e0, 2.2); contorno.position.set(-4, 1.5, 1); cena.add(contorno);

    // crânio visto por trás: elipsoide com occipital, mandíbula e nuca; o rosto nunca entra em quadro
    function forma(n) {
      let x = n.x * 0.78, y = n.y * 0.98, z = n.z * 0.96;
      if (y < 0) { const k = -y; x *= 1 - 0.32 * k * k; y *= 1 + 0.16 * k; if (z > 0) z *= 1 - 0.25 * k; }
      if (z < 0) z *= 1 + 0.07 * Math.exp(-((n.y - 0.05) ** 2) / 0.12);   // occipital mais cheio
      if (z > 0) z *= 1 - 0.12 * z;
      return v(x, y, z);
    }
    const normalEm = (p) => v(p.x / 0.61, p.y / 0.96, p.z / 0.92).normalize();
    function densidade(n) {                                                // onde nasce cabelo (0 a 1)
      const linha = -0.52 + 0.9 * suave(-0.3, 0.75, n.z);
      let d = suave(linha - 0.08, linha + 0.1, n.y);                       // linha do cabelo esfumada, sem degrau
      if (Math.abs(n.x) > 0.7 && n.y < 0.16 && n.z > -0.45) d *= 1 - suave(0.7, 0.8, Math.abs(n.x));
      d *= 1 - 0.72 * suave(0.42, 0.62, n.y) * suave(-0.4, -0.12, n.z);   // topo ralo
      d *= 1 - 0.8 * suave(0.45, 0.6, n.z) * suave(0.2, 0.3, Math.abs(n.x)) * (1 - suave(0.5, 0.7, n.y));
      return d;
    }

    const geo = new THREE.SphereGeometry(1, 160, 120);
    const p = geo.attributes.position, cores = [], c = new THREE.Color(), pele = new THREE.Color(0xc98f72), raiz = new THREE.Color(0x150d08);
    for (let i = 0; i < p.count; i++) {
      const n = v(p.getX(i), p.getY(i), p.getZ(i)).normalize(), q = forma(n);
      p.setXYZ(i, q.x, q.y, q.z);
      c.copy(pele).lerp(raiz, 0.9 * densidade(n)); cores.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    geo.computeVertexNormals();
    const matPele = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.5, sheenColor: 0xff8a66, sheenRoughness: 0.6, bumpMap: poros([10, 10]), bumpScale: 0.6 });
    const cranio = new THREE.Mesh(geo, matPele); cranio.castShadow = cranio.receiveShadow = true; cena.add(cranio);
    const matCorpo = new THREE.MeshPhysicalMaterial({ color: 0xc98f72, roughness: 0.6, sheen: 0.4, sheenColor: 0xff8a66 });
    [-1, 1].forEach((s) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30), matCorpo);
      o.scale.set(0.07, 0.19, 0.12); o.position.set(s * 0.75, -0.14, 0.02); o.rotation.y = s * 0.35; o.castShadow = o.receiveShadow = true; cena.add(o);
    });
    const pescoco = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.6, 64, 1, true), matCorpo);
    pescoco.position.set(0, -1.45, -0.1); pescoco.rotation.x = 0.1; pescoco.receiveShadow = true; cena.add(pescoco);

    // Fios: cada um é uma linha de 7 pontos que sai do couro cabeludo e deita sobre ele, a partir do redemoinho da coroa.
    // Fios vizinhos (mesma "célula" da cabeça) recebem o mesmo desvio de direção: formam mechas, como cabelo de verdade.
    const coroa = v(0.05, 0.85, -0.5).normalize();
    const total = leve ? 34000 : 70000, SEG = 6, pos = [], tan = [], nor = [], tons = [], fs = [];
    const mecha = new Map();
    const desvioDaMecha = (n) => {
      const k = `${Math.floor(n.x * 16)},${Math.floor(n.y * 16)},${Math.floor(n.z * 16)}`;
      if (!mecha.has(k)) mecha.set(k, { d: v(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(0.55), tom: rnd(0.75, 1.2) });
      return mecha.get(k);
    };
    for (let i = 0, feitos = 0; i < total * 6 && feitos < total; i++) {
      const n = v(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)); const l2 = n.lengthSq(); if (l2 > 1 || l2 < 0.01) continue; n.normalize();
      if (Math.random() > densidade(n)) continue;
      feitos++;
      const m = desvioDaMecha(n), comp = rnd(0.18, 0.36), tom = m.tom * rnd(0.8, 1.2), ergue = rnd(0.5, 1.6);
      let dirN = n.clone(), t = n.clone().sub(coroa).add(m.d), ant = null;
      for (let k = 0; k <= SEG; k++) {
        const s = forma(dirN), nn = normalEm(s);
        t.sub(nn.clone().multiplyScalar(t.dot(nn))); if (t.lengthSq() < 1e-6) t.set(0, -1, 0.3); t.normalize();
        const f = k / SEG, alt = 0.004 + 0.045 * ergue * Math.sin(f * Math.PI * 0.75) * (1 - 0.3 * f);
        const pt = s.addScaledVector(nn, alt);
        if (ant) {
          const d = pt.clone().sub(ant.p).normalize();
          pos.push(ant.p.x, ant.p.y, ant.p.z, pt.x, pt.y, pt.z);
          tan.push(d.x, d.y, d.z, d.x, d.y, d.z);
          nor.push(ant.n.x, ant.n.y, ant.n.z, nn.x, nn.y, nn.z);
          tons.push(tom, tom); fs.push(ant.f, f);
        }
        ant = { p: pt.clone(), n: nn.clone(), f };
        dirN = s.clone().addScaledVector(t, comp / SEG).normalize();
      }
    }
    const gFios = new THREE.BufferGeometry();
    gFios.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gFios.setAttribute('tangente', new THREE.Float32BufferAttribute(tan, 3));
    gFios.setAttribute('normalPele', new THREE.Float32BufferAttribute(nor, 3));
    gFios.setAttribute('tom', new THREE.Float32BufferAttribute(tons, 1));
    gFios.setAttribute('f', new THREE.Float32BufferAttribute(fs, 1));
    // Kajiya-Kay: difuso e brilho calculados pela direção do fio, não por uma normal de superfície.
    // Dois lóbulos: um reflexo branco estreito e um secundário, mais largo, na cor do cabelo.
    const matCabelo = new THREE.ShaderMaterial({
      uniforms: {
        uLuz: { value: chave.position.clone().normalize() }, uLuz2: { value: contorno.position.clone().normalize() },
        uCam: { value: camCab.position }, uCor: { value: new THREE.Color(0x24160c) }, uCorLuz: { value: new THREE.Color(0xffe6cc) },
        uCorContorno: { value: new THREE.Color(0x8fb0e0) }, uFogCor: { value: cena.fog.color }, uFogPerto: { value: cena.fog.near }, uFogLonge: { value: cena.fog.far },
      },
      vertexShader: `
        attribute vec3 tangente; attribute vec3 normalPele; attribute float tom; attribute float f;
        varying vec3 vT; varying vec3 vN; varying vec3 vPos; varying float vTom; varying float vF; varying float vProf;
        void main() {
          vec4 mundo = modelMatrix * vec4(position, 1.0);
          vPos = mundo.xyz; vT = normalize(mat3(modelMatrix) * tangente); vN = normalize(mat3(modelMatrix) * normalPele);
          vTom = tom; vF = f;
          vec4 mv = viewMatrix * mundo; vProf = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uLuz, uLuz2, uCam, uCor, uCorLuz, uCorContorno, uFogCor; uniform float uFogPerto, uFogLonge;
        varying vec3 vT; varying vec3 vN; varying vec3 vPos; varying float vTom; varying float vF; varying float vProf;
        float kk(vec3 T, vec3 H, float e) { float th = dot(T, H); return pow(sqrt(max(0.0, 1.0 - th * th)), e); }
        void main() {
          vec3 T = normalize(vT), N = normalize(vN), V = normalize(uCam - vPos), L1 = normalize(uLuz), L2 = normalize(uLuz2);
          float tl = dot(T, L1), dif = sqrt(max(0.0, 1.0 - tl * tl));
          float sombra = 0.25 + 0.75 * clamp(dot(N, L1) * 0.6 + 0.4, 0.0, 1.0);   // a própria cabeça faz sombra no lado oposto à luz
          vec3 H = normalize(L1 + V);
          float e1 = kk(normalize(T - N * 0.08), H, 110.0) * 0.16;               // reflexo primário, estreito e claro
          float e2 = kk(normalize(T + N * 0.12), H, 28.0) * 0.12;               // secundário, mais largo, tingido
          vec3 base = uCor * vTom;
          vec3 cor = base * (0.06 + dif * sombra * 0.75) * uCorLuz + (vec3(1.0, 0.92, 0.82) * e1 + base * 2.2 * e2) * sombra;
          float tl2 = dot(T, L2); cor += uCorContorno * sqrt(max(0.0, 1.0 - tl2 * tl2)) * 0.06 * clamp(dot(N, L2) * 0.5 + 0.5, 0.0, 1.0);
          cor *= mix(0.3, 1.0, smoothstep(0.0, 0.6, vF));                      // raiz no escuro, entre os outros fios
          cor = mix(cor, uFogCor, smoothstep(uFogPerto, uFogLonge, vProf));
          gl_FragColor = vec4(cor, 1.0);
        }`,
    });
    cena.add(new THREE.LineSegments(gFios, matCabelo));

    const nAlvo = v(0.12, 0.9, -0.32).normalize();
    const alvo = forma(nAlvo);
    return { cena, alvo, normalAlvo: normalEm(alvo), doadora: forma(v(0.35, -0.02, -0.94).normalize()), rala: forma(v(0.1, 0.8, 0.25).normalize()) };
  })();

  // ---------- capítulos 2 a 9: o couro cabeludo de perto (1 unidade ≈ 1 mm) ----------
  const LADO = 44, AREA = 16, EPI = 0.14, DERME = 2.2, FUNDO = 4.2;
  const ANG = THREE.MathUtils.degToRad(38);
  const D = v(-Math.sin(ANG), Math.cos(ANG), 0);                            // direção em que o fio sai da pele
  const Q = new THREE.Quaternion().setFromUnitVectors(cima, D);
  const E = v(0, 0, 0.32), R = v(6, 0, 0.32), F = v(2.2, 2.0, 1.0);         // doadora, receptora, espera fora do corpo
  const L = 3.2, RAREFEITO = 3.5;

  const scene = new THREE.Scene();
  scene.background = fundo; scene.environment = ambiente; scene.environmentIntensity = 0.5;
  scene.fog = new THREE.Fog(0x101d30, 18, 38);
  scene.add(new THREE.HemisphereLight(0xfff3e6, 0x1a2436, 0.45));
  const sol = new THREE.DirectionalLight(0xfff0de, 2.6); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 40 });
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
  scene.add(sol, sol.target);
  const contra = new THREE.DirectionalLight(0x9fb4d6, 0.9); contra.position.set(-8, 4, -6); scene.add(contra);

  // camadas da pele com textura própria: fibras na derme, células de gordura na hipoderme
  const texDerme = textura(512, (g, s) => {
    g.fillStyle = '#c47d6d'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {                                       // feixes de colágeno ondulados
      g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,220,205,.18)' : 'rgba(120,40,40,.14)'; g.lineWidth = rnd(1, 3);
      const y = Math.random() * s; g.beginPath(); g.moveTo(-10, y);
      for (let x = 0; x <= s + 20; x += 40) g.quadraticCurveTo(x + 20, y + rnd(-10, 10), x + 40, y + rnd(-6, 6));
      g.stroke();
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(150,30,40,.55)'; g.beginPath(); g.ellipse(Math.random() * s, Math.random() * s, rnd(3, 6), rnd(2, 4), rnd(0, 3), 0, 7); g.fill(); }
  }, [21, 1]);
  const texHipo = textura(512, (g, s) => {
    g.fillStyle = '#e2c88f'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 520; i++) {                                       // lóbulos de gordura
      const x = Math.random() * s, y = Math.random() * s, r = rnd(9, 20);
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      gr.addColorStop(0, 'rgba(255,244,205,.85)'); gr.addColorStop(0.85, 'rgba(232,205,145,.6)'); gr.addColorStop(1, 'rgba(170,130,70,.55)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }, [21, 1]);
  const texEpi = textura(256, (g, s) => {
    g.fillStyle = '#d29b7d'; g.fillRect(0, 0, s, s);
    ruido(g, 900, 0.05, 0.2, () => (Math.random() < 0.5 ? '#a86a50' : '#f0c4a8'));
  }, [22, 1]);
  const texTopo = textura(512, (g, s) => {
    g.fillStyle = '#d8a183'; g.fillRect(0, 0, s, s);
    ruido(g, 3000, 0.04, 0.16, () => (Math.random() < 0.5 ? '#b77a5e' : '#f2c9ad'));
  }, [8, 4]);

  function bloco(z0, z1) {
    const grupo = new THREE.Group(), mats = [];
    const lado = (map, cor) => new THREE.MeshPhysicalMaterial({ color: cor, map, roughness: 0.75, transparent: true, sheen: 0.3, sheenColor: 0xffb090 });
    [[0, -EPI, lado(texEpi, 0xffffff)], [-EPI, -DERME, lado(texDerme, 0xffffff)], [-DERME, -FUNDO, lado(texHipo, 0xffffff)]].forEach(([topo, base, corte], i) => {
      const cimaMat = i === 0
        ? new THREE.MeshPhysicalMaterial({ map: texTopo, roughness: 0.5, bumpMap: poros([10, 5]), bumpScale: 1.2, transparent: true, sheen: 0.5, sheenColor: 0xff9a7a, sheenRoughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.5 })
        : corte;
      // ordem das faces do BoxGeometry: +x, -x, +y, -y, +z, -z
      const m = new THREE.Mesh(new THREE.BoxGeometry(LADO, topo - base, z1 - z0), [corte, corte, cimaMat, corte, corte, corte]);
      m.position.set(0, (topo + base) / 2, (z0 + z1) / 2); m.receiveShadow = true;
      grupo.add(m); mats.push(corte, cimaMat);
    });
    scene.add(grupo);
    return { grupo, mats: [...new Set(mats)] };
  }
  bloco(-LADO / 2, 0);
  const frente = bloco(0, LADO / 2);   // some no "corte" e revela a face em z = 0

  // tubo que afina até a ponta (TubeGeometry não afina)
  function tuboAfinado(curva, segs, raio, radial = 7, ponta = 0.15) {
    const pts = curva.getSpacedPoints(segs), quadros = curva.computeFrenetFrames(segs, false);
    const pos = [], nor = [], tan = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const tg = quadros.tangents[i];
      const t = i / segs, r = raio * (1 - (1 - ponta) * Math.pow(t, 1.4));
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2, nx = Math.cos(a), ny = Math.sin(a);
        const n = quadros.normals[i].clone().multiplyScalar(nx).addScaledVector(quadros.binormals[i], ny);
        pos.push(pts[i].x + n.x * r, pts[i].y + n.y * r, pts[i].z + n.z * r); nor.push(n.x, n.y, n.z); tan.push(tg.x, tg.y, tg.z);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('tangenteFio', new THREE.Float32BufferAttribute(tan, 3)); g.setIndex(idx);
    return g;
  }
  // Material de fio: o físico do three.js mais um brilho de cabelo (Kajiya-Kay) calculado pela direção do fio.
  // É o que faz o reflexo correr ao longo da fibra, em vez de parecer um bastão plástico.
  const matFio = () => {
    const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5, sheen: 0.5, sheenRoughness: 0.45, sheenColor: 0x7a5a40 });
    m.customProgramCacheKey = () => 'fio-kajiya';
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 tangenteFio;\nvarying vec3 vTanFio;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 tF = tangenteFio;
          #ifdef USE_INSTANCING
            tF = mat3(instanceMatrix) * tF;
          #endif
          vTanFio = normalize(mat3(modelViewMatrix) * tF);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTanFio;')
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          #if NUM_DIR_LIGHTS > 0
            vec3 Tf = normalize(vTanFio), Vf = normalize(vViewPosition);
            for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
              vec3 Hf = normalize(directionalLights[i].direction + Vf);
              float t1 = dot(Tf, Hf), t2 = dot(normalize(Tf + normal * 0.15), Hf);
              float s1 = pow(sqrt(max(0.0, 1.0 - t1 * t1)), 140.0);   // reflexo branco, estreito
              float s2 = pow(sqrt(max(0.0, 1.0 - t2 * t2)), 30.0);    // reflexo secundário, na cor do fio
              float nl = clamp(dot(normal, directionalLights[i].direction) * 0.5 + 0.5, 0.0, 1.0);
              reflectedLight.directSpecular += directionalLights[i].color * (s1 * 0.3 + s2 * 0.6 * diffuseColor.rgb) * nl;
            }
          #endif`);
    };
    return m;
  };

  // Fios instanciados: três moldes (levemente curvo, mais deitado, ondulado em S), afinados até a ponta.
  const moldes = [
    [v(0, 0, 0), v(0, 0.35, 0), v(-0.08, 0.66, 0.01), v(-0.3, 1, 0)],
    [v(0, 0, 0), v(0.01, 0.3, 0), v(-0.12, 0.6, 0.03), v(-0.42, 0.86, -0.02), v(-0.72, 0.98, 0)],
    [v(0, 0, 0), v(0, 0.33, 0.02), v(-0.05, 0.62, -0.03), v(-0.18, 0.85, 0.03), v(-0.3, 1, 0)],
  ].map((p) => tuboAfinado(new THREE.CatmullRomCurve3(p), 18, 0.035, 7, 0.08));

  // Vista do destaque dos fios amarelos (câmera e alvo). Os fios que ficariam entre a câmera e a unidade não nascem;
  // os de volta ficam, para continuar parecendo um couro cabeludo.
  const VISTA_UNI = [-0.6, 2.4, 4.6, -0.9, 0.8, 0.3];
  const olhar = v(VISTA_UNI[0] - VISTA_UNI[3], VISTA_UNI[1] - VISTA_UNI[4], VISTA_UNI[2] - VISTA_UNI[5]).normalize();
  const origens = [];
  [[0, 0], [-0.04, 0.9], [-0.22, 1.8], [-0.6, 2.8]].forEach(([lx, ly]) => [-0.2, 0, 0.2].forEach((dx) => origens.push(v(lx + dx, ly, 0).applyQuaternion(Q).add(E))));
  const tmp = new THREE.Object3D(), dir = v(0, 0, 0), cor = new THREE.Color(), q1 = v(0, 0, 0), q2 = v(0, 0, 0);
  const direcao = (f) => dir.set(-Math.sin(f.incl) * Math.cos(f.giro), Math.cos(f.incl), Math.sin(f.incl) * Math.sin(f.giro));
  function tapaUnidade(f) {
    direcao(f);
    for (let s = 0; s <= 1; s += 0.2) {
      q1.set(f.x, 0, f.z).addScaledVector(dir, f.comp * s);
      for (const o of origens) {
        const t = THREE.MathUtils.clamp(q2.copy(q1).sub(o).dot(olhar), 0, 10);
        if (q2.copy(o).addScaledVector(olhar, t).distanceTo(q1) < 0.4) return true;
      }
    }
    return false;
  }

  const longe = (x, z, pts, r) => pts.every((p) => Math.hypot(x - p.x, z - p.z) > r);
  function sortearFios({ z0, z1, n, rarefazer = true }) {
    const fios = [];
    for (let i = 0; i < n; i++) {
      const x = rnd(-AREA, AREA), z = rnd(z0, z1);
      if (!longe(x, z, [E, R], 0.8)) continue;
      const rala = rarefazer && x > RAREFEITO;
      if (rala && Math.random() > 0.18) continue;
      const r = Math.random(), k = rala ? 1 : r < 0.2 ? 1 : r < 0.65 ? 2 : r < 0.93 ? 3 : 4;   // unidades de 1 a 4 fios
      for (let j = 0; j < k; j++) {
        const f = { x: x + rnd(-0.05, 0.05), z: z + rnd(-0.05, 0.05), giro: rnd(-0.3, 0.3) + j * 0.12, incl: ANG + rnd(-0.12, 0.12), comp: rnd(1.8, 3.2), tom: rnd(0.7, 1.3), v: Math.floor(Math.random() * moldes.length) };
        if (!tapaUnidade(f)) fios.push(f);
      }
    }
    return fios;
  }
  function poseFio(f, escala) {
    direcao(f);
    tmp.position.set(f.x, 0, f.z);
    tmp.quaternion.setFromUnitVectors(cima, dir);
    const s = Math.max(escala, 0.0001);
    tmp.scale.set(s, f.comp * s, s); tmp.updateMatrix();
    return tmp.matrix;
  }
  // um InstancedMesh por molde; devolve [{ m, lista }]
  function malhaFios(fios, mat) {
    return moldes.map((geo, vi) => {
      const lista = fios.filter((f) => f.v === vi);
      const m = new THREE.InstancedMesh(geo, mat, Math.max(lista.length, 1)); m.count = lista.length;
      lista.forEach((f, i) => { m.setMatrixAt(i, poseFio(f, 1)); m.setColorAt(i, cor.setHex(COR.fio).multiplyScalar(f.tom)); });
      m.castShadow = m.receiveShadow = true; scene.add(m);
      return { m, lista };
    });
  }
  // cada fio sai de uma pequena abertura escura na pele (o óstio do folículo)
  const geoOstio = new THREE.CircleGeometry(0.065, 14).rotateX(-Math.PI / 2);
  function ostios(fios, mat) {
    const m = new THREE.InstancedMesh(geoOstio, mat, Math.max(fios.length, 1)); m.count = fios.length;
    fios.forEach((f, i) => { tmp.position.set(f.x, 0.004, f.z); tmp.quaternion.identity(); tmp.scale.setScalar(rnd(0.8, 1.3)); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix); });
    m.receiveShadow = true; scene.add(m); return m;
  }
  const matOstio = () => new THREE.MeshStandardMaterial({ color: 0x5e3628, roughness: 0.8, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

  const n = leve ? 0.6 : 1;
  const fiosTras = sortearFios({ z0: -AREA, z1: -0.1, n: 1150 * n });
  malhaFios(fiosTras, matFio()); ostios(fiosTras, matOstio());
  const matFrente = matFio(); matFrente.transparent = true;
  const fiosFrenteLista = sortearFios({ z0: 0.5, z1: AREA, n: 1150 * n });
  const fiosFrente = malhaFios(fiosFrenteLista, matFrente);
  const matOstioFrente = matOstio(); const ostiosFrente = ostios(fiosFrenteLista, matOstioFrente);
  const novos = sortearFios({ z0: -AREA, z1: AREA, n: 2300 * n, rarefazer: false }).filter((f) => f.x > RAREFEITO + 0.2);
  novos.forEach((f) => { f.limiar = Math.random(); });
  const matNovos = matFio(); matNovos.transparent = true;
  const malhaNovos = malhaFios(novos, matNovos);

  // ---------- folículo (referencial local: y = eixo do fio, origem na saída da pele) ----------
  function foliculo({ dx = 0, dz = 0, comp = L, alto = 2.8, mats }) {
    const g = new THREE.Group();
    const abaixo = new THREE.CatmullRomCurve3([v(dx, -comp, dz), v(dx * 0.7, -comp * 0.65, dz * 0.7), v(dx * 0.25, -comp * 0.3, dz * 0.25), v(0, 0, 0)]);
    const acima = new THREE.CatmullRomCurve3([v(0, 0, 0), v(-0.04 + dx * 0.2, alto * 0.32, dz * 0.4), v(-0.22 + dx * 0.4, alto * 0.64, dz * 0.8), v(-0.6 + dx * 0.6, alto, dz)]);
    const bainha = new THREE.Mesh(tuboAfinado(abaixo, 40, 0.09, 12, 0.85), mats.bainha); bainha.renderOrder = 2;
    const raiz = new THREE.Mesh(new THREE.TubeGeometry(abaixo, 40, 0.032, 8), mats.fio);
    const haste = new THREE.Mesh(tuboAfinado(acima, 40, 0.036, 8, 0.12), mats.haste);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20), mats.bulbo); bulbo.scale.set(1, 1.45, 1); bulbo.position.set(dx, -comp + 0.05, dz); bulbo.renderOrder = 3;
    const papila = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), mats.papila); papila.scale.set(1, 1.3, 1); papila.position.set(dx, -comp - 0.02, dz);
    [raiz, haste, bulbo, papila].forEach((m) => { m.castShadow = true; });
    g.add(raiz, papila, bainha, bulbo, haste);
    return { g, haste };
  }
  const matsBase = () => ({
    bainha: new THREE.MeshPhysicalMaterial({ color: COR.bainha, roughness: 0.4, transparent: true, opacity: 0.6, depthWrite: false, sheen: 0.6, sheenColor: 0xffe0d0 }),
    fio: new THREE.MeshPhysicalMaterial({ color: COR.fio, roughness: 0.4, sheen: 1, sheenColor: 0x9c7a5c }),
    haste: (() => { const m = matFio(); m.color.setHex(COR.fio); m.transparent = true; return m; })(),
    bulbo: new THREE.MeshPhysicalMaterial({ color: COR.bulbo, roughness: 0.45, transparent: true, opacity: 0.75, depthWrite: false, sheen: 0.8, sheenColor: 0xffc0a8, clearcoat: 0.3 }),
    papila: new THREE.MeshPhysicalMaterial({ color: COR.papila, roughness: 0.5, sheen: 0.5, sheenColor: 0xff8080 }),
  });

  // outros folículos encostados na face do corte
  const matsCortados = matsBase();
  for (let x = -9; x <= 9; x += rnd(1.1, 1.6)) {
    if (Math.abs(x - E.x) < 1.4 || Math.abs(x - R.x) < 1.3 || (x > RAREFEITO && Math.random() > 0.35)) continue;
    const { g } = foliculo({ comp: rnd(2.9, 3.4), alto: rnd(2, 3), mats: matsCortados });
    g.position.set(x, 0, rnd(0.08, 0.18)); g.quaternion.setFromAxisAngle(v(0, 0, 1), ANG + rnd(-0.1, 0.1));
    scene.add(g);
  }

  // a unidade folicular em destaque: três folículos que convergem para a mesma saída, mais a glândula sebácea
  const matsUnidade = matsBase();
  const unidade = new THREE.Group(), hastes = new THREE.Group(); unidade.add(hastes);
  [[-0.17, 0.08, 3.1], [0, -0.06, 3.2], [0.18, 0.1, 3.05]].forEach(([dx, dz, comp], i) => {
    const { g, haste } = foliculo({ dx, dz, comp, alto: 2.6 + i * 0.25, mats: matsUnidade });
    unidade.add(g); hastes.add(haste);
  });
  const matGland = new THREE.MeshPhysicalMaterial({ color: COR.glandula, roughness: 0.45, sheen: 0.6, sheenColor: 0xfff0b0, clearcoat: 0.4 });
  [[-0.17, -0.75, 0.02, 0.11], [-0.28, -0.9, 0.06, 0.13], [-0.2, -1.02, -0.05, 0.1]].forEach(([x, y, z, r]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), matGland); s.position.set(x, y, z); s.castShadow = true; unidade.add(s);
  });
  unidade.position.copy(E); unidade.quaternion.copy(Q); scene.add(unidade); unidade.updateMatrixWorld();
  const naUnidade = (x, y, z) => unidade.localToWorld(v(x, y, z));

  // músculo eretor: sai da altura da glândula e sobe até a epiderme, do lado para onde o fio se inclina
  const m1 = naUnidade(-0.1, -1.25, 0), m2 = v(m1.x - 1.2, -EPI - 0.04, E.z), mm = m1.clone().lerp(m2, 0.5).add(v(0, -0.12, 0));
  const musculo = new THREE.Mesh(tuboAfinado(new THREE.CatmullRomCurve3([m1, mm, m2]), 24, 0.05, 10, 0.6), new THREE.MeshPhysicalMaterial({ color: COR.musculo, roughness: 0.5, sheen: 0.5, sheenColor: 0xff9090 }));
  musculo.castShadow = true; scene.add(musculo);

  // ---------- instrumentos (referencial local: ponta na origem, eixo +y) ----------
  const matMetal = new THREE.MeshPhysicalMaterial({ color: COR.metal, metalness: 1, roughness: 0.22, side: THREE.DoubleSide, clearcoat: 0.5 });
  const matLatao = new THREE.MeshPhysicalMaterial({ color: COR.latao, metalness: 1, roughness: 0.3 });
  const peca = (geo, mat, y, x = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); m.castShadow = true; return m; };
  const extrator = new THREE.Group();
  extrator.add(
    peca(new THREE.CylinderGeometry(0.36, 0.36, 2.6, 48, 1, true), matMetal, 1.3),
    peca(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 48), matLatao, 2.5),
    peca(new THREE.CylinderGeometry(0.2, 0.2, 3, 24), matMetal, 4.1),
  );
  scene.add(extrator);
  const matAgulha = new THREE.MeshPhysicalMaterial({ color: COR.metal, metalness: 1, roughness: 0.2, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  const implanter = new THREE.Group();
  implanter.add(
    peca(new THREE.CylinderGeometry(0.21, 0.21, L + 0.7, 40, 1, true), matAgulha, (L + 0.7) / 2),
    peca(new THREE.CylinderGeometry(0.05, 0.05, 3, 10), matMetal, L + 0.7 + 1.4, 0.24),
    peca(new THREE.CylinderGeometry(0.17, 0.17, 3, 28), matMetal, L + 4.3),
    peca(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 28), matLatao, L + 2.9),
  );
  scene.add(implanter);

  // ---------- composição: cada cena tem seu "filme"; no desktop o close ganha desfoque de lente ----------
  // (oclusão de ambiente GTAO foi testada e descartada: gerava blocos pretos com as partes translúcidas do folículo)
  function compor(cena, cam, abertura) {
    const c = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
    c.addPass(new RenderPass(cena, cam));
    const dof = abertura && !leve ? new BokehPass(cena, cam, { focus: 5, aperture: abertura, maxblur: 0.006 }) : null;
    if (dof) c.addPass(dof);
    c.addPass(new OutputPass());
    return { c, dof, abertura };
  }
  const compCab = compor(cabeca.cena, camCab, 0);
  const compPele = compor(scene, camPele, 0.0016);

  // Passagem da cabeça para o close: um "portal" que abre do centro para fora.
  // A cabeça continua aproximando; o close surge pequeno no centro e cresce até ocupar a tela.
  const passagem = new THREE.ShaderMaterial({
    uniforms: { tA: { value: null }, tB: { value: null }, k: { value: 0 }, aspecto: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tA, tB; uniform float k, aspecto; varying vec2 vUv;
      void main() {
        vec2 c = vUv - 0.5;
        vec2 uvA = 0.5 + c * (1.0 - 0.35 * k);                 // a cabeça segue entrando
        float d = length(vec2(c.x * aspecto, c.y));
        float r = k * (0.6 + 0.5 * aspecto);
        float m = 1.0 - smoothstep(r - 0.22, r, d);
        vec4 a = texture2D(tA, uvA), b = texture2D(tB, vUv);                 // o avanço do close vem da própria câmera, que já desce
        gl_FragColor = mix(a, b, m) * (1.0 - 0.25 * m * (1.0 - m));   // leve escurecida só na borda do portal
      }`,
    depthTest: false, depthWrite: false,
  });
  const quadPassagem = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), passagem);
  const cenaPassagem = new THREE.Scene(); cenaPassagem.add(quadPassagem);
  const camPassagem = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---------- rótulos HTML presos a pontos da cena ----------
  const caixaRot = secao.querySelector('[data-fio3d-rotulos]');
  const rotulos = [];
  const rotulo = (texto, grupo, ponto, esq = false, cena = 1) => {
    const el = document.createElement('span'); el.className = 'fio3d-rotulo' + (esq ? ' esq' : '');
    el.append(Object.assign(document.createElement('span'), { textContent: texto }));
    caixaRot.append(el); rotulos.push({ el, grupo, ponto, esq, cena });
  };
  rotulo('Topo e entradas: onde o cabelo rareia', 'cab', () => cabeca.rala, false, 0);
  rotulo('Nuca e laterais: área doadora', 'cab', () => cabeca.doadora, false, 0);
  rotulo('Área onde o cabelo rareou', 'area', () => v(6.5, 0.4, 3));
  rotulo('Unidade folicular, 3 fios', 'rotUni', () => unidade.localToWorld(v(-0.3, 1.9, 0)), true);
  rotulo('Epiderme', 'camadas', () => v(-0.55, -0.07, 0.02));
  rotulo('Derme', 'camadas', () => v(-0.55, -1.2, 0.02));
  rotulo('Hipoderme', 'camadas', () => v(-0.55, -2.6, 0.02));
  rotulo('Haste do fio', 'fol', () => unidade.localToWorld(v(-0.2, 1.3, 0)), true);
  rotulo('Glândula sebácea', 'fol', () => unidade.localToWorld(v(-0.38, -0.92, 0)), true);
  rotulo('Músculo eretor', 'fol', () => mm.clone().add(v(-0.2, 0.05, 0)), true);
  rotulo('Bulbo', 'fol', () => unidade.localToWorld(v(0.19, -3.12, 0)));
  rotulo('Papila dérmica', 'fol', () => unidade.localToWorld(v(-0.06, -3.25, 0)), true);
  rotulo('Resistentes à queda', 'resiste', () => unidade.localToWorld(v(0.3, -1.8, 0)));

  // ---------- estado animado pela rolagem ----------
  const S = {
    hx: 1.6, hy: 1.75, hz: -1.8, htx: 0, hty: 0.45, htz: -0.25, mix: 0, cab: 0,   // câmera da cabeça e a passagem
    cx: 0.6, cy: 20, cz: 2.5, tx: 0.6, ty: 0, tz: -1,                                // câmera do close (começa no alto, olhando para baixo)
    frente: 1, area: 0, uni: 0, rotUni: 0, camadas: 0, fol: 0, brilho: 0, resiste: 0,
    extrator: -3.5, extVis: 0, sobe: 0, espera: 0, leva: 0, entra: 3.5, gira: 0, impVis: 0, recua: 0,
    cai: 0, nasce: 0, cresce: 0,
  };
  const caps = gsap.utils.toArray(secao.querySelectorAll('[data-cap]'));
  const barra = secao.querySelector('[data-fio3d-barra]');
  const wa = document.querySelector('[data-wa-flutua]');

  secao.classList.add('is-3d');
  gsap.set(caps[0], { autoAlpha: 1 });

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: secao, start: 'top top', end: 'bottom bottom', scrub: 0.8,
      onUpdate: (st) => gsap.set(barra, { scaleY: st.progress }),
      onToggle: (st) => wa && wa.classList.toggle('is-oculto-3d', st.isActive),
    },
  });
  let O = 0; // deslocamento: a viagem pela pele começa depois do capítulo da cabeça
  const cam = (k, at, dur, ease) => tl.to(S, { cx: k[0], cy: k[1], cz: k[2], tx: k[3], ty: k[4], tz: k[5], duration: dur, ...(ease ? { ease } : {}) }, at + O);
  const camH = (k, at, dur, ease) => tl.to(S, { hx: k[0], hy: k[1], hz: k[2], htx: k[3], hty: k[4], htz: k[5], duration: dur, ...(ease ? { ease } : {}) }, at + O);
  const para = (props, at, dur, ease) => tl.to(S, { ...props, duration: dur, ...(ease ? { ease } : {}) }, at + O);
  const CABECA = 1.15;

  // textos: a cabeça ocupa 0 → CABECA; depois cada capítulo ocupa 1 unidade
  caps.forEach((cap, i) => {
    const ini = i === 0 ? 0 : CABECA + i - 1;
    if (i > 0) tl.to(cap, { autoAlpha: 1, duration: 0.12 }, ini + 0.06);
    if (i < caps.length - 1) tl.to(cap, { autoAlpha: 0, duration: 0.1 }, i === 0 ? 0.62 : ini + 0.9);
  });

  // 1. a cabeça: a câmera passa por trás, mostra topo e nuca, e mergulha no couro cabeludo
  const { alvo: P, normalAlvo: N } = cabeca;
  const sobre = (d) => [P.x + N.x * d, P.y + N.y * d, P.z + N.z * d, P.x, P.y, P.z];
  camH([-1.0, 2.25, -1.5, 0, 0.6, -0.2], 0.06, 0.4);
  para({ cab: 1 }, 0.22, 0.1); para({ cab: 0 }, 0.56, 0.06);
  camH(sobre(1.5), 0.48, 0.2);
  camH(sobre(0.03), 0.68, 0.42, 'power2.in');       // segue mergulhando durante a passagem
  cam([0.6, 13, 4, 0.6, 0, -1], 0.75, 0.4);           // enquanto isso, a câmera do close já desce
  para({ mix: 1 }, 0.78, 0.32, 'power1.inOut');
  O = CABECA;

  // 2. superfície
  cam([0, 9.5, 11.5, 0.8, 0, -0.5], 0.1, 0.8);
  para({ area: 1 }, 0.35, 0.15); para({ area: 0 }, 0.88, 0.1);
  // 3. abaixo da pele: aproxima da unidade, depois a frente da pele some e mostra o corte
  //    a câmera chega aos 3 fios (sem nenhum fio na frente), eles acendem em dourado,
  //    e a câmera desce junto com eles enquanto a pele da frente se abre: o corte mostra a raiz desses mesmos fios
  cam(VISTA_UNI, 1.0, 0.4);
  para({ uni: 1 }, 1.2, 0.12); para({ rotUni: 1 }, 1.24, 0.1); para({ rotUni: 0 }, 1.66, 0.08);
  para({ frente: 0 }, 1.42, 0.38);
  cam([0.4, 0.7, 6.4, -0.3, -0.2, 0.3], 1.42, 0.22, 'power1.in');
  cam([1.3, -0.6, 5.6, 0.7, -1.2, 0.3], 1.64, 0.26, 'power2.out');   // enquadra a raiz dos 3 fios, da pele ao bulbo
  para({ camadas: 1 }, 1.84, 0.12);
  // 4. folículo, depois o bulbo de perto
  para({ camadas: 0 }, 2.05, 0.1); para({ uni: 0 }, 2.05, 0.2);
  cam([1.6, -1.4, 5.2, 0.9, -1.4, 0.3], 2.05, 0.35);
  para({ fol: 1 }, 2.35, 0.15);
  cam([2.4, -2.4, 3.2, 1.75, -2.5, 0.3], 2.6, 0.3);
  // 5. área doadora: os folículos da unidade acendem
  para({ fol: 0 }, 3.0, 0.1);
  cam([0.6, -0.8, 8.5, 0.6, -1.1, 0], 3.0, 0.4);
  para({ brilho: 1 }, 3.35, 0.3);
  para({ resiste: 1 }, 3.5, 0.15); para({ resiste: 0 }, 3.9, 0.08);
  // 6. extração: o extrator desce girando, sobe, e a unidade sai inteira
  para({ brilho: 0.25 }, 4.0, 0.25);
  cam([2.8, 1.4, 7.2, 0.4, -0.4, 0.3], 4.0, 0.35);
  para({ extVis: 1 }, 4.22, 0.08);
  para({ extrator: 1.5 }, 4.3, 0.35, 'power1.inOut');
  para({ extrator: -3.5 }, 4.68, 0.2);
  para({ sobe: 3.6 }, 4.7, 0.25);
  para({ extVis: 0 }, 4.84, 0.08);
  // 7. fora do corpo
  para({ espera: 1 }, 5.0, 0.4);
  cam([4.4, 1.5, 6.4, 3.0, 0.9, 0.9], 5.0, 0.4);
  para({ gira: 1 }, 5.2, 0.6, 'none');
  // 8. implantação na área receptora
  para({ leva: 1 }, 6.0, 0.3);
  cam([7.6, -0.3, 7.6, 6.6, -0.9, 0.3], 6.0, 0.4);
  para({ impVis: 1 }, 6.05, 0.1);
  para({ entra: 0 }, 6.35, 0.35);
  para({ recua: 4 }, 6.72, 0.2);
  para({ impVis: 0 }, 6.85, 0.1);
  // 9. o fio cai, nasce de novo, e a área se preenche
  para({ cai: 1 }, 7.0, 0.25);
  para({ nasce: 1 }, 7.35, 0.45);
  para({ frente: 1 }, 7.4, 0.5);
  para({ cresce: 1 }, 7.5, 0.7, 'power1.inOut');
  cam([6, 11, 15, 3.5, 0, -1], 7.3, 0.9);
  tl.to({}, { duration: 0.4 }, 8.2 + O);

  // ---------- quadro a quadro: aplica S na cena ----------
  const alvo = v(0, 0, 0), pos = v(0, 0, 0), alvoH = v(0, 0, 0), qGiro = new THREE.Quaternion(), proj = v(0, 0, 0);
  let largura = 1, altura = 1, ultimoCresce = -1;

  function enquadrar() {
    largura = palco.clientWidth; altura = palco.clientHeight;
    renderer.setSize(largura, altura, false);
    [compCab, compPele].forEach((k) => k && (k.c.setPixelRatio(renderer.getPixelRatio()), k.c.setSize(largura, altura)));
    // desktop: texto à esquerda, centro da cena em ~62% da largura; celular: texto embaixo, centro em ~35% da altura
    const celular = largura < 900;
    const cheioL = celular ? largura : largura * 1.25, cheioA = celular ? altura * 1.3 : altura;
    [camCab, camPele].forEach((c) => {
      c.aspect = cheioL / cheioA;
      c.setViewOffset(cheioL, cheioA, 0, celular ? altura * 0.3 : 0, largura, altura);
      c.updateProjectionMatrix();
    });
    passagem.uniforms.aspecto.value = largura / altura;
  }
  const afastar = () => (largura < 900 ? THREE.MathUtils.clamp(0.82 / (largura / altura), 1, 2.1) : 1);

  function quadro() {
    alvoH.set(S.htx, S.hty, S.htz);
    camCab.position.set(S.hx, S.hy, S.hz).sub(alvoH).multiplyScalar(afastar()).add(alvoH); camCab.lookAt(alvoH);
    alvo.set(S.tx, S.ty, S.tz);
    pos.set(S.cx, S.cy, S.cz).sub(alvo).multiplyScalar(afastar()).add(alvo);
    camPele.position.copy(pos); camPele.lookAt(alvo);
    const foco = pos.distanceTo(alvo);

    // a sombra acompanha o que está em quadro
    sol.position.copy(alvo).add(v(5, 9, 6)); sol.target.position.copy(alvo);

    frente.mats.forEach((m) => { m.opacity = S.frente; });
    frente.grupo.visible = S.frente > 0.01;
    matFrente.opacity = S.frente; fiosFrente.forEach(({ m }) => { m.visible = S.frente > 0.01; });
    matOstioFrente.opacity = 0.8 * S.frente; ostiosFrente.visible = S.frente > 0.01;

    const e = S.brilho * 0.55 + S.uni * 0.45;  // no destaque, o folículo dos fios amarelos também acende
    [matsUnidade.bainha, matsUnidade.bulbo].forEach((m) => { m.emissive.setHex(COR.latao); m.emissiveIntensity = e; });
    matsUnidade.haste.emissive.setHex(COR.latao); matsUnidade.haste.emissiveIntensity = S.uni * 0.9;
    matsUnidade.fio.emissive.setHex(COR.latao); matsUnidade.fio.emissiveIntensity = S.uni * 0.7;   // a raiz do fio, dentro da pele, também acende

    extrator.visible = S.extVis > 0.01;
    extrator.position.copy(E).addScaledVector(D, -S.extrator);
    extrator.quaternion.copy(Q).multiply(qGiro.setFromAxisAngle(cima, S.extrator * 9));

    if (S.leva >= 1) unidade.position.copy(R).addScaledVector(D, S.entra);
    else {
      unidade.position.copy(E).addScaledVector(D, S.sobe).lerp(F, S.espera);
      unidade.position.lerp(v(0, 0, 0).copy(R).addScaledVector(D, 3.5), S.leva);
    }
    unidade.quaternion.copy(Q).multiply(qGiro.setFromAxisAngle(cima, S.gira * Math.PI * 2));

    implanter.visible = S.impVis > 0.01;
    implanter.position.copy(unidade.position).addScaledVector(D, -L - 0.3 + S.recua);
    implanter.quaternion.copy(Q);
    matAgulha.opacity = 0.4 * S.impVis;

    if (S.nasce > 0) { hastes.scale.setScalar(Math.max(S.nasce, 0.001)); hastes.position.set(0, 0, 0); matsUnidade.haste.opacity = 1; }
    else { hastes.scale.setScalar(1); hastes.position.set(-S.cai * 0.9, -S.cai * 0.4, 0); matsUnidade.haste.opacity = 1 - S.cai; }

    if (S.cresce !== ultimoCresce) {
      ultimoCresce = S.cresce;
      malhaNovos.forEach(({ m, lista }) => {
        lista.forEach((f, i) => m.setMatrixAt(i, poseFio(f, THREE.MathUtils.clamp((S.cresce - f.limiar * 0.6) / 0.4, 0, 1))));
        m.instanceMatrix.needsUpdate = true; m.visible = S.cresce > 0;
      });
    }

    // até a passagem só a cabeça; depois só o close; no meio, as duas fundidas pelo portal
    const k = S.mix, naCabeca = k < 0.5;
    if (compPele.dof) {
      compPele.dof.uniforms.focus.value = foco;
      compPele.dof.uniforms.aperture.value = compPele.abertura * THREE.MathUtils.clamp(6 / foco, 0.3, 1.6);
    }
    const filmar = (comp, tela) => { comp.c.renderToScreen = tela; comp.c.render(); return comp.c.readBuffer.texture; };
    if (k <= 0.001) filmar(compCab, true);
    else if (k >= 0.999) filmar(compPele, true);
    else {
      passagem.uniforms.tA.value = filmar(compCab, false);
      passagem.uniforms.tB.value = filmar(compPele, false);
      passagem.uniforms.k.value = k;
      renderer.setRenderTarget(null); renderer.render(cenaPassagem, camPassagem);
    }
    const camera = naCabeca ? camCab : camPele;   // para os rótulos

    unidade.updateMatrixWorld();
    rotulos.forEach((r) => {
      const op = r.cena === (naCabeca ? 0 : 1) ? S[r.grupo] : 0;
      if (op < 0.01) { r.el.style.opacity = 0; return; }
      proj.copy(r.ponto()).project(camera);
      // mantém a etiqueta inteira dentro da tela
      const w = r.el.offsetWidth, x0 = (proj.x * 0.5 + 0.5) * largura, y = (-proj.y * 0.5 + 0.5) * altura;
      const x = r.esq ? THREE.MathUtils.clamp(x0, w + 8, largura - 8) : THREE.MathUtils.clamp(x0, 8, largura - w - 8);
      r.el.style.opacity = proj.z < 1 ? op : 0;
      r.el.style.transform = `translate(${x}px, ${y}px) translate(${r.esq ? 'calc(-100% + 3.5px)' : '-3.5px'}, -50%)`;
    });
  }

  enquadrar();
  new ResizeObserver(() => { enquadrar(); quadro(); }).observe(palco);
  new IntersectionObserver(([en]) => renderer.setAnimationLoop(en.isIntersecting ? quadro : null), { rootMargin: '100px' }).observe(secao);
  ScrollTrigger.refresh();
}
