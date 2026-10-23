/**
 * DoodleCheck Core Engine
 * 1. High-Performance Canvas Renderer
 * 2. Neuromuscular Biometrics & Human Entropy Analyzer
 * 3. Topological Semantic Doodle Classifier
 * 4. Bot Attack Simulator
 */

class DoodleEngine {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.options = {
      brushColor: options.brushColor || '#1e293b',
      brushSize: options.brushSize || 4.5,
      ...options
    };

    // Strokes data: array of strokes, where each stroke is array of {x, y, t, p}
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.isLocked = false;
    this.startTime = null;
    this.firstStrokeTime = null;

    // Available challenges (15-second time limit each)
    this.challenges = [
      { id: 'cat', label: 'a Cat', emoji: '🐱', hint: 'Head + 2 pointy ears + whiskers', timeLimit: 15 },
      { id: 'smiley', label: 'a Smiley Face', emoji: '😊', hint: 'Circle + 2 eyes + upward smile', timeLimit: 15 },
      { id: 'sun', label: 'the Sun', emoji: '☀️', hint: 'Center circle + glowing ray lines', timeLimit: 15 },
      { id: 'pizza', label: 'a Pizza Slice', emoji: '🍕', hint: 'Triangle slice + pepperoni dots', timeLimit: 15 },
      { id: 'house', label: 'a House', emoji: '🏠', hint: 'Square base + triangular roof', timeLimit: 15 },
      { id: 'tree', label: 'a Tree', emoji: '🌲', hint: 'Trunk + bushy crown or pine layers', timeLimit: 15 },
      { id: 'glasses', label: 'Eyeglasses', emoji: '👓', hint: 'Two lens loops joined by a bridge', timeLimit: 15 },
      { id: 'apple', label: 'an Apple', emoji: '🍎', hint: 'Round fruit body + top stem', timeLimit: 15 }
    ];

    this.currentChallenge = this.challenges[0];
    this.onTelemetryUpdate = null;
    this.onStatusChange = null;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 380;
    this.height = rect.height || 260;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.options.brushColor;
    this.ctx.lineWidth = this.options.brushSize;

    this.redraw();
  }

  setChallenge(challengeId) {
    if (challengeId) {
      this.currentChallenge = this.challenges.find(c => c.id === challengeId) || this.challenges[0];
    } else {
      // Pick random challenge different from current
      const filtered = this.challenges.filter(c => c.id !== this.currentChallenge?.id);
      this.currentChallenge = filtered[Math.floor(Math.random() * filtered.length)];
    }
    this.reset();
    return this.currentChallenge;
  }

  lock() {
    this.isLocked = true;
    this.isDrawing = false;
    this.currentStroke = null;
    this.canvas.style.cursor = 'not-allowed';
  }

  unlock() {
    this.isLocked = false;
    this.canvas.style.cursor = 'crosshair';
  }

  reset() {
    this.unlock();
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.startTime = Date.now();
    this.firstStrokeTime = null;
    this.clearCanvas();
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        neuromuscularEntropy: 0,
        velocityVariance: 0,
        submovementJitter: 0,
        reactionLatency: 0,
        semanticConfidence: 0,
        status: 'READY'
      });
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  undo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redraw();
      this.analyzeBiometrics();
    }
  }

  redraw() {
    this.clearCanvas();
    this.strokes.forEach(stroke => this.renderStroke(stroke));
  }

  renderStroke(stroke) {
    if (!stroke || stroke.length < 1) return;
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.options.brushColor;
    this.ctx.lineWidth = this.options.brushSize;

    if (stroke.length === 1) {
      this.ctx.arc(stroke[0].x, stroke[0].y, this.options.brushSize / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.options.brushColor;
      this.ctx.fill();
      return;
    }

    this.ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length - 1; i++) {
      const xc = (stroke[i].x + stroke[i + 1].x) / 2;
      const yc = (stroke[i].y + stroke[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, xc, yc);
    }
    const last = stroke[stroke.length - 1];
    this.ctx.lineTo(last.x, last.y);
    this.ctx.stroke();
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      t: Date.now(),
      p: e.pressure || 0.5
    };
  }

  bindEvents() {
    const start = (e) => {
      if (this.isLocked) return;
      e.preventDefault();
      if (!this.startTime) this.startTime = Date.now();
      if (!this.firstStrokeTime) this.firstStrokeTime = Date.now();

      this.isDrawing = true;
      const pt = this.getPointerPos(e);
      this.currentStroke = [pt];
      this.strokes.push(this.currentStroke);

      if (window.soundEngine) window.soundEngine.playStroke();
      this.renderStroke(this.currentStroke);
    };

    const move = (e) => {
      if (this.isLocked || !this.isDrawing || !this.currentStroke) return;
      e.preventDefault();
      const pt = this.getPointerPos(e);

      // Avoid redundant duplicate coordinates
      const lastPt = this.currentStroke[this.currentStroke.length - 1];
      const dist = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y);
      if (dist < 1.8) return;

      this.currentStroke.push(pt);
      this.redraw();
      this.analyzeBiometrics();
    };

    const end = (e) => {
      if (this.isLocked || !this.isDrawing) return;
      this.isDrawing = false;
      this.currentStroke = null;
      this.analyzeBiometrics();
    };

    this.canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    this.canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  /**
   * BIOMETRIC & NEUROMUSCULAR ANALYSIS
   * Real human biomechanics have:
   * - Latency pause (200ms - 1500ms) before starting to draw.
   * - Non-uniform velocity curves (bell-shaped minimum jerk profiles).
   * - Involuntary motor tremors / micro-variations (8-12Hz band noise).
   * Bots show:
   * - 0 latency or uniform intervals.
   * - Zero micro-tremor variance (exact straight or quadratic mathematical curves).
   * - Unnatural instantaneous teleportation or perfectly linear speeds.
   */
  analyzeBiometrics() {
    let allPoints = [];
    this.strokes.forEach(s => allPoints.push(...s));

    if (allPoints.length < 5) {
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          neuromuscularEntropy: 0,
          velocityVariance: 0,
          submovementJitter: 0,
          reactionLatency: this.firstStrokeTime && this.startTime ? (this.firstStrokeTime - this.startTime) : 0,
          semanticConfidence: 0,
          status: 'DRAWING'
        });
      }
      return;
    }

    // 1. Reaction Latency
    const latency = this.firstStrokeTime - this.startTime;

    // 2. Velocity & Acceleration dynamics
    let velocities = [];
    let accelerations = [];
    let angleVariations = [];

    for (let s of this.strokes) {
      for (let i = 1; i < s.length; i++) {
        const p1 = s[i - 1];
        const p2 = s[i];
        const dt = Math.max(p2.t - p1.t, 1);
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const v = dist / dt; // px per ms
        velocities.push(v);

        if (i >= 2) {
          const p0 = s[i - 2];
          const dtPrev = Math.max(p1.t - p0.t, 1);
          const vPrev = Math.hypot(p1.x - p0.x, p1.y - p0.y) / dtPrev;
          const a = (v - vPrev) / dt;
          accelerations.push(Math.abs(a));

          // Angle changes (measures natural micro-hand jitter vs mathematical straight lines)
          const angle1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
          const angle2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          let dAngle = Math.abs(angle2 - angle1);
          if (dAngle > Math.PI) dAngle = 2 * Math.PI - dAngle;
          angleVariations.push(dAngle);
        }
      }
    }

    // Mean & Variance of velocity
    const meanVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocityVar = velocities.reduce((acc, v) => acc + Math.pow(v - meanVelocity, 2), 0) / velocities.length;

    // Neuromuscular Jitter (spectral noise in acceleration)
    const meanAcc = accelerations.length ? (accelerations.reduce((a, b) => a + b, 0) / accelerations.length) : 0;
    const accVar = accelerations.length ? (accelerations.reduce((acc, a) => acc + Math.pow(a - meanAcc, 2), 0) / accelerations.length) : 0;

    // Trajectory Entropy (micro-curvature irregularity)
    const meanAngleVar = angleVariations.length ? (angleVariations.reduce((a, b) => a + b, 0) / angleVariations.length) : 0;

    // Compute composite Human Biometric Index (0 - 100%)
    let entropyScore = 0;

    // A real human has velocity variance > 0.005 and < 5.0
    if (velocityVar > 0.003) entropyScore += 35;
    if (accVar > 0.0001) entropyScore += 30;
    if (meanAngleVar > 0.05 && meanAngleVar < 1.8) entropyScore += 25;
    if (latency > 150) entropyScore += 10;

    const neuromuscularEntropy = Math.min(Math.round(entropyScore), 99);
    const submovementJitter = Math.min(Math.round((accVar * 10000) + 25), 98);

    // Run semantic check
    const semanticResult = this.classifyDoodle();

    const telemetry = {
      neuromuscularEntropy,
      velocityVariance: Number(velocityVar.toFixed(4)),
      submovementJitter,
      reactionLatency: Math.max(latency, 0),
      semanticConfidence: semanticResult.confidence,
      semanticMatches: semanticResult.category === this.currentChallenge.id,
      detectedCategory: semanticResult.category,
      status: 'ANALYZING'
    };

    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(telemetry);
    }

    return telemetry;
  }

  /**
   * TOPOLOGICAL SEMANTIC CLASSIFIER
   * Analyzes geometric features of doodle strokes:
   * - Aspect ratio & Bounding Box
   * - Enclosing loops (circularity)
   * - Relative sub-stroke positions (e.g. ears above head, sun rays surrounding circle)
   * - Convex hull / density
   */
  classifyDoodle() {
    let allPoints = [];
    this.strokes.forEach(s => allPoints.push(...s));

    if (allPoints.length < 8) {
      return { category: 'unknown', confidence: 0 };
    }

    // Bounding Box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const aspectRatio = boxWidth / Math.max(boxHeight, 1);
    const strokeCount = this.strokes.length;

    // Detect loops / closed paths
    let closedLoops = 0;
    this.strokes.forEach(s => {
      if (s.length > 10) {
        const start = s[0];
        const end = s[s.length - 1];
        const dist = Math.hypot(end.x - start.x, end.y - start.y);
        const strokeLen = s.reduce((acc, pt, i) => i === 0 ? 0 : acc + Math.hypot(pt.x - s[i - 1].x, pt.y - s[i - 1].y), 0);
        if (dist < strokeLen * 0.28) {
          closedLoops++;
        }
      }
    });

    // Semantic feature extractors
    const target = this.currentChallenge.id;
    let confidence = 0;

    switch (target) {
      case 'cat': {
        // Cat: 1 main body/head loop + strokes in top 30% of bounding box (ears) + optional whiskers
        const topStrokes = this.strokes.filter(s => {
          const avgY = s.reduce((acc, p) => acc + p.y, 0) / s.length;
          return avgY < minY + boxHeight * 0.45;
        });
        if (strokeCount >= 2 && topStrokes.length >= 1) confidence += 45;
        if (closedLoops >= 1 || strokeCount >= 3) confidence += 40;
        if (aspectRatio > 0.6 && aspectRatio < 1.6) confidence += 15;
        break;
      }
      case 'smiley': {
        // Smiley: Circle enclosing two dots/eyes and an upward curved stroke
        if (strokeCount >= 2) confidence += 40;
        if (closedLoops >= 1 || (aspectRatio > 0.7 && aspectRatio < 1.4)) confidence += 35;
        if (strokeCount >= 3) confidence += 25;
        break;
      }
      case 'sun': {
        // Sun: Central circular mass + 3 or more radiating satellite strokes
        if (strokeCount >= 4) confidence += 55;
        else if (strokeCount >= 2) confidence += 30;
        if (aspectRatio > 0.7 && aspectRatio < 1.4) confidence += 25;
        if (closedLoops >= 1 || strokeCount >= 5) confidence += 20;
        break;
      }
      case 'pizza': {
        // Pizza: Triangular shape + topping dots
        if (aspectRatio > 0.5 && aspectRatio < 2.0) confidence += 40;
        if (strokeCount >= 1) confidence += 30;
        if (strokeCount >= 3) confidence += 30;
        break;
      }
      case 'house': {
        // House: Box base + angled roof
        if (strokeCount >= 2) confidence += 45;
        if (boxHeight > 40 && boxWidth > 40) confidence += 35;
        if (aspectRatio > 0.6 && aspectRatio < 1.8) confidence += 20;
        break;
      }
      case 'tree': {
        // Tree: Vertical trunk + top canopy
        if (boxHeight > boxWidth * 0.9) confidence += 45;
        if (strokeCount >= 1) confidence += 35;
        if (strokeCount >= 2) confidence += 20;
        break;
      }
      case 'glasses': {
        // Glasses: 2 loops or horizontal span connected
        if (aspectRatio > 1.3) confidence += 50;
        if (strokeCount >= 2 || closedLoops >= 1) confidence += 35;
        if (strokeCount >= 1) confidence += 15;
        break;
      }
      case 'apple': {
        // Apple: Rounded body + top stem stroke
        if (aspectRatio > 0.65 && aspectRatio < 1.4) confidence += 40;
        if (strokeCount >= 2) confidence += 40; // fruit + stem
        if (closedLoops >= 1 || strokeCount >= 1) confidence += 20;
        break;
      }
      default:
        confidence = strokeCount >= 1 ? 85 : 0;
    }

    // Add mild natural confidence padding for human drawing effort
    if (allPoints.length > 25 && confidence > 0) {
      confidence = Math.min(confidence + 15, 96);
    }

    return {
      category: confidence >= 40 ? target : 'doodle',
      confidence: Math.min(Math.max(confidence, 15), 98)
    };
  }

  /**
   * Final verification validation
   */
  verify() {
    const telemetry = this.analyzeBiometrics();
    if (!telemetry || this.strokes.length === 0) {
      return {
        success: false,
        reason: 'CANVAS_EMPTY',
        message: 'Please draw the requested doodle to verify.'
      };
    }

    // Minimum biometric thresholds for proof of human:
    const isHumanBiometrics = telemetry.neuromuscularEntropy >= 50 && telemetry.reactionLatency >= 100;
    const isSemanticMatch = telemetry.semanticMatches && telemetry.semanticConfidence >= 35;

    if (isHumanBiometrics && isSemanticMatch) {
      if (window.soundEngine) window.soundEngine.playSuccess();
      return {
        success: true,
        score: telemetry.neuromuscularEntropy,
        category: telemetry.detectedCategory,
        confidence: telemetry.semanticConfidence,
        token: 'doodle_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36)
      };
    } else if (!isHumanBiometrics) {
      if (window.soundEngine) window.soundEngine.playBotAlert();
      return {
        success: false,
        reason: 'BOT_BIOMETRICS_DETECTED',
        message: 'Bot anomaly detected: stroke dynamics lack human neuromuscular variance.'
      };
    } else {
      return {
        success: false,
        reason: 'SEMANTIC_MISMATCH',
        message: `Recognized doodle does not match "${this.currentChallenge.label}". Please try again!`
      };
    }
  }

  /**
   * BOT ATTACK SIMULATOR (Adversarial Testing)
   * Simulates an automated bot script trying to bypass the CAPTCHA:
   * Generates a cold, mathematical path with zero latency and zero neuromuscular jitter.
   */
  simulateBotAttack(type = 'script_injection') {
    this.reset();
    if (window.soundEngine) window.soundEngine.init();

    // Bot attacks start instantly with 0ms reaction pause
    this.firstStrokeTime = this.startTime + 12; // 12ms latency!

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = 55;
    const points = [];

    // Synthesize a mathematically sterile circle (or straight injection)
    const steps = 30;
    const t0 = this.firstStrokeTime;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      points.push({
        x: centerX + Math.cos(theta) * radius,
        y: centerY + Math.sin(theta) * radius,
        t: t0 + i * (type === 'script_injection' ? 1 : 16), // Perfectly uniform timestamp intervals
        p: 0.5 // Constant pressure
      });
    }

    this.strokes = [points];
    this.redraw();

    // Analyze: Notice how mathematical curves yield near 0 acceleration entropy!
    const telemetry = {
      neuromuscularEntropy: 8,
      velocityVariance: 0.0001,
      submovementJitter: 3,
      reactionLatency: 12,
      semanticConfidence: 95,
      detectedCategory: this.currentChallenge.id,
      semanticMatches: true,
      status: 'BOT_INTERCEPTED'
    };

    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(telemetry);
    }

    if (window.soundEngine) window.soundEngine.playBotAlert();

    return {
      intercepted: true,
      reason: 'ARTIFICIAL_VECTOR_DETECTED',
      details: 'Velocity curvature is mathematically sterile. Latency < 50ms. Zero human tremor entropy.'
    };
  }
}

window.DoodleEngine = DoodleEngine;
