
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            YOUR AI-POWERED FASHION STUDIO
          </span>

          <h1>
            Imagine it.
            <br />
            <span>Design it.</span>
            <br />
            Wear it.
          </h1>

          <p>
            Turn your fashion ideas into interactive 3D
            designs. Explore garments, customize colors,
            and bring your creativity to life.
          </p>

          <Link to="/studio" className="primary-button">
            Start Designing →
          </Link>
        </div>

        <div className="hero-visual">
          <div className="fashion-card">
            <div className="fashion-icon">✦</div>
            <h2>
              Your Style.
              <br />
              Your Creation.
            </h2>
            <p>Fashion starts with imagination.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <span className="eyebrow">EXPLORE THE POSSIBILITIES</span>
        <h2>Everything you need to start designing</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <span>✦</span>
            <h3>Interactive 3D Preview</h3>
            <p>
              Rotate and explore your garment designs
              using our interactive 3D viewer.
            </p>
          </div>

          <div className="feature-card">
            <span>◈</span>
            <h3>Customize Your Style</h3>
            <p>
              Choose different garments and experiment
              with colors to create your own look.
            </p>
          </div>

          <div className="feature-card">
            <span>✧</span>
            <h3>AI Fashion Inspiration</h3>
            <p>
              AI-assisted design generation is coming soon
              to help transform ideas into fashion concepts.
            </p>
          </div>
        </div>
      </section>

      {/* Workspace Section */}
      <section className="workspace">
        <span className="eyebrow">YOUR CREATIVE SPACE</span>
        <h2>Bring your fashion ideas to life</h2>

        <p>
          Select a garment, choose your favorite color,
          and explore your creation in 3D.
        </p>

        <Link to="/studio" className="primary-button">
          Open Design Studio →
        </Link>
      </section>

      {/* About Section */}
      <section className="about">
        <span className="eyebrow">ABOUT STYLEVERSE AI</span>
        <h2>Where fashion meets technology</h2>

        <p>
          StyleVerse AI is a fashion design platform
          combining creativity with interactive 3D
          technology. Our goal is to make fashion design
          accessible, engaging, and fun.
        </p>
      </section>

      <footer>
        <p>© 2026 StyleVerse AI. Made for creative minds.</p>
      </footer>
    </main>
  )
}
