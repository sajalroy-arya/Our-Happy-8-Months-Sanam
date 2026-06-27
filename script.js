/* ================================================================
   FOR YOU — ALWAYS  |  Interactive Anime Cinematic Romance
   Complete Script — GSAP ScrollTrigger + Canvas Particles + Web Audio
   ================================================================ */

(function () {
  "use strict";

  // ── Global State ───────────────────────────────────────────────
  const isMobile = window.innerWidth < 768;

  // ── Register GSAP Plugins ──────────────────────────────────────
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });
  let audioEngine = null;
  let particleSystem = null;
  let animationRunning = false;
  let lastTime = 0;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let currentScene = "scene-1";
  let envelopeOpened = false;
  let finaleTriggered = false;

  // ── DOM References ─────────────────────────────────────────────
  const introOverlay = document.getElementById("intro-overlay");
  const muteBtn = document.getElementById("mute-btn");
  const progressFill = document.getElementById("progress-fill");
  const mainCanvas = document.getElementById("main-canvas");
  const mainCtx = mainCanvas.getContext("2d");
  const finaleCanvas = document.getElementById("finale-canvas");
  const finaleCtx = finaleCanvas.getContext("2d");

  // ================================================================
  // 1. LENIS SMOOTH SCROLL
  // ================================================================
  const lenis = new Lenis({ 
    lerp: 0.08, 
    smoothWheel: true,
    smoothTouch: true,
    touchMultiplier: 1.5 
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // Don't scroll until intro is dismissed

  // ================================================================
  // 2. AUDIO ENGINE
  // ================================================================
  class AudioEngine {
    constructor() {
      this.audioCtx = null;
      this.masterGain = null;
      this.isMuted = false;
      this.pianoInterval = null;
      this.birdInterval = null;
      this.pianoActive = true;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.audioCtx.destination);
      this.initialized = true;

      this.createPiano();
      this.createRain();
      this.createWind();
      this.createBirds();
    }

    createPiano() {
      const notes = [261.63, 293.66, 329.63, 392, 440, 523.25];
      const playNote = () => {
        if (!this.pianoActive || !this.audioCtx) return;
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 2.1);

        const nextDelay = 2000 + Math.random() * 3000;
        this.pianoInterval = setTimeout(playNote, nextDelay);
      };

      const firstDelay = 500 + Math.random() * 1500;
      this.pianoInterval = setTimeout(playNote, firstDelay);
    }

    createRain() {
      if (!this.audioCtx) return;
      const bufferSize = this.audioCtx.sampleRate * 2;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;

      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.04;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start();
    }

    createWind() {
      if (!this.audioCtx) return;
      const bufferSize = this.audioCtx.sampleRate * 2;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.03;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start();
    }

    createBirds() {
      const chirp = () => {
        if (!this.audioCtx) return;
        const freq = 2000 + Math.random() * 2000;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, this.audioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.2);

        const nextDelay = 3000 + Math.random() * 5000;
        this.birdInterval = setTimeout(chirp, nextDelay);
      };

      const firstDelay = 2000 + Math.random() * 3000;
      this.birdInterval = setTimeout(chirp, firstDelay);
    }

    stopPiano() {
      this.pianoActive = false;
      if (this.pianoInterval) {
        clearTimeout(this.pianoInterval);
        this.pianoInterval = null;
      }
    }

    resumePiano() {
      if (!this.pianoActive) {
        this.pianoActive = true;
        this.createPiano();
      }
    }

    mute() {
      if (!this.audioCtx || !this.masterGain) return;
      this.isMuted = true;
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.3);
    }

    unmute() {
      if (!this.audioCtx || !this.masterGain) return;
      this.isMuted = false;
      this.masterGain.gain.linearRampToValueAtTime(1, this.audioCtx.currentTime + 0.3);
    }

    setVolume(v) {
      if (!this.audioCtx || !this.masterGain) return;
      this.masterGain.gain.linearRampToValueAtTime(v, this.audioCtx.currentTime + 0.1);
    }

    fadeOut(duration = 3) {
      if (!this.audioCtx || !this.masterGain) return;
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);
    }
  }

  // ================================================================
  // 3. PARTICLE ENGINE
  // ================================================================
  class ParticleSystem {
    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.particles = [];
      this.activeMode = "none";
      this.previousMode = "none";
      this.constellationPoints = [];
      this.constellationLines = [];
      this.constellationDrawProgress = 0;
      this.heartExploded = false;
      this.shootingStar = null;
      this.starsHeartLerp = 0; // 0=random, 1=heart
      this.resize();
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + "px";
      this.canvas.style.height = window.innerHeight + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = window.innerWidth;
      this.h = window.innerHeight;
    }

    setMode(mode) {
      if (mode === this.activeMode) return;
      this.previousMode = this.activeMode;
      this.activeMode = mode;
      this.particles = [];
      this.shootingStar = null;

      const count = isMobile ? 0.5 : 1; // Multiplier for mobile

      switch (mode) {
        case "stars":
          this.spawnStars(Math.floor(100 * count));
          break;
        case "petals":
          this.spawnPetals(Math.floor(25 * count));
          break;
        case "butterflies":
          this.spawnButterflies(Math.floor(12 * count));
          break;
        case "sparkles":
          // Sparkles are spawned continuously
          break;
        case "fireflies":
          this.spawnFireflies(Math.floor(30 * count));
          break;
        case "none":
          break;
      }
    }

    // ── Heart curve for star arrangement ──
    heartPoint(t, cx, cy, scale) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      return {
        x: cx + x * scale,
        y: cy + y * scale,
      };
    }

    // ── Star particles ──
    spawnStars(count) {
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const hp = this.heartPoint(t, this.w / 2, this.h / 2, Math.min(this.w, this.h) / 70);
        this.particles.push({
          type: "star",
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          heartX: hp.x,
          heartY: hp.y,
          origX: Math.random() * this.w,
          origY: Math.random() * this.h,
          radius: 0.5 + Math.random() * 1.5,
          opacity: Math.random(),
          twinkleSpeed: 0.5 + Math.random() * 2,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    // ── Petal particles ──
    spawnPetals(count) {
      const colors = [
        "rgba(255, 183, 197, 0.7)",
        "rgba(255, 218, 185, 0.6)",
        "rgba(216, 191, 216, 0.6)",
        "rgba(255, 192, 203, 0.65)",
        "rgba(255, 228, 225, 0.7)",
      ];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          type: "petal",
          x: Math.random() * this.w,
          y: Math.random() * this.h - this.h * 0.1,
          size: 3 + Math.random() * 5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          fallSpeed: 0.3 + Math.random() * 0.7,
          swayAmp: 30 + Math.random() * 50,
          swayPhase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          baseX: Math.random() * this.w,
        });
      }
    }

    // ── Butterfly particles ──
    spawnButterflies(count) {
      const colors = [
        "rgba(184, 169, 201, 0.8)",
        "rgba(255, 183, 197, 0.8)",
        "rgba(255, 218, 185, 0.75)",
        "rgba(244, 194, 194, 0.8)",
      ];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * this.w;
        const y = Math.random() * this.h;
        this.particles.push({
          type: "butterfly",
          x,
          y,
          targetX: x,
          targetY: y,
          wingAngle: 0,
          wingSpeed: 3 + Math.random() * 3,
          size: 8 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: 0,
          vy: 0,
          wanderAngle: Math.random() * Math.PI * 2,
          wanderTimer: 0,
        });
      }
    }

    // ── Sparkle particles ──
    spawnSparkle(x, y) {
      if (this.particles.length > (isMobile ? 80 : 200)) return;
      this.particles.push({
        type: "sparkle",
        x: x + (Math.random() - 0.5) * 200,
        y: y + (Math.random() - 0.5) * 200,
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        opacity: 1,
        vy: -0.2 - Math.random() * 0.5,
      });
    }

    // ── Firefly particles ──
    spawnFireflies(count) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          type: "firefly",
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          radius: 2 + Math.random() * 2,
          glowPhase: Math.random() * Math.PI * 2,
          driftAngle: Math.random() * Math.PI * 2,
          driftSpeed: 0.2 + Math.random() * 0.3,
        });
      }
    }

    // ── Confetti particles ──
    spawnConfetti(count, cx, cy) {
      const colors = [
        "#F4C2C2",
        "#FFB7C5",
        "#B8A9C9",
        "#FFDAB9",
        "#C0C0C0",
        "#E8835C",
        "#FFE4E1",
      ];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          type: "confetti",
          x: cx + (Math.random() - 0.5) * 50,
          y: cy + (Math.random() - 0.5) * 50,
          size: 4 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          fallSpeed: 1 + Math.random() * 2,
          swayAmp: 20 + Math.random() * 40,
          swayPhase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 8,
          vy: -3 - Math.random() * 5,
          gravity: 0.08,
          life: 0,
          maxLife: 180 + Math.random() * 120,
        });
      }
    }

    // ── Shooting Star ──
    triggerShootingStar() {
      this.shootingStar = {
        x: Math.random() * this.w * 0.3,
        y: Math.random() * this.h * 0.3,
        vx: 4 + Math.random() * 3,
        vy: 2 + Math.random() * 2,
        trail: [],
        life: 0,
        maxLife: 60,
      };
    }

    // ── Constellation System ──
    setupConstellations() {
      const cx = this.w / 2;
      const cy = this.h / 2;
      const spread = Math.min(this.w, this.h) * 0.35;
      // 6 constellations placed around the viewport
      const positions = [
        { x: cx - spread * 0.6, y: cy - spread * 0.5 },
        { x: cx + spread * 0.5, y: cy - spread * 0.6 },
        { x: cx - spread * 0.7, y: cy + spread * 0.1 },
        { x: cx + spread * 0.7, y: cy + spread * 0.0 },
        { x: cx - spread * 0.3, y: cy + spread * 0.6 },
        { x: cx + spread * 0.4, y: cy + spread * 0.5 },
      ];

      this.constellationPoints = [];
      this.constellationLines = [];

      positions.forEach((pos, i) => {
        const cluster = [];
        const numStars = 4 + Math.floor(Math.random() * 3);
        for (let j = 0; j < numStars; j++) {
          cluster.push({
            x: pos.x + (Math.random() - 0.5) * 80,
            y: pos.y + (Math.random() - 0.5) * 80,
            radius: 1.5 + Math.random() * 1.5,
            opacity: 0,
            group: i,
          });
        }
        this.constellationPoints.push(...cluster);

        // Create lines connecting stars in this cluster
        for (let j = 0; j < cluster.length - 1; j++) {
          this.constellationLines.push({
            x1: cluster[j].x,
            y1: cluster[j].y,
            x2: cluster[j + 1].x,
            y2: cluster[j + 1].y,
            progress: 0,
            group: i,
          });
        }
      });
    }

    drawConstellations(ctx, groupProgress) {
      // groupProgress: array of 6 values (0-1) for each constellation group
      this.constellationPoints.forEach((p) => {
        const gp = groupProgress[p.group] || 0;
        if (gp <= 0) return;
        p.opacity = Math.min(1, gp * 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 255, ${p.opacity * 0.15})`;
        ctx.fill();
      });

      this.constellationLines.forEach((l) => {
        const gp = groupProgress[l.group] || 0;
        if (gp <= 0) return;
        l.progress = Math.min(1, gp * 1.5);

        const ex = l.x1 + (l.x2 - l.x1) * l.progress;
        const ey = l.y1 + (l.y2 - l.y1) * l.progress;

        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(200, 200, 255, ${l.progress * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    }

    // ── Update all particles ──
    update(dt) {
      const time = performance.now() * 0.001;

      // Shooting star
      if (this.shootingStar) {
        const ss = this.shootingStar;
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.trail.push({ x: ss.x, y: ss.y, opacity: 1 });
        if (ss.trail.length > 20) ss.trail.shift();
        ss.trail.forEach((t) => (t.opacity *= 0.92));
        ss.life++;
        if (ss.life > ss.maxLife) this.shootingStar = null;
      }

      // Update sparkle spawning
      if (this.activeMode === "sparkles") {
        if (Math.random() < 0.3) {
          this.spawnSparkle(this.w / 2, this.h / 2);
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];

        switch (p.type) {
          case "star":
            p.twinklePhase += p.twinkleSpeed * dt;
            p.opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p.twinklePhase));
            // Lerp to heart position
            if (this.starsHeartLerp > 0) {
              p.x += (p.heartX - p.x) * this.starsHeartLerp * 0.02;
              p.y += (p.heartY - p.y) * this.starsHeartLerp * 0.02;
            }
            break;

          case "petal":
            p.y += p.fallSpeed;
            p.swayPhase += 0.01;
            p.x = p.baseX + Math.sin(p.swayPhase) * p.swayAmp;
            p.rotation += p.rotationSpeed;
            // Wrap around
            if (p.y > this.h + 20) {
              p.y = -20;
              p.baseX = Math.random() * this.w;
              p.x = p.baseX;
            }
            break;

          case "butterfly":
            p.wingAngle = Math.sin(time * p.wingSpeed) * 0.6;
            p.wanderTimer -= dt;
            if (p.wanderTimer <= 0) {
              p.wanderAngle += (Math.random() - 0.5) * 1.5;
              p.wanderTimer = 1 + Math.random() * 2;
              // Occasionally set a new target
              p.targetX = p.x + Math.cos(p.wanderAngle) * 100;
              p.targetY = p.y + Math.sin(p.wanderAngle) * 60;
              // Keep in bounds
              p.targetX = Math.max(20, Math.min(this.w - 20, p.targetX));
              p.targetY = Math.max(20, Math.min(this.h - 20, p.targetY));
            }
            p.x += (p.targetX - p.x) * 0.015;
            p.y += (p.targetY - p.y) * 0.015;
            break;

          case "sparkle":
            p.life++;
            p.y += p.vy;
            p.opacity = 1 - p.life / p.maxLife;
            if (p.life >= p.maxLife) {
              this.particles.splice(i, 1);
            }
            break;

          case "firefly":
            p.glowPhase += 0.03;
            p.driftAngle += (Math.random() - 0.5) * 0.1;
            p.x += Math.cos(p.driftAngle) * p.driftSpeed;
            p.y += Math.sin(p.driftAngle) * p.driftSpeed;
            // Keep in bounds
            if (p.x < 0) p.x = this.w;
            if (p.x > this.w) p.x = 0;
            if (p.y < 0) p.y = this.h;
            if (p.y > this.h) p.y = 0;
            break;

          case "confetti":
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.99;
            p.rotation += p.rotSpeed;
            p.life++;
            if (p.life >= p.maxLife || p.y > this.h + 20) {
              this.particles.splice(i, 1);
            }
            break;
        }
      }
    }

    // ── Render all particles ──
    render(ctx) {
      ctx.clearRect(0, 0, this.w, this.h);

      // Shooting star
      if (this.shootingStar) {
        const ss = this.shootingStar;
        ss.trail.forEach((t, idx) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2 * t.opacity, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 240, ${t.opacity})`;
          ctx.fill();
        });
        // Head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        // Glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 200, 0.3)";
        ctx.fill();
      }

      for (const p of this.particles) {
        ctx.save();

        switch (p.type) {
          case "star":
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
            // Subtle glow for larger stars
            if (p.radius > 1.2) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(200, 210, 255, ${p.opacity * 0.15})`;
              ctx.fill();
            }
            break;

          case "petal":
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            break;

          case "butterfly": {
            ctx.translate(p.x, p.y);
            const wingOpen = Math.abs(Math.sin(p.wingAngle));

            // Left wing
            ctx.save();
            ctx.scale(wingOpen, 1);
            ctx.beginPath();
            ctx.ellipse(-p.size * 0.5, -p.size * 0.1, p.size * 0.6, p.size * 0.35, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();

            // Right wing
            ctx.save();
            ctx.scale(wingOpen, 1);
            ctx.beginPath();
            ctx.ellipse(p.size * 0.5, -p.size * 0.1, p.size * 0.6, p.size * 0.35, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, 1.5, p.size * 0.25, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(80, 60, 80, 0.7)";
            ctx.fill();
            break;
          }

          case "sparkle": {
            ctx.translate(p.x, p.y);
            ctx.globalAlpha = p.opacity;
            // 4-point star
            const s = p.size;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.3, -s * 0.3);
            ctx.lineTo(s, 0);
            ctx.lineTo(s * 0.3, s * 0.3);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.3, s * 0.3);
            ctx.lineTo(-s, 0);
            ctx.lineTo(-s * 0.3, -s * 0.3);
            ctx.closePath();
            ctx.fillStyle = "#F4C2C2";
            ctx.fill();
            // Glow
            ctx.beginPath();
            ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(244, 194, 194, ${p.opacity * 0.15})`;
            ctx.fill();
            break;
          }

          case "firefly": {
            const glow = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.glowPhase));
            ctx.globalAlpha = glow;
            // Glow
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 6);
            grad.addColorStop(0, "rgba(255, 240, 150, 0.6)");
            grad.addColorStop(0.4, "rgba(255, 220, 100, 0.2)");
            grad.addColorStop(1, "rgba(255, 200, 50, 0)");
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 6, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            // Core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 240, 150, ${glow})`;
            ctx.fill();
            break;
          }

          case "confetti":
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            break;
        }

        ctx.restore();
      }
    }
  }

  // ================================================================
  // 4. CANVAS SETUP & RESIZE
  // ================================================================
  function resizeCanvases() {
    if (particleSystem) particleSystem.resize();
    // Finale canvas
    const dpr = window.devicePixelRatio || 1;
    finaleCanvas.width = window.innerWidth * dpr;
    finaleCanvas.height = window.innerHeight * dpr;
    finaleCanvas.style.width = window.innerWidth + "px";
    finaleCanvas.style.height = window.innerHeight + "px";
    finaleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let resizeTimeout;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvases, 150);
    },
    { passive: true }
  );

  // ================================================================
  // 5. ANIMATION LOOP
  // ================================================================
  function animationLoop(timestamp) {
    if (!animationRunning) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap at 50ms
    lastTime = timestamp;

    if (particleSystem) {
      particleSystem.update(dt);
      particleSystem.render(mainCtx);
    }

    requestAnimationFrame(animationLoop);
  }

  // ================================================================
  // 6. SCROLL PROGRESS BAR
  // ================================================================
  function setupScrollProgress() {
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progressFill.style.width = (self.progress * 100).toFixed(1) + "%";
      },
    });
  }

  // ================================================================
  // 7. MUTE BUTTON
  // ================================================================
  muteBtn.addEventListener("click", () => {
    if (!audioEngine) return;
    if (audioEngine.isMuted) {
      audioEngine.unmute();
      muteBtn.querySelector(".icon-sound-on").style.display = "block";
      muteBtn.querySelector(".icon-sound-off").style.display = "none";
    } else {
      audioEngine.mute();
      muteBtn.querySelector(".icon-sound-on").style.display = "none";
      muteBtn.querySelector(".icon-sound-off").style.display = "block";
    }
  });

  // ================================================================
  // 8. POINTER TRACKING (for butterflies)
  // ================================================================
  window.addEventListener(
    "mousemove",
    (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (particleSystem && particleSystem.activeMode === "butterflies") {
        particleSystem.particles.forEach((p) => {
          if (p.type === "butterfly") {
            p.targetX = pointerX + (Math.random() - 0.5) * 100;
            p.targetY = pointerY + (Math.random() - 0.5) * 80;
          }
        });
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        pointerX = e.touches[0].clientX;
        pointerY = e.touches[0].clientY;
        if (particleSystem && particleSystem.activeMode === "butterflies") {
          particleSystem.particles.forEach((p) => {
            if (p.type === "butterfly") {
              p.targetX = pointerX + (Math.random() - 0.5) * 100;
              p.targetY = pointerY + (Math.random() - 0.5) * 80;
            }
          });
        }
      }
    },
    { passive: true }
  );

  // ================================================================
  // 9. SCENE ANIMATIONS (GSAP ScrollTrigger)
  // ================================================================

  function setupAllScenes() {
    setupScene1();
    setupScene2();
    setupScene3();
    setupScene4();
    setupScene5();
    setupScene6();
    setupSceneWhatIf();
    setupScene7();
    setupScene8();
    setupScene9();
    setupScene10();
    setupScene11();
    setupScene12();
    setupFinale();
  }

  // ── SCENE 1: Stars & Destiny ──────────────────────────────────
  function setupScene1() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-1",
        start: "top top",
        end: isMobile ? "+=600%" : "+=300%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-1";
          if (particleSystem) particleSystem.setMode("stars");
        },
        onEnterBack: () => {
          currentScene = "scene-1";
          if (particleSystem) particleSystem.setMode("stars");
        },
      },
    });

    // Stars appear gradually (handled by particle system being in 'stars' mode)
    // At 20-30%: Shooting star
    tl.call(
      () => {
        if (particleSystem) particleSystem.triggerShootingStar();
      },
      [],
      0.25
    );

    // At 30-50%: Line 1 fades in
    tl.fromTo(
      "#scene-1 .destiny-line.line-1",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
      0.3
    );

    // At 55-60%: Line 1 fades out
    tl.to("#scene-1 .destiny-line.line-1", { opacity: 0, duration: 0.05 }, 0.55);

    // At 60-80%: Line 2 fades in
    tl.fromTo(
      "#scene-1 .destiny-line.line-2",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
      0.6
    );

    // At 85-100%: Stars rearrange toward heart
    tl.to(
      {},
      {
        duration: 0.15,
        onUpdate: function () {
          if (particleSystem) {
            particleSystem.starsHeartLerp = this.progress();
          }
        },
      },
      0.85
    );
  }

  // ── SCENE 2: Anime Sky & Anniversary ──────────────────────────
  function setupScene2() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-2",
        start: "top top",
        end: isMobile ? "+=400%" : "+=200%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-2";
          if (particleSystem) particleSystem.setMode("petals");
        },
        onEnterBack: () => {
          currentScene = "scene-2";
          if (particleSystem) particleSystem.setMode("petals");
        },
      },
    });

    // Cloud parallax
    tl.to("#scene-2 .cloud-1", { x: -60, duration: 1, ease: "none" }, 0);
    tl.to("#scene-2 .cloud-2", { x: 40, duration: 1, ease: "none" }, 0);
    tl.to("#scene-2 .cloud-3", { x: -30, duration: 1, ease: "none" }, 0);

    // Anniversary text
    tl.fromTo(
      "#scene-2 .anniversary-text",
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" },
      0.2
    );

    // Anniversary sub
    tl.fromTo(
      "#scene-2 .anniversary-sub",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
      0.5
    );
  }

  // ── SCENE 3: Chat Recreation ──────────────────────────────────
  function setupScene3() {
    const messages = document.querySelectorAll("#scene-3 .msg");
    const chatTimestamp = document.querySelector("#scene-3 .chat-timestamp");
    const typingIndicator = document.querySelector("#scene-3 .typing-indicator");
    const chatDate = document.querySelector("#scene-3 .chat-date");
    const colorWash = document.querySelector("#scene-3 .color-wash");
    const phoneFrame = document.querySelector("#scene-3 .phone-frame");

    // Hide all initially
    gsap.set(phoneFrame, { opacity: 0, y: 100 });
    gsap.set(messages, { opacity: 0, x: (i, el) => (el.classList.contains("sent") ? 20 : -20) });
    gsap.set(chatTimestamp, { opacity: 0 });
    gsap.set(typingIndicator, { opacity: 0 });
    gsap.set(chatDate, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-3",
        start: "top top",
        end: isMobile ? "+=700%" : "+=350%",
        pin: true,
        scrub: 1,
        onEnter: () => (currentScene = "scene-3"),
        onEnterBack: () => (currentScene = "scene-3"),
      },
    });

    // Color wash fades out
    tl.fromTo(colorWash, { opacity: 1 }, { opacity: 0, duration: 1, ease: "none" }, 0);

    // Phone slides up
    tl.to(phoneFrame, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.05);

    // Messages appear one by one
    // msg[0] received — "Listen to something..."
    tl.to(messages[0], { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }, 0.15);

    // msg[1] received — song
    tl.to(messages[1], { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }, 0.25);

    // msg[2] sent — "Nahi nahi..."
    tl.to(messages[2], { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }, 0.35);

    // timestamp
    tl.to(chatTimestamp, { opacity: 1, duration: 0.05 }, 0.45);

    // msg[3] sent — "Okay maybe..."
    tl.to(messages[3], { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }, 0.5);

    // msg[4] received — "So... us?"
    tl.to(messages[4], { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }, 0.6);

    // msg[5] sent — "Us."
    tl.to(messages[5], { opacity: 1, x: 0, duration: 0.1, ease: "power2.out" }, 0.7);

    // typing indicator
    tl.to(typingIndicator, { opacity: 1, duration: 0.1 }, 0.8);

    // chat date
    tl.to(chatDate, { opacity: 1, duration: 0.1, ease: "power2.out" }, 0.9);
  }

  // ── SCENE 4: Memory Lane ──────────────────────────────────────
  function setupScene4() {
    const frames = document.querySelectorAll("#scene-4 .memory-frame");
    const sectionTitle = document.querySelector("#scene-4 .section-title");

    // Position frames in a nice layout
    const positions = [
      { left: "5%", top: "25%", rot: -4 },
      { left: "50%", top: "15%", rot: 3 },
      { left: "10%", top: "55%", rot: 2 },
      { left: "52%", top: "52%", rot: -3 },
    ];

    frames.forEach((frame, i) => {
      const pos = positions[i];
      frame.style.position = "absolute";
      frame.style.left = pos.left;
      frame.style.top = pos.top;
      gsap.set(frame, { opacity: 0, y: 60, rotation: pos.rot });
    });

    gsap.set(sectionTitle, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-4",
        start: "top top",
        end: isMobile ? "+=700%" : "+=350%",
        pin: true,
        scrub: 1,
        onEnter: () => (currentScene = "scene-4"),
        onEnterBack: () => (currentScene = "scene-4"),
      },
    });

    // Section title
    tl.to(sectionTitle, { opacity: 1, duration: 0.15, ease: "power2.out" }, 0);

    // Frames float in staggered
    tl.to(frames[0], { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
    tl.to(frames[1], { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.3);
    tl.to(frames[2], { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.45);
    tl.to(frames[3], { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.6);

    // Gentle floating animation after appearing
    frames.forEach((frame) => {
      gsap.to(frame, {
        y: "+=10",
        duration: 2 + Math.random(),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: Math.random(),
      });
    });

    // Tap handler for expanding frames
    let expandedFrame = null;
    frames.forEach((frame) => {
      frame.addEventListener("click", () => {
        if (expandedFrame === frame) {
          // Close
          gsap.to(frame, {
            scale: 1,
            zIndex: 1,
            duration: 0.4,
            ease: "power2.inOut",
          });
          gsap.to(frames, { opacity: 1, duration: 0.3 });
          expandedFrame = null;
        } else {
          // Expand
          if (expandedFrame) {
            gsap.to(expandedFrame, { scale: 1, zIndex: 1, duration: 0.3 });
          }
          gsap.to(frame, {
            scale: 1.5,
            zIndex: 100,
            duration: 0.5,
            ease: "power2.out",
          });
          frames.forEach((f) => {
            if (f !== frame) gsap.to(f, { opacity: 0.3, duration: 0.3 });
          });
          gsap.to(frame, { opacity: 1, duration: 0.3 });
          expandedFrame = frame;
        }
      });
    });
  }

  // ── SCENE 5: Butterfly Garden ─────────────────────────────────
  function setupScene5() {
    const text1 = document.querySelector("#scene-5 .garden-text.text-1");
    const text2 = document.querySelector("#scene-5 .garden-text.text-2");
    const ground = document.querySelector("#scene-5 .garden-ground");

    gsap.set([text1, text2], { opacity: 0, y: 30 });
    gsap.set(ground, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-5",
        start: "top top",
        end: isMobile ? "+=500%" : "+=250%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-5";
          if (particleSystem) particleSystem.setMode("butterflies");
        },
        onEnterBack: () => {
          currentScene = "scene-5";
          if (particleSystem) particleSystem.setMode("butterflies");
        },
      },
    });

    tl.to(ground, { opacity: 1, duration: 0.3, ease: "none" }, 0);
    tl.to(text1, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.2);
    tl.to(text2, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.5);
  }

  // ── SCENE 6: Bollywood Montage ────────────────────────────────
  function setupScene6() {
    const items = document.querySelectorAll("#scene-6 .montage-item");

    // Hide all items initially
    items.forEach((item) => {
      gsap.set(item, { opacity: 0, y: 40 });
      const sub = item.querySelector(".montage-sub");
      if (sub) gsap.set(sub, { opacity: 0 });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-6",
        start: "top top",
        end: isMobile ? "+=1000%" : "+=500%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-6";
          if (particleSystem) particleSystem.setMode("none");
        },
        onEnterBack: () => {
          currentScene = "scene-6";
          if (particleSystem) particleSystem.setMode("none");
        },
      },
    });

    const itemCount = items.length;
    const sliceDuration = 1 / itemCount;

    items.forEach((item, i) => {
      const startT = i * sliceDuration;
      const sub = item.querySelector(".montage-sub");

      // Vary transition style
      const styles = [
        { x: -60, y: 0, scale: 1, filter: "blur(0px)" }, // Slide from left
        { x: 0, y: 0, scale: 0.8, filter: "blur(0px)" }, // Scale from center
        { x: 0, y: 0, scale: 1, filter: "blur(10px)" }, // Blur in
        { x: 0, y: 40, scale: 1, filter: "blur(0px)" }, // Fade up
        { x: 60, y: 0, scale: 1, filter: "blur(0px)" }, // Slide from right
      ];
      const style = styles[i % styles.length];

      // Fade in
      tl.fromTo(
        item,
        {
          opacity: 0,
          x: style.x,
          y: style.y || 40,
          scale: style.scale,
          filter: style.filter,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: sliceDuration * 0.35,
          ease: "power2.out",
        },
        startT
      );

      // Sub text appears slightly after
      if (sub) {
        tl.to(sub, { opacity: 1, duration: sliceDuration * 0.2, ease: "power2.out" }, startT + sliceDuration * 0.35);
      }

      // Fade out (except last)
      if (i < itemCount - 1) {
        tl.to(
          item,
          {
            opacity: 0,
            y: -20,
            duration: sliceDuration * 0.2,
            ease: "power2.in",
          },
          startT + sliceDuration * 0.7
        );
      }
    });
  }

  // ── SCENE WHAT-IF ─────────────────────────────────────────────
  function setupSceneWhatIf() {
    const line1 = document.querySelector("#scene-whatif .whatif-line.line-1");
    const line2 = document.querySelector("#scene-whatif .whatif-line.line-2");
    const light = document.querySelector("#scene-whatif .whatif-light");
    const bloom = document.querySelector("#scene-whatif .whatif-bloom");
    const resolve = document.querySelector("#scene-whatif .whatif-resolve");

    gsap.set([line1, line2], { opacity: 0, y: 20 });
    gsap.set(light, { opacity: 0 });
    gsap.set(bloom, { opacity: 0 });
    gsap.set(resolve, { opacity: 0, y: 15 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-whatif",
        start: "top top",
        end: isMobile ? "+=600%" : "+=300%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-whatif";
          if (particleSystem) particleSystem.setMode("none");
          if (audioEngine) audioEngine.stopPiano();
        },
        onEnterBack: () => {
          currentScene = "scene-whatif";
          if (particleSystem) particleSystem.setMode("none");
          if (audioEngine) audioEngine.stopPiano();
        },
      },
    });

    // Line 1 fades in (muted)
    tl.to(line1, { opacity: 0.6, y: 0, duration: 0.2, ease: "power2.out" }, 0.1);

    // Line 2 fades in
    tl.to(line2, { opacity: 0.6, y: 0, duration: 0.2, ease: "power2.out" }, 0.35);

    // SILENCE moment (0.55-0.60)

    // Light crack
    tl.to(light, { opacity: 1, duration: 0.1, ease: "power3.out" }, 0.6);

    // Resume audio & petals at 65%
    tl.call(
      () => {
        if (audioEngine) audioEngine.resumePiano();
        if (particleSystem) particleSystem.setMode("petals");
      },
      [],
      0.65
    );

    // Fade out what-if lines
    tl.to([line1, line2], { opacity: 0, duration: 0.1 }, 0.7);

    // Bloom and resolve
    tl.to(bloom, { opacity: 1, duration: 0.15 }, 0.75);
    tl.to(resolve, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.78);

    // Transition glow
    tl.to(light, { opacity: 0.5, duration: 0.1 }, 0.9);
  }

  // ── SCENE 7: Crystal Heart ────────────────────────────────────
  function setupScene7() {
    const heartFillRect = document.getElementById("heart-fill-rect");
    const heartProgressText = document.querySelector("#scene-7 .heart-progress-text");
    const heartRevealText = document.querySelector("#scene-7 .heart-reveal-text");

    gsap.set(heartRevealText, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-7",
        start: "top top",
        end: isMobile ? "+=600%" : "+=300%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-7";
          if (particleSystem) {
            particleSystem.setMode("stars");
            particleSystem.heartExploded = false;
          }
        },
        onEnterBack: () => {
          currentScene = "scene-7";
          if (particleSystem) particleSystem.setMode("stars");
        },
      },
    });

    // Fill heart (y: 180 -> 0)
    tl.to(
      heartFillRect,
      {
        attr: { y: 0 },
        duration: 0.8,
        ease: "none",
        onUpdate: function () {
          const progress = this.progress();
          const pct = Math.round(progress * 100);
          heartProgressText.textContent = pct + "%";
        },
      },
      0
    );

    // Heart explode — burst of sparkles at 80%
    tl.call(
      () => {
        if (particleSystem && !particleSystem.heartExploded) {
          particleSystem.heartExploded = true;
          // Spawn burst from center
          const cx = particleSystem.w / 2;
          const cy = particleSystem.h / 2;
          for (let i = 0; i < (isMobile ? 20 : 40); i++) {
            particleSystem.spawnSparkle(cx, cy);
          }
          // Also spawn some butterflies
          const colors = [
            "rgba(184, 169, 201, 0.8)",
            "rgba(255, 183, 197, 0.8)",
            "rgba(244, 194, 194, 0.8)",
          ];
          for (let i = 0; i < 8; i++) {
            particleSystem.particles.push({
              type: "butterfly",
              x: cx,
              y: cy,
              targetX: cx + (Math.random() - 0.5) * 300,
              targetY: cy + (Math.random() - 0.5) * 300,
              wingAngle: 0,
              wingSpeed: 3 + Math.random() * 3,
              size: 8 + Math.random() * 7,
              color: colors[Math.floor(Math.random() * colors.length)],
              vx: 0,
              vy: 0,
              wanderAngle: Math.random() * Math.PI * 2,
              wanderTimer: 0,
            });
          }
        }
      },
      [],
      0.8
    );

    // Hide progress text
    tl.to(heartProgressText, { opacity: 0, duration: 0.05 }, 0.82);

    // Reveal text
    tl.to(heartRevealText, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.85);
  }

  // ── SCENE 8: Floating Islands ─────────────────────────────────
  function setupScene8() {
    const islands = document.querySelectorAll("#scene-8 .island");
    const reasonsTitle = document.querySelector("#scene-8 .reasons-title");

    // Position islands in a scattered layout
    const islandPositions = [
      { left: "8%", top: "22%" },
      { left: "55%", top: "12%" },
      { left: "15%", top: "42%" },
      { left: "58%", top: "35%" },
      { left: "5%", top: "62%" },
      { left: "52%", top: "58%" },
      { left: "20%", top: "78%" },
      { left: "60%", top: "78%" },
    ];

    islands.forEach((island, i) => {
      const pos = islandPositions[i];
      island.style.position = "absolute";
      island.style.left = pos.left;
      island.style.top = pos.top;
      gsap.set(island, { opacity: 0, y: 40 });
    });

    gsap.set(reasonsTitle, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-8",
        start: "top top",
        end: isMobile ? "+=1000%" : "+=500%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-8";
          if (particleSystem) particleSystem.setMode("sparkles");
        },
        onEnterBack: () => {
          currentScene = "scene-8";
          if (particleSystem) particleSystem.setMode("sparkles");
        },
      },
    });

    // Title
    tl.to(reasonsTitle, { opacity: 1, duration: 0.1, ease: "power2.out" }, 0);

    // Stagger islands
    islands.forEach((island, i) => {
      const startT = 0.1 + i * 0.1;
      tl.to(island, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, startT);
    });

    // Float animation for appeared islands
    islands.forEach((island) => {
      gsap.to(island, {
        y: "+=8",
        duration: 2.5 + Math.random(),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2,
      });
    });

    // Tap handler for islands
    let expandedIsland = null;
    islands.forEach((island) => {
      island.addEventListener("click", () => {
        if (expandedIsland === island) {
          gsap.to(island, {
            scale: 1,
            zIndex: 1,
            duration: 0.4,
            ease: "power2.inOut",
          });
          gsap.to(islands, { opacity: 1, duration: 0.3 });
          expandedIsland = null;
        } else {
          if (expandedIsland) {
            gsap.to(expandedIsland, { scale: 1, zIndex: 1, duration: 0.3 });
          }
          gsap.to(island, {
            scale: 1.4,
            zIndex: 100,
            duration: 0.5,
            ease: "power2.out",
          });
          islands.forEach((isl) => {
            if (isl !== island) gsap.to(isl, { opacity: 0.3, duration: 0.3 });
          });
          gsap.to(island, { opacity: 1, duration: 0.3 });
          expandedIsland = island;
        }
      });
    });
  }

  // ── SCENE 9: Constellations ───────────────────────────────────
  function setupScene9() {
    const constellationTitle = document.querySelector("#scene-9 .constellation-title");
    const dreams = document.querySelectorAll("#scene-9 .dream");

    gsap.set(constellationTitle, { opacity: 0 });
    dreams.forEach((d) => gsap.set(d, { opacity: 0, y: 20 }));

    // Set up constellation data
    if (particleSystem) particleSystem.setupConstellations();

    // Track group progress for constellation drawing
    const groupProgress = [0, 0, 0, 0, 0, 0];

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-9",
        start: "top top",
        end: isMobile ? "+=800%" : "+=400%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-9";
          if (particleSystem) particleSystem.setMode("stars");
        },
        onEnterBack: () => {
          currentScene = "scene-9";
          if (particleSystem) particleSystem.setMode("stars");
        },
        onUpdate: (self) => {
          // Render constellations on canvas overlay
          if (particleSystem && currentScene === "scene-9") {
            particleSystem.drawConstellations(mainCtx, groupProgress);
          }
        },
      },
    });

    // Title
    tl.to(constellationTitle, { opacity: 1, duration: 0.1, ease: "power2.out" }, 0);

    // Each dream + constellation pair
    const dreamSlice = 0.15;
    dreams.forEach((dream, i) => {
      const startT = 0.1 + i * dreamSlice;

      // Animate constellation group progress
      tl.to(
        groupProgress,
        {
          [i]: 1,
          duration: dreamSlice * 0.6,
          ease: "power1.out",
        },
        startT
      );

      // Dream text fades in
      tl.to(dream, { opacity: 1, y: 0, duration: dreamSlice * 0.5, ease: "power2.out" }, startT + dreamSlice * 0.2);
    });
  }

  // ── SCENE 10: Promise / Notebook ──────────────────────────────
  function setupScene10() {
    const notebook = document.querySelector("#scene-10 .notebook");
    const promiseLines = document.querySelectorAll("#scene-10 .promise-line");
    const signature = document.querySelector("#scene-10 .signature");
    const promiseTitle = document.querySelector("#scene-10 .promise-title");

    gsap.set(notebook, { opacity: 0, y: 60 });
    gsap.set(promiseTitle, { opacity: 0 });
    promiseLines.forEach((line) => gsap.set(line, { opacity: 0, y: 10 }));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-10",
        start: "top top",
        end: isMobile ? "+=500%" : "+=250%",
        pin: true,
        scrub: 1,
        onEnter: () => (currentScene = "scene-10"),
        onEnterBack: () => (currentScene = "scene-10"),
      },
    });

    // Notebook slides up
    tl.to(notebook, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.1);

    // Promise title
    tl.to(promiseTitle, { opacity: 1, duration: 0.1, ease: "power2.out" }, 0.2);

    // Promise lines (not signature)
    const nonSigLines = Array.from(promiseLines).filter((l) => !l.classList.contains("signature"));
    const lineSlice = 0.65 / nonSigLines.length;

    nonSigLines.forEach((line, i) => {
      const startT = 0.25 + i * lineSlice;
      tl.to(line, { opacity: 1, y: 0, duration: lineSlice * 0.8, ease: "power2.out" }, startT);
    });

    // Signature
    if (signature) {
      tl.to(signature, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.9);
    }
  }

  // ── SCENE 11: Love Letter ─────────────────────────────────────
  function setupScene11() {
    const envelopeWrapper = document.querySelector("#scene-11 .envelope-wrapper");
    const envelope = document.querySelector("#scene-11 .envelope");
    const tapEnvelope = document.querySelector("#scene-11 .tap-envelope");
    const letterContainer = document.getElementById("letter-container");
    const envelopeTap = document.getElementById("envelope-tap");
    const letterBodies = document.querySelectorAll("#scene-11 .letter-body");
    const letterClosing = document.querySelector("#scene-11 .letter-closing");
    const letterSignature = document.querySelector("#scene-11 .letter-signature");
    const letterDate = document.querySelector("#scene-11 .letter-date");
    const letterSalutation = document.querySelector("#scene-11 .letter-salutation");

    gsap.set(envelopeWrapper, { opacity: 0, y: -50 });
    gsap.set(letterContainer, { display: "none", opacity: 0 });

    if (letterDate) gsap.set(letterDate, { opacity: 0 });
    if (letterSalutation) gsap.set(letterSalutation, { opacity: 0 });
    letterBodies.forEach((p) => gsap.set(p, { opacity: 0 }));
    if (letterClosing) gsap.set(letterClosing, { opacity: 0 });
    if (letterSignature) gsap.set(letterSignature, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-11",
        start: "top top",
        end: isMobile ? "+=400%" : "+=200%",
        pin: true,
        scrub: 1,
        onEnter: () => (currentScene = "scene-11"),
        onEnterBack: () => (currentScene = "scene-11"),
      },
    });

    // Envelope floats in
    tl.to(envelopeWrapper, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.1);

    // Tap text pulses (CSS animation handles this, but we ensure visibility)
    tl.to(tapEnvelope, { opacity: 1, duration: 0.2 }, 0.3);

    // Tap handler
    envelopeTap.addEventListener("click", () => {
      if (envelopeOpened) return;
      envelopeOpened = true;

      // Open envelope flap
      envelope.classList.add("open");

      setTimeout(() => {
        // Hide envelope, show letter
        gsap.to(envelopeWrapper, { opacity: 0, duration: 0.5, display: "none" });

        gsap.set(letterContainer, { display: "block" });
        gsap.to(letterContainer, { opacity: 1, duration: 0.6, ease: "power2.out" });

        // Animate letter contents
        const allLetterElements = [];
        if (letterDate) allLetterElements.push(letterDate);
        if (letterSalutation) allLetterElements.push(letterSalutation);
        letterBodies.forEach((p) => allLetterElements.push(p));
        if (letterClosing) allLetterElements.push(letterClosing);
        if (letterSignature) allLetterElements.push(letterSignature);

        allLetterElements.forEach((el, i) => {
          gsap.to(el, {
            opacity: 1,
            duration: 0.5,
            delay: 0.3 + i * 0.4,
            ease: "power2.out",
          });
        });
      }, 800);
    });
  }

  // ── SCENE 12: Sunrise Ending ──────────────────────────────────
  function setupScene12() {
    const sunriseGradient = document.querySelector("#scene-12 .sunrise-gradient");
    const line1 = document.querySelector("#scene-12 .ending-line.line-1");
    const line2 = document.querySelector("#scene-12 .ending-line.line-2");
    const line3 = document.querySelector("#scene-12 .ending-line.line-3");

    gsap.set(sunriseGradient, { opacity: 0 });
    gsap.set([line1, line2, line3], { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scene-12",
        start: "top top",
        end: isMobile ? "+=600%" : "+=300%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "scene-12";
          if (particleSystem) particleSystem.setMode("petals");
        },
        onEnterBack: () => {
          currentScene = "scene-12";
          if (particleSystem) particleSystem.setMode("petals");
        },
      },
    });

    // Sunrise gradient
    tl.to(sunriseGradient, { opacity: 1, duration: 0.4, ease: "none" }, 0);

    // Line 1
    tl.to(line1, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.3);
    tl.to(line1, { opacity: 0, duration: 0.05 }, 0.5);

    // Line 2
    tl.to(line2, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.5);
    tl.to(line2, { opacity: 0, duration: 0.05 }, 0.7);

    // Line 3
    tl.to(line3, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.7);
  }

  // ── FINALE ────────────────────────────────────────────────────
  function setupFinale() {
    const touchHeartBtn = document.getElementById("touch-heart-btn");
    const touchText = document.querySelector("#finale .touch-text");
    const glowHeart = document.querySelector("#finale .glow-heart");
    const finalScreen = document.getElementById("final-screen");
    const finalText = document.querySelector(".final-text");
    const infinity = document.querySelector(".infinity");

    gsap.set(touchText, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#finale",
        start: "top top",
        end: isMobile ? "+=300%" : "+=150%",
        pin: true,
        scrub: 1,
        onEnter: () => {
          currentScene = "finale";
          if (particleSystem) particleSystem.setMode("none");
        },
        onEnterBack: () => {
          currentScene = "finale";
          if (particleSystem) particleSystem.setMode("none");
        },
      },
    });

    // Touch text appears
    tl.to(touchText, { opacity: 1, duration: 0.2, ease: "power2.out" }, 0.4);

    // Tap handler on heart
    touchHeartBtn.addEventListener("click", () => {
      if (finaleTriggered) return;
      finaleTriggered = true;

      // 1. Big pulse on heart
      gsap.to(glowHeart, {
        scale: 1.3,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });

      // 2. Spawn particles on finale canvas after 500ms
      setTimeout(() => {
        const fW = window.innerWidth;
        const fH = window.innerHeight;
        const cx = fW / 2;
        const cy = fH / 2;

        // Create a separate particle system for the finale canvas
        const finaleParticles = new ParticleSystem(finaleCanvas, finaleCtx);

        // Spawn massive burst
        finaleParticles.spawnFireflies(isMobile ? 15 : 30);
        finaleParticles.spawnConfetti(isMobile ? 30 : 60, cx, cy);

        // Spawn butterflies
        const bColors = [
          "rgba(184, 169, 201, 0.8)",
          "rgba(255, 183, 197, 0.8)",
          "rgba(244, 194, 194, 0.8)",
        ];
        for (let i = 0; i < (isMobile ? 6 : 12); i++) {
          finaleParticles.particles.push({
            type: "butterfly",
            x: cx,
            y: cy,
            targetX: cx + (Math.random() - 0.5) * fW * 0.8,
            targetY: cy + (Math.random() - 0.5) * fH * 0.8,
            wingAngle: 0,
            wingSpeed: 3 + Math.random() * 3,
            size: 8 + Math.random() * 7,
            color: bColors[Math.floor(Math.random() * bColors.length)],
            vx: 0,
            vy: 0,
            wanderAngle: Math.random() * Math.PI * 2,
            wanderTimer: 0,
          });
        }

        // Sparkles
        for (let i = 0; i < (isMobile ? 15 : 30); i++) {
          finaleParticles.spawnSparkle(cx, cy);
        }

        // 3. Show final screen
        finalScreen.style.display = "flex";
        gsap.to(finalScreen, { opacity: 1, duration: 1, ease: "power2.out" });

        // Animate finale canvas particles
        let finaleRunning = true;
        let finaleLastTime = performance.now();
        let finaleAlpha = 1;

        function finaleLoop(timestamp) {
          if (!finaleRunning) return;
          const dt = Math.min((timestamp - finaleLastTime) / 1000, 0.05);
          finaleLastTime = timestamp;

          finaleCtx.globalAlpha = finaleAlpha;
          finaleParticles.update(dt);
          finaleParticles.render(finaleCtx);

          requestAnimationFrame(finaleLoop);
        }
        requestAnimationFrame(finaleLoop);

        // 4. After 2s: Fade to white background
        setTimeout(() => {
          gsap.to(finalScreen, {
            backgroundColor: "rgba(255, 255, 255, 1)",
            duration: 1.5,
            ease: "power2.inOut",
          });
        }, 2000);

        // 5. After 3s: Final text
        setTimeout(() => {
          gsap.fromTo(
            finalText,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
          );
        }, 3000);

        // 6. After 4.5s: Infinity symbol
        setTimeout(() => {
          gsap.fromTo(
            infinity,
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: "power2.out" }
          );
        }, 4500);

        // 7. Fade audio out over 3s
        if (audioEngine) {
          audioEngine.fadeOut(3);
        }

        // 8. After 6s: Particles fade out
        setTimeout(() => {
          gsap.to({ val: 1 }, {
            val: 0,
            duration: 2,
            onUpdate: function () {
              finaleAlpha = this.targets()[0].val;
            },
            onComplete: () => {
              finaleRunning = false;
            },
          });
        }, 6000);

        // 9. Stop lenis
        setTimeout(() => {
          lenis.stop();
        }, 3000);

        // Hide main canvas
        gsap.to(mainCanvas, { opacity: 0, duration: 1 });
        animationRunning = false;
      }, 500);
    });
  }

  // ================================================================
  // 10. INTRO OVERLAY HANDLER
  // ================================================================
  introOverlay.addEventListener("click", () => {
    // Initialize audio (required user gesture for AudioContext)
    audioEngine = new AudioEngine();
    audioEngine.init();

    // Fade out overlay
    gsap.to(introOverlay, {
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        introOverlay.style.display = "none";
      },
    });

    // Show mute button
    gsap.to(muteBtn, {
      opacity: 1,
      duration: 0.5,
      delay: 0.8,
      onStart: () => {
        muteBtn.style.display = "flex";
      },
    });

    // Start Lenis smooth scroll
    lenis.start();

    // Initialize particle system
    particleSystem = new ParticleSystem(mainCanvas, mainCtx);
    particleSystem.setMode("stars");

    // Start animation loop
    animationRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(animationLoop);

    // Setup all scene animations
    setupAllScenes();
    setupScrollProgress();

    // Refresh ScrollTrigger after setup
    ScrollTrigger.refresh();
  });

  // ================================================================
  // 11. INITIAL SETUP
  // ================================================================
  // Canvas sizing on load
  resizeCanvases();

  // Ensure mute button starts hidden
  muteBtn.style.display = "none";
  muteBtn.style.opacity = "0";

  // Final screen starts hidden
  const finalScreen = document.getElementById("final-screen");
  if (finalScreen) {
    finalScreen.style.display = "none";
    finalScreen.style.opacity = "0";
  }

  // Set initial opacity for all animated elements
  gsap.set(".destiny-line", { opacity: 0 });
  gsap.set(".anniversary-text", { opacity: 0 });
  gsap.set(".anniversary-sub", { opacity: 0 });
  gsap.set(".garden-text", { opacity: 0 });
  gsap.set(".whatif-line", { opacity: 0 });
  gsap.set(".whatif-light", { opacity: 0 });
  gsap.set(".whatif-bloom", { opacity: 0 });
  gsap.set(".whatif-resolve", { opacity: 0 });
  gsap.set(".heart-reveal-text", { opacity: 0 });
  gsap.set(".reasons-title", { opacity: 0 });
  gsap.set(".island", { opacity: 0 });
  gsap.set(".constellation-title", { opacity: 0 });
  gsap.set(".dream", { opacity: 0 });
  gsap.set(".ending-line", { opacity: 0 });
  gsap.set(".touch-text", { opacity: 0 });
  gsap.set(".final-text", { opacity: 0 });
  gsap.set(".infinity", { opacity: 0 });
})();



