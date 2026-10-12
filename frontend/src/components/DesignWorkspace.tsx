
import { useState } from 'react'
import GarmentViewer from './GarmentViewer'

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

export default function DesignWorkspace() {
  // Garment selection
  const [garment, setGarment] = useState<GarmentType>('Dress')

  // Color selection
  const [color, setColor] = useState('#a53d78')

  // Fabric selection
  const [fabric, setFabric] = useState<FabricType>('Cotton')

  // User's design description
  const [description, setDescription] = useState('')

  // Created design result
  const [design, setDesign] = useState<CreatedDesign | null>(null)

  // Handle design creation
  function handleGenerate() {
    const trimmedDescription = description.trim()

    if (!trimmedDescription) {
      return
    }

    setDesign({
      garment,
      color,
      fabric,
      description: trimmedDescription,
    })
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

        {/* Custom garment color */}
        <label htmlFor="garment-color">
          Garment color
        </label>

        <input
          id="garment-color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />

        {/* Preset colors */}
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
          disabled={!description.trim()}
        >
          Create Design
        </button>
      </div>

      {/* ======================================
          RIGHT PANEL — 3D DESIGN PREVIEW
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

          {/* Current garment information */}
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
            CREATED DESIGN SUMMARY
        ====================================== */}

        {design && (
          <div className="preview-note" role="status">
            <h3>Design Created Successfully!</h3>

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