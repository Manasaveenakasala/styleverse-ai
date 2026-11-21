
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type GarmentType = 'Dress' | 'Jacket' | 'Shirt' | 'Skirt' | 'Pants'
type FabricType = 'Cotton' | 'Silk' | 'Denim' | 'Leather'

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

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

export type FabricPattern =
  | 'Solid'
  | 'Stripes'
  | 'Floral'
  | 'Plaid'
  | 'Polka Dots'

type CameraView = 'Front' | 'Back' | 'Left' | 'Right'

type GarmentViewerProps = {
  garment: GarmentType
  color: string
  fabric?: FabricType
  size?: GarmentSize
  sleeveLength?: SleeveLength
  fit?: GarmentFit
  pattern?: FabricPattern
  onPatternChange?: (pattern: FabricPattern) => void
}

type ModelProps = {
  color: string
  fabric: FabricType
  sleeveLength: SleeveLength
}

const PatternContext = createContext<FabricPattern>('Solid')

const PATTERNS: FabricPattern[] = [
  'Solid',
  'Stripes',
  'Floral',
  'Plaid',
  'Polka Dots',
]

const sizeScales: Record<GarmentSize, number> = {
  XS: 0.8,
  S: 0.9,
  M: 1,
  L: 1.1,
  XL: 1.2,
  XXL: 1.3,
}

const fitScales: Record<GarmentFit, number> = {
  Slim: 0.85,
  Regular: 1,
  Relaxed: 1.12,
  Oversized: 1.25,
}

const materialProperties = {
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

const CAMERA_DISTANCE = 7
const MIN_DISTANCE = 3
const MAX_DISTANCE = 8
const ZOOM_STEP = 0.8

// ==========================================
// FABRIC TEXTURES AND PATTERNS
// ==========================================

function createFabricTexture(
  fabric: FabricType,
  pattern: FabricPattern
) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D is unavailable.')
  }

  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#eeeeee'
  ctx.fillRect(0, 0, w, h)

  // Base fabric texture
  switch (fabric) {
    case 'Cotton': {
      ctx.strokeStyle = 'rgba(90,90,90,0.22)'
      ctx.lineWidth = 1

      for (let x = 0; x < w; x += 7) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      for (let y = 0; y < h; y += 7) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(255,255,255,0.3)'

      for (let x = 0; x < w; x += 7) {
        for (let y = 0; y < h; y += 7) {
          ctx.fillRect(x, y, 3, 3)
        }
      }

      break
    }

    case 'Silk': {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        w,
        h
      )

      gradient.addColorStop(0, '#dddddd')
      gradient.addColorStop(0.3, '#ffffff')
      gradient.addColorStop(0.6, '#e2e2e2')
      gradient.addColorStop(1, '#ffffff')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      for (let y = 0; y < h; y += 3) {
        ctx.strokeStyle =
          y % 9 === 0
            ? 'rgba(100,100,100,0.09)'
            : 'rgba(255,255,255,0.16)'

        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      break
    }

    case 'Denim': {
      ctx.fillStyle = '#dedede'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(70,70,70,0.35)'
      ctx.lineWidth = 2

      for (
        let offset = -h;
        offset < w + h;
        offset += 9
      ) {
        ctx.beginPath()
        ctx.moveTo(offset, 0)
        ctx.lineTo(offset + h, h)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1

      for (let x = 0; x < w; x += 6) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      break
    }

    case 'Leather': {
      ctx.fillStyle = '#e6e6e6'
      ctx.fillRect(0, 0, w, h)

      let seed = 123456

      const random = () => {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }

      for (let i = 0; i < 4500; i++) {
        ctx.beginPath()
        ctx.arc(
          random() * w,
          random() * h,
          0.3 + random() * 1.6,
          0,
          Math.PI * 2
        )

        ctx.fillStyle =
          random() > 0.5
            ? 'rgba(75,75,75,0.16)'
            : 'rgba(255,255,255,0.4)'

        ctx.fill()
      }

      break
    }
  }

  // Overlay selected pattern
  if (pattern !== 'Solid') {
    ctx.save()

    ctx.strokeStyle = 'rgba(35,35,35,0.58)'
    ctx.fillStyle = 'rgba(35,35,35,0.62)'

    switch (pattern) {
      case 'Stripes': {
        for (let x = 0; x < w; x += 48) {
          ctx.fillRect(x, 0, 11, h)
        }
        break
      }

      case 'Plaid': {
        for (let x = 0; x < w; x += 64) {
          ctx.fillRect(x, 0, 13, h)
          ctx.fillRect(x + 22, 0, 4, h)
        }

        for (let y = 0; y < h; y += 64) {
          ctx.fillRect(0, y, w, 13)
          ctx.fillRect(0, y + 22, w, 4)
        }

        break
      }

      case 'Polka Dots': {
        for (let y = 20; y < h; y += 48) {
          for (let x = 20; x < w; x += 48) {
            ctx.beginPath()
            ctx.arc(
              x + (Math.floor(y / 48) % 2) * 24,
              y,
              9,
              0,
              Math.PI * 2
            )
            ctx.fill()
          }
        }

        break
      }

      case 'Floral': {
        for (let y = 32; y < h; y += 64) {
          for (let x = 32; x < w; x += 64) {
            const cx =
              x + (Math.floor(y / 64) % 2) * 18

            for (let petal = 0; petal < 5; petal++) {
              const angle =
                (petal * Math.PI * 2) / 5

              ctx.beginPath()
              ctx.ellipse(
                cx + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                7,
                4,
                angle,
                0,
                Math.PI * 2
              )
              ctx.fill()
            }

            ctx.beginPath()
            ctx.arc(cx, y, 4, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255,255,255,0.85)'
            ctx.fill()

            ctx.fillStyle = 'rgba(35,35,35,0.62)'
          }
        }

        break
      }
    }

    ctx.restore()
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
  const pattern = useContext(PatternContext)

  const texture = useMemo(
    () => createFabricTexture(fabric, pattern),
    [fabric, pattern]
  )

  useEffect(() => {
    return () => texture.dispose()
  }, [texture])

  const properties = materialProperties[fabric]

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
// GARMENT GEOMETRY
// ==========================================

function Sleeves({
  color,
  fabric,
  sleeveLength,
}: ModelProps) {
  if (sleeveLength === 'Sleeveless') {
    return null
  }

  const lengths = {
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
          <capsuleGeometry
            args={[0.28, length, 6, 12]}
          />

          <Fabric color={color} fabric={fabric} />
        </mesh>
      ))}
    </group>
  )
}

function Shirt(props: ModelProps) {
  return (
    <group>
      <mesh>
        <capsuleGeometry
          args={[0.72, 1.1, 8, 24]}
        />
        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
      </mesh>

      <Sleeves {...props} />
    </group>
  )
}

function Dress(props: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry
          args={[0.45, 0.65, 1.1, 32]}
        />
        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
      </mesh>

      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry
          args={[0.55, 1.3, 1.7, 32]}
        />
        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
      </mesh>

      <group position={[0, 0.65, 0]}>
        <Sleeves {...props} />
      </group>
    </group>
  )
}

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

function Skirt(props: ModelProps) {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry
        args={[0.55, 1.3, 1.8, 32]}
      />
      <Fabric
        color={props.color}
        fabric={props.fabric}
      />
    </mesh>
  )
}

function Pants(props: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.65, 0]}>
        <capsuleGeometry
          args={[0.6, 0.35, 6, 16]}
        />
        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
      </mesh>

      <mesh position={[-0.35, -0.55, 0]}>
        <cylinderGeometry
          args={[0.33, 0.22, 2, 16]}
        />
        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
      </mesh>

      <mesh position={[0.35, -0.55, 0]}>
        <cylinderGeometry
          args={[0.33, 0.22, 2, 16]}
        />
        <Fabric
          color={props.color}
          fabric={props.fabric}
        />
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

    case 'Shirt':
      return <Shirt {...props} />

    case 'Skirt':
      return <Skirt {...props} />

    case 'Pants':
      return <Pants {...props} />
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
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
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
// MAIN VIEWER
// ==========================================

export default function GarmentViewer({
  garment,
  color,
  fabric = 'Cotton',
  size = 'M',
  sleeveLength = 'Short',
  fit = 'Regular',
  pattern: controlledPattern,
  onPatternChange,
}: GarmentViewerProps) {
  const [internalPattern, setInternalPattern] =
    useState<FabricPattern>('Solid')

  const pattern = controlledPattern ?? internalPattern

  const [autoRotate, setAutoRotate] = useState(false)

  const [cameraView, setCameraView] =
    useState<CameraView>('Front')

  const [cameraDistance, setCameraDistance] =
    useState(CAMERA_DISTANCE)

  const [downloadError, setDownloadError] =
    useState('')

  const viewerRef = useRef<HTMLDivElement>(null)

  const controlsRef =
    useRef<OrbitControlsImpl | null>(null)

  function handlePatternChange(next: FabricPattern) {
    if (controlledPattern === undefined) {
      setInternalPattern(next)
    }

    onPatternChange?.(next)
  }

  function moveCameraToView(view: CameraView) {
    const controls = controlsRef.current

    if (!controls) return

    const distance = Math.max(
      MIN_DISTANCE,
      Math.min(
        MAX_DISTANCE,
        controls.object.position.distanceTo(
          controls.target
        )
      )
    )

    const directions: Record<CameraView, Vector3> = {
      Front: new Vector3(0, 0, 1),
      Back: new Vector3(0, 0, -1),
      Left: new Vector3(-1, 0, 0),
      Right: new Vector3(1, 0, 0),
    }

    setAutoRotate(false)
    controls.autoRotate = false

    const previousDamping =
      controls.enableDamping

    controls.enableDamping = false

    controls.object.position.copy(
      controls.target
        .clone()
        .add(
          directions[view].multiplyScalar(distance)
        )
    )

    controls.object.up.set(0, 1, 0)
    controls.object.lookAt(controls.target)
    controls.update()

    controls.enableDamping = previousDamping

    setCameraView(view)
    setCameraDistance(distance)
  }

  function changeZoom(amount: number) {
    const controls = controlsRef.current

    if (!controls) return

    const direction = controls.object.position
      .clone()
      .sub(controls.target)

    const nextDistance = Math.max(
      MIN_DISTANCE,
      Math.min(
        MAX_DISTANCE,
        direction.length() + amount
      )
    )

    direction
      .normalize()
      .multiplyScalar(nextDistance)

    controls.object.position.copy(
      controls.target.clone().add(direction)
    )

    controls.update()
    setCameraDistance(nextDistance)
  }

  function handleResetCamera() {
    const controls = controlsRef.current

    if (!controls) return

    setAutoRotate(false)
    controls.autoRotate = false

    const previousDamping =
      controls.enableDamping

    controls.enableDamping = false

    controls.target.set(0, 0, 0)
    controls.object.position.set(
      0,
      0,
      CAMERA_DISTANCE
    )

    controls.object.up.set(0, 1, 0)
    controls.object.lookAt(controls.target)
    controls.update()

    controls.enableDamping = previousDamping

    setCameraView('Front')
    setCameraDistance(CAMERA_DISTANCE)
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
      const link = document.createElement('a')

      link.href = imageUrl

      link.download =
        `styleverse-${garment.toLowerCase()}-` +
        `${fabric.toLowerCase()}-` +
        `${pattern.toLowerCase().replace(/\s+/g, '-')}-` +
        `${cameraView.toLowerCase()}.png`

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

  const sizeScale = sizeScales[size]
  const widthScale = fitScales[fit]

  return (
    <div className="garment-viewer-container">
      <div
        className="garment-viewer"
        ref={viewerRef}
      >
        <Canvas
          camera={{
            position: [0, 0, CAMERA_DISTANCE],
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

          <group scale={sizeScale}>
            <group
              scale={[
                widthScale,
                1,
                widthScale,
              ]}
            >
              <PatternContext.Provider
                value={pattern}
              >
                <GarmentModel
                  garment={garment}
                  color={color}
                  fabric={fabric}
                  sleeveLength={sleeveLength}
                />
              </PatternContext.Provider>
            </group>
          </group>

          <CameraControls
            controlsRef={controlsRef}
            autoRotate={autoRotate}
            onDistanceChange={setCameraDistance}
          />
        </Canvas>
      </div>

      {/* FABRIC PATTERN SELECTOR */}

      <div
        className="fabric-pattern-selector"
        style={{ marginTop: '16px' }}
      >
        <h3
          style={{
            fontSize: '16px',
            marginBottom: '10px',
          }}
        >
          Fabric Pattern
        </h3>

        <div
          role="group"
          aria-label="Fabric patterns"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {PATTERNS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                handlePatternChange(option)
              }
              aria-pressed={pattern === option}
              className={`camera-view-button ${
                pattern === option ? 'active' : ''
              }`}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* CAMERA VIEW BUTTONS */}

      <div
        className="camera-view-grid"
        role="group"
        aria-label="3D camera views"
      >
        {(
          [
            'Front',
            'Back',
            'Left',
            'Right',
          ] as const
        ).map((view) => (
          <button
            key={view}
            type="button"
            className={`camera-view-button ${
              cameraView === view ? 'active' : ''
            }`}
            onClick={() =>
              moveCameraToView(view)
            }
            aria-pressed={
              cameraView === view
            }
          >
            {view} View
          </button>
        ))}
      </div>

      {/* ZOOM AND RESET */}

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

      {/* ROTATION AND DOWNLOAD */}

      <div className="garment-viewer-actions">
        <button
          type="button"
          className="rotation-button"
          onClick={() =>
            setAutoRotate(
              (current) => !current
            )
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
        Select a pattern • Drag to rotate •
        Scroll to zoom
      </p>

      {downloadError && (
        <p
          className="design-error"
          role="alert"
        >
          {downloadError}
        </p>
      )}

      <div className="viewer-distance-indicator">
        <span>
          View: <strong>{cameraView}</strong>
        </span>
        {' • '}
        <span>
          Fabric: <strong>{fabric}</strong>
        </span>
        {' • '}
        <span>
          Pattern: <strong>{pattern}</strong>
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
