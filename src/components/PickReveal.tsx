import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  playHeartbeat,
  playTensionRiser,
  playWhoosh,
  playBoom,
  playTick,
} from '../lib/audio'

interface Props {
  pickNumber: number // 5 down to 2
  teamName: string
  percentage: string
  remainingTeams: string[]
  onNext: () => void
  isLast: boolean
}

type Phase = 'announce' | 'shuffle' | 'countdown' | 'reveal' | 'stats' | 'done'

export default function PickReveal({
  pickNumber,
  teamName,
  percentage,
  remainingTeams,
  onNext,
  isLast,
}: Props) {
  const [phase, setPhase] = useState<Phase>('announce')
  const [countdownNum, setCountdownNum] = useState(3)
  const [shuffleIndex, setShuffleIndex] = useState(0)
  const riserRef = useRef<{ stop: () => void } | null>(null)

  // Intensity scales up as picks get more important (5=low, 2=high before showdown)
  const intensity = (6 - pickNumber) / 4

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const advanceToShuffle = useCallback(() => {
    setPhase('shuffle')
    riserRef.current = playTensionRiser(2 + intensity * 2, intensity)
  }, [intensity])

  // Auto-advance from announce to shuffle
  useEffect(() => {
    if (phase === 'announce') {
      playHeartbeat(0.5 + intensity * 0.5)
      const t = setTimeout(advanceToShuffle, 1500 + intensity * 500)
      return () => clearTimeout(t)
    }
  }, [phase, advanceToShuffle, intensity])

  // Shuffle animation
  useEffect(() => {
    if (phase !== 'shuffle') return
    const interval = setInterval(() => {
      setShuffleIndex(prev => (prev + 1) % remainingTeams.length)
    }, 100)

    const t = setTimeout(() => {
      clearInterval(interval)
      riserRef.current?.stop()
      setPhase('countdown')
    }, 2000 + intensity * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(t)
    }
  }, [phase, remainingTeams.length, intensity])

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return

    let num = 3
    setCountdownNum(3)
    playTick()

    const interval = setInterval(() => {
      num--
      if (num <= 0) {
        clearInterval(interval)
        playWhoosh()
        setTimeout(() => {
          playBoom(0.5 + intensity * 0.7)
          setPhase('reveal')
        }, 200)
      } else {
        setCountdownNum(num)
        playTick()
        playHeartbeat(0.3 + intensity * 0.4)
      }
    }, 800 + intensity * 200)

    return () => clearInterval(interval)
  }, [phase, intensity])

  // Auto-advance from reveal to stats
  useEffect(() => {
    if (phase === 'reveal') {
      const t = setTimeout(() => setPhase('stats'), 1500)
      return () => clearTimeout(t)
    }
  }, [phase])

  // Auto-advance to done for stats
  useEffect(() => {
    if (phase === 'stats') {
      const t = setTimeout(() => setPhase('done'), 1200)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Background intensity glow */}
      <div
        className="absolute inset-0 transition-all duration-1000 pointer-events-none"
        style={{
          background: phase === 'reveal' || phase === 'stats' || phase === 'done'
            ? `radial-gradient(ellipse at center, rgba(212,175,55,${0.08 + intensity * 0.07}) 0%, transparent 70%)`
            : 'none',
        }}
      />

      <AnimatePresence mode="wait">
        {/* ANNOUNCE */}
        {phase === 'announce' && (
          <motion.div
            key="announce"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center z-10"
          >
            <p className="text-gray-500 text-sm tracking-[0.3em] uppercase mb-4">Coming up next</p>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-wider">
              WITH THE{' '}
              <span className="text-gold">{ordinal(pickNumber).toUpperCase()}</span>
              {' '}PICK
            </h2>
            <p className="font-display text-xl md:text-2xl text-gray-400 mt-2 tracking-widest">
              IN THE LHHF DRAFT...
            </p>
          </motion.div>
        )}

        {/* SHUFFLE */}
        {phase === 'shuffle' && (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-6">
              {ordinal(pickNumber)} PICK
            </p>
            <div className="space-y-2 mb-8">
              {remainingTeams.map((team, i) => (
                <motion.div
                  key={team}
                  animate={{
                    scale: i === shuffleIndex ? 1.05 : 1,
                    backgroundColor: i === shuffleIndex ? 'rgba(212,175,55,0.1)' : 'rgba(17,17,17,1)',
                    borderColor: i === shuffleIndex ? 'rgba(212,175,55,0.3)' : 'rgba(55,55,55,1)',
                  }}
                  transition={{ duration: 0.08 }}
                  className="px-8 py-3 border font-display text-xl tracking-wider text-white"
                >
                  {team}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* COUNTDOWN */}
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <motion.span
              key={countdownNum}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="font-display text-8xl md:text-[10rem] font-bold text-gold block"
              style={{
                textShadow: `0 0 ${30 + intensity * 30}px rgba(212,175,55,${0.3 + intensity * 0.3})`,
              }}
            >
              {countdownNum}
            </motion.span>
          </motion.div>
        )}

        {/* REVEAL */}
        {(phase === 'reveal' || phase === 'stats' || phase === 'done') && (
          <motion.div
            key="revealed"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="text-center z-10"
          >
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-3">
              {ordinal(pickNumber)} PICK
            </p>
            <h2
              className="font-display text-5xl md:text-7xl font-bold text-gold tracking-wider mb-4"
              style={{
                textShadow: `0 0 ${40 + intensity * 40}px rgba(212,175,55,${0.3 + intensity * 0.4})`,
              }}
            >
              {teamName}
            </h2>

            <AnimatePresence>
              {(phase === 'stats' || phase === 'done') && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-400 font-mono text-sm tracking-wider"
                >
                  HAD A {percentage}% CHANCE
                </motion.p>
              )}
            </AnimatePresence>

            {phase === 'done' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onNext}
                className="mt-10 px-10 py-4 bg-gold/10 border border-gold/30 text-gold font-display text-lg tracking-widest hover:bg-gold/20 transition-all animate-pulse-glow"
              >
                {isLast ? 'THE FINAL TWO' : 'NEXT PICK'}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
