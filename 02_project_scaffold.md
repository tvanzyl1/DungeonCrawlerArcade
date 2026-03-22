# 02 — Project Scaffold

## Mission

Create the technical skeleton for a self-contained browser game that is easy to run and easy to host.

## Requirements

Use:

- `index.html`
- `style.css`
- `game.js`

You may split into more JS files only if it improves clarity, but keep the project lightweight.

## Required setup

Create:

- full-screen or responsive game shell
- canvas play area
- overlay system for menu / pause / game over / upgrade modal
- responsive HUD layer
- input abstraction layer so desktop and touch can share the same gameplay logic

## Architecture goals

Structure the code into clear modules or sections for:

- game state
- renderer
- player
- enemies
- projectiles or slash effects
- rooms / dungeon progression
- pickups / rewards
- input manager
- UI manager
- mobile controls
- effects / juice helpers

## Important implementation direction

Do not tightly couple desktop-only controls to gameplay.

Instead:
- gameplay should read from a unified `moveVector`
- gameplay should read from a unified `aimVector`
- attack logic should use aim direction regardless of input source

That way:
- mouse aim works on PC
- right-stick aim works on mobile
- same combat code works across devices

## Responsive layout goals

The game should:

- fill the screen nicely on desktop and mobile
- preserve readable HUD spacing on smaller screens
- avoid tiny buttons or clipped overlays
- scale the canvas while keeping gameplay readable

## Main menu requirements

Create a polished title screen with:

- large game title
- fantasy subtitle or flavour line
- Play button
- short control hint block for desktop and mobile
- subtle background animation or ambient motion if practical

## Success check

At the end of this step the project should boot into a polished shell with the right structure, even if gameplay is still placeholder-level.
