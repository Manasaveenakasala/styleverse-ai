
import { useRef, useState } from 'react'
import GarmentViewer from './GarmentViewer'
import {
  createDesign,
  generateDesignSuggestion,
} from '../services/api'

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

type CreatedDesign = {
  garment: GarmentType
  color: string
  fabric: FabricType
  description: string
}

type DesignWorkspaceProps = {
  onDesignSaved: () => void
}

// ==========================================
// OPTIONS
// ==========================================

const garmentOptions: GarmentType[] = [
  'Dress',
  'Jacket',
  'Shirt',
  'Skirt',
  'Pants',
]

const fabricOptions: FabricType[] = [
  'Cotton',
  'Silk',
  'Denim',
  'Leather',
]

const colorPresets = [
  { name: 'Rose', value: '#a53d78' },
  { name: 'Black', value: '#29252b' },
  { name: 'White', value: '#f4f0eb' },
  { name: 'Blue', value: '#4779c7' },
  { name: 'Green', value: '#42856a' },
]

// ==========================================
// DESIGN WORKSPACE COMPONENT
// ==========================================

export default function DesignWorkspace({
  onDesignSaved,
}: DesignWorkspaceProps) {
  // Form state
  const [garment, setGarment] = useState<GarmentType>('Dress')
  const [color, setColor] = useState('#a53d78')
  const [fabric, setFabric] = useState<FabricType>('Cotton')
  const [description, setDescription] = useState('')

  // Request state
  const [isCreating, setIsCreating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Feedback state
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Saved design summary
  const [design, setDesign] = useState<CreatedDesign | null>(null)

  // Ignore outdated requests after Reset
  const requestVersion = useRef(0)

  // ========================================
  // GENERATE FREE FASHION SUGGESTION
  // ========================================

  async function handleGenerateSuggestion() {
    const trimmedDescription = description.trim()

    if (
      trimmedDescription.length < 10 ||
      isGenerating ||
      isCreating
    ) {
      return
    }

    const currentRequest = ++requestVersion.current

    setIsGenerating(true)
    setError('')
    setSuccessMessage('')
    setDesign(null)

    try {
      const response = await generateDesignSuggestion(
        trimmedDescription
      )

      if (currentRequest !== requestVersion.current) {
        return
      }

      const suggestion = response.design

      setGarment(suggestion.garment as GarmentType)
      setColor(suggestion.color)
      setFabric(suggestion.fabric as FabricType)
      setDescription(suggestion.description)

      setSuccessMessage(
        'Fashion suggestion generated! Review your design, then click Create Design to save it.'
      )
    } catch (err) {
      if (currentRequest !== requestVersion.current) {
        return
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate a fashion suggestion.'
      )
    } finally {
      if (currentRequest === requestVersion.current) {
        setIsGenerating(false)
      }
    }
  }

  // ========================================
  // CREATE AND SAVE DESIGN
  // ========================================

  async function handleCreateDesign() {
    const trimmedDescription = description.trim()

    if (
      !trimmedDescription ||
      isCreating ||
      isGenerating
    ) {
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
    setSuccessMessage('')
    setDesign(null)

    try {
      const response = await createDesign(newDesign)

      if (currentRequest !== requestVersion.current) {
        return
      }

      setDesign({
        garment: response.design.garment as GarmentType,
        color: response.design.color,
        fabric: response.design.fabric as FabricType,
        description: response.design.description,
      })

      setSuccessMessage('Design saved successfully!')

      // Refresh the saved designs section
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

  // ========================================
  // RESET DESIGN
  // ========================================

  function handleReset() {
    requestVersion.current += 1

    setGarment('Dress')
    setColor('#a53d78')
    setFabric('Cotton')
    setDescription('')

    setDesign(null)
    setError('')
    setSuccessMessage('')

    setIsCreating(false)
    setIsGenerating(false)
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="design-workspace">
      {/* LEFT SIDE — DESIGN CONTROLS */}

      <div className="design-controls">
        <span className="eyebrow">
          YOUR CREATIVE STUDIO
        </span>

        <h2>Design your outfit</h2>

        <p>
          Choose a garment, customize its color and fabric,
          and describe your fashion vision.
        </p>

        {/* GARMENT TYPE */}

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

        {/* GARMENT COLOR */}

        <label htmlFor="garment-color">
          Garment color
        </label>

        <input
          id="garment-color"
          type="color"
          value={color}
          onChange={(event) =>
            setColor(event.target.value)
          }
        />

        {/* COLOR PRESETS */}

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

        {/* FABRIC TYPE */}

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

        {/* DESIGN DESCRIPTION */}

        <label htmlFor="design-description">
          Describe your design
        </label>

        <textarea
          id="design-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Example: Design an elegant blue silk dress for a wedding"
          rows={5}
        />

        {/* FREE FASHION SUGGESTION BUTTON */}

        <button
          type="button"
          className="suggestion-button"
          onClick={handleGenerateSuggestion}
          disabled={
            description.trim().length < 10 ||
            isGenerating ||
            isCreating
          }
        >
          {isGenerating
            ? 'Generating Suggestion...'
            : '✨ Generate Design Suggestion'}
        </button>

        <p className="suggestion-hint">
          Free local fashion suggestions.
          No API payment required.
        </p>

        {/* CREATE DESIGN BUTTON */}

        <button
          type="button"
          className="primary-button"
          onClick={handleCreateDesign}
          disabled={
            !description.trim() ||
            isCreating ||
            isGenerating
          }
        >
          {isCreating
            ? 'Creating Design...'
            : 'Create Design'}
        </button>

        {/* RESET BUTTON */}

        <button
          type="button"
          className="reset-button"
          onClick={handleReset}
        >
          Reset Design
        </button>

        {/* ERROR MESSAGE */}

        {error && (
          <p
            className="design-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <p
            className="suggestion-success"
            role="status"
          >
            {successMessage}
          </p>
        )}
      </div>

      {/* RIGHT SIDE — 3D PREVIEW */}

      <div className="design-preview">
        <span className="eyebrow">
          DESIGN PREVIEW
        </span>

        {/* GARMENT VIEWER */}

        <div className="preview-canvas">
          <GarmentViewer
            garment={garment}
            color={color}
            fabric={fabric}
          />

          <h3>{garment}</h3>

          <p>
            <strong>Fabric:</strong> {fabric}
          </p>

          <p>
            <strong>Color:</strong>{' '}
            {color.toUpperCase()}
          </p>

          <p>
            {description.trim()
              ? description
              : 'Your fashion concept will appear here.'}
          </p>
        </div>

        {/* DESIGN DETAILS */}

        <div className="design-details">
          <h3>Design Details</h3>

          <div className="design-detail-row">
            <span>Garment</span>
            <strong>{garment}</strong>
          </div>

          <div className="design-detail-row">
            <span>Fabric</span>
            <strong>{fabric}</strong>
          </div>

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

              <strong>
                {color.toUpperCase()}
              </strong>
            </div>
          </div>

          <div className="design-detail-description">
            <span>Design Description</span>

            <p>
              {description.trim() ||
                'Add a description to personalize your design.'}
            </p>
          </div>
        </div>

        {/* SAVED DESIGN CONFIRMATION */}

        {design && (
          <div
            className="preview-note"
            role="status"
          >
            <h3>Design Saved Successfully!</h3>

            <p>
              Your fashion design was saved to SQLite.
            </p>

            <p>
              <strong>Garment:</strong>{' '}
              {design.garment}
            </p>

            <p>
              <strong>Fabric:</strong>{' '}
              {design.fabric}
            </p>

            <p>
              <strong>Color:</strong>{' '}
              {design.color.toUpperCase()}
            </p>

            <p>
              <strong>Description:</strong>{' '}
              {design.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
