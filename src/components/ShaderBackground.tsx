'use client'

import { useRef, useMemo, useState, useEffect, createContext, useContext } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Context for theme and mouse position
interface ShaderContextType {
  theme: 'light' | 'dark'
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
}

const ShaderContext = createContext<ShaderContextType>({
  theme: 'dark',
  mouseRef: { current: { x: 0, y: 0 } }
})

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader - Organic mineral-like flow with brand orange energy
const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uDarkMode;
  uniform vec2 uMouse;

  varying vec2 vUv;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
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

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Fractal Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.12;

    // Create organic flow patterns
    vec3 pos = vec3(uv * 2.5, time * 0.4);

    // Multiple layers of noise for mineral-like texture
    float noise1 = fbm(pos);
    float noise2 = fbm(pos * 1.8 + vec3(50.0));
    float noise3 = snoise(vec3(uv * 4.0, time * 0.25));

    // Combine noise layers
    float pattern = noise1 * 0.5 + noise2 * 0.35 + noise3 * 0.15;

    // Create flowing energy lines
    float energy = sin(uv.x * 15.0 + time * 1.5 + pattern * 4.0) * 0.5 + 0.5;
    energy *= smoothstep(0.2, 0.6, pattern + 0.5);
    energy = pow(energy, 2.0);

    // Brand colors - Datasite orange
    vec3 orangePrimary = vec3(1.0, 0.42, 0.0);    // #FF6B00
    vec3 orangeLight = vec3(1.0, 0.52, 0.2);       // #FF8534
    vec3 teal = vec3(0.05, 0.58, 0.53);            // #0D9488
    vec3 amber = vec3(0.96, 0.62, 0.04);           // Warm amber

    // Dark mode colors
    vec3 darkBg = vec3(0.047, 0.039, 0.035);       // #0C0A09
    vec3 darkSurface = vec3(0.11, 0.09, 0.09);     // #1C1917

    // Light mode colors
    vec3 lightBg = vec3(0.98, 0.98, 0.976);        // #FAFAF9
    vec3 lightSurface = vec3(0.96, 0.96, 0.953);   // #F5F5F3

    // Base color based on theme
    vec3 baseColor = mix(lightBg, darkBg, uDarkMode);
    vec3 surfaceColor = mix(lightSurface, darkSurface, uDarkMode);

    // Create subtle gradient background
    float gradientY = uv.y * 0.4 + pattern * 0.15;
    vec3 bgGradient = mix(baseColor, surfaceColor, gradientY);

    // Add orange energy glow
    float glowIntensity = energy * 0.25;
    vec3 glowColor = mix(orangePrimary, orangeLight, noise2 * 0.5 + 0.5);

    // Add subtle teal accent in certain areas
    float tealAccent = smoothstep(0.55, 0.75, noise1) * 0.08;

    // Mouse interaction glow - enhanced and more visible
    vec2 mousePos = uMouse;
    float mouseDist = distance(uv, mousePos);

    // Create a larger, softer glow that follows the mouse
    // Boost intensity significantly in light mode for visibility
    float baseGlowIntensity = smoothstep(0.5, 0.0, mouseDist);
    float mouseGlow = baseGlowIntensity * mix(0.6, 0.35, uDarkMode);

    // Add a sharper inner core - stronger in light mode
    float mouseCore = smoothstep(0.18, 0.0, mouseDist) * mix(0.4, 0.2, uDarkMode);

    // In light mode, add a subtle shadow/darken effect around the glow for contrast
    float shadowRing = smoothstep(0.0, 0.55, mouseDist) * smoothstep(0.7, 0.4, mouseDist);
    float lightModeShadow = shadowRing * (1.0 - uDarkMode) * 0.08;

    // Combine all elements
    vec3 finalColor = bgGradient;
    finalColor += glowColor * glowIntensity;
    finalColor += teal * tealAccent;

    // Apply subtle shadow in light mode first (darkens the area around glow)
    finalColor *= 1.0 - lightModeShadow;

    // Mouse glow color - use deeper orange in light mode for better contrast
    vec3 lightModeOrange = vec3(0.95, 0.35, 0.0);  // Deeper, more saturated orange
    vec3 mouseGlowColor = mix(
      mix(lightModeOrange, orangePrimary, 0.3),  // Light mode: deeper orange
      mix(orangePrimary, amber, 0.4),             // Dark mode: orange/amber blend
      uDarkMode
    );

    finalColor += mouseGlowColor * mouseGlow;
    finalColor += mix(orangePrimary, orangeLight, uDarkMode) * mouseCore;

    // Add very subtle animated grain
    float grain = snoise(vec3(uv * 400.0, time * 8.0)) * 0.02;
    finalColor += grain * mix(0.3, 0.8, uDarkMode);

    // Soft vignette
    float vignette = smoothstep(1.6, 0.4, length((uv - 0.5) * 1.8));
    finalColor *= 0.92 + vignette * 0.08;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { theme, mouseRef } = useContext(ShaderContext)
  const { viewport } = useThree()
  const smoothMouse = useRef(new THREE.Vector2(0.5, 0.5))

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDarkMode: { value: theme === 'dark' ? 1.0 : 0.0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  }), [])

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uDarkMode.value = theme === 'dark' ? 1.0 : 0.0

      // Smoothly interpolate mouse position
      const targetX = mouseRef.current.x
      const targetY = mouseRef.current.y

      smoothMouse.current.x += (targetX - smoothMouse.current.x) * 0.08
      smoothMouse.current.y += (targetY - smoothMouse.current.y) * 0.08

      material.uniforms.uMouse.value.set(smoothMouse.current.x, smoothMouse.current.y)
    }
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

function ShaderCanvas({ theme, mouseRef }: { theme: 'light' | 'dark', mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const [dpr, setDpr] = useState(1)

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, 2))
  }, [])

  return (
    <ShaderContext.Provider value={{ theme, mouseRef }}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={dpr}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ShaderPlane />
      </Canvas>
    </ShaderContext.Provider>
  )
}

export default function ShaderBackground() {
  const [mounted, setMounted] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)

  // Global mouse position ref (normalized 0-1)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    // Check for WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) {
        setHasWebGL(false)
      }
    } catch (e) {
      setHasWebGL(false)
    }

    setMounted(true)

    // Global mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to 0-1 range (with Y inverted for shader coordinates)
      mouseRef.current.x = e.clientX / window.innerWidth
      mouseRef.current.y = 1.0 - (e.clientY / window.innerHeight)
    }

    // Add global mouse listener
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Fallback gradient for non-WebGL or SSR - dark mode only
  if (!mounted || !hasWebGL) {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 107, 0, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(13, 148, 136, 0.05) 0%, transparent 50%), #0C0A09'
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 -z-10">
      <ShaderCanvas theme="dark" mouseRef={mouseRef} />
    </div>
  )
}
