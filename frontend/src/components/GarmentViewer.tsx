import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type GarmentType = "Dress" | "Jacket" | "Shirt" | "Skirt" | "Pants";
type FabricType = "Cotton" | "Silk" | "Denim" | "Leather";

type GarmentViewerProps = {
  color: string;
  garment: GarmentType;
  fabric?: FabricType;
};

type GarmentMaterialProps = {
  color: string;
  fabric?: FabricType;
};

const fabricMaterials = {
  Cotton: { roughness: 0.95, metalness: 0 },
  Silk: { roughness: 0.2, metalness: 0.1 },
  Denim: { roughness: 1, metalness: 0 },
  Leather: { roughness: 0.35, metalness: 0.05 },
};

// Shared fabric material
function Fabric({ color, fabric = "Cotton" }: GarmentMaterialProps) {
  const material = fabricMaterials[fabric];

  return (
    <meshStandardMaterial
      color={color}
      roughness={material.roughness}
      metalness={material.metalness}
    />
  );
}

// Shirt model
function Shirt({ color, fabric }: GarmentMaterialProps) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.5, 1.8, 0.35]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh position={[-1.05, 0.55, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.75, 0.6, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh position={[1.05, 0.55, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.75, 0.6, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>
    </group>
  );
}

// Dress model
function Dress({ color, fabric }: GarmentMaterialProps) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.45, 0.65, 1.1, 32]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.55, 1.3, 1.7, 32]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>
    </group>
  );
}

// Jacket model
function Jacket({ color, fabric }: GarmentMaterialProps) {
  return (
    <group>
      <Shirt color={color} fabric={fabric} />

      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[0.06, 1.8, 0.05]} />
        <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Skirt model
function Skirt({ color, fabric }: GarmentMaterialProps) {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry args={[0.55, 1.3, 1.8, 32]} />
      <Fabric color={color} fabric={fabric} />
    </mesh>
  );
}

// Pants model
function Pants({ color, fabric }: GarmentMaterialProps) {
  return (
    <group>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.25, 0.5, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh position={[-0.35, -0.55, 0]}>
        <boxGeometry args={[0.52, 2, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh position={[0.35, -0.55, 0]}>
        <boxGeometry args={[0.52, 2, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>
    </group>
  );
}

// Select the correct garment
function GarmentModel({ garment, color, fabric }: GarmentViewerProps) {
  switch (garment) {
    case "Dress":
      return <Dress color={color} fabric={fabric} />;

    case "Jacket":
      return <Jacket color={color} fabric={fabric} />;

    case "Skirt":
      return <Skirt color={color} fabric={fabric} />;

    case "Pants":
      return <Pants color={color} fabric={fabric} />;

    case "Shirt":
    default:
      return <Shirt color={color} fabric={fabric} />;
  }
}

// Main interactive 3D viewer
export default function GarmentViewer({
  color,
  garment,
  fabric = "Cotton",
}: GarmentViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false);

  function toggleRotation() {
    setAutoRotate((previous) => !previous);
  }

  return (
    <div className="garment-viewer-container">
      <div className="garment-viewer">
        <Canvas
          camera={{
            position: [0, 0, 7],
            fov: 45,
          }}
        >
          <ambientLight intensity={1.5} />

          <directionalLight position={[5, 5, 5]} intensity={2} />

          <directionalLight position={[-4, 2, -3]} intensity={0.7} />

          <GarmentModel garment={garment} color={color} fabric={fabric} />

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={8}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
          />
        </Canvas>
      </div>

      <button
        type="button"
        className="rotation-button"
        onClick={toggleRotation}
        aria-pressed={autoRotate}
      >
        {autoRotate ? "Stop Rotation" : "Auto Rotate"}
      </button>
    </div>
  );
}
