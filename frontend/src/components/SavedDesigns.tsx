
import { useEffect, useState } from 'react'
import { getSavedDesigns } from '../services/api'
import type { SavedDesign } from '../services/api'

type SavedDesignsProps = {
  refreshKey: number
}

export default function SavedDesigns({
  refreshKey,
}: SavedDesignsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDesigns() {
      setLoading(true)
      setError('')

      try {
        const savedDesigns = await getSavedDesigns()

        if (active) {
          setDesigns(savedDesigns)
        }
      } catch {
        if (active) {
          setError('Unable to load saved designs.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDesigns()

    return () => {
      active = false
    }
  }, [refreshKey])

  return (
    <section className="saved-designs">
      <h2>My Saved Designs</h2>
      <p>Explore your previously created fashion designs.</p>

      {loading && <p role="status">Loading designs...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && designs.length === 0 && (
        <p>No saved designs yet. Create your first design!</p>
      )}

      {!loading && !error && (
        <div className="saved-designs-grid">
          {designs.map((design) => (
            <article className="saved-design-card" key={design.id}>
              <div className="saved-design-color">
                <span
                  className="saved-design-swatch"
                  style={{ backgroundColor: design.color }}
                />
              </div>

              <h3>{design.garment}</h3>

              <p>
                <strong>Fabric:</strong> {design.fabric}
              </p>

              <p>
                <strong>Color:</strong> {design.color}
              </p>

              <p>{design.description}</p>

              <small>Created: {design.created_at}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
