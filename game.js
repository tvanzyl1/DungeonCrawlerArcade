(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const ui = {
    hud: document.querySelector(".hud"),
    healthFill: document.getElementById("healthFill"),
    healthText: document.getElementById("healthText"),
    xpFill: document.getElementById("xpFill"),
    levelText: document.getElementById("levelText"),
    weaponText: document.getElementById("weaponText"),
    roomText: document.getElementById("roomText"),
    coinsText: document.getElementById("coinsText"),
    scoreText: document.getElementById("scoreText"),
    menuOverlay: document.getElementById("menuOverlay"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    upgradeOverlay: document.getElementById("upgradeOverlay"),
    resultOverlay: document.getElementById("resultOverlay"),
    resultEyebrow: document.getElementById("resultEyebrow"),
    resultTitle: document.getElementById("resultTitle"),
    resultSubtitle: document.getElementById("resultSubtitle"),
    resultStats: document.getElementById("resultStats"),
    upgradeGrid: document.getElementById("upgradeGrid"),
    playButton: document.getElementById("playButton"),
    muteButton: document.getElementById("muteButton"),
    pauseButton: document.getElementById("pauseButton"),
    resumeButton: document.getElementById("resumeButton"),
    restartButtonPause: document.getElementById("restartButtonPause"),
    menuButtonPause: document.getElementById("menuButtonPause"),
    retryButton: document.getElementById("retryButton"),
    menuButtonResult: document.getElementById("menuButtonResult"),
    touchControls: document.getElementById("touchControls"),
    moveStick: document.getElementById("moveStick"),
    aimStick: document.getElementById("aimStick"),
  };

  const DPR_LIMIT = 2;
  const ROOM_TARGET = 6;
  const WORLD_BASE = { width: 1600, height: 900 };
  const TAU = Math.PI * 2;
  const ATTACK_ONLY_WHEN_AIMING_AT_ENEMY = true;
  const ATTACK_AIM_CONE = 0.92;
  const WAVE_HP_SCALING = 1.14;
  const WAVE_SPEED_SCALING = 1.08;

  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    hasMouseAim: false,
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    sticks: {},
  };

  const state = {
    scene: "menu",
    muted: false,
    reducedShake: false,
    cameraShake: 0,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    worldWidth: WORLD_BASE.width,
    worldHeight: WORLD_BASE.height,
    playfieldTop: 140,
    player: null,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    effects: [],
    pickups: [],
    floatingTexts: [],
    room: 1,
    roomCooldown: 0,
    roomActive: false,
    pendingRoom: null,
    score: 0,
    coins: 0,
    killCount: 0,
    roomClearFlash: 0,
    bestScore: 0,
  };

  let lastTime = 0;
  let touchMode = false;

  function deviceHasTouchSupport() {
    return window.matchMedia("(pointer: coarse)").matches
      || window.matchMedia("(any-pointer: coarse)").matches
      || navigator.maxTouchPoints > 0;
  }

  const upgradePool = [
    { id: "faster", icon: "⚡", title: "Quickened Rune", desc: "Attack 16% faster.", apply: (p) => { p.attackCooldown *= 0.84; } },
    { id: "damage", icon: "✦", title: "Bright Edge", desc: "Blade waves hit harder.", apply: (p) => { p.damage += 8; } },
    { id: "size", icon: "🜂", title: "Grand Arc", desc: "Projectiles grow and linger longer.", apply: (p) => { p.projectileSize += 4; p.projectileLife += 0.08; } },
    { id: "speed", icon: "➹", title: "Fleet Boots", desc: "Move speed up by 12%.", apply: (p) => { p.speed *= 1.12; } },
    { id: "magnet", icon: "🜁", title: "Treasure Halo", desc: "Pickup magnet radius grows.", apply: (p) => { p.pickupRadius += 50; } },
    { id: "health", icon: "❤", title: "Ruby Flask", desc: "Max HP +20 and heal 20.", apply: (p) => { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 20); } },
    { id: "burst", icon: "❈", title: "Split Echo", desc: "Gain an extra side projectile.", apply: (p) => { p.sideProjectiles = Math.min(2, p.sideProjectiles + 1); } },
    { id: "crit", icon: "✹", title: "Lucky Sigil", desc: "Crit chance up by 10%.", apply: (p) => { p.critChance += 0.1; } },
  ];

  function createStickState(element) {
    return {
      element,
      knob: element.querySelector(".touch-stick-knob"),
      pointerId: null,
      active: false,
      x: 0,
      y: 0,
    };
  }

  input.sticks.move = createStickState(ui.moveStick);
  input.sticks.aim = createStickState(ui.aimStick);

  function normalized(x, y) {
    const mag = Math.hypot(x, y);
    return mag ? { x: x / mag, y: y / mag } : { x: 0, y: 0 };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.width = rect.width;
    state.height = rect.height;
    const aspect = rect.width / rect.height;
    state.worldWidth = aspect > 1.6 ? WORLD_BASE.width * aspect / 1.78 : WORLD_BASE.width;
    state.worldHeight = aspect < 1 ? WORLD_BASE.height * 1.05 : WORLD_BASE.height;
    state.playfieldTop = clamp(ui.hud.getBoundingClientRect().bottom + 24, 120, state.worldHeight - 240);
    updateTouchVisibility();
  }

  function getArenaBounds() {
    return {
      left: 56,
      right: state.worldWidth - 56,
      top: state.playfieldTop + 32,
      bottom: state.worldHeight - 56,
    };
  }

  function updateTouchVisibility() {
    const show = touchMode || deviceHasTouchSupport();
    ui.touchControls.classList.toggle("hidden", !show);
    ui.touchControls.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function setScene(scene) {
    state.scene = scene;
    ui.menuOverlay.classList.toggle("hidden", scene !== "menu");
    ui.pauseOverlay.classList.toggle("hidden", scene !== "pause");
    ui.upgradeOverlay.classList.toggle("hidden", scene !== "upgrade");
    ui.resultOverlay.classList.toggle("hidden", scene !== "result");
  }

  function createPlayer() {
    const arena = getArenaBounds();
    return {
      x: state.worldWidth / 2,
      y: arena.top + (arena.bottom - arena.top) / 2,
      radius: 24,
      speed: 320,
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      xpToLevel: 70,
      attackCooldown: 1,
      attackTimer: 0.12,
      damage: 24,
      projectileSpeed: 500,
      projectileLife: 0.52,
      projectileSize: 7,
      pickupRadius: 70,
      invuln: 0,
      flash: 0,
      facing: { x: 1, y: 0 },
      sideProjectiles: 0,
      critChance: 0.08,
    };
  }

  function resetRun() {
    state.player = createPlayer();
    state.enemies = [];
    state.projectiles = [];
    state.enemyProjectiles = [];
    state.effects = [];
    state.pickups = [];
    state.floatingTexts = [];
    state.room = 1;
    state.roomCooldown = 0;
    state.roomActive = true;
    state.pendingRoom = null;
    state.score = 0;
    state.coins = 0;
    state.killCount = 0;
    state.cameraShake = 0;
    state.roomClearFlash = 0;
    spawnRoom(state.room);
    setScene("playing");
    updateHud();
  }

  function createEnemy(type, roomNumber) {
    const arena = getArenaBounds();
    const side = Math.floor(Math.random() * 4);
    let x = 80;
    let y = arena.top;
    if (side === 0) { x = random(80, state.worldWidth - 80); y = arena.top; }
    if (side === 1) { x = state.worldWidth - 80; y = random(arena.top, state.worldHeight - 80); }
    if (side === 2) { x = random(80, state.worldWidth - 80); y = state.worldHeight - 80; }
    if (side === 3) { x = 80; y = random(arena.top, state.worldHeight - 80); }

    const waveScale = roomNumber - 1;
    const base = {
      slime: { hp: 50, speed: 90, radius: 22, color: "#6ef0bf", value: 12 },
      bat: { hp: 30, speed: 180, radius: 16, color: "#9f94ff", value: 14 },
      skeleton: { hp: 80, speed: 90, radius: 24, color: "#ffe0ac", value: 22 },
      mage: { hp: 58, speed: 90, radius: 20, color: "#ff7a8f", value: 24 },
    }[type];
    const hp = Math.round(base.hp * Math.pow(WAVE_HP_SCALING, waveScale));
    const speed = base.speed * Math.pow(WAVE_SPEED_SCALING, waveScale);

    return {
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      speed,
      radius: base.radius,
      color: base.color,
      value: base.value,
      hitFlash: 0,
      wobble: random(0, TAU),
      attackTimer: type === "mage" ? random(1.1, 2) : random(0.6, 1.6),
    };
  }

  function spawnRoom(roomNumber) {
    const nextEnemies = [];
    const arena = getArenaBounds();
    state.projectiles = [];
    state.enemyProjectiles = [];
    state.pickups = [];
    state.roomActive = true;
    state.roomCooldown = 0;
    state.effects.push({ type: "pulse", x: state.worldWidth / 2, y: state.playfieldTop + (state.worldHeight - state.playfieldTop) / 2, life: 0.7, maxLife: 0.7, radius: 36, maxRadius: 220, color: "103,215,255" });
    let budget = 5 + roomNumber * 4;
    while (budget > 0) {
      const roll = Math.random();
      const type = roomNumber >= 3
        ? (roll < 0.3 ? "slime" : roll < 0.54 ? "bat" : roll < 0.82 ? "skeleton" : "mage")
        : (roll < 0.42 ? "slime" : roll < 0.72 ? "bat" : "skeleton");
      const cost = type === "skeleton" ? 2 : type === "mage" ? 2 : 1;
      if (budget - cost < 0) {
        continue;
      }
      budget -= cost;
      nextEnemies.push(createEnemy(type, roomNumber));
    }
    if (!nextEnemies.length) {
      nextEnemies.push({
        ...createEnemy("slime", roomNumber),
        x: state.worldWidth / 2,
        y: arena.top + (arena.bottom - arena.top) * 0.3,
      });
    }
    state.enemies = nextEnemies.filter((enemy) => Number.isFinite(enemy.x) && Number.isFinite(enemy.y) && Number.isFinite(enemy.hp) && enemy.hp > 0);
    if (!state.enemies.length) {
      state.enemies = [{
        ...createEnemy("slime", roomNumber),
        x: state.worldWidth / 2,
        y: arena.top + (arena.bottom - arena.top) * 0.3,
      }];
    }
  }

  function spawnFloatingText(text, x, y, color = "#ffffff") {
    state.floatingTexts.push({ text, x, y, life: 0.8, color });
  }

  function spawnEffect(type, x, y, color) {
    if (type === "swish") {
      state.effects.push({ type, x, y, life: 0.22, maxLife: 0.22, radius: 46, color });
      return;
    }
    state.effects.push({ type, x, y, life: 0.55, maxLife: 0.55, radius: 18, maxRadius: 110, color });
  }

  function createProjectile(angleOffset) {
    const player = state.player;
    const angle = Math.atan2(player.facing.y, player.facing.x) + angleOffset;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    state.projectiles.push({
      x: player.x + dir.x * 24,
      y: player.y + dir.y * 24,
      vx: dir.x * player.projectileSpeed,
      vy: dir.y * player.projectileSpeed,
      life: player.projectileLife,
      radius: player.projectileSize,
      damage: player.damage,
      color: "#67d7ff",
    });
  }

  function playBeep(frequency, duration, type, volume) {
    if (state.muted) {
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }
      if (!playBeep.ctx) {
        playBeep.ctx = new AudioContextClass();
      }
      const audioCtx = playBeep.ctx;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    } catch (error) {
      // Audio is optional.
    }
  }

  function attack() {
    const player = state.player;
    player.attackTimer = player.attackCooldown;
    createProjectile(0);
    if (player.sideProjectiles >= 1) {
      createProjectile(-0.22);
    }
    if (player.sideProjectiles >= 2) {
      createProjectile(0.22);
    }
    state.cameraShake = Math.max(state.cameraShake, 7);
    spawnEffect("swish", player.x + player.facing.x * 34, player.y + player.facing.y * 34, "#9be6ff");
    playBeep(660, 0.035, "triangle", 0.025);
  }

  function gainXp(amount) {
    const player = state.player;
    player.xp += amount;
    while (player.xp >= player.xpToLevel) {
      player.xp -= player.xpToLevel;
      player.level += 1;
      player.xpToLevel = Math.round(player.xpToLevel * 1.28);
      renderUpgradeChoices();
      setScene("upgrade");
      playBeep(920, 0.08, "sine", 0.035);
    }
  }

  function enemyDrop(enemy) {
    const xpValue = enemy.type === "skeleton" ? 24 : enemy.type === "bat" ? 15 : 18;
    state.pickups.push({ type: "xp", x: enemy.x, y: enemy.y, vx: random(-32, 32), vy: random(-24, 24), radius: 10, value: xpValue, life: 10, color: "#69f0c0" });
    if (Math.random() < 0.78) {
      state.pickups.push({ type: "coin", x: enemy.x, y: enemy.y, vx: random(-38, 38), vy: random(-28, 28), radius: 9, value: enemy.type === "skeleton" ? 4 : 2, life: 10, color: "#ffc766" });
    }
    if (Math.random() < 0.12) {
      state.pickups.push({ type: "heal", x: enemy.x, y: enemy.y, vx: random(-50, 50), vy: random(-100, -40), radius: 10, value: 14, life: 8, color: "#ff8aa2" });
    }
  }

  function renderUpgradeChoices() {
    const chosen = [...upgradePool].sort(() => Math.random() - 0.5).slice(0, 3);
    ui.upgradeGrid.innerHTML = "";
    chosen.forEach((upgrade) => {
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.type = "button";
      button.innerHTML = `<span class="upgrade-icon">${upgrade.icon}</span><h3>${upgrade.title}</h3><p>${upgrade.desc}</p>`;
      button.addEventListener("click", () => {
        upgrade.apply(state.player);
        spawnEffect("pulse", state.player.x, state.player.y, "255,199,102");
        updateHud();
        setScene("playing");
      }, { once: true });
      ui.upgradeGrid.appendChild(button);
    });
  }

  function finishRun(victory) {
    state.bestScore = Math.max(state.bestScore, state.score);
    ui.resultEyebrow.textContent = victory ? "Treasure Choir" : "Heroic Collapse";
    ui.resultTitle.textContent = victory ? "Dungeon Cleared" : "Run Over";
    ui.resultSubtitle.textContent = victory
      ? "You made it to the vault and left with all your important limbs."
      : "The dungeon keeps the coins. It also keeps the gossip.";
    ui.resultStats.innerHTML = "";
    [
      { label: "Depth", value: `${state.room} / ${ROOM_TARGET}` },
      { label: "Coins", value: `${state.coins}` },
      { label: "Best Score", value: `${state.bestScore}` },
    ].forEach((item) => {
      const card = document.createElement("div");
      card.className = "result-stat";
      card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
      ui.resultStats.appendChild(card);
    });
    setScene("result");
  }

  function clearRoom() {
    if (!state.roomActive) {
      return;
    }
    state.roomActive = false;
    state.score += 100 + state.room * 30;
    state.roomClearFlash = 1;
    playBeep(1080, 0.09, "triangle", 0.03);
    if (state.room >= ROOM_TARGET) {
      finishRun(true);
      return;
    }
    state.roomCooldown = 2.2;
    state.pickups.push({ type: "portal", x: state.worldWidth / 2, y: state.playfieldTop + 74, vx: 0, vy: 0, radius: 24, value: 0, life: 999, color: "#8f83ff" });
  }

  function takeDamage(amount) {
    const player = state.player;
    if (player.invuln > 0) {
      return;
    }
    player.hp -= amount;
    player.invuln = 0.75;
    player.flash = 0.2;
    state.cameraShake = Math.max(state.cameraShake, 12);
    spawnFloatingText(`-${amount}`, player.x, player.y - 24, "#ff8aa2");
    playBeep(180, 0.06, "sawtooth", 0.03);
    if (player.hp <= 0) {
      player.hp = 0;
      finishRun(false);
    }
  }

  function updateInput() {
    const moveX = (input.keys.has("KeyD") ? 1 : 0) - (input.keys.has("KeyA") ? 1 : 0);
    const moveY = (input.keys.has("KeyS") ? 1 : 0) - (input.keys.has("KeyW") ? 1 : 0);
    const keyMove = normalized(moveX, moveY);
    const stickMove = normalized(input.sticks.move.x, input.sticks.move.y);
    input.move = Math.hypot(stickMove.x, stickMove.y) > 0.15 ? stickMove : keyMove;

    const aimStick = normalized(input.sticks.aim.x, input.sticks.aim.y);
    if (Math.hypot(aimStick.x, aimStick.y) > 0.2) {
      input.aim = aimStick;
      return;
    }
    if (input.hasMouseAim && state.player) {
      const world = screenToWorld(input.mouseX, input.mouseY);
      input.aim = normalized(world.x - state.player.x, world.y - state.player.y);
    }
  }

  function getCamera() {
    const player = state.player || { x: state.worldWidth / 2, y: state.worldHeight / 2 };
    const shake = state.reducedShake ? 0 : state.cameraShake;
    return {
      x: clamp(player.x + random(-shake, shake), state.width / 2, state.worldWidth - state.width / 2),
      y: clamp(player.y + random(-shake, shake), state.height / 2, state.worldHeight - state.height / 2),
    };
  }

  function screenToWorld(x, y) {
    const camera = getCamera();
    return {
      x: x - state.width / 2 + camera.x,
      y: y - state.height / 2 + camera.y,
    };
  }

  function updateProjectiles(dt) {
    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = state.projectiles[i];
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      if (projectile.life <= 0 || projectile.x < -80 || projectile.x > state.worldWidth + 80 || projectile.y < -80 || projectile.y > state.worldHeight + 80) {
        state.projectiles.splice(i, 1);
        continue;
      }

      for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = state.enemies[j];
        const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
        if (dist < projectile.radius + enemy.radius) {
          const crit = Math.random() < state.player.critChance;
          const damage = crit ? Math.round(projectile.damage * 1.8) : projectile.damage;
          enemy.hp -= damage;
          enemy.hitFlash = 0.14;
          enemy.vx += projectile.vx * 0.02;
          enemy.vy += projectile.vy * 0.02;
          spawnFloatingText(`${damage}${crit ? "!" : ""}`, enemy.x, enemy.y - enemy.radius, crit ? "#ffc766" : "#ffffff");
          spawnEffect("pulse", enemy.x, enemy.y, "255,255,255");
          state.projectiles.splice(i, 1);
          if (enemy.hp <= 0) {
            state.score += enemy.value;
            state.killCount += 1;
            enemyDrop(enemy);
            playBeep(enemy.type === "slime" ? 220 : 300, 0.045, "square", 0.03);
            state.enemies.splice(j, 1);
          }
          break;
        }
      }
    }
  }

  function spawnEnemyProjectile(enemy, player) {
    const dir = normalized(player.x - enemy.x, player.y - enemy.y);
    state.enemyProjectiles.push({
      x: enemy.x + dir.x * 18,
      y: enemy.y + dir.y * 18,
      vx: dir.x * 360,
      vy: dir.y * 360,
      life: 1.8,
      radius: 8,
      damage: 14,
      color: "#ff5d73",
    });
    spawnEffect("pulse", enemy.x, enemy.y, "255,93,115");
    playBeep(260, 0.04, "sawtooth", 0.018);
  }

  function updateEnemyProjectiles(dt) {
    const player = state.player;
    for (let i = state.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = state.enemyProjectiles[i];
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      if (projectile.life <= 0 || projectile.x < -80 || projectile.x > state.worldWidth + 80 || projectile.y < -80 || projectile.y > state.worldHeight + 80) {
        state.enemyProjectiles.splice(i, 1);
        continue;
      }
      if (Math.hypot(projectile.x - player.x, projectile.y - player.y) < projectile.radius + player.radius) {
        takeDamage(projectile.damage);
        spawnEffect("pulse", projectile.x, projectile.y, "255,93,115");
        state.enemyProjectiles.splice(i, 1);
      }
    }
  }

  function canAttackCurrentAim(player) {
    if (!ATTACK_ONLY_WHEN_AIMING_AT_ENEMY) {
      return true;
    }
    for (const enemy of state.enemies) {
      const toEnemy = normalized(enemy.x - player.x, enemy.y - player.y);
      const alignment = player.facing.x * toEnemy.x + player.facing.y * toEnemy.y;
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (alignment >= ATTACK_AIM_CONE && distance <= 560) {
        return true;
      }
    }
    return false;
  }

  function updateEnemies(dt) {
    const player = state.player;
    const arena = getArenaBounds();
    for (const enemy of state.enemies) {
      const toPlayer = normalized(player.x - enemy.x, player.y - enemy.y);
      enemy.attackTimer -= dt;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      if (enemy.type === "slime") {
        enemy.vx += toPlayer.x * enemy.speed * dt * 1.4;
        enemy.vy += toPlayer.y * enemy.speed * dt * 1.4;
      } else if (enemy.type === "bat") {
        enemy.wobble += dt * 9;
        enemy.vx += (toPlayer.x * enemy.speed + Math.cos(enemy.wobble) * 120) * dt;
        enemy.vy += (toPlayer.y * enemy.speed + Math.sin(enemy.wobble * 1.2) * 120) * dt;
      } else if (enemy.type === "mage") {
        const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const retreat = distance < 240 ? -1 : distance > 340 ? 1 : 0;
        const orbit = { x: -toPlayer.y, y: toPlayer.x };
        enemy.vx += (toPlayer.x * enemy.speed * retreat + orbit.x * 42) * dt;
        enemy.vy += (toPlayer.y * enemy.speed * retreat + orbit.y * 42) * dt;
        if (enemy.attackTimer <= 0 && distance < 560) {
          enemy.attackTimer = 1.8;
          spawnEnemyProjectile(enemy, player);
        }
      } else {
        const orbit = { x: -toPlayer.y, y: toPlayer.x };
        enemy.vx += (toPlayer.x * enemy.speed + orbit.x * 34) * dt;
        enemy.vy += (toPlayer.y * enemy.speed + orbit.y * 34) * dt;
      }
      enemy.vx *= 0.9;
      enemy.vy *= 0.9;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.x = clamp(enemy.x, arena.left, arena.right);
      enemy.y = clamp(enemy.y, arena.top, arena.bottom);

      const hitDistance = enemy.radius + player.radius - (enemy.type === "bat" ? 8 : enemy.type === "mage" ? 18 : 0);
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < hitDistance && enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.type === "bat" ? 1.1 : 0.95;
        takeDamage(enemy.type === "skeleton" ? 16 : enemy.type === "bat" ? 10 : 12);
      }
    }
  }

  function updatePickups(dt) {
    const player = state.player;
    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = state.pickups[i];
      if (!pickup) {
        continue;
      }
      pickup.life -= dt;
      if (pickup.type !== "portal") {
        const floatingPickup = pickup.type === "xp" || pickup.type === "coin";
        if (!floatingPickup) {
          pickup.vy += 260 * dt;
        }
        pickup.x += pickup.vx * dt;
        pickup.y += pickup.vy * dt;
        const drag = floatingPickup ? 0.82 : 0.94;
        pickup.vx *= drag;
        pickup.vy *= drag;
        if (!floatingPickup && pickup.y > state.worldHeight - 64) {
          pickup.y = state.worldHeight - 64;
          pickup.vy *= -0.3;
        }
        const dist = Math.hypot(player.x - pickup.x, player.y - pickup.y);
        if (dist < player.pickupRadius) {
          const pull = clamp(520 / Math.max(dist, 50), 0, 10);
          pickup.x += ((player.x - pickup.x) / Math.max(dist, 1)) * pull * dt * 120;
          pickup.y += ((player.y - pickup.y) / Math.max(dist, 1)) * pull * dt * 120;
        }
      }

      if (pickup.life <= 0) {
        state.pickups.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(player.x - pickup.x, player.y - pickup.y);
      if (dist < player.radius + pickup.radius + (pickup.type === "portal" ? 12 : 4)) {
        if (pickup.type === "xp") {
          gainXp(pickup.value);
          spawnFloatingText(`+${pickup.value} xp`, pickup.x, pickup.y, "#69f0c0");
          playBeep(520, 0.03, "sine", 0.02);
        } else if (pickup.type === "coin") {
          state.coins += pickup.value;
          state.score += pickup.value * 6;
          spawnFloatingText(`+${pickup.value} coin`, pickup.x, pickup.y, "#ffc766");
          playBeep(840, 0.025, "square", 0.018);
        } else if (pickup.type === "heal") {
          player.hp = Math.min(player.maxHp, player.hp + pickup.value);
          spawnFloatingText(`+${pickup.value} hp`, pickup.x, pickup.y, "#ff8aa2");
        } else if (pickup.type === "portal" && state.roomCooldown <= 0) {
          state.pickups.splice(i, 1);
          state.pendingRoom = state.room + 1;
          return;
        }
        state.pickups.splice(i, 1);
      }
    }
  }

  function updateEffects(dt) {
    for (let i = state.effects.length - 1; i >= 0; i -= 1) {
      state.effects[i].life -= dt;
      if (state.effects[i].life <= 0) {
        state.effects.splice(i, 1);
      }
    }
  }

  function updateFloatingTexts(dt) {
    for (let i = state.floatingTexts.length - 1; i >= 0; i -= 1) {
      state.floatingTexts[i].y -= 38 * dt;
      state.floatingTexts[i].life -= dt;
      if (state.floatingTexts[i].life <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }
  }

  function updateHud() {
    const player = state.player || createPlayer();
    ui.healthFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
    ui.healthText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    ui.xpFill.style.width = `${(player.xp / player.xpToLevel) * 100}%`;
    ui.levelText.textContent = `Level ${player.level}`;
    ui.weaponText.textContent = `Moonsteel Arc${player.sideProjectiles ? ` +${player.sideProjectiles}` : ""}`;
    ui.roomText.textContent = `${state.room} / ${ROOM_TARGET}`;
    ui.coinsText.textContent = `${state.coins}`;
    ui.scoreText.textContent = `${state.score}`;
  }

  function update(dt) {
    if (state.scene !== "playing") {
      return;
    }

    updateInput();
    const player = state.player;
    const arena = getArenaBounds();
    player.invuln = Math.max(0, player.invuln - dt);
    player.flash = Math.max(0, player.flash - dt);
    state.cameraShake = Math.max(0, state.cameraShake - dt * 22);
    state.roomClearFlash = Math.max(0, state.roomClearFlash - dt * 0.9);

    player.x += input.move.x * player.speed * dt;
    player.y += input.move.y * player.speed * dt;
    player.x = clamp(player.x, arena.left, arena.right);
    player.y = clamp(player.y, arena.top, arena.bottom);

    if (Math.hypot(input.aim.x, input.aim.y) > 0.15) {
      player.facing = normalized(input.aim.x, input.aim.y);
    }

    player.attackTimer -= dt;
    if (Math.hypot(player.facing.x, player.facing.y) > 0.3 && player.attackTimer <= 0 && canAttackCurrentAim(player)) {
      attack();
    }

    updateProjectiles(dt);
    updateEnemyProjectiles(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateEffects(dt);
    updateFloatingTexts(dt);

    if (state.pendingRoom !== null) {
      state.room = state.pendingRoom;
      state.pendingRoom = null;
      spawnRoom(state.room);
      updateHud();
      return;
    }

    if (state.roomActive && !state.enemies.length && state.roomCooldown <= 0 && !state.pickups.some((pickup) => pickup.type === "portal")) {
      clearRoom();
    }
    if (state.roomCooldown > 0) {
      state.roomCooldown -= dt;
    }
    updateHud();
  }

  function drawDungeon() {
    const borderTop = state.playfieldTop;
    const gradient = ctx.createLinearGradient(0, 0, 0, state.worldHeight);
    gradient.addColorStop(0, "#141937");
    gradient.addColorStop(1, "#0a0e1e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.worldWidth, state.worldHeight);
    for (let y = borderTop; y < state.worldHeight; y += 96) {
      for (let x = 0; x < state.worldWidth; x += 96) {
        ctx.fillStyle = (Math.floor(x / 96) + Math.floor(y / 96)) % 2 === 0 ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.06)";
        ctx.fillRect(x + 4, y + 4, 88, 88);
      }
    }
    [[92, borderTop + 68], [state.worldWidth - 92, borderTop + 68], [92, state.worldHeight - 92], [state.worldWidth - 92, state.worldHeight - 92]].forEach(([x, y]) => {
      const glow = ctx.createRadialGradient(x, y, 4, x, y, 90);
      glow.addColorStop(0, "rgba(255,199,102,0.32)");
      glow.addColorStop(1, "rgba(255,199,102,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 90, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ffb563";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, TAU);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(171,206,255,0.18)";
    ctx.lineWidth = 12;
    ctx.strokeRect(24, borderTop, state.worldWidth - 48, state.worldHeight - borderTop - 24);
  }

  function drawPlayer() {
    const player = state.player;
    const angle = Math.atan2(player.facing.y, player.facing.x);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle);
    if (player.invuln > 0 && Math.floor(player.invuln * 16) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }
    const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 42);
    glow.addColorStop(0, "rgba(255,255,255,0.4)");
    glow.addColorStop(1, "rgba(103,215,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, TAU);
    ctx.fill();
    ctx.fillStyle = player.flash > 0 ? "#ffffff" : "#67d7ff";
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#eff4ff";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, -11);
    ctx.lineTo(-10, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd36d";
    ctx.fillRect(16, -4, 20, 8);
    ctx.restore();
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = enemy.hitFlash > 0 ? "#ffffff" : enemy.color;
      if (enemy.type === "slime") {
        ctx.beginPath();
        ctx.ellipse(0, 4, enemy.radius, enemy.radius * 0.8, 0, 0, TAU);
        ctx.fill();
      } else if (enemy.type === "bat") {
        ctx.beginPath();
        ctx.moveTo(-enemy.radius, 0);
        ctx.quadraticCurveTo(-6, -enemy.radius, 0, -4);
        ctx.quadraticCurveTo(6, -enemy.radius, enemy.radius, 0);
        ctx.quadraticCurveTo(6, 4, 0, 10);
        ctx.quadraticCurveTo(-6, 4, -enemy.radius, 0);
        ctx.fill();
      } else if (enemy.type === "mage") {
        ctx.beginPath();
        ctx.roundRect(-enemy.radius + 2, -enemy.radius + 4, enemy.radius * 2 - 4, enemy.radius * 2 - 8, 12);
        ctx.fill();
        ctx.fillStyle = enemy.hitFlash > 0 ? "#ffffff" : "#ffd9df";
        ctx.beginPath();
        ctx.arc(0, -4, 8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#2d1430";
        ctx.fillRect(-10, 8, 20, 6);
        ctx.strokeStyle = "#ff5d73";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-8, -enemy.radius + 2);
        ctx.lineTo(0, -enemy.radius - 10);
        ctx.lineTo(8, -enemy.radius + 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 10);
        ctx.fill();
        ctx.fillStyle = "#1e233f";
        ctx.fillRect(-8, -4, 5, 5);
        ctx.fillRect(3, -4, 5, 5);
      }
      ctx.restore();
      ctx.fillStyle = "rgba(10,14,30,0.6)";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y + enemy.radius + 8, enemy.radius * 2, 5);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y + enemy.radius + 8, (enemy.hp / enemy.maxHp) * enemy.radius * 2, 5);
    }
  }

  function drawProjectiles() {
    for (const projectile of state.projectiles) {
      const gradient = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, projectile.radius * 1.6);
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(1, "rgba(103,215,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius * 1.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#67d7ff";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TAU);
      ctx.fill();
    }
  }

  function drawEnemyProjectiles() {
    for (const projectile of state.enemyProjectiles) {
      const gradient = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, projectile.radius * 1.8);
      gradient.addColorStop(0, "rgba(255,255,255,0.9)");
      gradient.addColorStop(1, "rgba(255,93,115,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius * 1.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TAU);
      ctx.fill();
    }
  }

  function drawPickups() {
    for (const pickup of state.pickups) {
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      const bob = pickup.type === "portal" ? Math.sin(performance.now() * 0.005) * 5 : Math.sin((pickup.life + pickup.x) * 5) * 2;
      ctx.translate(0, bob);
      if (pickup.type === "portal") {
        const portal = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
        portal.addColorStop(0, "rgba(255,255,255,0.5)");
        portal.addColorStop(1, "rgba(143,131,255,0)");
        ctx.fillStyle = portal;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#8f83ff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, TAU);
        ctx.stroke();
      } else {
        ctx.fillStyle = pickup.color;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawEffects() {
    for (const effect of state.effects) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, effect.life * 1.6);
      if (effect.type === "swish") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, Math.max(0.01, effect.radius * (1.2 - effect.life / Math.max(effect.maxLife || effect.life, 0.01))), -0.9, 0.8);
        ctx.stroke();
      } else {
        const progress = effect.maxLife ? clamp(1 - effect.life / effect.maxLife, 0, 1) : 0;
        const radius = effect.maxRadius ? Math.max(0.01, effect.radius + progress * effect.maxRadius) : effect.radius;
        ctx.strokeStyle = `rgba(${effect.color}, ${effect.life})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawFloatingTexts() {
    ctx.textAlign = "center";
    ctx.font = "700 18px Nunito";
    for (const text of state.floatingTexts) {
      ctx.globalAlpha = text.life;
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    const camera = getCamera();
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.save();
    ctx.translate(state.width / 2 - camera.x, state.height / 2 - camera.y);
    drawDungeon();
    drawPickups();
    drawProjectiles();
    drawEnemyProjectiles();
    drawEnemies();
    drawPlayer();
    drawEffects();
    drawFloatingTexts();
    ctx.restore();
    if (state.roomClearFlash > 0) {
      ctx.fillStyle = `rgba(255, 245, 210, ${state.roomClearFlash * 0.18})`;
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  function bindStick(stick, isAim) {
    const updateStick = (clientX, clientY) => {
      const rect = stick.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const max = rect.width * 0.34;
      const mag = Math.hypot(dx, dy);
      if (mag > max) {
        dx = (dx / mag) * max;
        dy = (dy / mag) * max;
      }
      stick.x = dx / max;
      stick.y = dy / max;
      stick.active = true;
      stick.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      if (isAim) {
        input.hasMouseAim = false;
      }
    };

    const endStick = () => {
      stick.pointerId = null;
      stick.active = false;
      stick.x = 0;
      stick.y = 0;
      stick.knob.style.transform = "translate(-50%, -50%)";
    };

    stick.element.addEventListener("pointerdown", (event) => {
      touchMode = true;
      updateTouchVisibility();
      stick.pointerId = event.pointerId;
      stick.element.setPointerCapture(event.pointerId);
      updateStick(event.clientX, event.clientY);
    });

    stick.element.addEventListener("pointermove", (event) => {
      if (stick.pointerId !== event.pointerId) {
        return;
      }
      updateStick(event.clientX, event.clientY);
    });

    stick.element.addEventListener("pointerup", (event) => {
      if (stick.pointerId === event.pointerId) {
        endStick();
      }
    });
    stick.element.addEventListener("pointercancel", endStick);
  }

  function bindEvents() {
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", (event) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
        input.keys.add(event.code);
      }
      if (event.code === "Escape") {
        if (state.scene === "playing") {
          setScene("pause");
        } else if (state.scene === "pause") {
          setScene("playing");
        }
      }
    });
    window.addEventListener("keyup", (event) => {
      input.keys.delete(event.code);
    });

    canvas.addEventListener("mousemove", (event) => {
      touchMode = false;
      updateTouchVisibility();
      const rect = canvas.getBoundingClientRect();
      input.mouseX = event.clientX - rect.left;
      input.mouseY = event.clientY - rect.top;
      input.hasMouseAim = true;
    });
    canvas.addEventListener("mouseleave", () => {
      input.hasMouseAim = false;
    });

    bindStick(input.sticks.move, false);
    bindStick(input.sticks.aim, true);

    ui.playButton.addEventListener("click", resetRun);
    ui.retryButton.addEventListener("click", resetRun);
    ui.resumeButton.addEventListener("click", () => setScene("playing"));
    ui.pauseButton.addEventListener("click", () => {
      if (state.scene === "playing") {
        setScene("pause");
      }
    });
    ui.restartButtonPause.addEventListener("click", resetRun);
    ui.menuButtonPause.addEventListener("click", () => setScene("menu"));
    ui.menuButtonResult.addEventListener("click", () => setScene("menu"));
    ui.muteButton.addEventListener("click", () => {
      state.muted = !state.muted;
      ui.muteButton.textContent = `Soundless Hall: ${state.muted ? "On" : "Off"}`;
    });
  }

  function loop(timestamp) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0.016);
    lastTime = timestamp;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function init() {
    bindEvents();
    resize();
    state.player = createPlayer();
    updateHud();
    setScene("menu");
    requestAnimationFrame(loop);
  }

  init();
})();
