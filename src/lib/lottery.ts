export interface TeamEntry {
  team: string
  balls: number
}

export interface LotteryResult {
  picks: { pick: number; team: string; balls: number; percentage: string }[]
  entries: TeamEntry[]
  timestamp: string
  year: number
}

/**
 * Run a weighted lottery without replacement.
 * Uses crypto.getRandomValues() for cryptographic randomness.
 */
export function runLottery(entries: TeamEntry[]): LotteryResult {
  const totalBalls = entries.reduce((sum, e) => sum + e.balls, 0)
  if (totalBalls !== 10000) {
    throw new Error(`Ball count must equal 10,000 (got ${totalBalls})`)
  }

  const remaining = entries.map(e => ({ ...e }))
  const picks: LotteryResult['picks'] = []

  for (let round = 0; round < 6; round++) {
    const remainingTotal = remaining.reduce((sum, e) => sum + e.balls, 0)

    // Generate cryptographically random number in [0, remainingTotal)
    const randomValue = cryptoRandom(remainingTotal)

    let cumulative = 0
    let selectedIndex = -1
    for (let i = 0; i < remaining.length; i++) {
      cumulative += remaining[i].balls
      if (randomValue < cumulative) {
        selectedIndex = i
        break
      }
    }

    const selected = remaining[selectedIndex]
    picks.push({
      pick: round + 1,
      team: selected.team,
      balls: selected.balls,
      percentage: ((selected.balls / totalBalls) * 100).toFixed(1),
    })

    remaining.splice(selectedIndex, 1)
  }

  return {
    picks,
    entries,
    timestamp: new Date().toISOString(),
    year: new Date().getFullYear(),
  }
}

/**
 * Generate a random integer in [0, max) using crypto.getRandomValues
 */
function cryptoRandom(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}
