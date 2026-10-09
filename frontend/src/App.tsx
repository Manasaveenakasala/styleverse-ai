import { useEffect, useState } from 'react'
import './App.css'
import DesignWorkspace from './components/DesignWorkspace'

function App() {
  const [backendStatus, setBackendStatus] = useState('Connecting...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((response) => {
        if (!response.ok) throw new Error('Backend unavailable')
        return response.json()
      })
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus('Connection failed'))
  }, [])

  return (
    <div className="app">
      <header className="navbar">
        <a href="#" className="brand">StyleVerse <span>AI</span></a>
        <nav aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>
        <a href="#workspace" className="nav-button">Start Designing</a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">THE FUTURE OF FASHION DESIGN</span>
            <h1>Imagine it.<br /><span>Design it.</span><br />Wear it.</h1>
            <p>
              Transform your creative ideas into fashion designs
              with AI-powered tools and interactive 3D experiences.
            </p>
            <a href="#workspace" className="primary-button">
              Start Creating →
            </a>
            <div className="status">
              <span className={backendStatus === 'ok' ? 'status-dot online' : 'status-dot'} />
              Backend: {backendStatus}
            </div>
          </div>
          <div className="hero-visual" aria-label="Fashion design illustration">
            <div className="fashion-card">
              <span className="fashion-icon">✦</span>
              <h2>Your Style.<br />Your Vision.</h2>
              <p>AI × Creativity × 3D</p>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <span className="eyebrow">WHAT YOU CAN CREATE</span>
          <h2>Design without limits</h2>
          <div className="feature-grid">
            <article className="feature-card">
              <span>✧</span>
              <h3>AI Fashion Assistant</h3>
              <p>Turn natural-language ideas into fashion concepts.</p>
            </article>
            <article className="feature-card">
              <span>◈</span>
              <h3>Interactive 3D Preview</h3>
              <p>Explore your garment designs from every angle.</p>
            </article>
            <article className="feature-card">
              <span>✿</span>
              <h3>Personalized Designs</h3>
              <p>Experiment with colors, styles, and materials.</p>
            </article>
          </div>
        </section>

       <section className="workspace" id="workspace">
          <DesignWorkspace />
      </section>

        <section className="about" id="about">
          <h2>About StyleVerse AI</h2>
          <p>
            A creative platform combining artificial intelligence,
            modern web technologies, and 3D visualization.
          </p>
        </section>
      </main>

      <footer>© 2026 StyleVerse AI. Designed for creativity.</footer>
    </div>
  )
}

export default App