
import { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type GarmentType =
  | 'Dress'
  | 'Jacket'
  | 'Shirt'
  | 'Skirt'
  | 'Pants'

type FabricType =
  | 'Cotton'
  | 'Silk'
  | 'Denim'
  | 'Leather'

export type GarmentSize =
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | 'XXL'

export type SleeveLength =
  | 'Sleeveless'
  | 'Short'
  | 'Three-Quarter'
  | 'Long'

export type GarmentFit =
  | 'Slim'
  | 'Regular'
  | 'Relaxed'
  | 'Oversized'

type GarmentViewerProps = {
  garment: GarmentType
  color: string
  fabric?: FabricType
  size?: GarmentSize
  sleeveLength?: SleeveLength
  fit?: GarmentFit
}

type ModelProps = {
  color: string
  fabric: FabricType
  sleeveLength: SleeveLength
}

const fabricMaterials = {
  Cotton: { roughness: 0.95, metalness: 0 },
  Silk: { roughness: 0.2, metalness: 0.1 },
  Denim: { roughness: 1, metalness: 0 },
  Leather: { roughness: 0.35, metalness: 0.05 },
}

const garmentSizeScale: Record<GarmentSize, number> = {
  XS: 0.8,
  S: 0.9,
  M: 1,
  L: 1.1,
  XL: 1.2,
  XXL: 1.3,
}

const fitScale: Record<GarmentFit, number> = {
  Slim: 0.85,
  Regular: 1,
  Relaxed: 1.12,
  Oversized: 1.25,
}

const DEFAULT_CAMERA_DISTANCE = 7
const MIN_CAMERA_DISTANCE = 3
const MAX_CAMERA_DISTANCE = 8
const ZOOM_STEP = 0.8

function Fabric({
  color,
  fabric,
}: {
  color: string
  fabric: FabricType
}) {
  const material = fabricMaterials[fabric]

  return (
    <meshStandardMaterial
      color={color}
      roughness={material.roughness}
      metalness={material.metalness}
    />
  )
}

// ==========================================
// REUSABLE SLEEVES
// ==========================================

function Sleeves({
  color,
  fabric,
  sleeveLength,
}: ModelProps) {
  if (sleeveLength === 'Sleeveless') {
    return null
  }

  const lengths: Record<
    Exclude<SleeveLength, 'Sleeveless'>,
    number
  > = {
    Short: 0.6,
    'Three-Quarter': 1.15,
    Long: 1.55,
  }

  const length = lengths[sleeveLength]

  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          position={[
            side * (0.75 + length * 0.34),
            0.55 - length * 0.2,
            0,
          ]}
          rotation={[0, 0, side * 0.4]}
        >
          <boxGeometry args={[length, 0.55, 0.4]} />
          <Fabric color={color} fabric={fabric} />
        </mesh>
      ))}
    </group>
  )
}

// ==========================================
// GARMENT MODELS
// ==========================================

function Shirt(props: ModelProps) {
  const { color, fabric, sleeveLength } = props

  return (
    <group>
      <mesh>
        <boxGeometry args={[1.5, 1.8, 0.35]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>

      <Sleeves
        color={color}
        fabric={fabric}
        sleeveLength={sleeveLength}
      />
    </group>
  )
}

function Dress(props: ModelProps) {
  const { color, fabric, sleeveLength } = props

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

      <group position={[0, 0.65, 0]}>
        <Sleeves
          color={color}
          fabric={fabric}
          sleeveLength={sleeveLength}
        />
      </group>
    </group>
  )
}

function Jacket(props: ModelProps) {
  const { color, fabric } = props

  return (
    <group>
      <Shirt {...props} />

      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[0.06, 1.8, 0.05]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.8, 0.2]}>
        <boxGeometry args={[0.7, 0.15, 0.12]} />
        <Fabric color={color} fabric={fabric} />
      </mesh>
    </group>
  )
}

function Skirt({ color, fabric }: ModelProps) {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry args={[0.55, 1.3, 1.8, 32]} />
      <Fabric color={color} fabric={fabric} />
    </mesh>
  )
}

function Pants({ color, fabric }: ModelProps) {
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
  )
}

function GarmentModel({
  garment,
  color,
  fabric = 'Cotton',
  sleeveLength = 'Short',
}: GarmentViewerProps) {
  const props: ModelProps = {
    color,
    fabric,
    sleeveLength,
  }

  switch (garment) {
    case 'Dress':
      return <Dress {...props} />
    case 'Jacket':
      return <Jacket {...props} />
    case 'Skirt':
      return <Skirt {...props} />
    case 'Pants':
      return <Pants {...props} />
    case 'Shirt':
    default:
      return <Shirt {...props} />
  }
}

// ==========================================
// CAMERA CONTROLS
// ==========================================

type CameraControlsProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  autoRotate: boolean
  onDistanceChange: (distance: number) => void
}

function CameraControls({
  controlsRef,
  autoRotate,
  onDistanceChange,
}: CameraControlsProps) {
  const { camera } = useThree()

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
      onEnd={() => {
        const controls = controlsRef.current
        if (controls) {
          onDistanceChange(
            camera.position.distanceTo(controls.target)
          )
        }
      }}
    />
  )
}

// ==========================================
// MAIN VIEWER
// ==========================================

export default function GarmentViewer({
  garment,
  color,
  fabric = 'Cotton',
  size = 'M',
  sleeveLength = 'Short',
  fit = 'Regular',
}: GarmentViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [cameraDistance, setCameraDistance] = useState(
    DEFAULT_CAMERA_DISTANCE
  )

  const viewerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  function changeZoom(amount: number) {
    const controls = controlsRef.current
    if (!controls) return

    const camera = controls.object
    const direction = camera.position
      .clone()
      .sub(controls.target)

    const currentDistance = direction.length()
    const nextDistance = Math.max(
      MIN_CAMERA_DISTANCE,
      Math.min(
        MAX_CAMERA_DISTANCE,
        currentDistance + amount
      )
    )

    direction.normalize().multiplyScalar(nextDistance)

    camera.position.copy(
      controls.target.clone().add(direction)
    )

    controls.update()
    setCameraDistance(nextDistance)
  }

  function handleResetCamera() {
    const controls = controlsRef.current
    if (!controls) return

    setAutoRotate(false)
    controls.reset()
    controls.object.position.set(
      0,
      0,
      DEFAULT_CAMERA_DISTANCE
    )
    controls.target.set(0, 0, 0)
    controls.update()
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
  }

  function handleDownloadPNG() {
    setDownloadError('')

    try {
      const canvas =
        viewerRef.current?.querySelector('canvas')

      if (!canvas) {
        throw new Error('3D canvas not found.')
      }

      const imageUrl = canvas.toDataURL('image/png')

      if (!imageUrl.startsWith('data:image/png')) {
        throw new Error('Could not generate PNG image.')
      }

      const link = document.createElement('a')
      link.href = imageUrl
      link.download =
        `styleverse-${garment.toLowerCase()}-${size.toLowerCase()}-${fit.toLowerCase()}.png`

      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('PNG download failed:', error)
      setDownloadError(
        'Unable to download the 3D preview. Please try again.'
      )
    }
  }

  const sizeScale = garmentSizeScale[size]
  const widthScale = fitScale[fit]

  return (
    <div className="garment-viewer-container">
      <div className="garment-viewer" ref={viewerRef}>
        <Canvas
          camera={{
            position: [0, 0, DEFAULT_CAMERA_DISTANCE],
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
            args={['#ffffff']}
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

          {/* Size changes overall scale.
              Fit changes width and depth. */}
          <group scale={sizeScale}>
            <group scale={[widthScale, 1, widthScale]}>
              <GarmentModel
                garment={garment}
                color={color}
                fabric={fabric}
                sleeveLength={sleeveLength}
              />
            </group>
          </group>

          <CameraControls
            controlsRef={controlsRef}
            autoRotate={autoRotate}
            onDistanceChange={setCameraDistance}
          />
        </Canvas>
      </div>

      <div className="viewer-camera-controls">
        <button
          type="button"
          className="viewer-control-button"
          onClick={() => changeZoom(-ZOOM_STEP)}
        >
          + Zoom In
        </button>

        <button
          type="button"
          className="viewer-control-button"
          onClick={() => changeZoom(ZOOM_STEP)}
        >
          − Zoom Out
        </button>

        <button
          type="button"
          className="viewer-control-button"
          onClick={handleResetCamera}
        >
          ↺ Reset Camera
        </button>
      </div>

      <div className="garment-viewer-actions">
        <button
          type="button"
          className="rotation-button"
          onClick={() => setAutoRotate((value) => !value)}
          aria-pressed={autoRotate}
        >
          {autoRotate
            ? '⏸ Stop Rotation'
            : '▶ Auto Rotate'}
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
        <p className="design-error" role="alert">
          {downloadError}
        </p>
      )}

      <div className="viewer-distance-indicator">
        <span>
          Size: <strong>{size}</strong>
        </span>
        {' • '}
        <span>
          Fit: <strong>{fit}</strong>
        </span>
        {' • '}
        <span>
          Camera distance: {cameraDistance.toFixed(1)}
        </span>
      </div>
    </div>
  )
}
