
import { useEffect, useRef, useState } from 'react'
import GarmentViewer, {
  type GarmentSize,
  type SleeveLength,
  type GarmentFit,
} from './GarmentViewer'
import {
  createDesign,
  generateDesignSuggestion,
  type SavedDesign,
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
  selectedDesign: SavedDesign | null
  selectionVersion: number
}

// ==========================================
// GARMENT OPTIONS
// ==========================================

const garmentOptions: {
  name: GarmentType
  icon: string
}[] = [
  { name: 'Dress', icon: '👗' },
  { name: 'Jacket', icon: '🧥' },
  { name: 'Shirt', icon: '👕' },
  { name: 'Skirt', icon: '✨' },
  { name: 'Pants', icon: '👖' },
]

// ==========================================
// FABRIC OPTIONS
// ==========================================

const fabricOptions: {
  name: FabricType
  description: string
}[] = [
  {
    name: 'Cotton',
    description: 'Soft & breathable',
  },
  {
    name: 'Silk',
    description: 'Smooth & elegant',
  },
  {
    name: 'Denim',
    description: 'Casual & durable',
  },
  {
    name: 'Leather',
    description: 'Bold & structured',
  },
]

// ==========================================
// COLOR PRESETS
// ==========================================

const colorPresets = [
  { name: 'Rose', value: '#a53d78' },
  { name: 'Black', value: '#29252b' },
  { name: 'White', value: '#f4f0eb' },
  { name: 'Blue', value: '#4779c7' },
  { name: 'Green', value: '#42856a' },
]

// ==========================================
// CUSTOMIZATION OPTIONS
// ==========================================

const garmentSizes: GarmentSize[] = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
]

const sleeveOptions: SleeveLength[] = [
  'Sleeveless',
  'Short',
  'Three-Quarter',
  'Long',
]

const fitOptions: GarmentFit[] = [
  'Slim',
  'Regular',
  'Relaxed',
  'Oversized',
]

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DesignWorkspace({
  onDesignSaved,
  selectedDesign,
  selectionVersion,
}: DesignWorkspaceProps) {
  // ========================================
  // DESIGN STATE
  // ========================================

  const [garment, setGarment] =
    useState<GarmentType>('Dress')

  const [color, setColor] =
    useState('#a53d78')

  const [fabric, setFabric] =
    useState<FabricType>('Cotton')

  const [size, setSize] =
    useState<GarmentSize>('M')

  const [sleeveLength, setSleeveLength] =
    useState<SleeveLength>('Short')

  const [fit, setFit] =
    useState<GarmentFit>('Regular')

  const [description, setDescription] =
    useState('')

  const [isCreating, setIsCreating] =
    useState(false)

  const [isGenerating, setIsGenerating] =
    useState(false)

  const [error, setError] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const [design, setDesign] =
    useState<CreatedDesign | null>(null)

  const requestVersion = useRef(0)

  const isBusy = isCreating || isGenerating
  const trimmedDescription = description.trim()

  const hasSleeves =
    garment === 'Dress' ||
    garment === 'Shirt' ||
    garment === 'Jacket'

  // ========================================
  // LOAD SAVED DESIGN
  // ========================================

  useEffect(() => {
  if (!selectedDesign) return

  requestVersion.current += 1

  // Schedule state updates after the effect finishes.
  const timeoutId = window.setTimeout(() => {
    setGarment(selectedDesign.garment as GarmentType)
    setColor(selectedDesign.color)
    setFabric(selectedDesign.fabric as FabricType)
    setDescription(selectedDesign.description)

    // Advanced customizations are preview-only.
    setSize('M')
    setSleeveLength('Short')
    setFit('Regular')

    setDesign(null)
    setError('')
    setSuccessMessage(
      'Saved design loaded into your studio.'
    )

    setIsCreating(false)
    setIsGenerating(false)
  }, 0)

  return () => {
    window.clearTimeout(timeoutId)
  }
}, [selectedDesign, selectionVersion])

  // ========================================
  // GENERATE AI SUGGESTION
  // ========================================

  async function handleGenerateSuggestion() {
    if (
      trimmedDescription.length < 10 ||
      isBusy
    ) {
      return
    }

    const currentRequest =
      ++requestVersion.current

    setIsGenerating(true)
    setError('')
    setSuccessMessage('')
    setDesign(null)

    try {
      const response =
        await generateDesignSuggestion(
          trimmedDescription
        )

      if (
        currentRequest !== requestVersion.current
      ) {
        return
      }

      const suggestion = response.design

      setGarment(
        suggestion.garment as GarmentType
      )

      setColor(suggestion.color)

      setFabric(
        suggestion.fabric as FabricType
      )

      setDescription(suggestion.description)

      setSuccessMessage(
        'Your fashion suggestion is ready! Review the preview and save your design.'
      )
    } catch (err) {
      if (
        currentRequest !== requestVersion.current
      ) {
        return
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate a fashion suggestion.'
      )
    } finally {
      if (
        currentRequest === requestVersion.current
      ) {
        setIsGenerating(false)
      }
    }
  }

  // ========================================
  // CREATE AND SAVE DESIGN
  // ========================================

  async function handleCreateDesign() {
    if (!trimmedDescription || isBusy) {
      return
    }

    const currentRequest =
      ++requestVersion.current

    // Existing backend currently stores:
    // garment, color, fabric, description.
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
      const response =
        await createDesign(newDesign)

      if (
        currentRequest !== requestVersion.current
      ) {
        return
      }

      setDesign({
        garment:
          response.design.garment as GarmentType,
        color: response.design.color,
        fabric:
          response.design.fabric as FabricType,
        description:
          response.design.description,
      })

      setSuccessMessage(
        'Your design has been saved successfully! Advanced customizations are currently preview-only.'
      )

      onDesignSaved()
    } catch (err) {
      if (
        currentRequest !== requestVersion.current
      ) {
        return
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save design. Please try again.'
      )
    } finally {
      if (
        currentRequest === requestVersion.current
      ) {
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
    setSize('M')
    setSleeveLength('Short')
    setFit('Regular')
    setDescription('')

    setDesign(null)
    setError('')
    setSuccessMessage('')
    setIsCreating(false)
    setIsGenerating(false)
  }

  // ========================================
  // CLEAR FEEDBACK
  // ========================================

  function clearFeedback() {
    setError('')
    setSuccessMessage('')
    setDesign(null)
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="design-workspace">
      {/* LEFT — DESIGN CONTROLS */}

      <section className="design-controls">
        <div className="studio-panel-heading">
          <span className="eyebrow">
            STYLEVERSE DESIGN LAB
          </span>

          <h2>Create your look</h2>

          <p>
            Bring your fashion ideas to life.
            Customize every detail and watch
            your creation appear in 3D.
          </p>
        </div>

        {/* ==================================
            01 — GARMENT SELECTION
        ================================== */}

        <div className="studio-field-group">
          <div className="studio-field-heading">
            <label id="garment-label">
              Choose your garment
            </label>

            <span className="studio-field-step">
              01
            </span>
          </div>

          <div
            className="garment-option-grid"
            role="group"
            aria-labelledby="garment-label"
          >
            {garmentOptions.map((option) => {
              const selected =
                garment === option.name

              return (
                <button
                  key={option.name}
                  type="button"
                  className={`garment-option ${
                    selected ? 'active' : ''
                  }`}
                  onClick={() => {
                    setGarment(option.name)
                    clearFeedback()
                  }}
                  aria-pressed={selected}
                >
                  <span
                    className="garment-option-icon"
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>

                  <span>{option.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ==================================
            02 — COLOR SELECTION
        ================================== */}

        <div className="studio-field-group">
          <div className="studio-field-heading">
            <label htmlFor="garment-color">
              Choose your color
            </label>

            <span className="studio-field-step">
              02
            </span>
          </div>

          <div className="studio-color-section">
            <div
              className="color-presets"
              role="group"
              aria-label="Preset garment colors"
            >
              {colorPresets.map((preset) => {
                const selected =
                  color.toLowerCase() ===
                  preset.value

                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={`color-swatch ${
                      selected ? 'selected' : ''
                    }`}
                    style={{
                      backgroundColor:
                        preset.value,
                    }}
                    onClick={() => {
                      setColor(preset.value)
                      clearFeedback()
                    }}
                    aria-label={`Select ${preset.name} color`}
                    aria-pressed={selected}
                    title={preset.name}
                  />
                )
              })}
            </div>

            <div className="custom-color-control">
              <input
                id="garment-color"
                type="color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value)
                  clearFeedback()
                }}
                aria-label="Custom garment color"
              />

              <div>
                <span className="custom-color-label">
                  Custom color
                </span>

                <strong>
                  {color.toUpperCase()}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================
            03 — FABRIC SELECTION
        ================================== */}

        <div className="studio-field-group">
          <div className="studio-field-heading">
            <label id="fabric-label">
              Select your fabric
            </label>

            <span className="studio-field-step">
              03
            </span>
          </div>

          <div
            className="fabric-option-grid"
            role="group"
            aria-labelledby="fabric-label"
          >
            {fabricOptions.map((option) => {
              const selected =
                fabric === option.name

              return (
                <button
                  key={option.name}
                  type="button"
                  className={`fabric-option ${
                    selected ? 'active' : ''
                  }`}
                  onClick={() => {
                    setFabric(option.name)
                    clearFeedback()
                  }}
                  aria-pressed={selected}
                >
                  <strong>
                    {option.name}
                  </strong>

                  <span>
                    {option.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ==================================
            04 — GARMENT SIZE
        ================================== */}

        <div className="studio-field-group">
          <div className="studio-field-heading">
            <label id="size-label">
              Choose your size
            </label>

            <span className="studio-field-step">
              04
            </span>
          </div>

          <div
            className="garment-size-grid"
            role="group"
            aria-labelledby="size-label"
          >
            {garmentSizes.map((option) => {
              const selected = size === option

              return (
                <button
                  key={option}
                  type="button"
                  className={`garment-size-option ${
                    selected ? 'active' : ''
                  }`}
                  onClick={() => {
                    setSize(option)
                    clearFeedback()
                  }}
                  aria-pressed={selected}
                  aria-label={`Size ${option}`}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <p className="garment-size-hint">
            Selected size:{' '}
            <strong>{size}</strong>.
            The 3D preview updates instantly.
          </p>
        </div>

        {/* ==================================
            05 — SLEEVE LENGTH
        ================================== */}

        {hasSleeves && (
          <div className="studio-field-group">
            <div className="studio-field-heading">
              <label id="sleeve-length-label">
                Sleeve length
              </label>

              <span className="studio-field-step">
                05
              </span>
            </div>

            <div
              className="customization-option-grid"
              role="group"
              aria-labelledby="sleeve-length-label"
            >
              {sleeveOptions.map((option) => {
                const selected =
                  sleeveLength === option

                return (
                  <button
                    key={option}
                    type="button"
                    className={`customization-option ${
                      selected ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSleeveLength(option)
                      clearFeedback()
                    }}
                    aria-pressed={selected}
                  >
                    {option === 'Three-Quarter'
                      ? '3/4 Sleeve'
                      : option}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ==================================
            06 — GARMENT FIT
        ================================== */}

        <div className="studio-field-group">
          <div className="studio-field-heading">
            <label id="garment-fit-label">
              Garment fit
            </label>

            <span className="studio-field-step">
              06
            </span>
          </div>

          <div
            className="customization-option-grid"
            role="group"
            aria-labelledby="garment-fit-label"
          >
            {fitOptions.map((option) => {
              const selected = fit === option

              return (
                <button
                  key={option}
                  type="button"
                  className={`customization-option ${
                    selected ? 'active' : ''
                  }`}
                  onClick={() => {
                    setFit(option)
                    clearFeedback()
                  }}
                  aria-pressed={selected}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        {/* ==================================
            07 — DESIGN DESCRIPTION
        ================================== */}

        <div className="studio-field-group">
          <div className="studio-field-heading">
            <label htmlFor="design-description">
              Describe your vision
            </label>

            <span className="studio-field-step">
              07
            </span>
          </div>

          <textarea
            id="design-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              clearFeedback()
            }}
            placeholder="Example: Design an elegant blue silk evening dress for a wedding..."
            rows={5}
            maxLength={1000}
          />

          <div className="description-footer">
            <span>
              Add at least 10 characters
              for AI suggestions.
            </span>

            <span>
              {description.length}/1000
            </span>
          </div>
        </div>

        {/* ==================================
            AI FASHION ASSISTANT
        ================================== */}

        <div className="studio-ai-panel">
          <div className="studio-ai-heading">
            <span
              className="studio-ai-icon"
              aria-hidden="true"
            >
              ✨
            </span>

            <div>
              <h3>AI Fashion Assistant</h3>

              <p>
                Turn your description into
                a personalized design suggestion.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="suggestion-button"
            onClick={handleGenerateSuggestion}
            disabled={
              trimmedDescription.length < 10 ||
              isBusy
            }
          >
            {isGenerating
              ? 'Generating your suggestion...'
              : '✨ Generate Design Suggestion'}
          </button>

          <p className="suggestion-hint">
            Free local fashion suggestions.
            No paid API required.
          </p>
        </div>

        {/* ==================================
            ACTION BUTTONS
        ================================== */}

        <div className="studio-action-buttons">
          <button
            type="button"
            className="primary-button"
            onClick={handleCreateDesign}
            disabled={
              !trimmedDescription || isBusy
            }
          >
            {isCreating
              ? 'Saving your design...'
              : 'Create & Save Design'}
          </button>

          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
          >
            Reset Design
          </button>
        </div>

        {/* FEEDBACK */}

        {error && (
          <p
            className="design-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {successMessage && (
          <p
            className="suggestion-success"
            role="status"
          >
            {successMessage}
          </p>
        )}
      </section>

      {/* =====================================
          RIGHT — LIVE 3D PREVIEW
      ===================================== */}

      <section className="design-preview">
        <div className="studio-preview-header">
          <div>
            <span className="eyebrow">
              LIVE DESIGN PREVIEW
            </span>

            <h2>Your creation</h2>
          </div>

          <span className="studio-live-badge">
            <span
              className="studio-live-dot"
              aria-hidden="true"
            />

            Live 3D
          </span>
        </div>

        <div className="preview-canvas">
          <GarmentViewer
            garment={garment}
            color={color}
            fabric={fabric}
            size={size}
            sleeveLength={sleeveLength}
            fit={fit}
          />

          <div className="preview-design-summary">
            <h3>{garment}</h3>

            <p>
              {fabric} Collection
            </p>

            <span className="preview-color-chip">
              <span
                className="design-color-indicator"
                style={{
                  backgroundColor: color,
                }}
                aria-hidden="true"
              />

              {color.toUpperCase()}
            </span>

            <p className="garment-preview-size">
              Size: <strong>{size}</strong>
            </p>

            <p className="garment-preview-size">
              Fit: <strong>{fit}</strong>
            </p>

            {hasSleeves && (
              <p className="garment-preview-size">
                Sleeves:{' '}
                <strong>{sleeveLength}</strong>
              </p>
            )}
          </div>

          <p className="preview-description">
            {trimmedDescription ||
              'Your fashion concept will appear here as you customize your design.'}
          </p>
        </div>

        {/* ==================================
            DESIGN DETAILS
        ================================== */}

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
            <span>Size</span>
            <strong>{size}</strong>
          </div>

          <div className="design-detail-row">
            <span>Fit</span>
            <strong>{fit}</strong>
          </div>

          {hasSleeves && (
            <div className="design-detail-row">
              <span>Sleeve Length</span>
              <strong>{sleeveLength}</strong>
            </div>
          )}

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
            <span>
              Design Description
            </span>

            <p>
              {trimmedDescription ||
                'Add a description to personalize your design.'}
            </p>
          </div>
        </div>

        {/* ==================================
            SAVE CONFIRMATION
        ================================== */}

        {design && (
          <div
            className="preview-note"
            role="status"
          >
            <h3>
              Design Saved Successfully!
            </h3>

            <p>
              Your fashion design was
              saved to SQLite.
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

            <p>
              <strong>Size:</strong>{' '}
              {size} (preview only)
            </p>

            <p>
              <strong>Fit:</strong>{' '}
              {fit} (preview only)
            </p>

            {hasSleeves && (
              <p>
                <strong>Sleeves:</strong>{' '}
                {sleeveLength} (preview only)
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
