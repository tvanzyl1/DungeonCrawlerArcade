# 01 — Game Design Guardrails

## Mission

Define the dungeon crawler's gameplay identity before building systems.

## Output required

Create or update the project planning docs so the game clearly has:

- a top-down fantasy dungeon crawler identity
- a small, achievable scope for a browser game
- control plans for desktop and mobile
- a clear win / lose flow
- a readable combat-first core loop

## Design guardrails

### Experience target
The game should feel like a **premium bite-sized arcade dungeon run**.

It is not:
- a slow roguelike sim
- a heavy inventory RPG
- a grim horror crawler
- a complex story-driven game

It is:
- action-forward
- readable
- juicy
- replayable
- easy to understand in seconds

### Visual direction
Use a dark fantasy arcade presentation:

- deep navy / charcoal / purple dungeon backdrop
- bright glowing accents for attacks, loot, portals, and enemies
- warm torch or magical highlights
- strong contrast between floor, enemies, projectiles, and pickups
- rounded UI panels and polished overlays

### Tone
Keep the tone slightly cheeky and adventurous.

Examples:
- funny item names
- playful menu copy
- charming upgrade labels
- satisfying treasure and victory moments

Avoid bleak grimdark language.

## Core loop definition

Lock in a loop similar to:

1. enter room
2. dodge and attack
3. defeat enemies
4. gather rewards
5. unlock next room / portal / choice
6. scale challenge
7. continue until death or completion

## Baseline systems for v1

The first version should include:

- player movement
- directional auto-attack
- enemies that pursue or pattern attack
- player health
- room progression
- loot / XP / score reward
- menu and game over / victory state

## Nice-to-have but optional for later

- boss room
- weapon swap
- dash ability
- multiple biomes
- mini-map
- meta progression

## Success check

The game concept is correct if:

- it can be understood from one screenshot and 20 seconds of play
- it already feels different from the zombie template
- it still inherits the same polished arcade presentation values
