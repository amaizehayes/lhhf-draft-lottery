import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  playDrone,
  playHeartbeat,
  playTensionRiser,
  playBoom,
  playWhoosh,
  playCelebration,
  playTick,
} from '../lib/audio'

interface Props {
  team1: { team: string; percentage: string }  // The #1 pick winner
  team6: { team: string; percentage: string }  // The #6 pick
  onContinue: () => void
}

type Phase =
  | 'intro'        // "TWO TEAMS REMAIN"
  | 'versus'       // Show both teams face-to-face
  | 'tension'      // Heartbeats, flashing, building
  | 'fate'         // "ONE GETS THE FIRST PICK. ONE GETS THE LAST."
  | 'countdown'    // 3... 2... 1...
  | 'pause'        // Brief dark pause before the winner
  | 'winner-build' // "WITH THE #1 OVERALL PICK..."
  | 'winner'       // BOOM - team revealed with celebration
  | 'done'         // Show button

export default function FinalShowdown({ team1, team6, onContinue }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdownNum, setCountdownNum] = useState(3)
  const [flashTeam, setFlashTeam] = useState(0) // For the tension flashing between teams
  const droneRef = useRef<{ stop: () => void } | null>(null)
  const riserRef = useRef<{ stop: () => void } | null>(null)

  // Phase progression
  useEffect(() => {
    const teams = [team1.team, team6.team]

    switch (phase) {
      case 'intro': {
        droneRef.current = playDrone(30, 0.5)
        const t = setTimeout(() => setPhase('versus'), 2500)
        return () => clearTimeout(t)
      }
      case 'versus': {
        playHeartbeat(0.6)
        const t = setTimeout(() => setPhase('tension'), 3000)
        return () => clearTimeout(t)
      }
      case 'tension': {
        // Flash between teams rapidly
        let count = 0
        const interval = setInterval(() => {
          setFlashTeam(count % 2)
          count++
          if (count % 4 === 0) playHeartbeat(0.4 + (count / 40))
        }, 150)

        riserRef.current = playTensionRiser(4, 1.2)

        const t = setTimeout(() => {
          clearInterval(interval)
          riserRef.current?.stop()
          setPhase('fate')
        }, 4000)

        return () => { clearInterval(interval); clearTimeout(t) }
      }
      case 'fate': {
        playHeartbeat(0.8)
        const t = setTimeout(() => setPhase('countdown'), 3000)
        return () => clearTimeout(t)
      }
      case 'countdown': {
        let num = 3
        setCountdownNum(3)
        playTick()
        playHeartbeat(0.6)

        const interval = setInterval(() => {
          num--
          if (num <= 0) {
            clearInterval(interval)
            playWhoosh()
            setTimeout(() => {
              playBoom(0.8)
              setPhase('pause')
            }, 300)
          } else {
            setCountdownNum(num)
            playTick()
            playHeartbeat(0.5 + (3 - num) * 0.2)
          }
        }, 1000)

        return () => clearInterval(interval)
      }
      case 'pause': {
        // Dark beat of silence
        droneRef.current?.stop()
        droneRef.current = playDrone(8, 0.6)
        const t = setTimeout(() => setPhase('winner-build'), 2000)
        return () => clearTimeout(t)
      }
      case 'winner-build': {
        riserRef.current = playTensionRiser(3, 1.5)
        playHeartbeat(1.0)
        const t = setTimeout(() => {
          riserRef.current?.stop()
          droneRef.current?.stop()
          setPhase('winner')
        }, 3000)
        return () => clearTimeout(t)
      }
      case 'winner': {
        // BIG BOOM
        playBoom(1.5)

        // Confetti from both sides
        const end = Date.now() + 4000
        const frame = () => {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ['#d4af37', '#f0d060', '#ffffff', '#a08520'],
          })
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ['#d4af37', '#f0d060', '#ffffff', '#a08520'],
          })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()

        // Center burst after a beat
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#d4af37', '#f0d060', '#ffffff', '#a08520'],
          })
          playCelebration()
        }, 600)

        const t = setTimeout(() => setPhase('done'), 3500)
        return () => clearTimeout(t)
      }
      default:
        void teams // suppress unused warning
    }
  }, [phase, team1, team6])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      droneRef.current?.stop()
      riserRef.current?.stop()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Background glow that intensifies */}
      <div
        className="absolute inset-0 transition-all duration-1000 pointer-events-none"
        style={{
          background: phase === 'winner' || phase === 'done'
            ? 'radial-gradient(ellipse at center, rgba(212,175,55,0.15) 0%, transparent 60%)'
            : phase === 'tension' || phase === 'countdown'
              ? 'radial-gradient(ellipse at center, rgba(220,38,38,0.05) 0%, transparent 70%)'
              : 'none',
        }}
      />

      {/* Screen flash on winner reveal */}
      {phase === 'winner' && (
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white z-20 pointer-events-none"
        />
      )}

      <AnimatePresence mode="wait">
        {/* INTRO: "TWO TEAMS REMAIN" */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center z-10"
          >
            <p className="text-gray-600 text-sm tracking-[0.3em] uppercase mb-4">The moment of truth</p>
            <h2 className="font-display text-5xl md:text-7xl font-bold text-white tracking-wider">
              TWO TEAMS REMAIN
            </h2>
          </motion.div>
        )}

        {/* VERSUS: Both teams shown */}
        {phase === 'versus' && (
          <motion.div
            key="versus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center z-10 w-full max-w-md"
          >
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-surface border border-gray-700 px-8 py-5 mb-4"
            >
              <span className="font-display text-3xl text-white tracking-wider">{team1.team}</span>
              <span className="font-mono text-sm text-gray-500 ml-4">{team1.percentage}%</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="font-display text-2xl text-gold/50 my-3 tracking-widest"
            >
              VS
            </motion.p>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-surface border border-gray-700 px-8 py-5"
            >
              <span className="font-display text-3xl text-white tracking-wider">{team6.team}</span>
              <span className="font-mono text-sm text-gray-500 ml-4">{team6.percentage}%</span>
            </motion.div>
          </motion.div>
        )}

        {/* TENSION: Flashing between teams */}
        {phase === 'tension' && (
          <motion.div
            key="tension"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <motion.h2
              animate={{
                textShadow: [
                  '0 0 20px rgba(212,175,55,0.3)',
                  '0 0 40px rgba(212,175,55,0.6)',
                  '0 0 20px rgba(212,175,55,0.3)',
                ],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="font-display text-5xl md:text-7xl font-bold text-white tracking-wider"
            >
              {flashTeam === 0 ? team1.team : team6.team}
            </motion.h2>
          </motion.div>
        )}

        {/* FATE: The stakes */}
        {phase === 'fate' && (
          <motion.div
            key="fate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center z-10 max-w-lg"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display text-2xl md:text-3xl text-gray-300 tracking-wider leading-relaxed"
            >
              ONE GETS THE{' '}
              <span className="text-gold">FIRST PICK</span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="font-display text-2xl md:text-3xl text-gray-300 tracking-wider leading-relaxed mt-2"
            >
              ONE GETS THE{' '}
              <span className="text-gray-500">LAST</span>
            </motion.p>
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
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="font-display text-[10rem] md:text-[14rem] font-bold text-gold block"
              style={{
                textShadow: '0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(212,175,55,0.2)',
              }}
            >
              {countdownNum}
            </motion.span>
          </motion.div>
        )}

        {/* PAUSE: Dark silence */}
        {phase === 'pause' && (
          <motion.div
            key="pause"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <p className="text-gray-700 text-sm tracking-[0.4em] uppercase">
              which means...
            </p>
          </motion.div>
        )}

        {/* WINNER BUILD: "WITH THE #1 OVERALL PICK..." */}
        {phase === 'winner-build' && (
          <motion.div
            key="winner-build"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center z-10 animate-heartbeat"
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-wider">
              WITH THE{' '}
              <span className="text-gold">#1 OVERALL</span>
              {' '}PICK
            </h2>
            <p className="font-display text-xl md:text-2xl text-gray-400 mt-2 tracking-widest">
              IN THE LHHF DRAFT...
            </p>
          </motion.div>
        )}

        {/* WINNER + DONE: The champion revealed */}
        {(phase === 'winner' || phase === 'done') && (
          <motion.div
            key="winner"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 8, stiffness: 100 }}
            className="text-center z-10"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-sm tracking-[0.3em] uppercase mb-4"
            >
              WITH THE #1 OVERALL PICK
            </motion.p>

            <h1
              className="font-display text-6xl md:text-8xl lg:text-9xl font-bold text-shimmer tracking-wider mb-6"
              style={{
                textShadow: '0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(212,175,55,0.2)',
              }}
            >
              {team1.team}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-gold/80 font-mono text-lg tracking-wider mb-2"
            >
              HAD A {team1.percentage}% CHANCE
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-gray-500 text-sm tracking-widest uppercase"
            >
              Congratulations
            </motion.p>

            {phase === 'done' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onContinue}
                className="mt-10 px-10 py-4 bg-gold/10 border border-gold/30 text-gold font-display text-lg tracking-widest hover:bg-gold/20 transition-all animate-pulse-glow"
              >
                VIEW FULL RESULTS
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
