
import { useEffect, useState } from 'react'
import DesignWorkspace from '../components/DesignWorkspace'
import SavedDesigns from '../components/SavedDesigns'
import { checkBackendHealth } from '../services/api'

export default function DesignStudio() {
  const [backendStatus, setBackendStatus] = useState<
    'connecting' | 'connected' | 'unavailable'
  >('connecting')

  // Increase this number whenever a new design is saved
  const [designRefreshKey, setDesignRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    checkBackendHealth()
      .then((data) => {
        if (active) {
          setBackendStatus(
            data.status === 'ok' ? 'connected' : 'unavailable'
          )
        }
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

  // Called only after a design is saved successfully
  function handleDesignSaved() {
    setDesignRefreshKey((previous) => previous + 1)
  }

  return (
    <main className="studio-page">
      <section className="studio-header">
        <h1>AI Fashion Design Studio</h1>
        <p>
          Choose a garment, customize its color,
          and explore your design in 3D.
        </p>
      </section>

      {/* FastAPI backend connection status */}
      <p className="backend-status" role="status">
        {backendStatus === 'connecting' && '⏳ Connecting to backend...'}
        {backendStatus === 'connected' && '✓ Backend Connected'}
        {backendStatus === 'unavailable' && '⚠ Backend Unavailable'}
      </p>

      <DesignWorkspace onDesignSaved={handleDesignSaved} />

      <SavedDesigns refreshKey={designRefreshKey} />
    </main>
  )
}
