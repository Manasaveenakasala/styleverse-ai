
import { useEffect, useState } from 'react'
import DesignWorkspace from '../components/DesignWorkspace'
import SavedDesigns from '../components/SavedDesigns'

import {
  checkBackendHealth,
  type SavedDesign,
} from '../services/api'

// ==========================================
// DESIGN STUDIO PAGE
// ==========================================

export default function DesignStudio() {
  // Backend connection status
  const [backendStatus, setBackendStatus] = useState<
    'connecting' | 'connected' | 'unavailable'
  >('connecting')

  // Refresh saved designs after saving
  const [designRefreshKey, setDesignRefreshKey] =
    useState(0)

  // Currently selected saved design
  const [selectedDesign, setSelectedDesign] =
    useState<SavedDesign | null>(null)

  // Tracks repeated selections
  const [selectionVersion, setSelectionVersion] =
    useState(0)

  // ========================================
  // CHECK BACKEND CONNECTION
  // ========================================

  useEffect(() => {
    let active = true

    checkBackendHealth()
      .then((data) => {
        if (!active) return

        setBackendStatus(
          data.status === 'ok'
            ? 'connected'
            : 'unavailable'
        )
      })
      .catch(() => {
        if (active) {
          setBackendStatus('unavailable')
        }
      })

    return () => {
      active = false
    }
  }, [])

  // ========================================
  // REFRESH SAVED DESIGNS
  // ========================================

  function handleDesignSaved() {
    setDesignRefreshKey((previous) => previous + 1)
  }

  // ========================================
  // LOAD SAVED DESIGN INTO STUDIO
  // ========================================

  function handleLoadDesign(design: SavedDesign) {
    setSelectedDesign(design)

    setSelectionVersion((previous) => previous + 1)

    // Scroll to the top of Design Studio
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ========================================
  // RENDER DESIGN STUDIO
  // ========================================

  return (
    <main className="studio-page">
      {/* PAGE HEADER */}

      <section className="studio-header">
        <h1>AI Fashion Design Studio</h1>

        <p>
          Choose a garment, customize its color and fabric,
          generate fashion suggestions, and explore your
          designs in 3D.
        </p>
      </section>

      {/* BACKEND CONNECTION STATUS */}

      <p
        className="backend-status"
        role="status"
      >
        {backendStatus === 'connecting' &&
          '⏳ Connecting to backend...'}

        {backendStatus === 'connected' &&
          '✓ Backend Connected'}

        {backendStatus === 'unavailable' &&
          '⚠ Backend Unavailable'}
      </p>

      {/* DESIGN WORKSPACE */}

      <DesignWorkspace
        onDesignSaved={handleDesignSaved}
        selectedDesign={selectedDesign}
        selectionVersion={selectionVersion}
      />

      {/* SAVED DESIGNS */}

      <SavedDesigns
        refreshKey={designRefreshKey}
        onLoadDesign={handleLoadDesign}
      />
    </main>
  )
}
