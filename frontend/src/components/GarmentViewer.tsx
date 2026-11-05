
import { useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type GarmentType =
  | "Dress"
  | "Jacket"
  | "Shirt"
  | "Skirt"
  | "Pants";

type FabricType =
  | "Cotton"
  | "Silk"
  | "Denim"
  | "Leather";

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

const DEFAULT_CAMERA_DISTANCE = 7;
const MIN_CAMERA_DISTANCE = 3;
const MAX_CAMERA_DISTANCE = 8;
const ZOOM_STEP = 0.8;

// ==========================================
// FABRIC MATERIAL
// ==========================================

function Fabric({
  color,
  fabric = "Cotton",
}: GarmentMaterialProps) {
  const material = fabricMaterials[fabric];

  return (
    <meshStandardMaterial
      color={color}
      roughness={material.roughness}
      metalness={material.metalness}
    />
  );
}

// ==========================================
// SHIRT MODEL
// ==========================================

function Shirt({
  color,
  fabric,
}: GarmentMaterialProps) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.5, 1.8, 0.35]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh
        position={[-1.05, 0.55, 0]}
        rotation={[0, 0, -0.4]}
      >
        <boxGeometry args={[0.75, 0.6, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh
        position={[1.05, 0.55, 0]}
        rotation={[0, 0, 0.4]}
      >
        <boxGeometry args={[0.75, 0.6, 0.4]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>
    </group>
  );
}

// ==========================================
// DRESS MODEL
// ==========================================

function Dress({
  color,
  fabric,
}: GarmentMaterialProps) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry
          args={[0.45, 0.65, 1.1, 32]}
        />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry
          args={[0.55, 1.3, 1.7, 32]}
        />
        <Fabric color={color} fabric={fabric} />
      </mesh>
    </group>
  );
}

// ==========================================
// JACKET MODEL
// ==========================================

function Jacket({
  color,
  fabric,
}: GarmentMaterialProps) {
  return (
    <group>
      <Shirt color={color} fabric={fabric} />

      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[0.06, 1.8, 0.05]} />

        <meshStandardMaterial
          color="#ffffff"
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ==========================================
// SKIRT MODEL
// ==========================================

function Skirt({
  color,
  fabric,
}: GarmentMaterialProps) {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry
        args={[0.55, 1.3, 1.8, 32]}
      />
      <Fabric color={color} fabric={fabric} />
    </mesh>
  );
}

// ==========================================
// PANTS MODEL
// ==========================================

function Pants({
  color,
  fabric,
}: GarmentMaterialProps) {
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

// ==========================================
// GARMENT MODEL SELECTOR
// ==========================================

function GarmentModel({
  garment,
  color,
  fabric,
}: GarmentViewerProps) {
  switch (garment) {
    case "Dress":
      return (
        <Dress color={color} fabric={fabric} />
      );

    case "Jacket":
      return (
        <Jacket color={color} fabric={fabric} />
      );

    case "Skirt":
      return (
        <Skirt color={color} fabric={fabric} />
      );

    case "Pants":
      return (
        <Pants color={color} fabric={fabric} />
      );

    case "Shirt":
    default:
      return (
        <Shirt color={color} fabric={fabric} />
      );
  }
}

// ==========================================
// CAMERA CONTROLS
// ==========================================

type CameraControlsProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  autoRotate: boolean;
};

function CameraControls({
  controlsRef,
  autoRotate,
}: CameraControlsProps) {
  const { camera } = useThree();

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableRotate
      enableZoom
      enableDamping
      dampingFactor={0.08}
      minDistance={MIN_CAMERA_DISTANCE}
      maxDistance={MAX_CAMERA_DISTANCE}
      autoRotate={autoRotate}
      autoRotateSpeed={1.5}
      onChange={() => {
        camera.updateProjectionMatrix();
      }}
    />
  );
}

// ==========================================
// MAIN 3D GARMENT VIEWER
// ==========================================

export default function GarmentViewer({
  color,
  garment,
  fabric = "Cotton",
}: GarmentViewerProps) {
  const [autoRotate, setAutoRotate] =
    useState(false);

  const [downloadError, setDownloadError] =
    useState("");

  const [cameraDistance, setCameraDistance] =
    useState(DEFAULT_CAMERA_DISTANCE);

  const viewerRef =
    useRef<HTMLDivElement>(null);

  const controlsRef =
    useRef<OrbitControlsImpl | null>(null);

  // ========================================
  // AUTO ROTATION
  // ========================================

  function toggleRotation() {
    setAutoRotate((previous) => !previous);
  }

  // ========================================
  // ZOOM IN
  // ========================================

  function handleZoomIn() {
    const controls = controlsRef.current;

    if (!controls) return;

    const camera = controls.object;

    const currentDistance =
      camera.position.distanceTo(
        controls.target
      );

    const newDistance = Math.max(
      MIN_CAMERA_DISTANCE,
      currentDistance - ZOOM_STEP
    );

    const direction = camera.position
      .clone()
      .sub(controls.target)
      .normalize();

    camera.position.copy(
      controls.target
        .clone()
        .add(
          direction.multiplyScalar(newDistance)
        )
    );

    controls.update();
    setCameraDistance(newDistance);
  }

  // ========================================
  // ZOOM OUT
  // ========================================

  function handleZoomOut() {
    const controls = controlsRef.current;

    if (!controls) return;

    const camera = controls.object;

    const currentDistance =
      camera.position.distanceTo(
        controls.target
      );

    const newDistance = Math.min(
      MAX_CAMERA_DISTANCE,
      currentDistance + ZOOM_STEP
    );

    const direction = camera.position
      .clone()
      .sub(controls.target)
      .normalize();

    camera.position.copy(
      controls.target
        .clone()
        .add(
          direction.multiplyScalar(newDistance)
        )
    );

    controls.update();
    setCameraDistance(newDistance);
  }

  // ========================================
  // RESET CAMERA
  // ========================================

  function handleResetCamera() {
    const controls = controlsRef.current;

    if (!controls) return;

    setAutoRotate(false);

    controls.reset();

    controls.object.position.set(
      0,
      0,
      DEFAULT_CAMERA_DISTANCE
    );

    controls.target.set(0, 0, 0);
    controls.update();

    setCameraDistance(
      DEFAULT_CAMERA_DISTANCE
    );
  }

  // ========================================
  // DOWNLOAD PNG
  // ========================================

  function handleDownloadPNG() {
    setDownloadError("");

    try {
      const canvas =
        viewerRef.current?.querySelector(
          "canvas"
        );

      if (!canvas) {
        throw new Error(
          "3D canvas not found."
        );
      }

      const imageUrl =
        canvas.toDataURL("image/png");

      if (
        !imageUrl.startsWith(
          "data:image/png"
        )
      ) {
        throw new Error(
          "Could not generate PNG image."
        );
      }

      const link =
        document.createElement("a");

      link.href = imageUrl;

      link.download =
        `styleverse-${garment.toLowerCase()}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(
        "PNG download failed:",
        error
      );

      setDownloadError(
        "Unable to download the 3D preview. Please try again."
      );
    }
  }

  return (
    <div className="garment-viewer-container">
      {/* 3D CANVAS */}

      <div
        className="garment-viewer"
        ref={viewerRef}
      >
        <Canvas
          camera={{
            position: [
              0,
              0,
              DEFAULT_CAMERA_DISTANCE,
            ],
            fov: 45,
          }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: false,
          }}
        >
          <color
            attach="background"
            args={["#ffffff"]}
          />

          <ambientLight intensity={1.5} />

          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
          />

          <directionalLight
            position={[-4, 2, -3]}
            intensity={0.7}
          />

          <GarmentModel
            garment={garment}
            color={color}
            fabric={fabric}
          />

          <CameraControls
            controlsRef={controlsRef}
            autoRotate={autoRotate}
          />
        </Canvas>
      </div>

      {/* CAMERA ACTIONS */}

      <div className="viewer-camera-controls">
        <button
          type="button"
          className="viewer-control-button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          + Zoom In
        </button>

        <button
          type="button"
          className="viewer-control-button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          − Zoom Out
        </button>

        <button
          type="button"
          className="viewer-control-button"
          onClick={handleResetCamera}
          title="Reset camera"
        >
          ↺ Reset Camera
        </button>
      </div>

      {/* ROTATION & DOWNLOAD */}

      <div className="garment-viewer-actions">
        <button
          type="button"
          className="rotation-button"
          onClick={toggleRotation}
          aria-pressed={autoRotate}
        >
          {autoRotate
            ? "⏸ Stop Rotation"
            : "▶ Auto Rotate"}
        </button>

        <button
          type="button"
          className="download-button"
          onClick={handleDownloadPNG}
        >
          📸 Download 3D Preview (PNG)
        </button>
      </div>

      <p className="viewer-help-text">
        Drag to rotate • Scroll to zoom •
        Use buttons to adjust the view
      </p>

      {downloadError && (
        <p
          className="design-error"
          role="alert"
        >
          {downloadError}
        </p>
      )}

      <span className="viewer-distance-indicator">
        Camera distance:{" "}
        {cameraDistance.toFixed(1)}
      </span>
    </div>
  );
}
