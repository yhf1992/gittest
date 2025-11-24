# Game Balance and Mechanics Testing Checklist

## Document Overview
**Purpose:** Manual testing checklist for core game mechanics and balance verification  
**Created:** 2024  
**Game:** Combat Engine - Xianxia Cultivation System  
**Testing Type:** Manual exploratory and regression testing  

---

## Table of Contents
1. [Cultivation Progression Testing](#1-cultivation-progression-testing)
2. [Combat System Testing](#2-combat-system-testing)
3. [Equipment System Testing](#3-equipment-system-testing)
4. [Dungeon Difficulty Testing](#4-dungeon-difficulty-testing)
5. [Loot Drop Testing](#5-loot-drop-testing)
6. [Balance Testing Scenarios](#6-balance-testing-scenarios)
7. [Exploitability Testing](#7-exploitability-testing)
8. [Integration Testing](#8-integration-testing)
9. [Issues and Balance Findings](#9-issues-and-balance-findings)

---

## 1. Cultivation Progression Testing

### 1.1 Level Progression Verification

#### Test: Cultivation Level Progression (练气 → 渡劫)
**Objective:** Verify all 6 cultivation levels are accessible and progression works correctly

| Level | Chinese Name | English Name | Min XP | Test Status | Notes |
|-------|--------------|--------------|---------|-------------|-------|
| 1 | 练气 | Qi Gathering | 0 | ⬜ Not Tested | Starter level |
| 2 | 筑基 | Foundation Establishment | TBD | ⬜ Not Tested | First breakthrough |
| 3 | 金丹 | Golden Core | TBD | ⬜ Not Tested | Mid-tier power |
| 4 | 元婴 | Nascent Soul | TBD | ⬜ Not Tested | Advanced level |
| 5 | 化神 | Soul Formation | TBD | ⬜ Not Tested | Master level |
| 6 | 渡劫 | Void Tribulation | TBD | ⬜ Not Tested | Peak level |

**Test Steps:**
1. ⬜ Create character at 练气 level
2. ⬜ Verify starting stats appropriate for level 1
3. ⬜ Progress through each cultivation level
4. ⬜ Verify stat increases at each breakthrough
5. ⬜ Confirm level 6 (渡劫) is reachable
6. ⬜ Test level requirements for content access

**Expected Results:**
- [ ] All 6 levels accessible
- [ ] Clear progression path from 练气 to 渡劫
- [ ] Stat scaling appropriate at each level
- [ ] No level-gating bugs

**Balance Check:**
- [ ] Time to reach each level feels reasonable (not too fast/slow)
- [ ] Power spikes at breakthroughs feel significant but not overwhelming
- [ ] Each level provides meaningful progression

---

## 2. Combat System Testing

### 2.1 Damage Calculation Verification

#### Test: Base Damage Formula
**Formula:** `base_damage = attacker_attack * modifier - defender_defense * 0.5`

| Test Case | Attacker ATK | Defender DEF | Modifier | Expected Damage | Actual | Status |
|-----------|--------------|--------------|----------|-----------------|--------|--------|
| Basic Attack | 20 | 10 | 1.0 | 15 | | ⬜ |
| High Attack | 50 | 10 | 1.0 | 45 | | ⬜ |
| High Defense | 20 | 30 | 1.0 | 5 | | ⬜ |
| With Modifier | 20 | 10 | 1.5 | 25 | | ⬜ |

**Test Steps:**
1. ⬜ Set up controlled characters with known stats
2. ⬜ Execute attacks and record damage
3. ⬜ Compare actual damage to formula calculation
4. ⬜ Test edge cases (very high/low stats)
5. ⬜ Verify minimum damage is always 1

**Balance Check:**
- [ ] Damage scales reasonably with stat differences
- [ ] Defense provides meaningful damage reduction but not immunity
- [ ] Attack/Defense ratio feels balanced

---

### 2.2 Elemental System Testing

#### Test: Elemental Advantages and Disadvantages
**Mechanics:** 1.5x advantage, 0.8x disadvantage, 1.0x neutral

| Attacker Element | Defender Element | Expected Modifier | Actual | Status | Notes |
|------------------|------------------|-------------------|--------|--------|-------|
| Fire | Earth | 1.5x | | ⬜ | Advantage |
| Fire | Wind | 0.8x | | ⬜ | Disadvantage |
| Fire | Fire | 1.0x | | ⬜ | Neutral |
| Water | Fire | 1.5x | | ⬜ | Advantage |
| Water | Earth | 0.8x | | ⬜ | Disadvantage |
| Earth | Water | 1.5x | | ⬜ | Advantage |
| Earth | Wind | 0.8x | | ⬜ | Disadvantage |
| Wind | Water | 1.5x | | ⬜ | Advantage |
| Wind | Fire | 0.8x | | ⬜ | Disadvantage |
| Neutral | Any | 1.0x | | ⬜ | Always neutral |

**Test Steps:**
1. ⬜ Create characters with each element type
2. ⬜ Test all advantage matchups (should deal 1.5x damage)
3. ⬜ Test all disadvantage matchups (should deal 0.8x damage)
4. ⬜ Test neutral matchups (should deal 1.0x damage)
5. ⬜ Verify Neutral element is truly neutral

**Balance Check:**
- [ ] Elemental advantages feel significant in combat
- [ ] No element is objectively stronger than others
- [ ] Rock-paper-scissors dynamic works properly

---

### 2.3 Critical Hits Testing

#### Test: Critical Hit Mechanics
**Mechanics:** 15% base chance, 2x damage multiplier

| Test Case | Sample Size | Expected Crits | Actual Crits | Crit % | Status |
|-----------|-------------|----------------|--------------|---------|--------|
| 100 attacks | 100 | ~15 | | | ⬜ |
| 1000 attacks | 1000 | ~150 | | | ⬜ |
| With crit gear (+10%) | 100 | ~25 | | | ⬜ |
| With crit gear (+25% cap) | 100 | ~40 | | | ⬜ |

**Test Steps:**
1. ⬜ Execute 100+ attacks with no crit modifiers
2. ⬜ Record number of critical hits
3. ⬜ Verify crit rate is ~15% (13-17% acceptable range)
4. ⬜ Test with equipment that adds crit chance
5. ⬜ Verify crit damage is exactly 2x base damage
6. ⬜ Confirm 25% crit cap is enforced

**Balance Check:**
- [ ] 15% crit rate feels appropriate (not too frequent/rare)
- [ ] 2x damage is noticeable but not game-breaking
- [ ] Crit chance from gear is meaningful

---

### 2.4 Miss Chance Testing

#### Test: Miss Mechanics
**Mechanics:** 5% base miss chance

| Test Case | Sample Size | Expected Misses | Actual Misses | Miss % | Status |
|-----------|-------------|-----------------|---------------|---------|--------|
| 100 attacks | 100 | ~5 | | | ⬜ |
| 1000 attacks | 1000 | ~50 | | | ⬜ |

**Test Steps:**
1. ⬜ Execute 100+ attacks
2. ⬜ Record number of misses
3. ⬜ Verify miss rate is ~5% (3-7% acceptable range)
4. ⬜ Confirm misses deal 0 damage
5. ⬜ Verify status effects don't apply on miss

**Balance Check:**
- [ ] 5% miss rate adds variance without being frustrating
- [ ] Misses don't occur in frustrating streaks too often

---

### 2.5 Status Effects Testing

#### Test: Stun Effect
**Mechanics:** Prevents action for duration, Rogue has 30% chance to apply (1 turn)

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| Rogue applies stun | ~30% chance per hit | | ⬜ |
| Stunned character | Cannot act for 1 turn | | ⬜ |
| Stun duration | Removed after 1 turn | | ⬜ |
| Multiple stuns | Replaced with longer duration | | ⬜ |

**Test Steps:**
1. ⬜ Create Rogue character and test stun application rate
2. ⬜ Verify stunned characters skip their turn
3. ⬜ Confirm stun expires after 1 turn
4. ⬜ Test stun interaction with other effects

---

#### Test: Damage Over Time (DoT)
**Mechanics:** Damage per turn for 3 turns, Mage has 40% chance to apply (3 damage/turn)

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| Mage applies DoT | ~40% chance per hit | | ⬜ |
| DoT damage | 3 damage per turn | | ⬜ |
| DoT duration | Lasts 3 turns | | ⬜ |
| Total DoT damage | 9 damage over 3 turns | | ⬜ |

**Test Steps:**
1. ⬜ Create Mage character and test DoT application rate
2. ⬜ Verify DoT deals damage at start of each turn
3. ⬜ Confirm DoT lasts exactly 3 turns
4. ⬜ Calculate total damage dealt by DoT

---

#### Test: Defense Debuff
**Mechanics:** Reduces defense stat, Warrior has 20% chance to apply (2 defense, 2 turns)

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| Warrior applies debuff | ~20% chance per hit | | ⬜ |
| Defense reduction | -2 defense | | ⬜ |
| Debuff duration | Lasts 2 turns | | ⬜ |
| Increased damage | Subsequent hits deal more damage | | ⬜ |

**Test Steps:**
1. ⬜ Create Warrior character and test debuff application rate
2. ⬜ Verify target's defense is reduced by 2
3. ⬜ Confirm debuff lasts 2 turns
4. ⬜ Verify increased damage while debuff is active

---

#### Test: Attack Buff
**Mechanics:** Increases attack stat, Paladin has 20% chance to apply to self (+2 attack, 2 turns)

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| Paladin applies buff | ~20% chance on successful hit | | ⬜ |
| Attack increase | +2 attack | | ⬜ |
| Buff duration | Lasts 2 turns | | ⬜ |
| Increased damage | Subsequent hits deal more damage | | ⬜ |

**Test Steps:**
1. ⬜ Create Paladin character and test buff application rate
2. ⬜ Verify Paladin's attack increases by 2
3. ⬜ Confirm buff lasts 2 turns
4. ⬜ Verify increased damage while buff is active

---

#### Test: Heal Over Time (HoT)
**Mechanics:** Healing per turn for duration

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| HoT applied | Heals at start of turn | | ⬜ |
| Healing amount | Specified heal per turn | | ⬜ |
| Duration | Lasts specified turns | | ⬜ |
| Overheal prevention | Cannot exceed max HP | | ⬜ |

**Test Steps:**
1. ⬜ Apply HoT effect to damaged character
2. ⬜ Verify healing occurs at start of each turn
3. ⬜ Confirm duration works correctly
4. ⬜ Test that healing stops at max HP

---

### 2.6 Multi-Hit Testing

#### Test: Multi-Hit Mechanics
**Mechanics:** 30% chance for 2 hits if speed > 15, second hit deals 50% damage

| Character Speed | Expected Multi-Hit Chance | Sample Size | Actual Multi-Hits | Status |
|-----------------|---------------------------|-------------|-------------------|--------|
| 10 | 0% | 50 | | ⬜ |
| 16 | 30% | 100 | | ⬜ |
| 20 | 30% | 100 | | ⬜ |
| 30 | 30% | 100 | | ⬜ |

**Test Steps:**
1. ⬜ Create character with speed ≤ 15, verify no multi-hits
2. ⬜ Create character with speed > 15
3. ⬜ Execute 100+ attacks and count multi-hits
4. ⬜ Verify multi-hit rate is ~30%
5. ⬜ Confirm second hit deals 50% of first hit damage

**Balance Check:**
- [ ] Speed threshold (15) is achievable but requires investment
- [ ] Multi-hit feels rewarding without being overpowered
- [ ] 50% damage on second hit is balanced

---

### 2.7 Class-Specific Testing

#### Test: Character Classes Balance

| Class | Special Ability | Proc Chance | Effectiveness | Balance Rating | Status |
|-------|-----------------|-------------|---------------|----------------|--------|
| Warrior | Defense Debuff | 20% | Increases team DPS | | ⬜ |
| Mage | DoT (3 dmg, 3 turns) | 40% | Consistent damage | | ⬜ |
| Rogue | Stun (1 turn) | 30% | Crowd control | | ⬜ |
| Paladin | Attack Buff (+2, 2 turns) | 20% | Self-enhancement | | ⬜ |

**Test Steps:**
1. ⬜ Create level 10 character of each class with identical stats
2. ⬜ Run 10 combats per class against same opponent
3. ⬜ Record win rates, average turns to win, damage dealt
4. ⬜ Test each class's special ability activation rate
5. ⬜ Compare overall effectiveness

**Balance Check:**
- [ ] All classes feel viable
- [ ] No single class dominates all scenarios
- [ ] Each class has distinct playstyle/strength
- [ ] Special abilities are useful but not mandatory

---

## 3. Equipment System Testing

### 3.1 Rarity Distribution Testing

#### Test: Equipment Generation Rarity
**Weights:** Common (50), Uncommon (30), Rare (15), Epic (4), Legendary (1)

| Rarity | Weight | Expected % | Sample Size | Actual Count | Actual % | Status |
|--------|--------|-----------|-------------|--------------|----------|--------|
| Common | 50 | 50% | 1000 | | | ⬜ |
| Uncommon | 30 | 30% | 1000 | | | ⬜ |
| Rare | 15 | 15% | 1000 | | | ⬜ |
| Epic | 4 | 4% | 1000 | | | ⬜ |
| Legendary | 1 | 1% | 1000 | | | ⬜ |

**Test Steps:**
1. ⬜ Generate 1000 random equipment items (no rarity specified)
2. ⬜ Record rarity distribution
3. ⬜ Compare actual percentages to expected weights
4. ⬜ Verify acceptable variance (±3% for common/uncommon, ±2% for others)

**Balance Check:**
- [ ] Legendary items feel rare and special (~1%)
- [ ] Common items are abundant but not useless
- [ ] Distribution feels right for progression

---

### 3.2 Stat Scaling Testing

#### Test: Equipment Stat Scaling by Rarity
**Base Formula:** `item_level * 2 * rarity_multiplier`

| Rarity | Multiplier | Item Level | Expected Base Stat | Actual | Status |
|--------|------------|------------|-------------------|--------|--------|
| Common | 1.0x | 10 | 20 | | ⬜ |
| Uncommon | 1.2x | 10 | 24 | | ⬜ |
| Rare | 1.5x | 10 | 30 | | ⬜ |
| Epic | 2.0x | 10 | 40 | | ⬜ |
| Legendary | 2.5x | 10 | 50 | | ⬜ |
| Common | 1.0x | 20 | 40 | | ⬜ |
| Legendary | 2.5x | 20 | 100 | | ⬜ |

**Test Steps:**
1. ⬜ Generate weapons of each rarity at level 10
2. ⬜ Verify base attack stat matches expected value
3. ⬜ Repeat for armor (defense stat) and accessories
4. ⬜ Test different item levels (1, 10, 20, 50)

**Balance Check:**
- [ ] Higher rarity feels significantly more powerful
- [ ] 2.5x multiplier on legendary doesn't trivialize content
- [ ] Stat scaling keeps pace with enemy scaling

---

### 3.3 Affix System Testing

#### Test: Affix Count by Rarity

| Rarity | Affix Range | Test Sample | Actual Range | Status |
|--------|-------------|-------------|--------------|--------|
| Common | 0-1 | 20 items | | ⬜ |
| Uncommon | 1-2 | 20 items | | ⬜ |
| Rare | 2-3 | 20 items | | ⬜ |
| Epic | 3-4 | 20 items | | ⬜ |
| Legendary | 4-5 | 20 items | | ⬜ |

**Test Steps:**
1. ⬜ Generate 20 items of each rarity
2. ⬜ Count affixes on each item
3. ⬜ Verify counts fall within expected ranges
4. ⬜ Check that no duplicate affix types on same item

---

#### Test: Affix Types and Values

| Affix Type | Value Formula | Test Level | Expected Value | Actual | Status |
|------------|---------------|------------|----------------|--------|--------|
| Attack Bonus | level * 2 * mult | 10 (common) | 20 | | ⬜ |
| Defense Bonus | level * 2 * mult | 10 (common) | 20 | | ⬜ |
| HP Bonus | level * 2 * mult | 10 (common) | 20 | | ⬜ |
| Speed Bonus | level * mult | 10 (common) | 10 | | ⬜ |
| Crit Chance | level * 0.5 * mult (cap 25%) | 10 (common) | 5% | | ⬜ |
| Elemental Damage | level * 1.5 * mult | 10 (common) | 15 | | ⬜ |
| Lifesteal | level * 0.3 * mult (cap 20%) | 10 (common) | 3% | | ⬜ |
| Proc Damage | level * 3 * mult | 10 (common) | 30 | | ⬜ |

**Test Steps:**
1. ⬜ Generate items with each affix type
2. ⬜ Verify affix values match formulas
3. ⬜ Test crit chance cap (max 25%)
4. ⬜ Test lifesteal cap (max 20%)
5. ⬜ Verify elemental affixes include element type

**Balance Check:**
- [ ] All affix types feel useful
- [ ] No single affix dominates others
- [ ] Crit chance and lifesteal caps prevent overpowered builds

---

### 3.4 Special Proc Testing

#### Test: Special Proc Chances by Rarity

| Rarity | Proc Chance | Sample Size | Items with Procs | Actual % | Status |
|--------|-------------|-------------|------------------|----------|--------|
| Common | 0% | 50 | | | ⬜ |
| Uncommon | 5% | 100 | | | ⬜ |
| Rare | 15% | 100 | | | ⬜ |
| Epic | 30% | 100 | | | ⬜ |
| Legendary | 50% | 100 | | | ⬜ |

**Test Steps:**
1. ⬜ Generate 50-100 items of each rarity
2. ⬜ Count items with special procs
3. ⬜ Verify proc rates match expected percentages
4. ⬜ Test that proc descriptions are appropriate for slot type

---

### 3.5 Equipment Level Requirements

#### Test: Level Requirement Calculation
**Formula:** `item_level - 5` (minimum 1)

| Item Level | Expected Requirement | Actual | Status |
|------------|---------------------|--------|--------|
| 1 | 1 | | ⬜ |
| 5 | 1 | | ⬜ |
| 10 | 5 | | ⬜ |
| 20 | 15 | | ⬜ |
| 50 | 45 | | ⬜ |

**Test Steps:**
1. ⬜ Generate items at various levels
2. ⬜ Verify level requirements match formula
3. ⬜ Test that minimum requirement is 1
4. ⬜ Verify characters can't equip items above their level

**Balance Check:**
- [ ] Level requirements prevent premature access to powerful gear
- [ ] Requirements are reasonable (not too restrictive)

---

## 4. Dungeon Difficulty Testing

### 4.1 Dungeon Configuration Verification

#### Test: Four Difficulty Tiers

| Dungeon | Difficulty | Level Req | Entry Cost | Daily Attempts | Reward Mult | Floors | Status |
|---------|-----------|-----------|------------|----------------|-------------|--------|--------|
| Goblin Caves | Easy | 1 | 10 | 5 | 1.0x | 5 | ⬜ |
| Dark Forest | Normal | 5 | 25 | 3 | 1.2x | 8 | ⬜ |
| Volcanic Fortress | Hard | 10 | 50 | 2 | 1.5x | 10 | ⬜ |
| Shadow Realm | Nightmare | 15 | 100 | 1 | 2.0x | 15 | ⬜ |

**Test Steps:**
1. ⬜ Verify all 4 dungeons are accessible
2. ⬜ Check level requirements prevent early access
3. ⬜ Test entry cost deduction from player currency
4. ⬜ Verify daily attempt limits are enforced
5. ⬜ Confirm reward multipliers apply to loot
6. ⬜ Test floor count matches configuration

**Balance Check:**
- [ ] Entry costs feel appropriate for rewards
- [ ] Daily attempt limits encourage strategic choices
- [ ] Difficulty progression feels smooth
- [ ] Reward multipliers justify increased difficulty

---

### 4.2 Daily Reset Testing

#### Test: Daily Attempt Limits

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| First attempt | Allowed, counter increments | | ⬜ |
| Within daily limit | Allowed | | ⬜ |
| Exceeding limit | Denied with error message | | ⬜ |
| Midnight reset | Counter resets to 0 | | ⬜ |
| Multiple dungeons | Separate counters per dungeon | | ⬜ |

**Test Steps:**
1. ⬜ Enter dungeon for first time in a day
2. ⬜ Complete dungeon and verify attempt counter increments
3. ⬜ Attempt to exceed daily limit
4. ⬜ Verify error message when limit reached
5. ⬜ Test reset at midnight (or simulate date change)
6. ⬜ Verify each dungeon has independent attempt counter

**Balance Check:**
- [ ] Daily limits prevent excessive grinding
- [ ] Limits are generous enough for regular play
- [ ] System encourages trying different content

---

### 4.3 Entry Cost and Refund Testing

#### Test: Currency Management

| Test Case | Expected Behavior | Actual | Status |
|-----------|-------------------|--------|--------|
| Successful entry | Cost deducted from currency | | ⬜ |
| Insufficient currency | Entry denied with error | | ⬜ |
| Full completion | No refund (rewards only) | | ⬜ |
| Partial completion | 30% refund * (floors/total) | | ⬜ |
| Failed entry | No cost deducted | | ⬜ |

**Test Steps:**
1. ⬜ Enter dungeon with sufficient currency
2. ⬜ Verify entry cost is deducted
3. ⬜ Attempt entry with insufficient currency
4. ⬜ Complete dungeon fully, verify no refund
5. ⬜ Complete dungeon partially, calculate refund
6. ⬜ Test entry failure scenarios

**Balance Check:**
- [ ] Entry costs aren't prohibitively expensive
- [ ] Partial refund system is fair
- [ ] System doesn't punish exploration excessively

---

### 4.4 Reward Multiplier Testing

#### Test: Difficulty Reward Scaling

| Difficulty | Base Loot | Reward Mult | Expected Currency | Actual | Status |
|-----------|-----------|-------------|-------------------|--------|--------|
| Easy | 100 currency | 1.0x | 100 | | ⬜ |
| Normal | 100 currency | 1.2x | 120 | | ⬜ |
| Hard | 100 currency | 1.5x | 150 | | ⬜ |
| Nightmare | 100 currency | 2.0x | 200 | | ⬜ |

**Test Steps:**
1. ⬜ Complete each difficulty dungeon
2. ⬜ Record currency rewards
3. ⬜ Verify multipliers are correctly applied
4. ⬜ Test that multiplier doesn't affect equipment quality
5. ⬜ Confirm multiplier only affects currency

**Balance Check:**
- [ ] Higher difficulty rewards feel worth the effort
- [ ] 2x multiplier for Nightmare is attractive but not mandatory
- [ ] Reward scaling encourages difficulty progression

---

## 5. Loot Drop Testing

### 5.1 Monster Tier Drop Rates

#### Test: Tier 1 (Common Monsters)
**Drop Count:** 1 item  
**Rarity Distribution:** 70% Common, 25% Uncommon, 5% Rare  
**Currency:** 1-5 (guaranteed)

| Test Run | Items Dropped | Rarity | Currency | Status |
|----------|---------------|--------|----------|--------|
| 1 | | | | ⬜ |
| 2 | | | | ⬜ |
| 3 | | | | ⬜ |
| ... | | | | ⬜ |
| 50 | | | | ⬜ |

**Test Steps:**
1. ⬜ Roll loot from Tier 1 table 50 times
2. ⬜ Record item count (should always be 1)
3. ⬜ Record rarity distribution
4. ⬜ Record currency range
5. ⬜ Verify rarity distribution: ~70%/25%/5%
6. ⬜ Verify currency always in 1-5 range

**Balance Check:**
- [ ] Common monsters provide steady progression
- [ ] Rare drops from common monsters feel special
- [ ] Currency rewards are appropriate for early game

---

#### Test: Tier 2 (Elite Monsters)
**Drop Count:** 1-2 items  
**Rarity Distribution:** 50% Common, 35% Uncommon, 12% Rare, 3% Epic  
**Currency:** 5-15 (guaranteed)

| Test Run | Items Dropped | Rarities | Currency | Status |
|----------|---------------|----------|----------|--------|
| 1 | | | | ⬜ |
| ... | | | | ⬜ |
| 50 | | | | ⬜ |

**Test Steps:**
1. ⬜ Roll loot from Tier 2 table 50 times
2. ⬜ Record item counts (should be 1-2)
3. ⬜ Record rarity distribution
4. ⬜ Verify rarity distribution: ~50%/35%/12%/3%
5. ⬜ Verify currency in 5-15 range

**Balance Check:**
- [ ] Elite monsters feel more rewarding than common
- [ ] Epic drops are rare but possible
- [ ] Currency rewards support mid-game costs

---

#### Test: Tier 3 (Mini-Bosses)
**Drop Count:** 2-3 items  
**Rarity Distribution:** 30% Common, 40% Uncommon, 20% Rare, 8% Epic, 2% Legendary  
**Currency:** 10-25 (guaranteed) + bonus chance

| Test Run | Items Dropped | Rarities | Currency | Bonus Currency | Status |
|----------|---------------|----------|----------|----------------|--------|
| 1 | | | | | ⬜ |
| ... | | | | | ⬜ |
| 50 | | | | | ⬜ |

**Test Steps:**
1. ⬜ Roll loot from Tier 3 table 50 times
2. ⬜ Record item counts (should be 2-3)
3. ⬜ Record rarity distribution
4. ⬜ Track bonus currency drops (~50% chance)
5. ⬜ Verify rarity distribution
6. ⬜ Verify legendary drops appear (~2%)

**Balance Check:**
- [ ] Mini-bosses provide significant rewards
- [ ] Legendary drops are very rare but possible
- [ ] Bonus currency adds excitement

---

#### Test: Tier 4 (Boss Monsters)
**Drop Count:** 3-5 items  
**Rarity Distribution:** 20% Common, 30% Uncommon, 25% Rare, 15% Epic, 10% Legendary  
**Guaranteed:** At least 1 Rare+ item  
**Currency:** 25-50 (guaranteed) + multiple bonus chances

| Test Run | Items Dropped | Rarities | Guaranteed Rare+ | Currency | Status |
|----------|---------------|----------|------------------|----------|--------|
| 1 | | | | | ⬜ |
| ... | | | | | ⬜ |
| 50 | | | | | ⬜ |

**Test Steps:**
1. ⬜ Roll loot from Tier 4 table 50 times
2. ⬜ Record item counts (should be 3-5)
3. ⬜ Verify EVERY roll has at least 1 Rare+ item
4. ⬜ Record rarity distribution
5. ⬜ Track bonus currency (75% and 25% chances)
6. ⬜ Verify legendary drop rate is ~10%

**Balance Check:**
- [ ] Boss loot feels exciting and rewarding
- [ ] Guaranteed Rare+ prevents bad luck
- [ ] 10% legendary rate is attractive but not guaranteed
- [ ] Currency rewards support endgame economy

---

### 5.2 Loot Probability Verification

#### Test: Aggregate Drop Statistics (1000 rolls per tier)

| Tier | Sample Size | Avg Items | Common % | Uncommon % | Rare % | Epic % | Legend % | Status |
|------|-------------|-----------|----------|------------|--------|--------|----------|--------|
| 1 | 1000 | ~1.0 | ~70% | ~25% | ~5% | 0% | 0% | ⬜ |
| 2 | 1000 | ~1.5 | ~50% | ~35% | ~12% | ~3% | 0% | ⬜ |
| 3 | 1000 | ~2.5 | ~30% | ~40% | ~20% | ~8% | ~2% | ⬜ |
| 4 | 1000 | ~4.0 | ~20% | ~30% | ~25% | ~15% | ~10% | ⬜ |

**Test Steps:**
1. ⬜ Automate 1000 loot rolls per tier
2. ⬜ Calculate aggregate statistics
3. ⬜ Compare to expected distributions
4. ⬜ Verify distributions are within ±3% variance
5. ⬜ Check for statistical anomalies

---

## 6. Balance Testing Scenarios

### 6.1 Solo Combat Scenarios

#### Test: Starter Character vs. Common Enemy
**Setup:** Level 1 character with no equipment vs. Tier 1 monster

| Attempt | Character Class | Character HP | Enemy HP | Turns to Win | Winner | Status |
|---------|----------------|--------------|----------|--------------|--------|--------|
| 1 | Warrior | 100 | 30 | | | ⬜ |
| 2 | Mage | 100 | 30 | | | ⬜ |
| 3 | Rogue | 100 | 30 | | | ⬜ |
| 4 | Paladin | 100 | 30 | | | ⬜ |

**Test Steps:**
1. ⬜ Create level 1 character of each class (no equipment)
2. ⬜ Fight against Tier 1 monster
3. ⬜ Record combat length and outcome
4. ⬜ Verify all classes can win consistently

**Balance Check:**
- [ ] Fight is not trivial (takes 5-10 turns)
- [ ] Fight is not impossible (player wins 90%+ of time)
- [ ] All classes have similar win rates

---

#### Test: Elite Enemy Challenge
**Setup:** Level 5 character with basic equipment vs. Tier 2 monster

| Attempt | Character Class | Equipment Quality | Turns to Win | Winner | Status |
|---------|----------------|-------------------|--------------|--------|--------|
| 1 | Warrior | Common | | | ⬜ |
| 2 | Mage | Common | | | ⬜ |
| 3 | Rogue | Common | | | ⬜ |
| 4 | Paladin | Common | | | ⬜ |

**Test Steps:**
1. ⬜ Create level 5 character with full common equipment
2. ⬜ Fight against Tier 2 elite monster
3. ⬜ Record combat outcomes
4. ⬜ Test with mixed equipment rarities

**Balance Check:**
- [ ] Elite fights are challenging but winnable
- [ ] Equipment makes noticeable difference
- [ ] Fight length is engaging (10-20 turns)

---

#### Test: Boss Fight
**Setup:** Level 10 character with rare equipment vs. Tier 4 boss

| Attempt | Equipment Quality | Turns to Win | HP Remaining | Winner | Status |
|---------|------------------|--------------|--------------|--------|--------|
| 1 | All Common | | | | ⬜ |
| 2 | All Uncommon | | | | ⬜ |
| 3 | All Rare | | | | ⬜ |
| 4 | Mixed Rare/Epic | | | | ⬜ |

**Test Steps:**
1. ⬜ Create level 10 character
2. ⬜ Test boss fight with different equipment tiers
3. ⬜ Record outcomes and combat length
4. ⬜ Determine minimum equipment tier needed to win

**Balance Check:**
- [ ] Boss requires preparation (good equipment/level)
- [ ] Boss feels like significant challenge
- [ ] Victory feels earned and rewarding
- [ ] Boss doesn't feel impossible with appropriate gear

---

### 6.2 Gear Progression Testing

#### Test: Fully Geared vs. Starter Gear
**Setup:** Same level character, different equipment

| Test | Equipment Setup | Total ATK | Total DEF | Total HP | Turns to Win | Status |
|------|----------------|-----------|-----------|----------|--------------|--------|
| 1 | No equipment | Base | Base | Base | | ⬜ |
| 2 | Full common | | | | | ⬜ |
| 3 | Full uncommon | | | | | ⬜ |
| 4 | Full rare | | | | | ⬜ |
| 5 | Full epic | | | | | ⬜ |
| 6 | Full legendary | | | | | ⬜ |

**Test Steps:**
1. ⬜ Create level 10 character with no equipment
2. ⬜ Fight Tier 3 monster, record results
3. ⬜ Equip full set of each rarity tier
4. ⬜ Record stat increases and combat improvements
5. ⬜ Calculate % improvement per rarity tier

**Balance Check:**
- [ ] Each rarity tier provides meaningful upgrade
- [ ] Equipment progression feels impactful
- [ ] Legendary gear is powerful but not god-mode
- [ ] Common gear still viable for appropriate content

---

### 6.3 Cultivation Level Testing

#### Test: Power Scaling Across Cultivation Levels

| Cultivation Level | Base Stats | Equipment Level | Enemy Tier | Win Rate | Avg Turns | Status |
|-------------------|------------|-----------------|------------|----------|-----------|--------|
| 练气 (1) | Low | 1-5 | Tier 1 | | | ⬜ |
| 筑基 (2) | Medium | 6-10 | Tier 2 | | | ⬜ |
| 金丹 (3) | Medium-High | 11-20 | Tier 2-3 | | | ⬜ |
| 元婴 (4) | High | 21-30 | Tier 3 | | | ⬜ |
| 化神 (5) | Very High | 31-40 | Tier 3-4 | | | ⬜ |
| 渡劫 (6) | Peak | 41-50 | Tier 4 | | | ⬜ |

**Test Steps:**
1. ⬜ Create character at each cultivation level
2. ⬜ Equip appropriate level gear for each
3. ⬜ Fight against appropriate tier enemies
4. ⬜ Record win rates and combat efficiency
5. ⬜ Test fighting below/above level enemies

**Balance Check:**
- [ ] Clear power progression through cultivation levels
- [ ] Each level opens new content appropriately
- [ ] Fighting below level is easy but not one-shot
- [ ] Fighting above level is possible but challenging

---

### 6.4 Dungeon Progression Testing

#### Test: Dungeon Difficulty Curve

| Character Level | Equipment | Easy Dungeon | Normal Dungeon | Hard Dungeon | Nightmare Dungeon | Status |
|-----------------|-----------|--------------|----------------|--------------|-------------------|--------|
| 1 | Common | ✓ Possible | | | | ⬜ |
| 5 | Uncommon | ✓ Easy | ✓ Possible | | | ⬜ |
| 10 | Rare | ✓ Easy | ✓ Easy | ✓ Possible | | ⬜ |
| 15 | Epic | ✓ Easy | ✓ Easy | ✓ Easy | ✓ Possible | ⬜ |
| 20 | Legendary | ✓ Easy | ✓ Easy | ✓ Easy | ✓ Moderate | ⬜ |

**Test Steps:**
1. ⬜ Test each level/equipment combo against dungeons
2. ⬜ Verify level requirements prevent premature access
3. ⬜ Record success rates for each combination
4. ⬜ Determine "recommended" vs "minimum" levels

**Balance Check:**
- [ ] Level requirements are appropriate
- [ ] Each dungeon feels right for its level range
- [ ] Higher level players can farm lower dungeons efficiently
- [ ] Nightmare remains challenging even at max level

---

## 7. Exploitability Testing

### 7.1 Economy Exploits

#### Test: Currency Generation Rate

| Method | Time | Currency Gained | Items Gained | Sustainability | Exploit Risk | Status |
|--------|------|-----------------|--------------|----------------|--------------|--------|
| Easy dungeon spam | 1 hour | | | 5 attempts/day | | ⬜ |
| Normal dungeon optimal | 1 hour | | | 3 attempts/day | | ⬜ |
| Hard dungeon | 1 hour | | | 2 attempts/day | | ⬜ |
| Nightmare dungeon | 1 hour | | | 1 attempt/day | | ⬜ |
| Selling common loot | 1 hour | | | Unlimited | | ⬜ |

**Test Steps:**
1. ⬜ Calculate maximum currency gain per day
2. ⬜ Test if players can infinitely farm currency
3. ⬜ Verify daily limits prevent excessive grinding
4. ⬜ Check for currency generation exploits
5. ⬜ Analyze currency sinks vs. sources

**Exploit Check:**
- [ ] No infinite currency generation
- [ ] Daily limits effectively cap progression
- [ ] Entry costs provide meaningful currency sink
- [ ] Selling equipment provides reasonable income

---

### 7.2 Progression Exploits

#### Test: Rapid Progression Attempts

| Exploit Attempt | Method | Expected Outcome | Actual Outcome | Exploitable? | Status |
|-----------------|--------|------------------|----------------|--------------|--------|
| Dungeon spam | Exceed daily limit | Blocked | | | ⬜ |
| Equipment duping | Equip same item twice | Error | | | ⬜ |
| Stat stacking | Multiple same affixes | Prevented | | | ⬜ |
| Level skipping | Access high dungeons early | Level check | | | ⬜ |
| Currency overflow | Generate excessive currency | Capped | | | ⬜ |

**Test Steps:**
1. ⬜ Attempt to exceed dungeon daily limits
2. ⬜ Try to equip same item to multiple slots
3. ⬜ Test if multiple items with same affix stack excessively
4. ⬜ Try to bypass level requirements
5. ⬜ Test for integer overflow on currency

**Exploit Check:**
- [ ] All attempted exploits are prevented
- [ ] Error messages are informative
- [ ] No way to bypass progression systems

---

### 7.3 Combat Exploits

#### Test: Combat Manipulation

| Exploit Attempt | Method | Expected Outcome | Actual Outcome | Exploitable? | Status |
|-----------------|--------|------------------|----------------|--------------|--------|
| Status effect stacking | Apply many same effects | Replaced/Stacked properly | | | ⬜ |
| Infinite stun | Chain stun enemy | 30% chance prevents | | | ⬜ |
| Damage manipulation | Min damage bypass | Always ≥1 damage | | | ⬜ |
| Crit stacking | Exceed 25% cap | Capped at 25% | | | ⬜ |
| Lifesteal abuse | Exceed 20% cap | Capped at 20% | | | ⬜ |

**Test Steps:**
1. ⬜ Test status effect stacking mechanics
2. ⬜ Attempt to chain-stun enemies
3. ⬜ Test minimum damage enforcement
4. ⬜ Verify crit chance cap with excessive crit gear
5. ⬜ Verify lifesteal cap with excessive lifesteal gear

**Exploit Check:**
- [ ] Status effects work as intended
- [ ] No way to permanently disable enemies
- [ ] Stat caps are enforced properly
- [ ] Combat remains fair and balanced

---

## 8. Integration Testing

### 8.1 Complete Gameplay Loop

#### Test: New Player → First Dungeon Clear

**Steps:**
1. ⬜ Create new level 1 character
2. ⬜ Verify starting stats and currency
3. ⬜ Attempt to access dungeons (should fail higher difficulties)
4. ⬜ Enter Goblin Caves (Easy difficulty)
5. ⬜ Progress through 5 floors
6. ⬜ Defeat all monsters (mostly Tier 1, some Tier 2)
7. ⬜ Complete dungeon and receive rewards
8. ⬜ Equip any upgrades from loot
9. ⬜ Verify stats increase from equipment
10. ⬜ Check daily attempt counter

**Expected Results:**
- [ ] Smooth progression from start to first clear
- [ ] Combat feels fair but challenging
- [ ] Rewards feel meaningful
- [ ] Equipment provides noticeable improvement
- [ ] Daily limit system is clear

**Time to Complete:** ______ minutes  
**Balance Rating:** ☐ Too Easy  ☐ Appropriate  ☐ Too Hard

---

#### Test: Mid-Game Progression

**Steps:**
1. ⬜ Create level 5 character with uncommon gear
2. ⬜ Clear Easy dungeon (should be trivial now)
3. ⬜ Enter Normal dungeon (Dark Forest)
4. ⬜ Progress through 8 floors
5. ⬜ Fight Tier 2-3 monsters
6. ⬜ Complete dungeon and receive rewards
7. ⬜ Verify 1.2x reward multiplier applies
8. ⬜ Test daily limit across multiple dungeons
9. ⬜ Equip rare gear from drops
10. ⬜ Attempt Hard dungeon to test readiness

**Expected Results:**
- [ ] Clear difficulty progression
- [ ] Normal feels appropriately challenging
- [ ] Reward improvements are noticeable
- [ ] Hard dungeon is accessible but difficult

**Time to Complete:** ______ minutes  
**Balance Rating:** ☐ Too Easy  ☐ Appropriate  ☐ Too Hard

---

#### Test: End-Game Content

**Steps:**
1. ⬜ Create level 15 character with epic/legendary gear
2. ⬜ Test all lower dungeons (should be easy farms)
3. ⬜ Enter Nightmare dungeon (Shadow Realm)
4. ⬜ Progress through 15 floors
5. ⬜ Fight exclusively Tier 4 boss-level monsters
6. ⬜ Verify difficulty is high even with good gear
7. ⬜ Complete dungeon and receive rewards
8. ⬜ Verify 2.0x reward multiplier applies
9. ⬜ Check legendary drop rates from Tier 4
10. ⬜ Verify 1 attempt/day limit

**Expected Results:**
- [ ] Nightmare is significantly harder
- [ ] Good gear is necessary to succeed
- [ ] Rewards justify difficulty and entry cost
- [ ] Legendary drops feel exciting
- [ ] Limited attempts encourage strategic play

**Time to Complete:** ______ minutes  
**Balance Rating:** ☐ Too Easy  ☐ Appropriate  ☐ Too Hard

---

### 8.2 Equipment Progression Loop

#### Test: Common → Legendary Progression

**Steps:**
1. ⬜ Create level 10 character with all common equipment
2. ⬜ Record starting stats (ATK/DEF/HP/SPD)
3. ⬜ Farm Normal dungeon for uncommon gear
4. ⬜ Replace all common with uncommon, record stats
5. ⬜ Farm Hard dungeon for rare gear
6. ⬜ Replace all uncommon with rare, record stats
7. ⬜ Farm Nightmare for epic/legendary
8. ⬜ Record final stats with best possible gear
9. ⬜ Calculate % improvement per tier
10. ⬜ Test against Tier 4 boss with each gear set

**Stat Progression Table:**

| Equipment Tier | ATK | DEF | HP | SPD | Boss Win Rate | Avg Turns |
|---------------|-----|-----|-----|-----|--------------|-----------|
| All Common | | | | | | |
| All Uncommon | | | | | | |
| All Rare | | | | | | |
| All Epic | | | | | | |
| Mixed Best | | | | | | |

**Expected Results:**
- [ ] Each tier provides 20-30% stat improvement
- [ ] Boss becomes progressively easier
- [ ] Legendary gear feels significantly powerful
- [ ] Progression is satisfying and noticeable

---

## 9. Issues and Balance Findings

> **Current Status:** Manual execution of this checklist is pending. No balance issues have been observed yet; log all findings in the sections below as testing progresses.

### 9.1 Critical Issues (Game-Breaking)

| Issue ID | Description | Severity | Reproduction Steps | Status |
|----------|-------------|----------|-------------------|--------|
| | | | | |

---

### 9.2 Major Issues (Significant Impact)

| Issue ID | Description | Impact | Suggested Fix | Status |
|----------|-------------|--------|---------------|--------|
| | | | | |

---

### 9.3 Minor Issues (Quality of Life)

| Issue ID | Description | Impact | Suggested Fix | Status |
|----------|-------------|--------|---------------|--------|
| | | | | |

---

### 9.4 Balance Concerns

| Concern | Area | Description | Data | Recommendation | Status |
|---------|------|-------------|------|----------------|--------|
| | | | | | |

---

## 10. Balance Recommendations

### 10.1 Mechanics Working Well

**List mechanics that feel balanced and fun:**

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### 10.2 Mechanics Needing Adjustment

**List mechanics that need tuning:**

| Mechanic | Current State | Issue | Recommended Change |
|----------|---------------|-------|-------------------|
| | | | |

---

### 10.3 Progression Pacing

**Overall progression feedback:**

- **Early Game (Levels 1-5):**
  - Pacing: ☐ Too Fast  ☐ Good  ☐ Too Slow
  - Notes: ___________________________________________

- **Mid Game (Levels 6-10):**
  - Pacing: ☐ Too Fast  ☐ Good  ☐ Too Slow
  - Notes: ___________________________________________

- **Late Game (Levels 11-15):**
  - Pacing: ☐ Too Fast  ☐ Good  ☐ Too Slow
  - Notes: ___________________________________________

- **End Game (Level 15+):**
  - Pacing: ☐ Too Fast  ☐ Good  ☐ Too Slow
  - Notes: ___________________________________________

---

## 11. Final Acceptance

### 11.1 Acceptance Criteria Checklist

- [ ] All core mechanics work as designed
- [ ] No game-breaking bugs discovered
- [ ] Combat system is balanced across all classes
- [ ] Equipment progression feels meaningful
- [ ] Dungeon difficulty curve is appropriate
- [ ] Loot drops are fair and exciting
- [ ] No exploitable mechanics found
- [ ] Progression pacing is reasonable
- [ ] Player can progress from 练气 to 渡劫
- [ ] All cultivation levels function correctly
- [ ] Status effects work as intended
- [ ] Critical hits and misses feel balanced
- [ ] Elemental system adds strategic depth
- [ ] Daily reset system works properly
- [ ] Economy is sustainable (not exploitable)

### 11.2 Final Verdict

**Overall Balance Rating:** ☐ Poor  ☐ Needs Work  ☐ Good  ☐ Excellent

**Recommendation:** ☐ Needs Major Rework  ☐ Needs Tuning  ☐ Ready for Release

**Tester Name:** _____________________  
**Date Completed:** _____________________  
**Time Spent Testing:** _________ hours  

**Summary Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Appendix A: Test Data Recording

### Combat Log Template
```
Fight ID: ___________
Date: ___________
Player: Level ___ [Class] | ATK: ___ DEF: ___ HP: ___ SPD: ___
Equipment: Weapon [____] | Armor [____] | Accessory [____]
Enemy: Tier ___ | ATK: ___ DEF: ___ HP: ___ SPD: ___

Turn-by-turn:
Turn 1: [Actor] attacks [Target] for ___ damage (Crit: Y/N, Miss: Y/N)
Turn 2: ...

Result: [Winner] in ___ turns
```

### Loot Roll Template
```
Roll ID: ___________
Date: ___________
Loot Table: Tier ___

Items Dropped:
1. [Slot] - [Name] - [Rarity] - Level Req: ___ - Affixes: ___
2. ...

Currency: ___
Total Items: ___
```

### Dungeon Run Template
```
Run ID: ___________
Date: ___________
Dungeon: ___________ | Difficulty: ___________
Player Level: ___ | Equipment: [Common/Uncommon/Rare/Epic/Legendary]

Floor-by-floor:
Floor 1: Enemy Tier ___ | Win: Y/N | Turns: ___
Floor 2: ...

Completion: [Full/Partial/Failed]
Floors Completed: ___ / ___
Rewards: ___ items, ___ currency
Entry Cost: ___ | Refund: ___
```

---

## Appendix B: Known Mechanics Reference

### Damage Formula
```
base_damage = attacker_attack * modifier - defender_defense * 0.5
elemental_damage = base_damage * elemental_modifier
final_damage = elemental_damage * crit_modifier (if crit)
actual_damage = max(1, final_damage)
```

### Elemental Advantages
```
Fire > Earth (1.5x)     Fire < Wind (0.8x)
Water > Fire (1.5x)     Water < Earth (0.8x)
Earth > Water (1.5x)    Earth < Wind (0.8x)
Wind > Water (1.5x)     Wind < Fire (0.8x)
Neutral = All (1.0x)
```

### Status Effect Summary
```
Stun: Skip turn, 1 turn duration
DoT: 3 damage/turn, 3 turns
Defense Debuff: -2 defense, 2 turns
Attack Buff: +2 attack, 2 turns
HoT: X healing/turn, Y turns
```

### Class Special Abilities
```
Warrior: 20% Defense Debuff on enemy
Mage: 40% DoT on enemy
Rogue: 30% Stun on enemy
Paladin: 20% Attack Buff on self
```

### Multi-Hit Mechanics
```
Trigger: Speed > 15
Chance: 30%
Effect: Second hit deals 50% damage
```

---

**End of Checklist**
