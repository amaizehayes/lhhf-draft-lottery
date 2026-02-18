import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { LotteryResult } from '../lib/lottery'
import { hashResults } from '../lib/encoding'

interface Props {
  result: LotteryResult
  preRevealHash: string
}

export default function ResultsSummary({ result, preRevealHash }: Props) {
  const [computedHash, setComputedHash] = useState<string>('')
  const [hashMatch, setHashMatch] = useState<boolean | null>(null)

  useEffect(() => {
    hashResults(result).then(hash => {
      setComputedHash(hash)
      setHashMatch(hash === preRevealHash)
    })
  }, [result, preRevealHash])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <h2 className="font-display text-3xl md:text-4xl text-center text-shimmer tracking-wider mb-2">
          OFFICIAL RESULTS
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8 tracking-widest uppercase">
          {result.year} LHHF Draft Lottery
        </p>

        {/* Results Table */}
        <div className="mb-8">
          <div className="grid grid-cols-[50px_1fr_80px] gap-2 text-xs text-gray-600 uppercase tracking-wider px-4 pb-2 border-b border-gray-800">
            <span>Pick</span>
            <span>Team</span>
            <span className="text-right">Odds</span>
          </div>
          {result.picks.map((pick, i) => (
            <motion.div
              key={pick.pick}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`grid grid-cols-[50px_1fr_80px] gap-2 items-center px-4 py-3 border-b border-gray-800/50 ${i === 0 ? 'bg-gold/5' : ''}`}
            >
              <span className={`font-display text-lg ${i === 0 ? 'text-gold' : 'text-gray-500'}`}>
                #{pick.pick}
              </span>
              <span className={`font-display text-lg tracking-wider ${i === 0 ? 'text-gold' : 'text-white'}`}>
                {pick.team}
              </span>
              <span className="font-mono text-sm text-gray-500 text-right">
                {pick.percentage}%
              </span>
            </motion.div>
          ))}
        </div>

        {/* Hash Verification */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border border-gray-800 bg-surface p-4 space-y-3"
        >
          <h3 className="font-display text-sm text-gray-400 tracking-wider">
            INTEGRITY VERIFICATION
          </h3>

          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Pre-Reveal Hash</p>
            <p className="font-mono text-xs text-gray-400 break-all">{preRevealHash}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Computed Hash</p>
            <p className="font-mono text-xs text-gray-400 break-all">{computedHash}</p>
          </div>

          {hashMatch !== null && (
            <div className={`flex items-center gap-2 pt-2 border-t border-gray-800 ${hashMatch ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-lg">{hashMatch ? '\u2713' : '\u2717'}</span>
              <span className="text-xs uppercase tracking-wider">
                {hashMatch ? 'Hashes match \u2014 results verified' : 'Hash mismatch \u2014 results may have been tampered with'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-8 tracking-widest uppercase">
          Powered by LHHF Draft Lottery
        </p>
      </motion.div>
    </div>
  )
}
