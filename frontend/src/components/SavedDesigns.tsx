
import { useEffect, useState } from 'react'

import {
  getSavedDesigns,
  deleteDesign,
  type SavedDesign,
} from '../services/api'

// ==========================================
// COMPONENT PROPS
// ==========================================

type SavedDesignsProps = {
  refreshKey: number
  onLoadDesign: (design: SavedDesign) => void
}

// ==========================================
// SAVED DESIGNS COMPONENT
// ==========================================

export default function SavedDesigns({
  refreshKey,
  onLoadDesign,
}: SavedDesignsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // ========================================
  // LOAD SAVED DESIGNS
  // ========================================

  useEffect(() => {
    let active = true

    async function loadDesigns() {
      try {
        const savedDesigns = await getSavedDesigns()

        if (!active) return

        setDesigns(savedDesigns)
        setError('')
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load saved designs.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadDesigns()

    return () => {
      active = false
    }
  }, [refreshKey])

  // ========================================
  // DELETE DESIGN
  // ========================================

  async function handleDeleteDesign(designId: number) {
    if (deletingId !== null) return

    const shouldDelete = window.confirm(
      'Are you sure you want to delete this design?'
    )

    if (!shouldDelete) return

    setDeletingId(designId)
    setError('')
    setSuccessMessage('')

    try {
      await deleteDesign(designId)

      setDesigns((previous) =>
        previous.filter((design) => design.id !== designId)
      )

      setSuccessMessage('Design deleted successfully!')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete design.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ========================================
  // LOAD DESIGN INTO STUDIO
  // ========================================

  function handleLoadDesign(design: SavedDesign) {
    onLoadDesign(design)

    setSuccessMessage(
      'Design loaded into the studio! Scroll up to customize it.'
    )

    setError('')
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <section className="saved-designs">
      <div className="saved-designs-header">
        <h2>My Saved Designs</h2>

        <p>
          View your creations, load a design into the studio,
          or delete designs you no longer need.
        </p>
      </div>

      {/* LOADING STATE */}

      {isLoading && (
        <p role="status">Loading saved designs...</p>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <p className="design-error" role="alert">
          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <p className="suggestion-success" role="status">
          {successMessage}
        </p>
      )}

      {/* EMPTY STATE */}

      {!isLoading && !error && designs.length === 0 && (
        <div className="saved-designs-empty">
          <p>No saved designs yet.</p>

          <p>
            Create your first fashion design in the studio!
          </p>
        </div>
      )}

      {/* SAVED DESIGN CARDS */}

      {!isLoading && designs.length > 0 && (
        <div className="saved-designs-grid">
          {designs.map((design) => (
            <div
              key={design.id}
              className="saved-design-card"
            >
              {/* COLOR PREVIEW */}

              <div
                className="saved-design-color"
                style={{
                  backgroundColor: design.color,
                }}
              />

              {/* DESIGN INFORMATION */}

              <div className="saved-design-info">
                <h3>
                  {design.garment} #{design.id}
                </h3>

                <p>
                  <strong>Fabric:</strong> {design.fabric}
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
                  <strong>Created:</strong>{' '}
                  {design.created_at}
                </p>
              </div>

              {/* DESIGN ACTIONS */}

              <div className="saved-design-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleLoadDesign(design)}
                >
                  Load in Studio
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() =>
                    void handleDeleteDesign(design.id)
                  }
                  disabled={deletingId !== null}
                >
                  {deletingId === design.id
                    ? 'Deleting...'
                    : 'Delete Design'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
