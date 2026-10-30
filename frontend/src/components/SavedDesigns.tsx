
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

type SortOption = 'newest' | 'oldest' | 'name'

type GarmentFilter =
  | 'all'
  | 'Dress'
  | 'Jacket'
  | 'Shirt'
  | 'Skirt'
  | 'Pants'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [garmentFilter, setGarmentFilter] =
    useState<GarmentFilter>('all')
  const [sortOption, setSortOption] =
    useState<SortOption>('newest')

  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // ========================================
  // LOAD SAVED DESIGNS
  // ==========================================

  useEffect(() => {
    let active = true

    async function loadDesigns() {
      setIsLoading(true)

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
  // FAVORITE COUNT
  // ==========================================

  const favoriteCount = designs.filter(
    (design) => design.is_favorite === 1
  ).length

  // ========================================
  // SEARCH, FILTER AND SORT
  // ==========================================

  const filteredDesigns = designs
    .filter((design) => {
      if (filter === 'favorites') {
        return design.is_favorite === 1
      }

      return true
    })
    .filter((design) => {
      if (garmentFilter === 'all') {
        return true
      }

      return design.garment === garmentFilter
    })
    .filter((design) => {
      const query = searchQuery.trim().toLowerCase()

      if (!query) {
        return true
      }

      return (
        design.garment.toLowerCase().includes(query) ||
        design.fabric.toLowerCase().includes(query) ||
        design.description.toLowerCase().includes(query) ||
        design.color.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (sortOption === 'oldest') {
        return a.id - b.id
      }

      if (sortOption === 'name') {
        return (
          a.garment.localeCompare(b.garment) ||
          b.id - a.id
        )
      }

      return b.id - a.id
    })

  // ========================================
  // TOGGLE FAVORITE
  // ==========================================

  async function handleToggleFavorite(design: SavedDesign) {
    if (
      updatingFavoriteId !== null ||
      deletingId !== null
    ) {
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
          item.id === design.id
            ? response.design
            : item
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
  // ==========================================

  async function handleDeleteDesign(designId: number) {
    if (
      deletingId !== null ||
      updatingFavoriteId !== null
    ) {
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
        previous.filter(
          (design) => design.id !== designId
        )
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
  // ==========================================

  function handleLoadDesign(design: SavedDesign) {
    onLoadDesign(design)

    setSuccessMessage(
      'Design loaded into the studio! Scroll up to customize it.'
    )

    setError('')
  }

  // ========================================
  // DOWNLOAD DESIGN AS JSON
  // ==========================================

  function handleDownloadDesign(design: SavedDesign) {
    try {
      const exportData = {
        id: design.id,
        garment: design.garment,
        color: design.color,
        fabric: design.fabric,
        description: design.description,
        created_at: design.created_at,
        is_favorite: design.is_favorite === 1,
      }

      const json = JSON.stringify(exportData, null, 2)

      const blob = new Blob([json], {
        type: 'application/json',
      })

      const url = URL.createObjectURL(blob)

      try {
        const link = document.createElement('a')

        link.href = url
        link.download =
          `styleverse-${design.garment.toLowerCase()}-${design.id}.json`

        document.body.appendChild(link)

        try {
          link.click()
        } finally {
          link.remove()
        }
      } finally {
        URL.revokeObjectURL(url)
      }

      setSuccessMessage('Design download started!')
      setError('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to download design.'
      )
      setSuccessMessage('')
    }
  }

  // ========================================
  // CLEAR FILTERS
  // ==========================================

  function handleClearFilters() {
    setSearchQuery('')
    setGarmentFilter('all')
    setSortOption('newest')
    setFilter('all')
  }

  // ========================================
  // RENDER
  // ==========================================

  return (
    <section className="saved-designs">
      {/* HEADER */}

      <div className="saved-designs-header">
        <h2>My Saved Designs</h2>

        <p>
          Search, organize, customize and download
          your saved fashion designs.
        </p>
      </div>

      {/* ALL / FAVORITES FILTER */}

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

      {/* SEARCH, GARMENT FILTER AND SORT */}

      <div className="design-search-controls">
        <input
          type="search"
          placeholder="Search by garment, fabric or description..."
          aria-label="Search saved designs"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
        />

        <select
          aria-label="Filter by garment"
          value={garmentFilter}
          onChange={(event) =>
            setGarmentFilter(
              event.target.value as GarmentFilter
            )
          }
        >
          <option value="all">All Garments</option>
          <option value="Dress">Dresses</option>
          <option value="Jacket">Jackets</option>
          <option value="Shirt">Shirts</option>
          <option value="Skirt">Skirts</option>
          <option value="Pants">Pants</option>
        </select>

        <select
          aria-label="Sort saved designs"
          value={sortOption}
          onChange={(event) =>
            setSortOption(
              event.target.value as SortOption
            )
          }
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Garment Name (A–Z)</option>
        </select>

        <button
          type="button"
          className="filter-button"
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* RESULTS COUNT */}

      {!isLoading && !error && (
        <p role="status">
          Showing {filteredDesigns.length} of{' '}
          {designs.length} saved designs
        </p>
      )}

      {/* LOADING */}

      {isLoading && (
        <p role="status">
          Loading saved designs...
        </p>
      )}

      {/* ERROR */}

      {error && (
        <p className="design-error" role="alert">
          {error}
        </p>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <p
          className="suggestion-success"
          role="status"
        >
          {successMessage}
        </p>
      )}

      {/* NO SAVED DESIGNS */}

      {!isLoading &&
        !error &&
        designs.length === 0 && (
          <div className="saved-designs-empty">
            <p>No saved designs yet.</p>

            <p>
              Create your first fashion design
              in the studio!
            </p>
          </div>
        )}

      {/* NO SEARCH RESULTS */}

      {!isLoading &&
        !error &&
        designs.length > 0 &&
        filteredDesigns.length === 0 && (
          <div className="saved-designs-empty">
            <p>No designs match your filters.</p>

            <p>
              Try another search or clear
              your filters.
            </p>

            <button
              type="button"
              className="filter-button"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* DESIGN CARDS */}

      {!isLoading &&
        filteredDesigns.length > 0 && (
          <div className="saved-designs-grid">
            {filteredDesigns.map((design) => {
              const isFavorite =
                design.is_favorite === 1

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

                  {/* DESIGN DETAILS */}

                  <div className="saved-design-info">
                    <h3>
                      {design.garment} #{design.id}
                    </h3>

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
                      <strong>Created:</strong>{' '}
                      {design.created_at}
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}

                  <div className="saved-design-actions">
                    <button
                      type="button"
                      className={`favorite-button ${
                        isFavorite
                          ? 'is-favorite'
                          : ''
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
                      onClick={() =>
                        handleLoadDesign(design)
                      }
                    >
                      Load in Studio
                    </button>

                    {/* NEW: DOWNLOAD JSON */}

                    <button
                      type="button"
                      className="download-button"
                      onClick={() =>
                        handleDownloadDesign(design)
                      }
                      aria-label={`Download ${design.garment} design ${design.id} as JSON`}
                    >
                      ↓ Download JSON
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        void handleDeleteDesign(
                          design.id
                        )
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