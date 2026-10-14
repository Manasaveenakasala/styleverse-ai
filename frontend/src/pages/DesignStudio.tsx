
import { useEffect, useState } from 'react'
import DesignWorkspace from '../components/DesignWorkspace'
import { checkBackendHealth } from '../services/api'

export default function DesignStudio() {
  const [backendStatus, setBackendStatus] = useState<
    'connecting' | 'connected' | 'unavailable'
  >('connecting')

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

      <DesignWorkspace />
    </main>
  )
}