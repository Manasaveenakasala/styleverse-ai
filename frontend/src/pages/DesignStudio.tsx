import DesignWorkspace from '../components/DesignWorkspace'

export default function DesignStudio() {
  return (
    <main className="studio-page">
      <section className="studio-header">
        <h1>AI Fashion Design Studio</h1>
        <p>
          Choose a garment, customize its color,
          and explore your design in 3D.
        </p>
      </section>

      <DesignWorkspace />
    </main>
  )
}