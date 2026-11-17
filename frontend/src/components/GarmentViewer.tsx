
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// ==========================================
// TYPES
// ==========================================

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

// ==========================================
// CONSTANTS
// ==========================================

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

const fabricProperties: Record<
  FabricType,
  {
    roughness: number
    metalness: number
    bumpScale: number
  }
> = {
  Cotton: {
    roughness: 0.95,
    metalness: 0,
    bumpScale: 0.025,
  },
  Silk: {
    roughness: 0.22,
    metalness: 0.05,
    bumpScale: 0.006,
  },
  Denim: {
    roughness: 0.9,
    metalness: 0,
    bumpScale: 0.04,
  },
  Leather: {
    roughness: 0.38,
    metalness: 0.04,
    bumpScale: 0.025,
  },
}

const DEFAULT_CAMERA_DISTANCE = 7
const MIN_CAMERA_DISTANCE = 3
const MAX_CAMERA_DISTANCE = 8
const ZOOM_STEP = 0.8

// ==========================================
// PROCEDURAL FABRIC TEXTURE GENERATOR
// ==========================================

function createFabricTexture(fabric: FabricType) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create fabric texture.')
  }

  const width = canvas.width
  const height = canvas.height

  // White and gray patterns allow the garment
  // color to remain visible when multiplied
  // by the texture.

  context.fillStyle = '#eeeeee'
  context.fillRect(0, 0, width, height)

  switch (fabric) {
    case 'Cotton': {
      // Small intersecting fibers

      context.strokeStyle = 'rgba(90,90,90,0.22)'
      context.lineWidth = 1

      for (let x = 0; x < width; x += 7) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, height)
        context.stroke()
      }

      for (let y = 0; y < height; y += 7) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }

      context.fillStyle = 'rgba(255,255,255,0.3)'

      for (let x = 0; x < width; x += 7) {
        for (let y = 0; y < height; y += 7) {
          context.fillRect(x, y, 3, 3)
        }
      }

      break
    }

    case 'Silk': {
      // Fine horizontal fibers and soft bands

      const gradient = context.createLinearGradient(
        0,
        0,
        width,
        height
      )

      gradient.addColorStop(0, '#dddddd')
      gradient.addColorStop(0.3, '#ffffff')
      gradient.addColorStop(0.6, '#e2e2e2')
      gradient.addColorStop(1, '#ffffff')

      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)

      for (let y = 0; y < height; y += 3) {
        context.strokeStyle =
          y % 9 === 0
            ? 'rgba(100,100,100,0.09)'
            : 'rgba(255,255,255,0.16)'

        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }

      break
    }

    case 'Denim': {
      // Diagonal twill weave

      context.fillStyle = '#dedede'
      context.fillRect(0, 0, width, height)

      context.strokeStyle = 'rgba(70,70,70,0.35)'
      context.lineWidth = 2

      for (let offset = -height; offset < width + height; offset += 9) {
        context.beginPath()
        context.moveTo(offset, 0)
        context.lineTo(offset + height, height)
        context.stroke()
      }

      context.strokeStyle = 'rgba(255,255,255,0.3)'
      context.lineWidth = 1

      for (let x = 0; x < width; x += 6) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, height)
        context.stroke()
      }

      break
    }

    case 'Leather': {
      // Deterministic pseudo-random grain

      context.fillStyle = '#e6e6e6'
      context.fillRect(0, 0, width, height)

      let seed = 123456

      const random = () => {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }

      for (let i = 0; i < 4500; i++) {
        const x = random() * width
        const y = random() * height
        const radius = 0.3 + random() * 1.6

        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)

        context.fillStyle =
          random() > 0.5
            ? 'rgba(75,75,75,0.16)'
            : 'rgba(255,255,255,0.4)'

        context.fill()
      }

      break
    }
  }

  const texture = new CanvasTexture(canvas)

  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping

  texture.repeat.set(3, 3)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

// ==========================================
// FABRIC MATERIAL
// ==========================================

function Fabric({
  color,
  fabric,
}: {
  color: string
  fabric: FabricType
}) {
  const texture = useMemo(
    () => createFabricTexture(fabric),
    [fabric]
  )

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  const properties = fabricProperties[fabric]

  return (
    <meshStandardMaterial
      color={color}
      map={texture}
      bumpMap={texture}
      bumpScale={properties.bumpScale}
      roughness={properties.roughness}
      metalness={properties.metalness}
    />
  )
}

// ==========================================
// SLEEVE COMPONENT
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
          <boxGeometry
            args={[length, 0.55, 0.4]}
          />

          <Fabric
            color={color}
            fabric={fabric}
          />
        </mesh>
      ))}
    </group>
  )
}

// ==========================================
// SHIRT
// ==========================================

function Shirt({
  color,
  fabric,
  sleeveLength,
}: ModelProps) {
  return (
    <group>
      <mesh>
        <boxGeometry
          args={[1.5, 1.8, 0.35]}
        />

        <Fabric
          color={color}
          fabric={fabric}
        />
      </mesh>

      <Sleeves
        color={color}
        fabric={fabric}
        sleeveLength={sleeveLength}
      />
    </group>
  )
}

// ==========================================
// DRESS
// ==========================================

function Dress({
  color,
  fabric,
  sleeveLength,
}: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry
          args={[0.45, 0.65, 1.1, 32]}
        />

        <Fabric
          color={color}
          fabric={fabric}
        />
      </mesh>

      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry
          args={[0.55, 1.3, 1.7, 32]}
        />

        <Fabric
          color={color}
          fabric={fabric}
        />
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

// ==========================================
// JACKET
// ==========================================

function Jacket(props: ModelProps) {
  return (
    <group>
      <Shirt {...props} />

      <mesh position={[0, 0, 0.22]}>
        <boxGeometry
          args={[0.06, 1.8, 0.05]}
        />

        <meshStandardMaterial
          color="#ffffff"
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.8, 0.2]}>
        <boxGeometry
          args={[0.7, 0.15, 0.12]}
        />

        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
      </mesh>
    </group>
  )
}

// ==========================================
// SKIRT
// ==========================================

function Skirt({
  color,
  fabric,
}: ModelProps) {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry
        args={[0.55, 1.3, 1.8, 32]}
      />

      <Fabric
        color={color}
        fabric={fabric}
      />
    </mesh>
  )
}

// ==========================================
// PANTS
// ==========================================

function Pants({
  color,
  fabric,
}: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry
          args={[1.25, 0.5, 0.4]}
        />

        <Fabric
          color={color}
          fabric={fabric}
        />
      </mesh>

      <mesh position={[-0.35, -0.55, 0]}>
        <boxGeometry
          args={[0.52, 2, 0.4]}
        />

        <Fabric
          color={color}
          fabric={fabric}
        />
      </mesh>

      <mesh position={[0.35, -0.55, 0]}>
        <boxGeometry
          args={[0.52, 2, 0.4]}
        />

        <Fabric
          color={color}
          fabric={fabric}
        />
      </mesh>
    </group>
  )
}

// ==========================================
// GARMENT MODEL SWITCH
// ==========================================

function GarmentModel({
  garment,
  color,
  fabric = 'Cotton',
  sleeveLength = 'Short',
}: GarmentViewerProps) {
  const modelProps: ModelProps = {
    color,
    fabric,
    sleeveLength,
  }

  switch (garment) {
    case 'Dress':
      return <Dress {...modelProps} />

    case 'Jacket':
      return <Jacket {...modelProps} />

    case 'Shirt':
      return <Shirt {...modelProps} />

    case 'Skirt':
      return <Skirt {...modelProps} />

    case 'Pants':
      return <Pants {...modelProps} />

    default:
      return <Dress {...modelProps} />
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
            camera.position.distanceTo(
              controls.target
            )
          )
        }
      }}
    />
  )
}

// ==========================================
// MAIN GARMENT VIEWER
// ==========================================

export default function GarmentViewer({
  garment,
  color,
  fabric = 'Cotton',
  size = 'M',
  sleeveLength = 'Short',
  fit = 'Regular',
}: GarmentViewerProps) {
  const [autoRotate, setAutoRotate] =
    useState(false)

  const [downloadError, setDownloadError] =
    useState('')

  const [cameraDistance, setCameraDistance] =
    useState(DEFAULT_CAMERA_DISTANCE)

  const viewerRef = useRef<HTMLDivElement>(null)

  const controlsRef =
    useRef<OrbitControlsImpl | null>(null)

  // ========================================
  // ZOOM
  // ========================================

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

    direction
      .normalize()
      .multiplyScalar(nextDistance)

    camera.position.copy(
      controls.target.clone().add(direction)
    )

    controls.update()
    setCameraDistance(nextDistance)
  }

  // ========================================
  // RESET CAMERA
  // ========================================

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

  // ========================================
  // PNG DOWNLOAD
  // ========================================

  function handleDownloadPNG() {
    setDownloadError('')

    try {
      const canvas =
        viewerRef.current?.querySelector('canvas')

      if (!canvas) {
        throw new Error('3D canvas not found.')
      }

      const imageUrl =
        canvas.toDataURL('image/png')

      if (
        !imageUrl.startsWith('data:image/png')
      ) {
        throw new Error(
          'Could not generate PNG image.'
        )
      }

      const link =
        document.createElement('a')

      link.href = imageUrl

      link.download =
        `styleverse-${garment.toLowerCase()}-${fabric.toLowerCase()}-${size.toLowerCase()}-${fit.toLowerCase()}.png`

      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error(
        'PNG download failed:',
        error
      )

      setDownloadError(
        'Unable to download the 3D preview. Please try again.'
      )
    }
  }

  const sizeScale = garmentSizeScale[size]
  const widthScale = fitScale[fit]

  return (
    <div className="garment-viewer-container">
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

          {/* GARMENT SIZE AND FIT */}

          <group scale={sizeScale}>
            <group
              scale={[
                widthScale,
                1,
                widthScale,
              ]}
            >
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
            onDistanceChange={
              setCameraDistance
            }
          />
        </Canvas>
      </div>

      {/* CAMERA BUTTONS */}

      <div className="viewer-camera-controls">
        <button
          type="button"
          className="viewer-control-button"
          onClick={() =>
            changeZoom(-ZOOM_STEP)
          }
        >
          + Zoom In
        </button>

        <button
          type="button"
          className="viewer-control-button"
          onClick={() =>
            changeZoom(ZOOM_STEP)
          }
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

      {/* ROTATION AND EXPORT */}

      <div className="garment-viewer-actions">
        <button
          type="button"
          className="rotation-button"
          onClick={() =>
            setAutoRotate((value) => !value)
          }
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
        <p
          className="design-error"
          role="alert"
        >
          {downloadError}
        </p>
      )}

      {/* CURRENT CUSTOMIZATIONS */}

      <div className="viewer-distance-indicator">
        <span>
          Fabric: <strong>{fabric}</strong>
        </span>

        {' • '}

        <span>
          Size: <strong>{size}</strong>
        </span>

        {' • '}

        <span>
          Fit: <strong>{fit}</strong>
        </span>

        {' • '}

        <span>
          Camera distance:{' '}
          {cameraDistance.toFixed(1)}
        </span>
      </div>
    </div>
  )
}
