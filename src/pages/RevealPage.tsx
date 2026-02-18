import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { decodeResults, hashResults } from '../lib/encoding'
import { initAudio } from '../lib/audio'
import type { LotteryResult } from '../lib/lottery'
import IntroSequence from '../components/IntroSequence'
import OddsBoard from '../components/OddsBoard'
import PickReveal from '../components/PickReveal'
import FinalShowdown from '../components/FinalShowdown'
import ResultsSummary from '../components/ResultsSummary'
import SoundToggle from '../components/SoundToggle'

type RevealState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'intro' }
  | { phase: 'odds' }
  | { phase: 'pick'; index: number } // index into middlePicks (reveals #5, #4, #3, #2)
  | { phase: 'showdown' }            // dramatic final between last 2 teams
  | { phase: 'summary' }

interface Props {
  encodedData: string
}

export default function RevealPage({ encodedData }: Props) {
  const [state, setState] = useState<RevealState>({ phase: 'loading' })
  const [result, setResult] = useState<LotteryResult | null>(null)
  const [sha256, setSha256] = useState('')

  // Decode on mount
  useEffect(() => {
    try {
      const decoded = decodeResults(encodedData)
      setResult(decoded)
      hashResults(decoded).then(hash => {
        setSha256(hash)
        setState({ phase: 'intro' })
      })
    } catch {
      setState({ phase: 'error', message: 'Invalid or corrupted lottery data' })
    }
  }, [encodedData])

  // Middle picks revealed in order: #5, #4, #3, #2
  const middlePicks = useMemo(() => {
    if (!result) return []
    return result.picks
      .filter(p => p.pick >= 2 && p.pick <= 5)
      .sort((a, b) => b.pick - a.pick) // 5, 4, 3, 2
  }, [result])

  // The #1 and #6 picks for the final showdown
  const pick1 = useMemo(() => result?.picks.find(p => p.pick === 1), [result])
  const pick6 = useMemo(() => result?.picks.find(p => p.pick === 6), [result])

  // Get remaining teams for a given middle-pick reveal index
  const getRemainingTeams = (revealIndex: number): string[] => {
    const revealed = new Set(middlePicks.slice(0, revealIndex).map(p => p.team))
    return result!.entries
      .filter(e => !revealed.has(e.team))
      .map(e => e.team)
  }

  const handlePickNext = () => {
    if (state.phase !== 'pick') return
    const nextIndex = state.index + 1
    if (nextIndex >= middlePicks.length) {
      // Middle picks done — time for the showdown
      setState({ phase: 'showdown' })
    } else {
      setState({ phase: 'pick', index: nextIndex })
    }
  }

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-600 font-display tracking-widest">LOADING...</div>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8">
        <h1 className="font-display text-3xl text-red-500 mb-4">ERROR</h1>
        <p className="text-gray-400">{state.message}</p>
        <a href="#/" className="mt-8 text-gold/50 hover:text-gold transition-colors">
          &larr; Home
        </a>
      </div>
    )
  }

  return (
    <div className="relative">
      <SoundToggle />

      <AnimatePresence mode="wait">
        {state.phase === 'intro' && (
          <IntroSequence
            key="intro"
            year={result!.year}
            sha256={sha256}
            onComplete={() => {
              initAudio()
              setState({ phase: 'odds' })
            }}
          />
        )}

        {state.phase === 'odds' && (
          <OddsBoard
            key="odds"
            entries={result!.entries}
            onReveal={() => setState({ phase: 'pick', index: 0 })}
          />
        )}

        {state.phase === 'pick' && (
          <PickReveal
            key={`pick-${state.index}`}
            pickNumber={middlePicks[state.index].pick}
            teamName={middlePicks[state.index].team}
            percentage={middlePicks[state.index].percentage}
            remainingTeams={getRemainingTeams(state.index)}
            onNext={handlePickNext}
            isLast={state.index === middlePicks.length - 1}
          />
        )}

        {state.phase === 'showdown' && pick1 && pick6 && (
          <FinalShowdown
            key="showdown"
            team1={{ team: pick1.team, percentage: pick1.percentage }}
            team6={{ team: pick6.team, percentage: pick6.percentage }}
            onContinue={() => setState({ phase: 'summary' })}
          />
        )}

        {state.phase === 'summary' && (
          <ResultsSummary
            key="summary"
            result={result!}
            preRevealHash={sha256}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
