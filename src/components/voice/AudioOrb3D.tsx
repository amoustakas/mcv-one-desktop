/**
 * AudioOrb3D — THREE.js audio visualization sphere with MCV color palette.
 * Cyan glow when listening, purple glow when AI speaking.
 * Sphere geometry displaced by audio frequency + ambient particles.
 */
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface AudioOrb3DProps {
  inputVolume: number;   // 0-1
  outputVolume: number;  // 0-1
}

// MCV palette
const CYAN = new THREE.Color(0x00f0ff);
const PURPLE = new THREE.Color(0x8b5cf6);
// MCV deep slate used for scene background
// eslint-disable-next-line @typescript-eslint/no-unused-vars

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uInputVol;
  uniform float uOutputVol;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Simplex-like noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normal;
    float combinedVol = max(uInputVol, uOutputVol);
    float noiseScale = 1.5 + combinedVol * 2.0;
    float noiseSpeed = uTime * 0.4;
    float n = snoise(normal * noiseScale + noiseSpeed);
    float displacement = n * (0.08 + combinedVol * 0.35);
    vDisplacement = displacement;
    vec3 newPos = position + normal * displacement;
    vPosition = newPos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uInputVol;
  uniform float uOutputVol;
  uniform vec3 uCyanColor;
  uniform vec3 uPurpleColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    // Mix color based on who is active: input=cyan, output=purple
    float inputStrength = smoothstep(0.0, 0.5, uInputVol);
    float outputStrength = smoothstep(0.0, 0.5, uOutputVol);
    float mixFactor = outputStrength / max(inputStrength + outputStrength, 0.001);

    vec3 baseColor = mix(uCyanColor, uPurpleColor, mixFactor);

    // Fresnel rim glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

    // Core intensity based on volume
    float coreGlow = 0.15 + max(uInputVol, uOutputVol) * 0.5;

    // Displacement highlights
    float highlight = smoothstep(0.0, 0.2, vDisplacement) * 0.3;

    vec3 color = baseColor * (coreGlow + highlight) + baseColor * fresnel * 0.8;

    // Subtle time shimmer
    float shimmer = sin(uTime * 2.0 + vPosition.y * 10.0) * 0.02;
    color += vec3(shimmer);

    float alpha = 0.7 + fresnel * 0.3;
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function AudioOrb3D({ inputVolume, outputVolume }: AudioOrb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    particles: THREE.Points;
    uniforms: Record<string, THREE.IUniform>;
    frameId: number;
  } | null>(null);
  const volumeRef = useRef({ input: 0, output: 0 });

  // Keep volumes in ref for animation loop (no re-render needed)
  volumeRef.current.input = inputVolume;
  volumeRef.current.output = outputVolume;

  const initScene = useCallback((container: HTMLDivElement) => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 3.2;

    // Uniforms
    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uInputVol: { value: 0 },
      uOutputVol: { value: 0 },
      uCyanColor: { value: CYAN },
      uPurpleColor: { value: PURPLE },
    };

    // Orb
    const geo = new THREE.IcosahedronGeometry(1, 64);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Particles
    const particleCount = 200;
    const pPositions = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 1.5;
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);
      pSizes[i] = Math.random() * 2 + 0.5;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

    const pMat = new THREE.PointsMaterial({
      color: CYAN,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Ambient light
    scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    return { renderer, scene, camera, mesh, particles, uniforms, frameId: 0 };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = initScene(container);
    sceneRef.current = ctx;

    const clock = new THREE.Clock();

    function animate() {
      ctx.frameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const { input, output } = volumeRef.current;

      // Smooth uniforms
      ctx.uniforms.uTime.value = elapsed;
      ctx.uniforms.uInputVol.value += (input - ctx.uniforms.uInputVol.value) * 0.15;
      ctx.uniforms.uOutputVol.value += (output - ctx.uniforms.uOutputVol.value) * 0.15;

      // Slow rotation
      ctx.mesh.rotation.y = elapsed * 0.15;
      ctx.mesh.rotation.x = Math.sin(elapsed * 0.1) * 0.1;

      // Particles orbit
      ctx.particles.rotation.y = elapsed * 0.05;
      ctx.particles.rotation.x = Math.sin(elapsed * 0.08) * 0.05;

      // Particle color shift
      const pMat = ctx.particles.material as THREE.PointsMaterial;
      const combinedVol = Math.max(input, output);
      pMat.opacity = 0.2 + combinedVol * 0.5;
      if (output > input) {
        pMat.color.lerp(PURPLE, 0.05);
      } else {
        pMat.color.lerp(CYAN, 0.05);
      }

      ctx.renderer.render(ctx.scene, ctx.camera);
    }

    animate();

    // Resize handler
    function handleResize() {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    }

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(ctx.frameId);
      ctx.renderer.dispose();
      ctx.mesh.geometry.dispose();
      (ctx.mesh.material as THREE.ShaderMaterial).dispose();
      ctx.particles.geometry.dispose();
      (ctx.particles.material as THREE.PointsMaterial).dispose();
      if (container.contains(ctx.renderer.domElement)) {
        container.removeChild(ctx.renderer.domElement);
      }
    };
  }, [initScene]);

  return (
    <div className="orb3d-root" ref={containerRef}>
      <style>{`
        .orb3d-root {
          width: 100%;
          height: 100%;
          min-height: 120px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orb3d-root canvas {
          display: block;
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
}
