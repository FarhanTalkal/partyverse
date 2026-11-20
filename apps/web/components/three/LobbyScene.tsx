"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, Sparkles } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

function Hub() {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.18;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.85}>
      <group ref={ref} position={[0, -0.15, 0]}>
        <mesh castShadow receiveShadow>
          <torusKnotGeometry args={[0.85, 0.28, 128, 16]} />
          <meshStandardMaterial
            color="#ff2e63"
            roughness={0.25}
            metalness={0.55}
            emissive="#ff2e63"
            emissiveIntensity={0.15}
          />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial
            color="#ff9f43"
            roughness={0.2}
            metalness={0.45}
            emissive="#ff9f43"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.55, 0.04, 16, 100]} />
          <meshStandardMaterial color="#2de2e6" emissive="#2de2e6" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function Orbits() {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.cos((i / 12) * Math.PI * 2) * (2.4 + (i % 3) * 0.15),
        z: Math.sin((i / 12) * Math.PI * 2) * (2.4 + (i % 3) * 0.15),
        y: Math.sin(i) * 0.45,
        color: ["#ff9f43", "#2de2e6", "#ffd36e", "#ff2e63"][i % 4],
        scale: 0.1 + (i % 4) * 0.035,
      })),
    []
  );

  return (
    <>
      {items.map((item) => (
        <Float key={item.id} speed={1.2 + item.id * 0.08} floatIntensity={1}>
          <mesh position={[item.x, item.y, item.z]} scale={item.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={item.color}
              roughness={0.25}
              metalness={0.4}
              emissive={item.color}
              emissiveIntensity={0.25}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function SpinRing() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.35;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.6, 0.15, 0]} position={[0, 0.35, 0]}>
      <torusGeometry args={[2.35, 0.03, 16, 120]} />
      <meshStandardMaterial color="#ffd36e" transparent opacity={0.55} />
    </mesh>
  );
}

function SceneContent({ lite }: { lite: boolean }) {
  return (
    <>
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 2]} intensity={1.35} castShadow={!lite} />
      <pointLight position={[-3, 2, -2]} intensity={0.8} color="#ff2e63" />
      <pointLight position={[3, 1, 2]} intensity={0.7} color="#2de2e6" />
      <Hub />
      <Orbits />
      <SpinRing />
      {!lite && (
        <>
          <Sparkles count={40} scale={6} size={2} speed={0.4} color="#ffd36e" />
          <ContactShadows opacity={0.4} scale={12} blur={2.8} far={5} />
          <Environment preset="night" />
        </>
      )}
    </>
  );
}

export function LobbyScene({ lite = false }: { lite?: boolean }) {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={lite ? [1, 1.25] : [1, 1.85]}
        camera={{ position: [0, 1.7, 5.4], fov: 42 }}
        gl={{ antialias: !lite, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneContent lite={lite} />
        </Suspense>
      </Canvas>
    </div>
  );
}
