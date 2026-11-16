import csv
import json

# =====================================================
# LHHF 2026 Draft Board & Keeper Projection Analysis
# =====================================================

# Team code mapping
TEAM_CODES = {
    'LU': 'Butt Pirates',
    'MSOB': "Motorboatin' Sons a Bitches",
    'KISH': 'Stack That Cheese',
    'TMB': 'The Master Batters',
    'MM': 'Mustache Militia',
    'SAP': 'Sausage Peddler',
    'JAZZ': 'Jazz Hands',
    'LCKK': 'Liberty City Kommy Killers',
    'IAN': 'The Hebrew Hammers',
    'NGNP': 'No Glove No Problem',
    'CLSP': 'Cleft Lip Sucker Punchers',
    'CMPN': 'Chin Music',
}

# =====================================================
# Parse 2025 Draft to get keeper data and draft rounds
# =====================================================
keepers_2025 = {}  # {player_name: {team, round, is_keeper, keeper_value_2025, keeper_value_2026}}
draft_rounds = {}  # {player_name: round_number} - original draft round

with open('LHHF - Master Tracker - 2025 Draft.csv', 'r') as f:
    reader = csv.reader(f)
    current_round = 0
    for row in reader:
        if not row or len(row) < 6:
            continue
        round_str = row[0].strip()
        pick_str = row[1].strip()
        team = row[2].strip()
        acquired = row[3].strip() if len(row) > 3 else ''
        keeper = row[4].strip() if len(row) > 4 else ''
        player = row[5].strip() if len(row) > 5 else ''
        kv_2026 = row[6].strip() if len(row) > 6 else ''
        kv_2025 = row[7].strip() if len(row) > 7 else ''

        # Parse round
        if round_str.startswith('Round '):
            try:
                current_round = int(round_str.replace('Round ', ''))
            except:
                continue
        elif round_str in ('Fantasy Football', 'March Madness', "Bowl Pick em'"):
            continue

        if not player:
            continue

        draft_rounds[player] = current_round

        if keeper == 'KEEPER':
            keepers_2025[player] = {
                'team': team,
                'round': current_round,
                'keeper_value_2026': int(kv_2026) if kv_2026 else None,
                'keeper_value_2025': int(kv_2025) if kv_2025 else None,
            }

# =====================================================
# Parse Top 500 League Players (current rosters + rankings)
# =====================================================
league_players = []
with open('top-500-players.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        player = row['Player'].strip()
        team_code = row['Status'].strip() if 'Status' in row else row.get('Team', '').strip()
        try:
            adp = float(row['ADP'])
        except (ValueError, TypeError):
            adp = 999
        try:
            rkov = int(row['RkOv'])
        except (ValueError, TypeError):
            rkov = 999
        pos = row.get('Position', '')
        try:
            age = int(row['Age'])
        except (ValueError, TypeError):
            age = 0
        try:
            score = float(row['Score'])
        except (ValueError, TypeError):
            score = 0
        real_team = row.get('Team', '')

        league_players.append({
            'name': player,
            'fantasy_team': team_code,
            'adp': adp,
            'rank': rkov,
            'position': pos,
            'age': age,
            'score': score,
            'real_team': real_team,
        })

# Sort by ADP
league_players.sort(key=lambda x: x['adp'])

# =====================================================
# Parse Dynasty Rankings
# =====================================================
dynasty_ranks = {}
with open('Top-500 Fantasy Baseball Dynasty Rankings - FantraxHQ.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        player = row.get('Player', '').strip()
        try:
            roto_rank = int(row.get('Roto', '999'))
        except:
            roto_rank = 999
        dynasty_ranks[player] = roto_rank

# =====================================================
# Calculate 2026 keeper costs for each team's players
# =====================================================
def get_keeper_cost_2026(player_name, was_keeper_2025=False):
    """Calculate what it would cost to keep this player in 2026"""
    if player_name in keepers_2025:
        info = keepers_2025[player_name]
        if info['keeper_value_2026'] is not None:
            # Multi-year keeper, explicit 2026 value
            return info['keeper_value_2026']
        else:
            # First-time keeper in 2025, escalates 3 rounds
            return max(1, info['round'] - 3)

    # Not a 2025 keeper - first-time keeper cost = original draft round
    if player_name in draft_rounds:
        return draft_rounds[player_name]

    # Undrafted player
    return 13  # undrafted = R13

# =====================================================
# Build team rosters from league players
# =====================================================
team_rosters = {}
for p in league_players:
    tc = p['fantasy_team']
    if tc == 'FA' or tc not in TEAM_CODES:
        continue
    if tc not in team_rosters:
        team_rosters[tc] = []
    team_rosters[tc].append(p)

# =====================================================
# Project each team's keepers (top 5 by surplus value)
# =====================================================
def adp_to_round(adp, num_teams=12):
    if adp <= 0:
        return 1
    return max(1, int((adp - 1) / num_teams) + 1)

projected_keepers = {}
all_kept_players = set()

for tc, roster in team_rosters.items():
    candidates = []
    for p in roster:
        cost = get_keeper_cost_2026(p['name'])
        adp_round = adp_to_round(p['adp'])
        surplus = adp_round - cost  # positive = good value
        dyn_rank = dynasty_ranks.get(p['name'], 999)

        candidates.append({
            **p,
            'keeper_cost': cost,
            'adp_round': adp_round,
            'surplus': surplus,
            'dynasty_rank': dyn_rank,
            'was_2025_keeper': p['name'] in keepers_2025,
        })

    # Sort by surplus (best value first), then by ADP
    candidates.sort(key=lambda x: (-x['surplus'], x['adp']))

    # Pick top 5 with positive or neutral surplus
    # Also respect the 2-in-R2-4 constraint
    team_keepers = []
    r2_4_count = 0
    for c in candidates:
        if len(team_keepers) >= 5:
            break
        if c['keeper_cost'] >= 2 and c['keeper_cost'] <= 4:
            if r2_4_count >= 2:
                continue
            r2_4_count += 1
        # Only keep if surplus >= 0 (not overpaying)
        if c['surplus'] >= 0 or (c['surplus'] >= -1 and c['adp'] < 50):
            team_keepers.append(c)

    # If fewer than 5 with positive surplus, that's fine - teams may not keep all 5
    projected_keepers[tc] = team_keepers
    for k in team_keepers:
        all_kept_players.add(k['name'])

# =====================================================
# CLSP confirmed keepers (override projection)
# =====================================================
clsp_keepers = {
    'Bobby Witt Jr.': 7,
    'Corbin Carroll': 10,
    'Jesus Luzardo': 22,
    'Gunnar Henderson': 4,
    'Pete Alonso': 2,
}
# Remove CLSP from projections and use confirmed
for name in clsp_keepers:
    all_kept_players.add(name)

# =====================================================
# Build draft pool (players NOT being kept)
# =====================================================
draft_pool = []
for p in league_players:
    if p['name'] not in all_kept_players:
        dyn_rank = dynasty_ranks.get(p['name'], 999)
        draft_pool.append({**p, 'dynasty_rank': dyn_rank})

draft_pool.sort(key=lambda x: x['adp'])

# =====================================================
# CLSP Draft Picks in 2026
# =====================================================
clsp_picks = {
    1: 7, 3: 31, 5: 55, 6: 66, 8: 90, 9: 103,
    11: 127, 12: 138, 13: 151, 15: 175, 16: 186,
    17: [199, 202], 18: 210, 19: 223, 21: 247,
    23: [271, 275], 24: 282,
}
# Rounds used by keepers: R2 (Alonso), R4 (Henderson), R7 (Witt), R10 (Carroll), R22 (Luzardo)

# =====================================================
# OUTPUT
# =====================================================
print("=" * 80)
print("LHHF 2026 DRAFT ANALYSIS - CLEFT LIP SUCKER PUNCHERS")
print("=" * 80)

print("\n" + "=" * 80)
print("PROJECTED LEAGUE-WIDE KEEPERS (by team)")
print("=" * 80)
for tc in sorted(TEAM_CODES.keys()):
    team_name = TEAM_CODES[tc]
    if tc == 'CLSP':
        print(f"\n--- {team_name} ({tc}) --- [YOUR TEAM - CONFIRMED]")
        for name, cost in clsp_keepers.items():
            p = next((x for x in league_players if x['name'] == name), None)
            adp = p['adp'] if p else '?'
            dyn = dynasty_ranks.get(name, '?')
            print(f"  R{cost:>2} | {name:<25} | ADP: {adp:<6} | Dynasty: #{dyn}")
    elif tc in projected_keepers:
        print(f"\n--- {team_name} ({tc}) ---")
        for k in projected_keepers[tc]:
            marker = " *" if k['was_2025_keeper'] else ""
            print(f"  R{k['keeper_cost']:>2} | {k['name']:<25} | ADP: {k['adp']:<6.1f} | Surplus: {k['surplus']:>+3} | Dyn: #{k['dynasty_rank']}{marker}")

print("\n" + "=" * 80)
print("TOP 100 AVAILABLE PLAYERS (Projected Draft Pool)")
print("=" * 80)
print(f"{'Rank':>4} | {'ADP':>6} | {'Player':<28} | {'Pos':<12} | {'Team':<5} | {'Age':>3} | {'Dyn':>4} | {'Fantasy Team':<6}")
print("-" * 100)
for i, p in enumerate(draft_pool[:100]):
    ft = p['fantasy_team'] if p['fantasy_team'] != 'FA' else 'FA'
    print(f"{i+1:>4} | {p['adp']:>6.1f} | {p['name']:<28} | {p['position']:<12} | {p['real_team']:<5} | {p['age']:>3} | {p['dynasty_rank']:>4} | {ft}")

print("\n" + "=" * 80)
print("CLSP PICK-BY-PICK DRAFT STRATEGY")
print("=" * 80)

pick_targets = {
    'R1 (Pick 7)': {
        'need': 'BPA - Elite hitter or ace SP',
        'notes': 'With ~60 keepers off the board, this pick lands you someone normally drafted in the top 15-20.',
    },
    'R3 (Pick 31)': {
        'need': 'SP1 or premium bat',
        'notes': 'Heavy pitching need. Target a top SP here.',
    },
    'R5 (Pick 55)': {
        'need': 'SP or high-upside bat',
        'notes': 'Continue building pitching depth or grab a value hitter.',
    },
    'R6 (Pick 66)': {
        'need': 'Catcher or SP',
        'notes': 'Consider catcher here if Goodman/Raleigh available.',
    },
    'R8 (Pick 90)': {
        'need': 'SP depth / SB source',
        'notes': 'Fill remaining roster holes.',
    },
    'R9 (Pick 103)': {
        'need': 'Flex - best available',
        'notes': 'Upside pick.',
    },
}

for pick, info in pick_targets.items():
    print(f"\n{pick}")
    print(f"  Target: {info['need']}")
    print(f"  Notes:  {info['notes']}")

# Category analysis for roster construction
print("\n" + "=" * 80)
print("CATEGORY STRENGTHS/WEAKNESSES (Keepers Only)")
print("=" * 80)
print("""
HITTING (7 cats: HR, RBI, R, SB, AVG, TB, BB+HBP):
  Keepers: Witt Jr., Carroll, Henderson, Alonso

  STRONG: HR (Alonso 34, Witt 30, Carroll 29, Henderson 26 = ~119 total)
          RBI (Alonso 107, Witt 97, Carroll 81, Henderson 85 = ~370)
          R (Witt 108, Carroll 115, Henderson 105 = ~330+)
          SB (Witt 37, Carroll 35 = elite speed duo)
          TB (Witt 336, Carroll 295, Henderson 285 = ~900+)

  MODERATE: AVG (Witt .303, Carroll .256, Henderson .274, Alonso .259)
            BB+HBP (Carroll 77, Alonso 75, Henderson 72 = solid)

  DRAFT NEED: More SB depth, AVG stabilizer

PITCHING (7 cats: SV, HLD, ERA, WHIP, K/9, QA3, BAA):
  Keepers: Luzardo only

  Luzardo: 3.70 ERA, 1.178 WHIP, 10.60 K/9

  CRITICAL NEED: 2-3 more quality SPs + at least 1 closer/reliever

  DRAFT PRIORITY: Pitching in R1 or R3, then again R5-R6
""")

# Positional analysis
print("=" * 80)
print("POSITIONAL NEEDS FOR DRAFT")
print("=" * 80)
print("""
  C:  EMPTY - Need catcher (Raleigh R1? Goodman R6-8? Basallo R24?)
  1B: Alonso (set)
  2B: EMPTY - Need 2B (Brice Turang? Bo Bichette? Nico Hoerner?)
  3B: EMPTY - Henderson can play SS, need 3B (Bregman? Vientos on roster?)
  SS: Henderson + Witt (elite)
  OF: Carroll (1 of 3 needed) - need 2 more OF
  DH: Flexible
  UT: Flexible
  P:  Luzardo (1 of 6 needed) - CRITICAL need 5 more pitchers
""")
