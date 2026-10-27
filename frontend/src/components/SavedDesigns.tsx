
import { useEffect, useState } from 'react'

import {
  getSavedDesigns,
  deleteDesign,
  updateDesignFavorite,
  type SavedDesign,
} from '../services/api'

// ==========================================
// TYPES
// ==========================================

type SavedDesignsProps = {
  refreshKey: number
  onLoadDesign: (design: SavedDesign) => void
}

type DesignFilter = 'all' | 'favorites'

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
  const [updatingFavoriteId, setUpdatingFavoriteId] =
    useState<number | null>(null)

  const [filter, setFilter] = useState<DesignFilter>('all')

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
  // FILTER DESIGNS
  // ========================================

  const favoriteCount = designs.filter(
    (design) => design.is_favorite === 1
  ).length

  const filteredDesigns =
    filter === 'favorites'
      ? designs.filter((design) => design.is_favorite === 1)
      : designs

  // ========================================
  // TOGGLE FAVORITE
  // ========================================

  async function handleToggleFavorite(design: SavedDesign) {
    if (updatingFavoriteId !== null || deletingId !== null) {
      return
    }

    setUpdatingFavoriteId(design.id)
    setError('')
    setSuccessMessage('')

    const nextFavoriteStatus = design.is_favorite !== 1

    try {
      const response = await updateDesignFavorite(
        design.id,
        nextFavoriteStatus
      )

      setDesigns((previous) =>
        previous.map((item) =>
          item.id === design.id ? response.design : item
        )
      )

      setSuccessMessage(response.message)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update favorite status.'
      )
    } finally {
      setUpdatingFavoriteId(null)
    }
  }

  // ========================================
  // DELETE DESIGN
  // ========================================

  async function handleDeleteDesign(designId: number) {
    if (deletingId !== null || updatingFavoriteId !== null) {
      return
    }

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
          Browse your creations, mark favorites,
          and load designs into your 3D Studio.
        </p>
      </div>

      {/* FILTER BUTTONS */}

      <div
        className="saved-design-filters"
        role="group"
        aria-label="Filter saved designs"
      >
        <button
          type="button"
          className={`filter-button ${
            filter === 'all' ? 'active' : ''
          }`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          All Designs ({designs.length})
        </button>

        <button
          type="button"
          className={`filter-button ${
            filter === 'favorites' ? 'active' : ''
          }`}
          onClick={() => setFilter('favorites')}
          aria-pressed={filter === 'favorites'}
        >
          ♥ Favorites ({favoriteCount})
        </button>
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

      {/* EMPTY STATES */}

      {!isLoading && !error && designs.length === 0 && (
        <div className="saved-designs-empty">
          <p>No saved designs yet.</p>
          <p>Create your first fashion design in the studio!</p>
        </div>
      )}

      {!isLoading &&
        designs.length > 0 &&
        filteredDesigns.length === 0 && (
          <div className="saved-designs-empty">
            <p>No favorite designs yet.</p>
            <p>
              Click the heart button on any design
              to add it to your favorites.
            </p>
          </div>
        )}

      {/* SAVED DESIGN CARDS */}

      {!isLoading && filteredDesigns.length > 0 && (
        <div className="saved-designs-grid">
          {filteredDesigns.map((design) => {
            const isFavorite = design.is_favorite === 1
            const isUpdating =
              updatingFavoriteId === design.id

            return (
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
                    className={`favorite-button ${
                      isFavorite ? 'is-favorite' : ''
                    }`}
                    onClick={() =>
                      void handleToggleFavorite(design)
                    }
                    disabled={
                      updatingFavoriteId !== null ||
                      deletingId !== null
                    }
                    aria-pressed={isFavorite}
                    aria-label={
                      isFavorite
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    {isUpdating
                      ? 'Updating...'
                      : isFavorite
                        ? '♥ Favorited'
                        : '♡ Favorite'}
                  </button>

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
                    disabled={
                      deletingId !== null ||
                      updatingFavoriteId !== null
                    }
                  >
                    {deletingId === design.id
                      ? 'Deleting...'
                      : 'Delete Design'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
