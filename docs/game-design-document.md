# Game Design Document: Math Quest Adventures
<!-- This is a test -->

## Executive Summary

**Game Title:** Math Quest Adventures (working title)

**Target Audience:** Children ages 6-8

**Platform:** Web Browser (Desktop & Tablet)

**Genre:** Educational Fantasy Adventure / RPG Lite

**Core Concept:** Players embark on an epic **Journey** through magical realms, leading an adventuring party. The Journey is divided into many **Adventures**, each with its own theme, story, and map featuring a linear set of **Encounters**. Some encounters involve battles against monsters, while others present puzzles to solve. Each adventure culminates in a **Boss Fight**. Through the adventures players can unlock new companions, grow and evolve their existing companions and collect visual elements to create their own unique Magical Canvas. The party grows from a small band to a formidable fellowship of heroes.

---

### 1. Game Overview

### 1.1 Vision Statement
Math Quest Adventures transforms math practicing into an exciting fantasy **Journey** where every challenge overcome makes your party stronger. Players lead their own fellowship through multiple **Adventures**, each containing a series of **Encounters** (battles and puzzles) that culminate in epic **Boss Fights**. Companions solve contextual math challenges to achieve **Companion Growth**, defeat monsters, and unlock new regions of the realm.

### 1.2 Core Gameplay Loop
* Choose Adventure/Chapter
* Choose Party from fellowship
* Face Encounters
* Solve Math Challenges
* Grow Companions
* Defeat Boss Fight
* Unlock next adventure

### 1.3 Key Features
- **Epic Journey**: Progress through multiple themed adventures, each with unique stories and maps
- **Selectable Math Difficulty**: Players can select which math difficulty to practice
- **Companion Collection**: Recruit diverse heroes, each with unique abilities
- **Party Customization**: Choose 4 companions to take on each encounter
- **Companion Growth System**: Companions upgrade their unique skills as they gain experience
- **Linear Adventure Maps**: Each adventure features a sequence of encounters leading to a boss fight
- **Encounter Variety**: Face monster battles and solve puzzles
- **Boss Fights**: Epic climactic battles at the end of each adventure
- **Reward System**: Immediate feedback and tangible progression through companion growth

---

## 2. Game Mechanics

### 2.1 Journey & Adventure System

#### Journey Structure
The player's overall progression is called the **Journey**. The Journey is divided into multiple **Adventures**, each representing a self-contained story arc with its own theme, map, and challenges. Additional **Journey**s can be purchased as DLCs. Progressing through new journeys unlocks new companions, and styling options for Magical Canvas

#### Adventure Structure
Each **Adventure** consists of:
- **Theme & Story**: Unique narrative context (e.g., "The Goblin Forest", "Dragon's Lair")
- **Linear Map**: A path of connected nodes representing encounters
- **Encounters**: Individual challenges along the path (battles against monsters or puzzles to solve)
- **Boss Fight**: The final, climactic encounter that must be defeated to complete the adventure

#### Encounter Types
- **Battle Encounters**: Turn-based battle against monsters
- **Puzzle Encounters**: Logic and math puzzles to solve (future feature)
- **Boss Fights**: Epic battle against powerful enemies at the end of each adventure

### 2.2 Math Challenge System

**Dimension 2: Difficulty Level** (determines companion growth level)
- **Level 1**: Small numbers (e.g., single-digit)
- **Level 2**: Medium numbers (e.g., double-digit)
- **Level 3**: Large numbers (e.g., triple-digit or complex operations)
- **Level 4**: Very large numbers or multi-step problems
- **Level 5**: Expert level challenges

#### Challenge Presentation
- **Contextual Integration**: Math naturally woven into story scenarios or displayed as part of ultimate ability system
  - "The merchant needs 7 potions but only has 3. How many more should we buy?"
  - "There are goblins hiding behind rocks. Count them before they attack!"
  - "The bridge can hold 50 people. We have 32. How many more allies can cross?"
- **Multiple Choice**: For younger players and easier for touch screen

#### Player-Controlled Difficulty
- Players can choose both the math difficulty level for each encounter
- Game encourages players to increase difficulty when they perform well using a star system
- No forced adjustments - player always has final choice
- Progress tracking shows performance by skill and difficulty to help inform choices

### 2.3 Companion System

#### Core Design Philosophy
- **Permanent Companions**: Once unlocked, companions are yours forever
- **No Equipment**: Companions upgrade directly (simpler for children)
- **Party Selection**: Choose which 4 companions to bring on each encounter
- **Diverse Heroes**: Each companion has unique personality, appearance, and an ability

### 2.4 Encounter System

#### Encounter Flow
1. **Meeting**: Player meets monster or monster group
2. **Action Phase**: Turn-based encounter begins
3. **Victory/Defeat**: Gain companion experience, stars for recognition or retry option

#### Encounter Mechanics (Turn-Based)
- **Player Turn**:
  - **Action Phase**: The player commands their party members. Each companion must act once per turn.
  - **Standard Abilities**: Companions use their attack to do damage to the monster
  - **Completion**: The Player Turn ends automatically when all conscious companions have acted.

- **Ultimate Ability System**:
  - **Spirit Accumulation**: Companions passively generate **Spirit** at the start of every Player Turn.
  - **Ultimate Ready**: When a companion reaches **100 Spirit**, their Standard Ability is replaced by their unique **Ultimate Ability**.
  - **High-Stakes Math Challenge**: Activating an Ultimate triggers a math problem.
    - **Solve Correctly**: The Ultimate activates with a powerful effect (e.g., "Protective Stance", "Piercing Shot").
    - **Solve Incorrectly**: The ability **Fails**, consuming the Spirit and the turn without effect.
    - **Reset**: Spirit always resets to 0 after an Ultimate attempt.

- **Monster Turn**:
  - **Sequential Attacks**: Monsters attack one by one to a random companion.


### 2.5 Progression System

#### Journey Progression Through Realms
Each realm contains multiple adventures:
- Unique visual theme
- New monster types
- New kinds of puzzles
- New companions to unlock
- Final adventure with a boss fight that must be defeated to unlock next realm

---

## 3. Reward System

### 3.1 Encounter Rewards
- **Encounter XP**: Completing each encounter grants a fixed XP reward for all companions participated in the encounter
- **Companion Unlocks**: Completing an entire adventure unlocks a new companion who joins your party.
  - Example: Complete "The Oasis Quest" adventure → Unlock Tariq (Level 1)
---

## 4. User Interface & Experience

### 4.1 The Magical Canvas (Creative Hub)
- **Concept**: A free-form sticker book/diorama creator where players can express themselves artistically.
- **My Scenes**: Players can create and save multiple scenes (e.g., "My Epic Battle", "Peaceful Forest").
- **Asset Collection**: 
  - **Stickers**: Characters, Monsters, Props, Backgrounds, Effects.
  - **Unlock Method**: Unlocked by playing Adventures, finding "Hidden Stickers" (loot), and leveling up Companions.
- **Creative Tools**:
  - **Free Placement**: Drag, drop, scale, rotate, and layer assets anywhere on the canvas.
  - **No Gameplay Constraints**: Pure artistic expression (e.g., placing a Goblin on a cloud).
- **Party Setup**: Accessed via a dedicated menu button, separating utility from creativity.
- **Adventure Map**: Accessible via the "Portal" icon.

### 4.3 Visual Design Principles
- **Child-Friendly**: Bright colors, clear icons, friendly characters
- **Fantasy Theme**: Castles, forests, magical effects, heroes and monsters
- **Feedback**: Animations for success/failure, level-ups
- **Accessibility**: Adjustable text size, colorblind modes
- **Character-Driven**: Companions have personality through dialogue and expressions

---

## 5. Educational Design

### 5.1 Learning Principles

**Spaced Repetition**
- Previously mastered concepts appear periodically
- Prevents skill decay
- Builds long-term retention

**Immediate Feedback**
- Correct answers: Positive reinforcement, rewards
- Incorrect answers: Show correct solution, offer retry
- No punishment, only learning opportunities

**Intrinsic Motivation**
- Progress is visible and meaningful
- Rewards are immediately useful
- Emotional connection to companions

---

## 7. Business Model & Meta Game

### 7.1 "The Chronicles of Realms" (Freemium + DLC)
- **Core Philosophy**: Honest, high-value content purchases. No ads, no predatory microtransactions for consumables.
- **Free Trial (The Hook)**:
    - Includes First Adventure: "The Oasis Quest".
    - Full access to core math curriculum
- **Premium Version (One-time Purchase)**:
    - Includes 5 more adventures and 2 more companions
- **Expansion Packs (Paid DLCs)**:
    - **Content**: Unlocks subsequent content as separate DLCs (e.g., "The Steam Canyons", "The Crystal Peaks") or as a bundle.
    - **Value**: Each DLC contains several adventures (10-15 encounters each), 2 new Unique Companions, new Monsters, and new Math Mechanics.

### 7.2 Engagement Loops
- **Map Progression**: Progress through the story, unlock new monsters and maps, and feel a sense of achievement through overcoming challenges.
- **Companion Progression**: Acquire new companions and watch them grow and evolve as they level up.