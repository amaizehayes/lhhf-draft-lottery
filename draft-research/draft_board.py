import csv

# =====================================================
# LHHF 2026 PRELIMINARY DRAFT BOARD
# Cleft Lip Sucker Punchers
# =====================================================

TEAM_NAMES = {
    'LU': 'Butt Pirates', 'MSOB': 'Motorboatin', 'KISH': 'Stack Cheese',
    'TMB': 'Master Batters', 'MM': 'Mustache Mil', 'SAP': 'Sausage Ped',
    'JAZZ': 'Jazz Hands', 'LCKK': 'Liberty City', 'IAN': 'Hebrew Hamm',
    'NGNP': 'No Glove', 'CLSP': '** YOU **', 'CMPN': 'Chin Music',
    'FA': 'FREE AGENT',
}

# Parse league players
league_players = []
with open('top-500-players.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            adp = float(row['ADP'])
        except:
            adp = 999
        try:
            rkov = int(row['RkOv'])
        except:
            rkov = 999
        try:
            age = int(row['Age'])
        except:
            age = 0

        league_players.append({
            'name': row['Player'].strip(),
            'team_code': row.get('Status', '').strip(),
            'adp': adp,
            'rank': rkov,
            'pos': row.get('Position', ''),
            'age': age,
            'real_team': row.get('Team', ''),
        })

# Parse dynasty rankings
dynasty = {}
with open('Top-500 Fantasy Baseball Dynasty Rankings - FantraxHQ.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('Player', '').strip()
        try:
            dynasty[name] = int(row.get('Roto', 999))
        except:
            dynasty[name] = 999

league_players.sort(key=lambda x: x['adp'])

# =====================================================
# Manually project HIGH-CONFIDENCE keepers for each team
# These are players so obviously kept that they won't be in the draft
# Conservative: only include players where keeper value is clearly positive
# =====================================================

# Based on 2025 draft keeper data + current rosters + known costs
# Format: player_name -> (team, estimated_round_cost, confidence)
LIKELY_KEPT = {
    # CLSP - CONFIRMED
    'Bobby Witt Jr.': ('CLSP', 7, 'CONFIRMED'),
    'Corbin Carroll': ('CLSP', 10, 'CONFIRMED'),
    'Gunnar Henderson': ('CLSP', 4, 'CONFIRMED'),
    'Pete Alonso': ('CLSP', 2, 'CONFIRMED'),
    'Jesus Luzardo': ('CLSP', 22, 'CONFIRMED'),

    # CMPN (Chin Music) - Ohtani, Skubal are obvious
    'Shohei Ohtani': ('CMPN', 1, 'LOCK'),
    'Tarik Skubal': ('CMPN', 7, 'LOCK'),
    'Cole Ragans': ('CMPN', 7, 'LIKELY'),  # conflicts w/ Skubal at R7
    'Nick Kurtz': ('CMPN', 13, 'LIKELY'),  # undrafted, huge value

    # JAZZ (Jazz Hands) - Judge, Skenes are obvious
    'Aaron Judge': ('JAZZ', 1, 'LOCK'),
    'Paul Skenes': ('JAZZ', 14, 'LOCK'),  # R17 first-time -> R14, insane value

    # KISH (Stack That Cheese) - have Soto, Ramirez, Tucker (traded for)
    # All R1 cost - can only keep 1 at R1
    'Juan Soto': ('KISH', 1, 'LIKELY'),  # or Ramirez, or Tucker
    'Pete Crow-Armstrong': ('KISH', 9, 'LIKELY'),  # R9 first-time, ADP 31

    # MM (Mustache Militia) - Acuna, Chourio
    'Ronald Acuna Jr.': ('MM', 1, 'LOCK'),
    'Jackson Chourio': ('MM', 13, 'LOCK'),  # R16 first-time -> R13, elite value
    'Spencer Schwellenbach': ('MM', 13, 'LIKELY'),

    # LCKK (Liberty City) - Ketel Marte, James Wood, Anthony Santander (injured), Mason Miller
    'James Wood': ('LCKK', 13, 'LOCK'),  # R16 first-time -> R13, ADP 28
    'Jackson Merrill': ('LCKK', 13, 'LOCK'),  # R17 first-time -> R14, good value
    'Mason Miller': ('LCKK', 5, 'LIKELY'),  # R8 first-time -> R5

    # IAN (Hebrew Hammers) - Crochet at R12 is insane, Betts/Vlad at R1
    'Garrett Crochet': ('IAN', 12, 'LOCK'),  # R15 first-time -> R12, ADP 11
    'Mookie Betts': ('IAN', 1, 'LOCK'),
    'Chris Sale': ('IAN', 4, 'LIKELY'),
    'William Contreras': ('IAN', 4, 'LIKELY'),

    # LU (Butt Pirates) - Julio, Yamamoto, Naylor
    'Julio Rodriguez': ('LU', 7, 'LOCK'),  # R10 first-time -> R7, ADP 11
    'Yoshinobu Yamamoto': ('LU', 7, 'LIKELY'),  # value 10->7
    'Josh Naylor': ('LU', 6, 'LIKELY'),

    # MSOB (Motorboatin') - Tatis, Junior Caminero, Westburg
    'Fernando Tatis Jr.': ('MSOB', 1, 'LOCK'),
    'Junior Caminero': ('MSOB', 9, 'LOCK'),  # R12 first-time -> R9, ADP 17.5

    # NGNP (No Glove) - Jarren Duran, Austin Riley, Brent Rooker, Bryce Miller
    'Jarren Duran': ('NGNP', 7, 'LOCK'),  # R10 first-time -> R7
    'Austin Riley': ('NGNP', 11, 'LIKELY'),  # R14 first-time -> R11
    'Brent Rooker': ('NGNP', 19, 'LIKELY'),  # R22 first-time -> R19

    # SAP (Sausage Peddler) - Logan Webb, Matt Chapman, Brenton Doyle
    'Logan Webb': ('SAP', 4, 'LIKELY'),  # R7 KEEPER -> R4
    'Matt Chapman': ('SAP', 10, 'LIKELY'),  # R13 first-time -> R10

    # TMB (Master Batters) - Elly De La Cruz, Royce Lewis, Dylan Cease, Jackson Holliday
    'Elly De La Cruz': ('TMB', 7, 'LOCK'),  # value 10->R7
    'Jackson Holliday': ('TMB', 13, 'LIKELY'),  # R16 first-time -> R13
    'Royce Lewis': ('TMB', 10, 'LIKELY'),
}

kept_names = set(LIKELY_KEPT.keys())

# =====================================================
# OUTPUT
# =====================================================
print("=" * 90)
print("  LHHF 2026 PRELIMINARY DRAFT BOARD — CLEFT LIP SUCKER PUNCHERS")
print("=" * 90)

print("""
YOUR CONFIRMED KEEPERS:
  R2:  Pete Alonso (1B, BAL)        | ADP 25.6  | Dynasty #32
  R4:  Gunnar Henderson (SS, BAL)   | ADP 19.6  | Dynasty #20
  R7:  Bobby Witt Jr. (SS, KC)      | ADP 4.1   | Dynasty #2
  R10: Corbin Carroll (OF, ARI)     | ADP 16.1  | Dynasty #8
  R22: Jesus Luzardo (SP, PHI)      | ADP 65.6  | Dynasty #97

MINOR LEAGUE (Free): Jesus Made, Charlie Condon, Justin Crawford

YOUR DRAFT PICKS: R1(7), R3(31), R5(55), R6(66), R8(90), R9(103),
  R11(127), R12(138), R13(151), R15(175), R16(186), R17(199+202),
  R18(210), R19(223), R21(247), R23(271+275), R24(282)
  [R14 & R20 traded to NGNP | Extra R17 & R23 from KISH]
""")

# =====================================================
# TOP 150 PLAYERS - AVAILABILITY PROJECTION
# =====================================================
print("=" * 90)
print("  MASTER DRAFT BOARD: Top 150 Players by ADP")
print("  [K] = Likely Kept  [FA] = Free Agent  [YOURS] = On your roster")
print("=" * 90)
print(f"{'#':>3} {'ADP':>6} {'Player':<26} {'Pos':<10} {'MLB':>4} {'Age':>3} {'Dyn':>4} {'Owner':<14} {'Status':<10}")
print("-" * 97)

for i, p in enumerate(league_players[:150]):
    name = p['name']
    tc = p['team_code']
    dyn = dynasty.get(name, 999)
    dyn_str = f"#{dyn}" if dyn < 500 else "---"
    owner = TEAM_NAMES.get(tc, tc)[:14]

    if name in LIKELY_KEPT:
        info = LIKELY_KEPT[name]
        if info[2] == 'CONFIRMED':
            status = f"YOURS R{info[1]}"
        elif info[2] == 'LOCK':
            status = f"[K] R{info[1]}"
        else:
            status = f"[K?] R{info[1]}"
    elif tc == 'FA':
        status = "[FA] AVAIL"
    elif tc == 'CLSP':
        status = "[YOURS]"
    else:
        status = "available?"

    print(f"{i+1:>3} {p['adp']:>6.1f} {name:<26} {p['pos']:<10} {p['real_team']:>4} {p['age']:>3} {dyn_str:>5} {owner:<14} {status}")

# =====================================================
# ROUND-BY-ROUND TARGETS
# =====================================================
print("\n" + "=" * 90)
print("  ROUND-BY-ROUND DRAFT STRATEGY")
print("=" * 90)

strategy = """
┌─────────────────────────────────────────────────────────────────────────────────┐
│ R1 (Pick 7) — BEST PLAYER AVAILABLE                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ With ~50-60 keepers off the board, pick 7 overall is more like pick 40-50      │
│ in a standard redraft. But MANY elite players return to the pool because       │
│ their keeper cost is R1 and teams can only keep 1 at R1.                       │
│                                                                                 │
│ TIER 1 TARGETS (if they fall - unlikely but possible):                         │
│   • Kyle Tucker (OF, LAD) — if KISH keeps Soto/Ramirez over him               │
│   • Jose Ramirez (3B, CLE) — if KISH keeps Soto/Tucker over him               │
│   • Vladimir Guerrero Jr. (1B, TOR) — if IAN keeps Betts over him             │
│                                                                                 │
│ TIER 2 TARGETS (realistic):                                                    │
│   • Cal Raleigh (C, SEA) — solves catcher, top-25 overall, 30+ HR             │
│   • Kyle Schwarber (DH, PHI) — elite HR/R/BB in categories                    │
│   • Ketel Marte (2B, ARI) — fills 2B, underrated in H2H cats                  │
│   • Yordan Alvarez (DH, HOU) — if CMPN doesn't keep him                       │
│                                                                                 │
│ TIER 3 (if pitching falls):                                                    │
│   • Hunter Brown (SP, HOU) — top-25 dynasty arm, K upside                     │
│   • Cristopher Sanchez (SP, PHI) — elite ratios, Phillies rotation             │
│                                                                                 │
│ RECOMMENDATION: Raleigh or best hitter available. Pitching is deep             │
│ enough to wait until R3. Catcher is NOT deep — Raleigh may be only             │
│ elite C option.                                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ R3 (Pick 31) — PITCHING OR PREMIUM BAT                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Your roster has 4 elite hitters and 1 SP. Pitching is CRITICAL here.           │
│                                                                                 │
│ SP TARGETS:                                                                     │
│   • Logan Gilbert (SP, SEA) — if MSOB doesn't keep, ADP ~42                   │
│   • Bryan Woo (SP, SEA) — ADP ~43, dynasty #56, elite stuff                   │
│   • Max Fried (SP, NYY) — already on your roster, ADP 49                       │
│   • Chris Sale (SP, ATL) — if IAN doesn't keep, ADP ~42                       │
│   • Freddy Peralta (SP, NYM) — ADP 57, K upside                               │
│                                                                                 │
│ BAT TARGETS (if elite value falls):                                             │
│   • Riley Greene (OF, DET) — your old keeper, ADP ~66, buy back cheap          │
│   • Brice Turang (2B, MIL) — ADP ~39, fills 2B, elite SB                      │
│   • CJ Abrams (SS, WSH) — ADP 70, if he falls                                │
│                                                                                 │
│ RECOMMENDATION: Take best SP available. You need 5 more pitchers.              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ R5 (Pick 55) — SP2 OR CATCHER                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ SP TARGETS:                                                                     │
│   • Joe Ryan (SP, MIN) — your old guy, ADP 69, solid ratios                    │
│   • George Kirby (SP, SEA) — ADP 73, workhorse                                │
│   • Framber Valdez (SP, DET) — ADP 79, high floor                              │
│   • Jacob deGrom (SP, TEX) — ADP 53, upside play                              │
│                                                                                 │
│ IF YOU DIDN'T GET CATCHER IN R1:                                               │
│   • William Contreras (C, MIL) — ADP 63                                        │
│   • Hunter Goodman (C, COL) — your own player, ADP 88                          │
│                                                                                 │
│ RECOMMENDATION: Continue SP or grab C if you skipped R1 catcher.               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ R6 (Pick 66) — FILL HOLES                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│   • Hunter Goodman (C, COL) — your player, ADP 88, re-draft cheaper            │
│   • Riley Greene (OF, DET) — ADP 66, buy back your old keeper                  │
│   • Bo Bichette (SS, NYM) — ADP 98, bounceback candidate at 27                │
│   • Nico Hoerner (2B, CHC) — ADP 90, fills 2B need                            │
│   • Kevin Gausman (SP, TOR) — ADP 96, reliable innings                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ R8-R9 (Picks 90, 103) — DEPTH + UPSIDE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│   • Eury Perez (SP, MIA) — ADP 99, age 22, if FA still available              │
│   • Kyle Bradish (SP, BAL) — ADP 85, FA, comeback from injury                 │
│   • Chase Burns (SP, CIN) — ADP 108, dynasty #86, young arm                   │
│   • Spencer Strider (SP, ATL) — ADP 83, if MM doesn't keep                    │
│   • Alex Bregman (3B, CHC) — ADP 84, FA, fills 3B need                        │
│   • Christian Yelich (DH, MIL) — ADP 80, FA                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ R11+ — RELIEVER(S) + ROSTER FILL                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│   • Target 1-2 closers/high-hold guys for SV/HLD categories                   │
│   • Andres Munoz, Edwin Diaz, Jhoan Duran, Mason Miller if available          │
│   • Fill remaining lineup spots (2B, 3B, OF depth)                             │
│   • R17+ use extra picks (KISH trades) on upside stashes                       │
└─────────────────────────────────────────────────────────────────────────────────┘
"""
print(strategy)

# =====================================================
# CATEGORY STRATEGY
# =====================================================
print("=" * 90)
print("  H2H CATEGORY STRATEGY (14 categories)")
print("=" * 90)
print("""
HITTING (7 cats): HR, RBI, R, SB, AVG, TB, BB+HBP

  Your keeper foundation:
  ┌────────────────┬─────┬─────┬─────┬────┬──────┬─────┬────────┐
  │ Player         │  HR │ RBI │   R │ SB │  AVG │  TB │ BB+HBP │
  ├────────────────┼─────┼─────┼─────┼────┼──────┼─────┼────────┤
  │ Bobby Witt Jr. │  30 │  97 │ 108 │ 37 │ .303 │ 336 │     56 │
  │ Corbin Carroll │  29 │  81 │ 115 │ 35 │ .256 │ 295 │     77 │
  │ Gunnar Hend.   │  26 │  85 │ 105 │ 25 │ .274 │ 285 │     72 │
  │ Pete Alonso    │  34 │ 107 │  85 │  1 │ .259 │ 295 │     75 │
  ├────────────────┼─────┼─────┼─────┼────┼──────┼─────┼────────┤
  │ TOTAL (4 guys) │ 119 │ 370 │ 413 │ 98 │ .274 │1211 │    280 │
  └────────────────┴─────┴─────┴─────┴────┴──────┴─────┴────────┘

  STRENGTHS: HR, RBI, R, TB, SB (Witt+Carroll = elite speed duo)
  MODERATE:  AVG (Witt carries), BB+HBP
  WEAKNESS:  Need more SB depth + AVG stabilizer

  DRAFT PRIORITY FOR HITTING:
  → Catcher (Raleigh = HR/RBI/TB; Goodman = HR/TB)
  → 2B with speed (Turang, Bichette)
  → OF with AVG/SB upside

PITCHING (7 cats): SV, HLD, ERA, WHIP, K/9, QA3, BAA

  Your keeper foundation:
  ┌────────────────┬────┬────┬──────┬───────┬──────┬─────┬──────┐
  │ Player         │ SV │HLD │  ERA │  WHIP │  K/9 │ QA3 │  BAA │
  ├────────────────┼────┼────┼──────┼───────┼──────┼─────┼──────┤
  │ Jesus Luzardo  │  0 │  0 │ 3.70 │ 1.178 │10.60 │   1 │  --- │
  └────────────────┴────┴────┴──────┴───────┴──────┴─────┴──────┘

  CRITICAL WEAKNESSES: Everything. One SP keeper.
  You need: 4-5 SPs + 1-2 relievers in the draft.

  DRAFT PRIORITY FOR PITCHING:
  → SP in R1 or R3 (don't leave R3 without at least 1 SP)
  → SP again in R5
  → Closer/elite RP by R8-R11
  → SP depth in R12-R15

  TARGET SP PROFILE: High K/9 + low WHIP (these correlate with BAA + ERA)
  TARGET RP PROFILE: Closer with saves OR high-hold setup man
""")

# =====================================================
# PLAYERS STILL ON YOUR ROSTER (not kept)
# =====================================================
print("=" * 90)
print("  YOUR ROSTERED PLAYERS NOT BEING KEPT")
print("=" * 90)
print("""
  These players return to the draft pool. Consider re-drafting:

  WORTH RE-DRAFTING:
  • Riley Greene (OF, DET) — ADP 66 (~R6). Buy back 3 rounds cheaper than keeping.
  • Hunter Goodman (C, COL) — ADP 88 (~R8). Your best C option.
  • Max Fried (SP, NYY) — ADP 49 (~R5). Top-15 SP, could grab in R3.
  • Joe Ryan (SP, MIN) — ADP 69 (~R6). Solid mid-rotation arm.
  • Ranger Suarez (SP, BOS) — ADP 161 (~R14). Deep value if he falls.

  PROBABLY NOT WORTH RE-DRAFTING:
  • Jose Altuve (2B, HOU) — Age 35, declining. ADP 99 → R9.
  • Rafael Devers (DH, SF) — ADP 37, but moved to SF (bad park). If falls to R3-5, maybe.
  • Pablo Lopez (SP, MIN) — ADP 212, declining.
  • Mark Vientos (3B, NYM) — ADP 291, not impactful enough.
  • Jeff Hoffman (RP, TOR) — ADP 206, aging reliever.
  • Kenley Jansen (RP, DET) — Age 38, ADP 261.
  • Emilio Pagan (RP, CIN) — ADP 241.
  • Slade Cecconi (SP, CLE) — ADP 356, back-end roster filler.
  • Ramon Laureano (OF, SD) — ADP 209, replacement level.
  • Dylan Crews (OF, WSH) — ADP 155, disappointing 2025. Could stash late.
  • Yu Darvish (SP, SD) — Age 39, 0 IP in 2025. Done.
""")

print("=" * 90)
print("  PRELIMINARY DRAFT BOARD COMPLETE")
print("  Update with confirmed league-wide keepers to finalize pick targets.")
print("=" * 90)
