import { useState, useEffect } from 'react'
import AdminPage from './pages/AdminPage'
import RevealPage from './pages/RevealPage'

type Route = { type: 'admin' } | { type: 'reveal'; data: string } | { type: 'home' }

function parseHash(): Route {
  const hash = window.location.hash
  if (hash.startsWith('#/admin')) return { type: 'admin' }
  if (hash.startsWith('#/reveal/')) return { type: 'reveal', data: hash.slice('#/reveal/'.length) }
  return { type: 'home' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  switch (route.type) {
    case 'admin':
      return <AdminPage />
    case 'reveal':
      return <RevealPage encodedData={route.data} />
    case 'home':
      return <HomePage />
  }
}

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8">
      <h1 className="font-display text-5xl md:text-7xl font-bold text-shimmer mb-4 tracking-wider">
        LHHF
      </h1>
      <p className="text-gray-400 text-lg mb-12 font-body tracking-widest uppercase">
        Draft Lottery
      </p>
      <a
        href="#/admin"
        className="px-8 py-4 bg-gold/10 border border-gold/30 text-gold font-display text-xl tracking-wider hover:bg-gold/20 transition-all duration-300 animate-pulse-glow"
      >
        COMMISSIONER ENTRANCE
      </a>
    </div>
  )
}
