import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

type GarmentType = 'Dress' | 'Jacket' | 'Shirt' | 'Skirt' | 'Pants'

type GarmentViewerProps = {
  color: string
  garment: GarmentType
}

function Fabric({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.85} />
}

function Shirt({ color }: { color: string }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.5, 1.8, 0.35]} />
        <Fabric color={color} />
      </mesh>

      <mesh position={[-1.05, 0.55, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.75, 0.6, 0.4]} />
        <Fabric color={color} />
      </mesh>

      <mesh position={[1.05, 0.55, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.75, 0.6, 0.4]} />
        <Fabric color={color} />
      </mesh>
    </group>
  )
}

function Dress({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.45, 0.65, 1.1, 32]} />
        <Fabric color={color} />
      </mesh>

      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.55, 1.3, 1.7, 32]} />
        <Fabric color={color} />
      </mesh>
    </group>
  )
}

function Jacket({ color }: { color: string }) {
  return (
    <group>
      <Shirt color={color} />

      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[0.06, 1.8, 0.05]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function Skirt({ color }: { color: string }) {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry args={[0.55, 1.3, 1.8, 32]} />
      <Fabric color={color} />
    </mesh>
  )
}

function Pants({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.25, 0.5, 0.4]} />
        <Fabric color={color} />
      </mesh>

      <mesh position={[-0.35, -0.55, 0]}>
        <boxGeometry args={[0.52, 2, 0.4]} />
        <Fabric color={color} />
      </mesh>

      <mesh position={[0.35, -0.55, 0]}>
        <boxGeometry args={[0.52, 2, 0.4]} />
        <Fabric color={color} />
      </mesh>
    </group>
  )
}

function GarmentModel({ garment, color }: GarmentViewerProps) {
  switch (garment) {
    case 'Dress':
      return <Dress color={color} />
    case 'Jacket':
      return <Jacket color={color} />
    case 'Skirt':
      return <Skirt color={color} />
    case 'Pants':
      return <Pants color={color} />
    case 'Shirt':
    default:
      return <Shirt color={color} />
  }
}

export default function GarmentViewer({
  color,
  garment,
}: GarmentViewerProps) {
  return (
    <div className="garment-viewer">
      <Canvas camera={{ position: [0, 1, 5.5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />

        <GarmentModel garment={garment} color={color} />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
        />
      </Canvas>
    </div>
  )
}