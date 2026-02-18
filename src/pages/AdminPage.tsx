import { useState, useMemo } from 'react'
import { runLottery, type TeamEntry } from '../lib/lottery'
import { buildRevealUrl, hashResults } from '../lib/encoding'

const TOTAL_BALLS = 10000

interface TeamRow {
  team: string
  balls: string
}

const emptyRows: TeamRow[] = Array.from({ length: 6 }, () => ({ team: '', balls: '' }))

export default function AdminPage() {
  const [rows, setRows] = useState<TeamRow[]>(emptyRows)
  const [revealUrl, setRevealUrl] = useState<string | null>(null)
  const [sha256, setSha256] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const updateRow = (i: number, field: keyof TeamRow, value: string) => {
    setRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r))
    setError(null)
    setRevealUrl(null)
  }

  const totalAssigned = useMemo(
    () => rows.reduce((sum, r) => sum + (parseInt(r.balls) || 0), 0),
    [rows]
  )

  const remaining = TOTAL_BALLS - totalAssigned

  const validate = (): TeamEntry[] | null => {
    const entries: TeamEntry[] = []
    for (let i = 0; i < rows.length; i++) {
      const name = rows[i].team.trim()
      const balls = parseInt(rows[i].balls)
      if (!name) { setError(`Row ${i + 1}: Team name is required`); return null }
      if (!balls || balls <= 0) { setError(`Row ${i + 1}: Ball count must be positive`); return null }
      entries.push({ team: name, balls })
    }
    const total = entries.reduce((s, e) => s + e.balls, 0)
    if (total !== TOTAL_BALLS) {
      setError(`Balls must total ${TOTAL_BALLS.toLocaleString()} (currently ${total.toLocaleString()})`)
      return null
    }
    return entries
  }

  const executeLottery = async (isReal: boolean) => {
    const entries = validate()
    if (!entries) return

    const result = runLottery(entries)
    const url = buildRevealUrl(result)
    const hash = await hashResults(result)

    setRevealUrl(url)
    setSha256(hash)
    setCopied(false)
    setShowConfirm(false)

    if (!isReal) {
      window.open(url, '_blank')
    }
  }

  const copyUrl = () => {
    if (revealUrl) {
      navigator.clipboard.writeText(revealUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="#/" className="text-gold/50 text-sm hover:text-gold/80 transition-colors">
            &larr; Home
          </a>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-shimmer mt-4 tracking-wider">
            COMMISSIONER
          </h1>
          <p className="text-gray-500 mt-2 tracking-widest text-sm uppercase">
            Lottery Administration
          </p>
        </div>

        {/* Team Input Form */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-[1fr_120px] gap-3 text-xs text-gray-500 uppercase tracking-wider px-1">
            <span>Team Name</span>
            <span className="text-right">Balls (of 10,000)</span>
          </div>

          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px] gap-3">
              <input
                type="text"
                placeholder={`Team ${i + 1}`}
                value={row.team}
                onChange={e => updateRow(i, 'team', e.target.value)}
                className="bg-surface border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-gold/50 focus:outline-none transition-colors font-body"
              />
              <input
                type="number"
                placeholder="0"
                value={row.balls}
                onChange={e => updateRow(i, 'balls', e.target.value)}
                className="bg-surface border border-gray-800 px-4 py-3 text-white text-right placeholder-gray-600 focus:border-gold/50 focus:outline-none transition-colors font-mono"
              />
            </div>
          ))}
        </div>

        {/* Ball Counter */}
        <div className={`text-center py-3 mb-6 border ${remaining === 0 ? 'border-green-800/50 bg-green-900/10 text-green-400' : remaining < 0 ? 'border-red-800/50 bg-red-900/10 text-red-400' : 'border-gray-800 bg-surface text-gray-400'}`}>
          <span className="font-mono text-sm">
            {totalAssigned.toLocaleString()} / {TOTAL_BALLS.toLocaleString()} balls assigned
            {remaining > 0 && ` \u2014 ${remaining.toLocaleString()} remaining`}
            {remaining < 0 && ` \u2014 ${Math.abs(remaining).toLocaleString()} over!`}
            {remaining === 0 && ' \u2713'}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/50 text-red-400 px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => executeLottery(false)}
            className="px-6 py-4 bg-surface-lighter border border-gray-700 text-gray-300 font-display text-lg tracking-wider hover:bg-gray-700 hover:text-white transition-all"
          >
            TEST LOTTERY
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-6 py-4 bg-gold/10 border border-gold/30 text-gold font-display text-lg tracking-wider hover:bg-gold/20 transition-all animate-pulse-glow"
          >
            SEAL THE LOTTERY
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-light border border-gold/30 p-8 max-w-md w-full text-center">
              <h2 className="font-display text-2xl text-gold mb-4 tracking-wider">
                SEAL THE LOTTERY?
              </h2>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                This will run the official lottery and generate the shareable reveal URL.
                The results are cryptographically sealed &mdash; once generated, they cannot be altered.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-surface border border-gray-700 text-gray-400 font-display tracking-wider hover:bg-gray-800 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => executeLottery(true)}
                  className="flex-1 py-3 bg-gold/20 border border-gold/50 text-gold font-display tracking-wider hover:bg-gold/30 transition-all"
                >
                  SEAL IT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result URL */}
        {revealUrl && (
          <div className="border border-gold/20 bg-surface p-6 space-y-4">
            <h3 className="font-display text-lg text-gold tracking-wider">LOTTERY SEALED</h3>

            {sha256 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">SHA-256 Hash</p>
                <p className="font-mono text-xs text-gray-400 break-all select-all">{sha256}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reveal URL</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={revealUrl}
                  className="flex-1 bg-black border border-gray-800 px-3 py-2 text-xs font-mono text-gray-400 select-all"
                />
                <button
                  onClick={copyUrl}
                  className="px-4 py-2 bg-gold/10 border border-gold/30 text-gold text-xs font-display tracking-wider hover:bg-gold/20 transition-all whitespace-nowrap"
                >
                  {copied ? 'COPIED!' : 'COPY'}
                </button>
              </div>
            </div>

            <button
              onClick={() => window.open(revealUrl, '_blank')}
              className="w-full py-3 bg-gold/10 border border-gold/30 text-gold font-display tracking-wider hover:bg-gold/20 transition-all"
            >
              OPEN REVEAL
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
