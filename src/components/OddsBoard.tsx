import { motion } from 'framer-motion'
import type { TeamEntry } from '../lib/lottery'
import { playDrone } from '../lib/audio'
import { useEffect, useRef } from 'react'

interface Props {
  entries: TeamEntry[]
  onReveal: () => void
}

export default function OddsBoard({ entries, onReveal }: Props) {
  const droneRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    droneRef.current = playDrone(20, 0.3)
    return () => { droneRef.current?.stop() }
  }, [])

  const totalBalls = entries.reduce((s, e) => s + e.balls, 0)
  const sorted = [...entries].sort((a, b) => b.balls - a.balls)

  const handleReveal = () => {
    droneRef.current?.stop()
    onReveal()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <h2 className="font-display text-2xl md:text-3xl text-center text-gold tracking-wider mb-2">
          THE LOTTERY FIELD
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8 tracking-widest uppercase">
          {totalBalls.toLocaleString()} balls in the machine
        </p>

        <div className="space-y-2 mb-10">
          {sorted.map((entry, i) => {
            const pct = ((entry.balls / totalBalls) * 100).toFixed(1)
            return (
              <motion.div
                key={entry.team}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-center justify-between bg-surface border border-gray-800 px-4 py-3"
              >
                <span className="font-display text-lg text-white tracking-wider">{entry.team}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-gray-500">{entry.balls.toLocaleString()} balls</span>
                  <span className="font-mono text-sm text-gold font-semibold w-16 text-right">{pct}%</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={handleReveal}
            className="px-10 py-4 bg-gold/10 border border-gold/30 text-gold font-display text-xl tracking-widest hover:bg-gold/20 transition-all animate-pulse-glow"
          >
            REVEAL THE PICKS
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
