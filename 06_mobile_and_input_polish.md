# 06 — Mobile and Input Polish

## Mission

Make the game genuinely comfortable on tablet and phone, not just technically playable.

## Touch control requirements

The twin-stick layout must:

- sit comfortably near lower left and lower right corners
- avoid conflict with browser gestures where possible
- feel stable under thumb movement
- provide visible stick base and knob feedback
- support responsive aim direction updates

## Input coexistence

The game should gracefully support:

- keyboard + mouse on desktop
- touch controls on phone / tablet
- device resize / orientation changes without breaking layout

## UX requirements for small screens

Ensure:

- HUD elements stay clear without covering the action too much
- upgrade cards or menus fit within narrow portrait widths
- buttons remain easy to tap
- visual clutter is reduced when screen size is small

## Camera / viewport considerations

If the game uses camera movement or larger rooms:

- keep the player easy to track
- avoid zoom levels that make enemies too tiny on mobile
- maintain strong contrast around the player

## Performance requirements

Optimise enough that it runs smoothly on normal phones and tablets.

Areas to watch:

- cap excessive particles
- clean up dead entities quickly
- keep collision logic simple
- avoid wasteful redraw work where possible

## Accessibility-friendly touches

Where practical, include:

- optional reduced screen shake
- optional mute toggle
- strong contrast for damage and pickups
- clear touch targets

## Success check

The game should feel like it was intentionally designed for touch, not merely ported from desktop.
