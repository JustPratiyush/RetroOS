/**
 * App: Morphy Cursor
 * Starts Morphy as a desktop companion after the red-pill Trash ending.
 */
(function (global) {
  "use strict";

  const SPRITE_SIZE = 100;
  const SOUND_VOLUME = 0.3;
  const DEFAULT_FPS = 50;
  const DEFAULT_SPEED = 2;
  const DEFAULT_SCALE = 1;
  const ASSET_BASE = "assets/morphy_assets";
  const SPEECH_LINES = [
    "I chased the cursor. The cursor started it.",
    "You took the red pill. I took the nap.",
    "Konami code? I only know sit, stay, sudo.",
    "If the Trash asks, I was never here.",
    "This desktop smells like old pixels and ambition.",
    "Blue pill users organize files. Red pill users get fur on the pointer.",
    "I guard the secret. Also crumbs.",
    "Abhinav hid snacks in /System/Definitely_Not_Snacks.",
    "The Matrix has bugs. I have fleas. We manage.",
    "Do not pet the terminal. It bites back.",
    "When I said: ↑ ↑ ↓ ↓ ← → ← → b a. You have to type it literally!",
  ];
  const SPEECH_FIRST_DELAY = 1400;
  const SPEECH_HIDE_DELAY = 4200;
  const SPEECH_GAP_MIN = 7600;
  const SPEECH_GAP_RANGE = 5200;

  const DIRECTION_SPRITES = [
    "up",
    "upright",
    "right",
    "downright",
    "down",
    "downleft",
    "left",
    "upleft",
  ];
  const IDLE_SPRITES = ["scratch", "wash", "yawn", "sleep"];
  const CLAW_SPRITES = ["upclaw", "rightclaw", "downclaw", "leftclaw"];
  const PAW_PRINT_SPRITES = DIRECTION_SPRITES.map((name) => `fp_${name}`);
  const SOUND_NAMES = ["awake", "sleep", "idle3"];
  const CLAW_TICKS = 18;
  const CLAW_COOLDOWN_TICKS = 70;
  const PAW_PRINT_INTERVAL_TICKS = 14;
  const EDGE_TARGET_MARGIN = 20;
  const WALL_SCRATCH_REACH = 42;

  let activeMorphy = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error(`Failed to load Morphy sprite: ${src}`));
      image.src = src;
    });
  }

  function createAudio(src) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = SOUND_VOLUME;
    return audio;
  }

  function buildSpriteNames() {
    const names = ["awake"];
    DIRECTION_SPRITES.concat(IDLE_SPRITES).forEach((name) => {
      names.push(`${name}1`, `${name}2`);
    });
    CLAW_SPRITES.forEach((name) => {
      names.push(`${name}1`, `${name}2`);
    });
    PAW_PRINT_SPRITES.forEach((name) => {
      names.push(name);
    });
    return names;
  }

  function MorphyFollower(options = {}) {
    this.options = {
      assetBase: options.assetBase || ASSET_BASE,
      speed: typeof options.speed === "number" ? options.speed : DEFAULT_SPEED,
      scale: typeof options.scale === "number" ? options.scale : DEFAULT_SCALE,
      quiet: Boolean(options.quiet),
      fps:
        typeof options.fps === "number" && options.fps > 0
          ? options.fps
          : DEFAULT_FPS,
    };

    this.images = {};
    this.sounds = {};
    this.currentSound = null;
    this.audioUnlocked = false;

    this.waiting = false;
    this.x = 0;
    this.y = 0;
    this.distance = 0;
    this.count = 0;
    this.min = 8;
    this.max = 16;
    this.state = 0;
    this.sprite = "awake";
    this.lastDirection = "down";
    this.clawDirection = "down";
    this.clawTicks = 0;
    this.clawCooldownTicks = 0;
    this.pawPrintTick = 0;
    this.pawPrints = new Set();
    this.running = false;
    this.loaded = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.rafId = 0;
    this.nextSpeechAt = 0;
    this.hideSpeechAt = 0;
    this.lastSpeechIndex = -1;
    this.isSpeechVisible = false;
    this.wasSpeechIdle = false;
    this.mouse = {
      x: global.innerWidth / 2,
      y: global.innerHeight / 2,
      inside: true,
    };

    this.canvas = global.document.createElement("canvas");
    this.canvas.id = "morphy-cursor";
    this.canvas.width = SPRITE_SIZE;
    this.canvas.height = SPRITE_SIZE;
    this.canvas.setAttribute("aria-hidden", "true");

    this.speechBubble = global.document.createElement("div");
    this.speechBubble.id = "morphy-speech-bubble";
    this.speechBubble.setAttribute("aria-live", "polite");
    this.speechBubble.setAttribute("role", "status");

    this.ctx = this.canvas.getContext("2d");
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.applyScale();
    this.recenter();
    this.bindEvents();
  }

  MorphyFollower.prototype.bindEvents = function () {
    global.addEventListener("pointermove", this.handlePointerMove);
    global.addEventListener("pointerdown", this.handlePointerDown);
    global.addEventListener("resize", this.handleResize);
  };

  MorphyFollower.prototype.unbindEvents = function () {
    global.removeEventListener("pointermove", this.handlePointerMove);
    global.removeEventListener("pointerdown", this.handlePointerDown);
    global.removeEventListener("resize", this.handleResize);
  };

  MorphyFollower.prototype.handlePointerMove = function (event) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.mouse.inside = true;
  };

  MorphyFollower.prototype.handlePointerDown = function () {
    this.audioUnlocked = true;

    if (this.waiting || this.distance < this.renderWidth) {
      this.waiting = !this.waiting;
    }
  };

  MorphyFollower.prototype.handleResize = function () {
    this.clampToBounds();
  };

  MorphyFollower.prototype.applyScale = function () {
    this.renderWidth = SPRITE_SIZE * this.options.scale;
    this.renderHeight = SPRITE_SIZE * this.options.scale;
    this.canvas.style.width = `${this.renderWidth}px`;
    this.canvas.style.height = `${this.renderHeight}px`;
  };

  MorphyFollower.prototype.recenter = function () {
    this.x = Math.max(0, (global.innerWidth - this.renderWidth) / 2);
    this.y = Math.max(0, (global.innerHeight - this.renderHeight) / 2);
    this.mouse.x = global.innerWidth / 2;
    this.mouse.y = global.innerHeight / 2;
    this.mouse.inside = true;
  };

  MorphyFollower.prototype.clampToBounds = function () {
    this.x = clamp(
      this.x,
      0,
      Math.max(0, global.innerWidth - this.renderWidth),
    );
    this.y = clamp(
      this.y,
      0,
      Math.max(0, global.innerHeight - this.renderHeight),
    );
  };

  MorphyFollower.prototype.loadAssets = function () {
    if (this.loaded) {
      return Promise.resolve();
    }

    const imageLoads = buildSpriteNames().map((name) =>
      preloadImage(`${this.options.assetBase}/${name}.png`).then((image) => {
        this.images[name] = image;
      }),
    );

    SOUND_NAMES.forEach((name) => {
      this.sounds[name] = createAudio(`${this.options.assetBase}/${name}.wav`);
    });

    return Promise.all(imageLoads).then(() => {
      this.loaded = true;
    });
  };

  MorphyFollower.prototype.start = function () {
    if (this.running) {
      return Promise.resolve(this);
    }

    return this.loadAssets().then(() => {
      if (!this.canvas.parentNode) {
        global.document.body.appendChild(this.canvas);
      }
      if (!this.speechBubble.parentNode) {
        global.document.body.appendChild(this.speechBubble);
      }

      this.running = true;
      this.lastFrameTime = global.performance.now();
      this.nextSpeechAt = this.lastFrameTime + SPEECH_FIRST_DELAY;
      this.accumulator = 0;
      this.rafId = global.requestAnimationFrame((time) => this.tick(time));
      return this;
    });
  };

  MorphyFollower.prototype.stop = function () {
    if (!this.running) return;

    this.running = false;
    this.stopCurrentSound();
    global.cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  };

  MorphyFollower.prototype.destroy = function () {
    this.stop();
    this.unbindEvents();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.speechBubble.parentNode) {
      this.speechBubble.parentNode.removeChild(this.speechBubble);
    }
    this.pawPrints.forEach((pawPrint) => pawPrint.remove());
    this.pawPrints.clear();
  };

  MorphyFollower.prototype.tick = function (timestamp) {
    if (!this.running) return;

    const frameDuration = 1000 / this.options.fps;
    const delta = Math.min(100, timestamp - this.lastFrameTime);
    this.lastFrameTime = timestamp;
    this.accumulator += delta;

    while (this.accumulator >= frameDuration) {
      this.update();
      this.accumulator -= frameDuration;
    }

    this.render();
    this.rafId = global.requestAnimationFrame((time) => this.tick(time));
  };

  MorphyFollower.prototype.playSound = function (name) {
    const sound = this.sounds[name];
    if (this.options.quiet || !this.audioUnlocked || !sound) return;

    if (this.currentSound) {
      this.currentSound.pause();
      this.currentSound.currentTime = 0;
    }

    this.currentSound = sound;
    sound.currentTime = 0;
    const playPromise = sound.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  MorphyFollower.prototype.update = function () {
    this.count += 1;
    if (this.clawCooldownTicks > 0) {
      this.clawCooldownTicks -= 1;
    }

    if (this.state === 10 && this.count === this.min) {
      this.playSound("idle3");
    }

    this.clampToBounds();

    const dx = this.mouse.x - (this.x + this.renderWidth / 2);
    const dy = this.mouse.y - (this.y + this.renderHeight / 2);
    this.distance = Math.abs(dx) + Math.abs(dy);

    if (this.clawTicks > 0) {
      this.clawTicks -= 1;
      this.sprite = `${this.clawDirection}claw`;
      this.stopCurrentSound();
      return;
    }

    if (!this.mouse.inside || this.waiting) {
      this.stopCurrentSound();
      this.stayIdle();
      return;
    }

    const scratchDirection = this.getBoundaryScratchDirection(dx, dy);
    if (scratchDirection) {
      this.startBoundaryScratch(scratchDirection);
      return;
    }

    if (this.distance < this.renderWidth) {
      this.stopCurrentSound();
      this.stayIdle();
      return;
    }

    if (this.state >= 13) {
      this.playSound("awake");
    }

    this.catchCursor(dx, dy);
  };

  MorphyFollower.prototype.stayIdle = function () {
    switch (this.state) {
      case 0:
      case 1:
      case 2:
      case 3:
        if (this.state === 0) this.state = 1;
        this.sprite = "awake";
        break;
      case 4:
      case 5:
      case 6:
        this.sprite = "scratch";
        break;
      case 7:
      case 8:
      case 9:
        this.sprite = "wash";
        break;
      case 10:
      case 11:
      case 12:
        this.min = 32;
        this.max = 64;
        this.sprite = "yawn";
        break;
      default:
        this.sprite = "sleep";
        break;
    }
  };

  MorphyFollower.prototype.stopCurrentSound = function () {
    if (!this.currentSound) return;

    this.currentSound.pause();
    this.currentSound.currentTime = 0;
    this.currentSound = null;
  };

  MorphyFollower.prototype.startBoundaryScratch = function (direction) {
    this.clawDirection = direction;
    this.sprite = `${this.clawDirection}claw`;
    this.clawTicks = CLAW_TICKS;
    this.clawCooldownTicks = CLAW_COOLDOWN_TICKS;
    this.count = 0;
    this.state = 0;
    this.min = Math.floor(CLAW_TICKS / 2);
    this.max = CLAW_TICKS;
    this.stopCurrentSound();
  };

  MorphyFollower.prototype.leavePawPrint = function () {
    this.pawPrintTick += 1;
    if (this.pawPrintTick < PAW_PRINT_INTERVAL_TICKS) return;
    this.pawPrintTick = 0;

    const pawPrintName = `fp_${this.lastDirection}`;
    const image = this.images[pawPrintName];
    if (!image) return;

    const pawPrint = global.document.createElement("img");
    pawPrint.className = "morphy-paw-print visible";
    pawPrint.src = image.src;
    pawPrint.alt = "";
    pawPrint.setAttribute("aria-hidden", "true");
    pawPrint.draggable = false;

    const left = this.x + this.renderWidth / 2 - 16;
    const top = this.y + this.renderHeight * 0.78 - 16;
    pawPrint.style.left = `${Math.round(clamp(left, 0, global.innerWidth - 32))}px`;
    pawPrint.style.top = `${Math.round(clamp(top, 0, global.innerHeight - 32))}px`;

    global.document.body.appendChild(pawPrint);
    this.pawPrints.add(pawPrint);

    global.setTimeout(() => {
      pawPrint.remove();
      this.pawPrints.delete(pawPrint);
    }, 900);
  };

  MorphyFollower.prototype.getBoundaryScratchDirection = function (dx, dy) {
    if (this.clawCooldownTicks > 0) return "";

    const maxX = Math.max(0, global.innerWidth - this.renderWidth);
    const maxY = Math.max(0, global.innerHeight - this.renderHeight);
    const targetNearLeft = this.mouse.x <= EDGE_TARGET_MARGIN;
    const targetNearRight = this.mouse.x >= global.innerWidth - EDGE_TARGET_MARGIN;
    const targetNearTop = this.mouse.y <= EDGE_TARGET_MARGIN;
    const targetNearBottom = this.mouse.y >= global.innerHeight - EDGE_TARGET_MARGIN;

    if (targetNearLeft && this.x <= WALL_SCRATCH_REACH && dx < 0) return "left";
    if (targetNearRight && this.x >= maxX - WALL_SCRATCH_REACH && dx > 0) return "right";
    if (targetNearTop && this.y <= WALL_SCRATCH_REACH && dy < 0) return "up";
    if (targetNearBottom && this.y >= maxY - WALL_SCRATCH_REACH && dy > 0) return "down";

    return "";
  };

  MorphyFollower.prototype.catchCursor = function (dx, dy) {
    const angle = ((Math.atan2(dy, dx) / Math.PI) * 180 + 360) % 360;
    const diagonalSpeed = this.options.speed / Math.SQRT2;

    this.state = 0;
    this.min = 8;
    this.max = 16;

    if (angle <= 292.5 && angle > 247.5) {
      this.y -= this.options.speed;
      this.clampToBounds();
      this.sprite = "up";
      this.lastDirection = "up";
      this.leavePawPrint();
      return;
    }
    if (angle <= 337.5 && angle > 292.5) {
      this.x += diagonalSpeed;
      this.y -= diagonalSpeed;
      this.clampToBounds();
      this.sprite = "upright";
      this.lastDirection = "upright";
      this.leavePawPrint();
      return;
    }
    if (angle <= 22.5 || angle > 337.5) {
      this.x += this.options.speed;
      this.clampToBounds();
      this.sprite = "right";
      this.lastDirection = "right";
      this.leavePawPrint();
      return;
    }
    if (angle <= 67.5 && angle > 22.5) {
      this.x += diagonalSpeed;
      this.y += diagonalSpeed;
      this.clampToBounds();
      this.sprite = "downright";
      this.lastDirection = "downright";
      this.leavePawPrint();
      return;
    }
    if (angle <= 112.5 && angle > 67.5) {
      this.y += this.options.speed;
      this.clampToBounds();
      this.sprite = "down";
      this.lastDirection = "down";
      this.leavePawPrint();
      return;
    }
    if (angle <= 157.5 && angle > 112.5) {
      this.x -= diagonalSpeed;
      this.y += diagonalSpeed;
      this.clampToBounds();
      this.sprite = "downleft";
      this.lastDirection = "downleft";
      this.leavePawPrint();
      return;
    }
    if (angle <= 202.5 && angle > 157.5) {
      this.x -= this.options.speed;
      this.clampToBounds();
      this.sprite = "left";
      this.lastDirection = "left";
      this.leavePawPrint();
      return;
    }

    this.x -= diagonalSpeed;
    this.y -= diagonalSpeed;
    this.clampToBounds();
    this.sprite = "upleft";
    this.lastDirection = "upleft";
    this.leavePawPrint();
  };

  MorphyFollower.prototype.isIdleSprite = function (spriteName) {
    return (
      spriteName === "awake" ||
      spriteName.indexOf("scratch") === 0 ||
      spriteName.indexOf("wash") === 0 ||
      spriteName.indexOf("yawn") === 0
    );
  };

  MorphyFollower.prototype.pickSpeechLine = function () {
    if (SPEECH_LINES.length === 1) return SPEECH_LINES[0];

    let nextIndex = this.lastSpeechIndex;
    while (nextIndex === this.lastSpeechIndex) {
      nextIndex = Math.floor(Math.random() * SPEECH_LINES.length);
    }

    this.lastSpeechIndex = nextIndex;
    return SPEECH_LINES[nextIndex];
  };

  MorphyFollower.prototype.showSpeechBubble = function (timestamp) {
    this.speechBubble.textContent = this.pickSpeechLine();
    this.speechBubble.classList.add("visible");
    this.isSpeechVisible = true;
    this.hideSpeechAt = timestamp + SPEECH_HIDE_DELAY;
    this.nextSpeechAt =
      timestamp +
      SPEECH_HIDE_DELAY +
      SPEECH_GAP_MIN +
      Math.random() * SPEECH_GAP_RANGE;
  };

  MorphyFollower.prototype.hideSpeechBubble = function () {
    if (!this.isSpeechVisible) return;

    this.speechBubble.classList.remove("visible");
    this.isSpeechVisible = false;
  };

  MorphyFollower.prototype.positionSpeechBubble = function () {
    const bubbleWidth = this.speechBubble.offsetWidth || 220;
    const bubbleHeight = this.speechBubble.offsetHeight || 56;
    const preferredLeft = this.x + this.renderWidth * 0.6;
    const preferredTop = this.y - bubbleHeight - 12;

    const left = clamp(
      preferredLeft,
      8,
      Math.max(8, global.innerWidth - bubbleWidth - 8),
    );
    const top = clamp(
      preferredTop,
      46,
      Math.max(46, global.innerHeight - bubbleHeight - 8),
    );

    this.speechBubble.style.left = `${Math.round(left)}px`;
    this.speechBubble.style.top = `${Math.round(top)}px`;
  };

  MorphyFollower.prototype.updateSpeechBubble = function (
    spriteName,
    timestamp,
  ) {
    const isIdle = this.isIdleSprite(spriteName);

    if (!isIdle) {
      this.hideSpeechBubble();
      this.wasSpeechIdle = false;
      return;
    }

    if (!this.wasSpeechIdle) {
      this.nextSpeechAt = timestamp + SPEECH_FIRST_DELAY;
      this.wasSpeechIdle = true;
    }

    this.positionSpeechBubble();

    if (this.isSpeechVisible && timestamp >= this.hideSpeechAt) {
      this.hideSpeechBubble();
      return;
    }

    if (!this.isSpeechVisible && timestamp >= this.nextSpeechAt) {
      this.showSpeechBubble(timestamp);
      this.positionSpeechBubble();
    }
  };

  MorphyFollower.prototype.getCurrentSpriteName = function () {
    if (this.sprite === "awake") return this.sprite;
    return this.count < this.min ? `${this.sprite}1` : `${this.sprite}2`;
  };

  MorphyFollower.prototype.render = function () {
    const spriteName = this.getCurrentSpriteName();
    const image = this.images[spriteName] || this.images.awake;
    if (!image || !this.ctx) return;

    if (this.count > this.max) {
      this.count = 0;
      if (this.state > 0) {
        this.state += 1;
        if (this.state === 13) {
          this.playSound("sleep");
        }
      }
    }

    this.canvas.style.left = `${Math.round(this.x)}px`;
    this.canvas.style.top = `${Math.round(this.y)}px`;

    this.ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    this.ctx.drawImage(image, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
    this.updateSpeechBubble(spriteName, global.performance.now());
  };

  global.startMorphyFollower = function () {
    if (!activeMorphy) {
      activeMorphy = new MorphyFollower();
    }

    return activeMorphy.start().catch((error) => {
      console.warn(error.message);
    });
  };

  global.stopMorphyFollower = function () {
    if (!activeMorphy) return;
    activeMorphy.destroy();
    activeMorphy = null;
  };

  global.MorphyFollower = MorphyFollower;
})(window);
