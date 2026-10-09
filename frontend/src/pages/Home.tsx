import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero">
        <h1>Imagine it. Design it. Wear it.</h1>
        <p>
          Bring your fashion ideas to life with StyleVerse AI.
        </p>

        <Link to="/studio" className="primary-button">
          Start Designing
        </Link>
      </section>
    </main>
  )
}