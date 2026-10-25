
import { useEffect, useState } from 'react'
import { deleteDesign, getSavedDesigns } from '../services/api'
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
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Load saved designs when the component mounts
  // or a new design is created
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

  // Delete a selected design
  async function handleDelete(designId: number) {
    const designToDelete = designs.find(
      (design) => design.id === designId
    )

    if (!designToDelete || deletingId !== null) {
      return
    }

    // Confirm before permanently deleting
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${designToDelete.garment} design?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(designId)
    setError('')

    try {
      await deleteDesign(designId)

      // Remove the deleted design without reloading
      setDesigns((previousDesigns) =>
        previousDesigns.filter(
          (design) => design.id !== designId
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete design. Please try again.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="saved-designs">
      <h2>My Saved Designs</h2>

      <p>
        Explore your previously created fashion designs.
      </p>

      {loading && (
        <p role="status">Loading designs...</p>
      )}

      {error && (
        <p className="design-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && designs.length === 0 && (
        <p>
          No saved designs yet. Create your first design!
        </p>
      )}

      {!loading && (
        <div className="saved-designs-grid">
          {designs.map((design) => (
            <article
              className="saved-design-card"
              key={design.id}
            >
              <div className="saved-design-color">
                <span
                  className="saved-design-swatch"
                  style={{
                    backgroundColor: design.color,
                  }}
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

              <small>
                Created: {design.created_at}
              </small>

              {/* Delete button */}
              <button
                type="button"
                className="delete-design-button"
                onClick={() => void handleDelete(design.id)}
                disabled={deletingId !== null}
                aria-label={`Delete ${design.garment} design`}
              >
                {deletingId === design.id
                  ? 'Deleting...'
                  : 'Delete Design'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
