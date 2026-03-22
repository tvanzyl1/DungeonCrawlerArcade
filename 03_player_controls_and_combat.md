# 03 — Player, Controls, and Combat

## Mission

Implement the player controller and the core feel of aiming and auto-attacking.

## Player requirements

The player should:

- move smoothly in 8 directions
- face the current aim direction
- automatically attack toward the aim direction
- feel responsive and forgiving
- stand out clearly from the background

## Desktop controls

Implement:

- `W`, `A`, `S`, `D` for movement
- mouse position for aiming
- continuous auto-attack while valid aim exists

The player should not need to click repeatedly to attack.

## Mobile / tablet controls

Implement twin-stick touch controls:

- left stick controls movement
- right stick controls aiming
- attacks auto-trigger while aiming with the right stick

Requirements:

- virtual sticks should be large and thumb-friendly
- sticks should feel stable and responsive
- they should not block HUD readability
- touch controls should appear only on touch-capable devices or when appropriate

## Combat direction

Choose a strong v1 combat style, such as one of these:

- sword slash arc in front of aim direction
- wand or bow projectile fired toward aim direction
- magical blade wave

Pick one and implement it well.

### Combat feel rules

Combat must include:

- visible attack cadence
- hit sparks or impact bursts
- damage numbers or hit pops
- enemy reaction feedback
- satisfying cooldown rhythm
- clear range / direction readability

## Optional but valuable

If manageable, add one support mechanic:

- short dash
- brief invulnerability after hit
- knockback on heavy attacks
- charge meter or combo meter

## Balance target

The starting weapon should feel fun immediately.

Avoid:
- slow dull attacks
- tiny invisible hitboxes
- confusing aim direction
- attacks that get lost in the background

## Success check

This step is done when moving and aiming already feels enjoyable on both desktop and touch devices.
