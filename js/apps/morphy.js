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
  const SOUND_NAMES = ["awake", "sleep", "idle3"];

  let activeMorphy = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load Morphy sprite: ${src}`));
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
    return names;
  }

  function MorphyFollower(options = {}) {
    this.options = {
      assetBase: options.assetBase || ASSET_BASE,
      speed: typeof options.speed === "number" ? options.speed : DEFAULT_SPEED,
      scale: typeof options.scale === "number" ? options.scale : DEFAULT_SCALE,
      quiet: Boolean(options.quiet),
      fps: typeof options.fps === "number" && options.fps > 0 ? options.fps : DEFAULT_FPS,
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
    this.running = false;
    this.loaded = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.rafId = 0;
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
    this.x = clamp(this.x, 0, Math.max(0, global.innerWidth - this.renderWidth));
    this.y = clamp(this.y, 0, Math.max(0, global.innerHeight - this.renderHeight));
  };

  MorphyFollower.prototype.loadAssets = function () {
    if (this.loaded) {
      return Promise.resolve();
    }

    const imageLoads = buildSpriteNames().map((name) =>
      preloadImage(`${this.options.assetBase}/${name}.png`).then((image) => {
        this.images[name] = image;
      })
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

      this.running = true;
      this.lastFrameTime = global.performance.now();
      this.accumulator = 0;
      this.rafId = global.requestAnimationFrame((time) => this.tick(time));
      return this;
    });
  };

  MorphyFollower.prototype.stop = function () {
    if (!this.running) return;

    this.running = false;
    global.cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  };

  MorphyFollower.prototype.destroy = function () {
    this.stop();
    this.unbindEvents();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
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

    if (this.state === 10 && this.count === this.min) {
      this.playSound("idle3");
    }

    this.clampToBounds();

    const dx = this.mouse.x - (this.x + this.renderWidth / 2);
    const dy = this.mouse.y - (this.y + this.renderHeight / 2);
    this.distance = Math.abs(dx) + Math.abs(dy);

    if (!this.mouse.inside || this.distance < this.renderWidth || this.waiting) {
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

  MorphyFollower.prototype.catchCursor = function (dx, dy) {
    const angle = ((Math.atan2(dy, dx) / Math.PI) * 180 + 360) % 360;
    const diagonalSpeed = this.options.speed / Math.SQRT2;

    this.state = 0;
    this.min = 8;
    this.max = 16;

    if (angle <= 292.5 && angle > 247.5) {
      this.y -= this.options.speed;
      this.sprite = "up";
      return;
    }
    if (angle <= 337.5 && angle > 292.5) {
      this.x += diagonalSpeed;
      this.y -= diagonalSpeed;
      this.sprite = "upright";
      return;
    }
    if (angle <= 22.5 || angle > 337.5) {
      this.x += this.options.speed;
      this.sprite = "right";
      return;
    }
    if (angle <= 67.5 && angle > 22.5) {
      this.x += diagonalSpeed;
      this.y += diagonalSpeed;
      this.sprite = "downright";
      return;
    }
    if (angle <= 112.5 && angle > 67.5) {
      this.y += this.options.speed;
      this.sprite = "down";
      return;
    }
    if (angle <= 157.5 && angle > 112.5) {
      this.x -= diagonalSpeed;
      this.y += diagonalSpeed;
      this.sprite = "downleft";
      return;
    }
    if (angle <= 202.5 && angle > 157.5) {
      this.x -= this.options.speed;
      this.sprite = "left";
      return;
    }

    this.x -= diagonalSpeed;
    this.y -= diagonalSpeed;
    this.sprite = "upleft";
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
