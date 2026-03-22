# 04 — Enemies, Rooms, and Progression

## Mission

Add dungeon content that creates a satisfying run structure.

## Enemies

Start with 3 or more readable enemy types.

Suggested examples:

1. **Slime**
   - slow mover
   - basic chase
   - squishy with fun splat feedback

2. **Bat**
   - fast flier
   - swoops or jitters
   - lower health

3. **Skeleton**
   - steady pursuer or ranged attacker
   - stronger than basic slime

Optional later:
- ghost
- goblin bomber
- armoured knight
- mini-boss

## Enemy design rules

Each enemy type should differ in at least one of:

- speed
- health
- attack range
- movement pattern
- spawn behaviour

All enemies must remain easy to read.

## Room progression

Implement a simple room progression system.

Good v1 options:

- clear enemies to unlock next door
- portal appears after room clear
- wave countdown per chamber

Each room should feel like a short challenge.

## Rewards

When enemies die, support some combination of:

- coins
- XP gems
- health drops
- temporary buffs

Rewards should have lively pickup behaviour such as:

- bounce
- float
- glow
- magnet pull toward player

## Upgrade flow

At certain intervals, offer a short upgrade choice.

Possible triggers:
- every level gained
- every few rooms
- after mini-boss

Possible upgrades:
- faster attack speed
- larger slash arc
- extra projectile
- better crits
- more HP
- life steal
- burn effect
- wider pickup range

## Difficulty scaling

Scale challenge by:

- more enemies
- mixed enemy types
- slightly faster enemies
- tougher room patterns

Do not create unfair difficulty spikes.

## Win / loss states

Loss:
- player HP reaches zero
- show a polished game over panel
- show score / rooms cleared / coins / best stat

Win for v1 can be:
- survive a set number of rooms
- defeat a final elite room
- complete a short dungeon depth target

## Success check

A full run should now exist with room progression, enemies, rewards, and a reason to keep pushing forward.
