
import { useRef, useState } from 'react'
import GarmentViewer from './GarmentViewer'
import { createDesign } from '../services/api'

// Garment types
type GarmentType = 'Dress' | 'Jacket' | 'Shirt' | 'Skirt' | 'Pants'

// Fabric types
type FabricType = 'Cotton' | 'Silk' | 'Denim' | 'Leather'

// Available garments
const garmentOptions: GarmentType[] = [
  'Dress',
  'Jacket',
  'Shirt',
  'Skirt',
  'Pants',
]

// Available fabrics
const fabricOptions: FabricType[] = [
  'Cotton',
  'Silk',
  'Denim',
  'Leather',
]

// Preset garment colors
const colorPresets = [
  { name: 'Rose', value: '#a53d78' },
  { name: 'Black', value: '#29252b' },
  { name: 'White', value: '#f4f0eb' },
  { name: 'Blue', value: '#4779c7' },
  { name: 'Green', value: '#42856a' },
]

// Created design information
type CreatedDesign = {
  garment: GarmentType
  color: string
  fabric: FabricType
  description: string
}

// Props received from DesignStudio.tsx
type DesignWorkspaceProps = {
  onDesignSaved: () => void
}

export default function DesignWorkspace({
  onDesignSaved,
}: DesignWorkspaceProps) {
  // Current design settings
  const [garment, setGarment] = useState<GarmentType>('Dress')
  const [color, setColor] = useState('#a53d78')
  const [fabric, setFabric] = useState<FabricType>('Cotton')
  const [description, setDescription] = useState('')

  // API request state
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [design, setDesign] = useState<CreatedDesign | null>(null)

  // Ignore outdated API responses after Reset
  const requestVersion = useRef(0)

  // Send a design to FastAPI and save it in SQLite
  async function handleGenerate() {
    const trimmedDescription = description.trim()

    if (!trimmedDescription || isCreating) {
      return
    }

    const currentRequest = ++requestVersion.current

    const newDesign: CreatedDesign = {
      garment,
      color,
      fabric,
      description: trimmedDescription,
    }

    setIsCreating(true)
    setError('')
    setDesign(null)

    try {
      const response = await createDesign(newDesign)

      // Ignore a response if Reset was clicked
      if (currentRequest !== requestVersion.current) {
        return
      }

      // Show the design returned by FastAPI
      setDesign({
        garment: response.design.garment as GarmentType,
        color: response.design.color,
        fabric: response.design.fabric as FabricType,
        description: response.design.description,
      })

      // Tell DesignStudio to refresh My Saved Designs
      onDesignSaved()
    } catch (err) {
      if (currentRequest !== requestVersion.current) {
        return
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save design. Please try again.'
      )
    } finally {
      if (currentRequest === requestVersion.current) {
        setIsCreating(false)
      }
    }
  }

  // Reset all design settings
  function handleReset() {
    requestVersion.current += 1

    setGarment('Dress')
    setColor('#a53d78')
    setFabric('Cotton')
    setDescription('')
    setDesign(null)
    setError('')
    setIsCreating(false)
  }

  return (
    <div className="design-workspace">
      {/* ======================================
          LEFT PANEL — DESIGN CONTROLS
      ====================================== */}

      <div className="design-controls">
        <span className="eyebrow">
          YOUR CREATIVE STUDIO
        </span>

        <h2>Design your outfit</h2>

        <p>
          Choose a garment, customize its color and fabric,
          and describe your fashion vision.
        </p>

        {/* Garment selection */}
        <label htmlFor="garment">
          Garment type
        </label>

        <select
          id="garment"
          value={garment}
          onChange={(event) =>
            setGarment(event.target.value as GarmentType)
          }
        >
          {garmentOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Custom color picker */}
        <label htmlFor="garment-color">
          Garment color
        </label>

        <input
          id="garment-color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />

        {/* Color preset buttons */}
        <div
          className="color-presets"
          role="group"
          aria-label="Preset garment colors"
        >
          {colorPresets.map((preset) => {
            const isSelected =
              color.toLowerCase() === preset.value

            return (
              <button
                key={preset.name}
                type="button"
                className={`color-swatch ${
                  isSelected ? 'selected' : ''
                }`}
                style={{
                  backgroundColor: preset.value,
                }}
                onClick={() => setColor(preset.value)}
                aria-label={`Select ${preset.name} color`}
                aria-pressed={isSelected}
                title={preset.name}
              />
            )
          })}
        </div>

        {/* Fabric selection */}
        <label htmlFor="fabric">
          Fabric type
        </label>

        <select
          id="fabric"
          value={fabric}
          onChange={(event) =>
            setFabric(event.target.value as FabricType)
          }
        >
          {fabricOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Design description */}
        <label htmlFor="design-description">
          Describe your design
        </label>

        <textarea
          id="design-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Example: A modern evening dress with elegant sleeves and floral details"
          rows={5}
        />

        {/* Create Design button */}
        <button
          type="button"
          className="primary-button"
          onClick={handleGenerate}
          disabled={!description.trim() || isCreating}
        >
          {isCreating ? 'Creating Design...' : 'Create Design'}
        </button>

        {/* Reset Design button */}
        <button
          type="button"
          className="reset-button"
          onClick={handleReset}
        >
          Reset Design
        </button>

        {/* API error message */}
        {error && (
          <p className="design-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* ======================================
          RIGHT PANEL — DESIGN PREVIEW
      ====================================== */}

      <div className="design-preview">
        <span className="eyebrow">
          DESIGN PREVIEW
        </span>

        <div className="preview-canvas">
          {/* Interactive 3D garment */}
          <GarmentViewer
            garment={garment}
            color={color}
            fabric={fabric}
          />

          {/* Current selection */}
          <h3>{garment}</h3>

          <p>
            <strong>Fabric:</strong> {fabric}
          </p>

          <p>
            <strong>Color:</strong> {color.toUpperCase()}
          </p>

          <p>
            {description.trim()
              ? description
              : 'Your fashion concept will appear here.'}
          </p>
        </div>

        {/* ======================================
            ENHANCED DESIGN DETAILS
        ====================================== */}

        <div className="design-details">
          <h3>Design Details</h3>

          {/* Garment */}
          <div className="design-detail-row">
            <span>Garment</span>
            <strong>{garment}</strong>
          </div>

          {/* Fabric */}
          <div className="design-detail-row">
            <span>Fabric</span>
            <strong>{fabric}</strong>
          </div>

          {/* Color */}
          <div className="design-detail-row">
            <span>Color</span>

            <div className="design-color-value">
              <span
                className="design-color-indicator"
                style={{
                  backgroundColor: color,
                }}
                aria-hidden="true"
              />

              <strong>{color.toUpperCase()}</strong>
            </div>
          </div>

          {/* Description */}
          <div className="design-detail-description">
            <span>Design Description</span>

            <p>
              {description.trim() ||
                'Add a description to personalize your design.'}
            </p>
          </div>
        </div>

        {/* ======================================
            SAVED DESIGN SUMMARY
        ====================================== */}

        {design && (
          <div className="preview-note" role="status">
            <h3>Design Saved Successfully!</h3>

            <p>
              Your fashion design was saved to SQLite.
            </p>

            <p>
              <strong>Garment:</strong> {design.garment}
            </p>

            <p>
              <strong>Fabric:</strong> {design.fabric}
            </p>

            <p>
              <strong>Color:</strong> {design.color.toUpperCase()}
            </p>

            <p>
              <strong>Description:</strong> {design.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}