import { useState } from 'react'
import GarmentViewer from './GarmentViewer'

const garmentOptions = ['Dress', 'Jacket', 'Shirt', 'Skirt', 'Pants']

export default function DesignWorkspace() {
  const [garment, setGarment] = useState('Dress')
  const [color, setColor] = useState('#a53d78')
  const [description, setDescription] = useState('')
  const [design, setDesign] = useState<string | null>(null)

function handleGenerate() {
  if (!description.trim()) {
    alert('Please describe your design first.')
    return
  }

  setDesign(
    `${garment} design created: ${description.trim()}`
  )
}

  return (
    <div className="design-workspace">
      <div className="design-controls">
        <span className="eyebrow">YOUR CREATIVE STUDIO</span>
        <h2>Design your outfit</h2>
        <p>Choose a garment, pick a color, and describe your vision.</p>

        <label htmlFor="garment">Garment type</label>
        <select
          id="garment"
          value={garment}
          onChange={(event) => setGarment(event.target.value)}
        >
          {garmentOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label htmlFor="garment-color">Garment color</label>
        <input
          id="garment-color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />

        <label htmlFor="design-description">Describe your design</label>
        <textarea
          id="design-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Example: A modern evening dress with elegant sleeves and floral details"
          rows={5}
        />

        <button
          type="button"
          className="primary-button"
          onClick={handleGenerate}
          disabled={!description.trim()}
        >
          Create Design
        </button>
      </div>

      <div className="design-preview">
        <span className="eyebrow">DESIGN PREVIEW</span>
        <div className="preview-canvas">
          <div>
          <GarmentViewer
            color={color}
            garment={garment as 'Dress' | 'Jacket' | 'Shirt' | 'Skirt' | 'Pants'}
          />
            ✦
          </div>
          <h3>{garment}</h3>
          <p>
            {design
              ? description.trim()
              : 'Your fashion concept will appear here.'}
          </p>
        </div>
        {design && (
  <div className="preview-note" role="status">
    <h3>Design Created Successfully!</h3>
    <p>{design}</p>
    <p>Selected color: {color}</p>
  </div>
)}
      </div>
    </div>
  )
}