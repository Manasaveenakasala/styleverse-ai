import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

type GarmentViewerProps = {
  color: string
}

function Shirt({ color }: GarmentViewerProps) {
  return (
    <group>
      {/* Shirt body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 2, 0.35]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Left sleeve */}
      <mesh position={[-1.15, 0.65, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.8, 0.65, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Right sleeve */}
      <mesh position={[1.15, 0.65, 0]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.8, 0.65, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Neck opening */}
      <mesh position={[0, 1.01, 0.19]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 32]} />
        <meshStandardMaterial color="#e9dfe5" />
      </mesh>
    </group>
  )
}

export default function GarmentViewer({ color }: GarmentViewerProps) {
  return (
    <div className="garment-viewer">
      <Canvas camera={{ position: [0, 1, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />

        <Shirt color={color} />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
        />
      </Canvas>
    </div>
  )
}