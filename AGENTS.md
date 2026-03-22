# AGENTS.md — Dungeon Crawler Agent Pack Master Brief

Use the attached generic style template as the **visual, UX, and feel blueprint**. Preserve the same premium arcade-browser DNA while adapting the theme to a dungeon crawler. The uploaded template is the style source of truth. fileciteturn0file0

## Goal

Build a small but polished **top-down dungeon crawler browser game** that feels great on:

- PC
- tablet
- phone

The game should be immediately playable, readable, satisfying, and charming.

## Core concept

Create a fantasy dungeon action game where the player explores rooms, defeats waves of enemies, survives dangerous encounters, collects treasure, and grows stronger during the run.

The player should always attack **automatically in the current aim direction**.

### Desktop controls
- `WASD` = movement
- mouse = aim direction
- attacks auto-fire / auto-slash toward the mouse direction
- optional keys can trigger dash, interact, or ability later

### Mobile / tablet controls
- left virtual stick = movement
- right virtual stick = aim direction
- attacks auto-fire / auto-slash toward right-stick direction
- all controls must be thumb-friendly and readable on smaller screens

## Non-negotiable style goals

Keep the same presentation values from the uploaded template:

- playful arcade polish
- juicy visual feedback
- colourful look on a darker background
- premium browser-game feel
- oversized readable UI
- satisfying motion and punch
- light-hearted fantasy tone

Do **not** copy any zombie theme, names, enemies, or presentation. Adapt the style to the dungeon concept.

## Suggested game loop

1. Start run from menu
2. Enter dungeon chamber
3. Move and auto-attack toward aim
4. Defeat enemies
5. Collect coins / XP / loot / health
6. Clear room or survive encounter
7. Move deeper into dungeon
8. Choose upgrades or gain stronger weapons
9. Continue until death or boss clear

## Combat feel

Combat should feel immediate and juicy.

Possible weapon styles:

- sword slash arc
- wand bolts
- dagger throws
- short-range cleave
- magic staff burst
- bow shot stream

The first playable version can start with one weapon type, but the structure should allow others later.

## Room / dungeon direction

Keep scope controlled. Use a simple room-based or arena-room dungeon layout.

Good options:
- connected chambers with doors
- one room at a time with progression portals
- procedural room sequence with increasing difficulty

Avoid overbuilding a huge RPG. Keep it arcade-first.

## Enemy direction

Use readable fantasy enemies such as:

- slimes
- bats
- skeletons
- goblins
- ghost flames
- enchanted armour

Each enemy should have clear silhouettes and simple behaviours.

## Progression direction

Make upgrades noticeable and fun.

Examples:
- attack speed
- slash size
- projectile count
- chain lightning
- crit chance
- move speed
- dash cooldown
- pickup magnet radius
- health boost
- burn / poison / freeze effect

## Deliverable expectation

Produce a playable browser game with:

- menu
- HUD
- core combat
- enemies
- room progression
- mobile support
- juicy feedback
- polished UI

Use the following files in this pack as sequential implementation briefs.
