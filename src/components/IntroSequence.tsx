import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playDrone } from '../lib/audio'

interface Props {
  year: number
  sha256: string
  onComplete: () => void
}

export default function IntroSequence({ year, sha256, onComplete }: Props) {
  const [phase, setPhase] = useState<'logo' | 'title' | 'hash' | 'ready'>('logo')
  const droneRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    droneRef.current = playDrone(12, 0.4)

    const t1 = setTimeout(() => setPhase('title'), 1500)
    const t2 = setTimeout(() => setPhase('hash'), 3500)
    const t3 = setTimeout(() => setPhase('ready'), 5500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      droneRef.current?.stop()
    }
  }, [])

  const handleBegin = () => {
    droneRef.current?.stop()
    onComplete()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Subtle radial glow behind content */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="font-display text-7xl md:text-9xl font-bold text-shimmer tracking-widest">
              LHHF
            </h1>
          </motion.div>
        )}

        {phase === 'title' && (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-gray-500 text-sm tracking-[0.3em] uppercase mb-4 font-body">
              Presented by Fate
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-wider">
              THE {year} DRAFT LOTTERY
            </h2>
          </motion.div>
        )}

        {(phase === 'hash' || phase === 'ready') && (
          <motion.div
            key="hash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg px-4"
          >
            <p className="text-gray-500 text-sm tracking-[0.3em] uppercase mb-4 font-body">
              Presented by Fate
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-wider mb-8">
              THE {year} DRAFT LOTTERY
            </h2>

            <div className="mb-8">
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Sealed Result Verification</p>
              <p className="font-mono text-xs text-gold/60 break-all leading-relaxed">
                SHA-256: {sha256}
              </p>
            </div>

            {phase === 'ready' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onClick={handleBegin}
                className="px-12 py-4 bg-gold/10 border border-gold/30 text-gold font-display text-2xl tracking-widest hover:bg-gold/20 transition-all animate-pulse-glow"
              >
                BEGIN
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
