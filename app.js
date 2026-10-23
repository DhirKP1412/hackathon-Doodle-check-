/**
 * DoodleCheck Showcase App Controller
 * Connects the live engine to telemetry meters, bot simulator, and demo integrations.
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvasEl = document.getElementById('main-canvas');
  if (!canvasEl) return;

  // Initialize Doodle Engine
  const engine = new DoodleEngine(canvasEl, {
    brushColor: '#0f172a',
    brushSize: 4.5
  });

  // UI Element References
  const promptEmoji = document.getElementById('prompt-emoji');
  const promptTitle = document.getElementById('prompt-title');
  const promptHint = document.getElementById('prompt-hint');
  const timerBadge = document.getElementById('timer-display');
  const overlaySuccess = document.getElementById('overlay-success');
  const overlayLocked = document.getElementById('overlay-locked');
  const btnUnlockRetry = document.getElementById('btn-unlock-retry');
  const verifiedTokenText = document.getElementById('verified-token-text');
  const statusToast = document.getElementById('status-toast');

  // Telemetry Dashboard References
  const meterEntropy = document.getElementById('meter-entropy');
  const valEntropy = document.getElementById('val-entropy');
  const meterJitter = document.getElementById('meter-jitter');
  const valJitter = document.getElementById('val-jitter');
  const meterVelocity = document.getElementById('meter-velocity');
  const valVelocity = document.getElementById('val-velocity');
  const meterLatency = document.getElementById('meter-latency');
  const valLatency = document.getElementById('val-latency');
  const meterSemantic = document.getElementById('meter-semantic');
  const valSemantic = document.getElementById('val-semantic');
  const badgeOverallStatus = document.getElementById('badge-overall-status');

  // Action Buttons
  const btnVerify = document.getElementById('btn-verify');
  const btnClear = document.getElementById('btn-clear');
  const btnUndo = document.getElementById('btn-undo');
  const btnReroll = document.getElementById('btn-reroll');
  const btnSound = document.getElementById('btn-sound');

  let countdownTimer = null;
  let timeLeft = 15;
  let isVerified = false;

  // Update Challenge UI
  function updateChallengeUI() {
    const ch = engine.currentChallenge;
    promptEmoji.innerText = ch.emoji;
    promptTitle.innerText = `Draw ${ch.label}`;
    promptHint.innerText = ch.hint;

    overlaySuccess.classList.add('hidden');
    if (overlayLocked) overlayLocked.classList.add('hidden');
    statusToast.classList.add('hidden');
    isVerified = false;
    btnVerify.disabled = false;
    btnVerify.classList.remove('opacity-50', 'cursor-not-allowed');

    engine.unlock();
    startCountdown(ch.timeLimit || 15);
  }

  // Countdown Timer
  function startCountdown(seconds) {
    clearInterval(countdownTimer);
    timeLeft = seconds;
    updateTimerText();

    countdownTimer = setInterval(() => {
      timeLeft--;
      updateTimerText();

      if (timeLeft <= 3 && timeLeft > 0) {
        if (window.soundEngine) window.soundEngine.playTick(true);
      } else if (timeLeft > 3) {
        if (window.soundEngine) window.soundEngine.playTick(false);
      }

      if (timeLeft <= 0) {
        clearInterval(countdownTimer);
        timerBadge.innerText = 'LOCKED (15s)';
        timerBadge.className = 'px-2.5 py-1 bg-rose-100 border-2 border-slate-900 rounded-xl text-xs font-mono font-bold text-rose-700 animate-pulse';

        // Lock drawing screen
        engine.lock();
        if (overlayLocked) overlayLocked.classList.remove('hidden');

        btnVerify.disabled = true;
        btnVerify.classList.add('opacity-50', 'cursor-not-allowed');

        if (window.soundEngine) window.soundEngine.playBotAlert();
      }
    }, 1000);
  }

  function updateTimerText() {
    timerBadge.innerText = `${timeLeft}s left`;
    if (timeLeft <= 3) {
      timerBadge.className = 'px-2.5 py-1 bg-rose-100 border-2 border-slate-900 rounded-xl text-xs font-mono font-bold text-rose-800 animate-pulse';
    } else if (timeLeft <= 6) {
      timerBadge.className = 'px-2.5 py-1 bg-amber-100 border-2 border-slate-900 rounded-xl text-xs font-mono font-bold text-amber-800 animate-pulse';
    } else {
      timerBadge.className = 'px-2.5 py-1 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs font-mono font-bold text-slate-800';
    }
  }

  // Real-time telemetry receiver
  engine.onTelemetryUpdate = (telemetry) => {
    // Neuromuscular Entropy
    valEntropy.innerText = `${telemetry.neuromuscularEntropy}%`;
    meterEntropy.style.width = `${telemetry.neuromuscularEntropy}%`;

    // Submovement Jitter
    valJitter.innerText = `${telemetry.submovementJitter} Hz`;
    meterJitter.style.width = `${Math.min(telemetry.submovementJitter, 100)}%`;

    // Velocity Variance
    valVelocity.innerText = telemetry.velocityVariance;
    meterVelocity.style.width = `${Math.min(telemetry.velocityVariance * 800, 100)}%`;

    // Latency
    valLatency.innerText = `${telemetry.reactionLatency} ms`;
    meterLatency.style.width = `${Math.min((telemetry.reactionLatency / 1000) * 100, 100)}%`;

    // Semantic Match
    valSemantic.innerText = `${telemetry.semanticConfidence}% (${telemetry.detectedCategory || 'analyzing'})`;
    meterSemantic.style.width = `${telemetry.semanticConfidence}%`;

    // Overall Status
    if (telemetry.status === 'BOT_INTERCEPTED') {
      badgeOverallStatus.innerText = '🚨 BOT DETECTED';
      badgeOverallStatus.className = 'px-3 py-1 bg-rose-500 text-white font-mono font-black text-xs rounded-full border-2 border-slate-900';
    } else if (telemetry.neuromuscularEntropy >= 50) {
      badgeOverallStatus.innerText = '👤 HUMAN DYNAMICS';
      badgeOverallStatus.className = 'px-3 py-1 bg-emerald-500 text-white font-mono font-black text-xs rounded-full border-2 border-slate-900';
    } else {
      badgeOverallStatus.innerText = '⏳ ANALYZING STROKES';
      badgeOverallStatus.className = 'px-3 py-1 bg-amber-400 text-slate-900 font-mono font-black text-xs rounded-full border-2 border-slate-900';
    }
  };

  // Bind Buttons
  btnUndo.addEventListener('click', () => engine.undo());
  
  btnClear.addEventListener('click', () => {
    engine.reset();
    engine.unlock();
    if (overlayLocked) overlayLocked.classList.add('hidden');
    statusToast.classList.add('hidden');
    btnVerify.disabled = false;
    btnVerify.classList.remove('opacity-50', 'cursor-not-allowed');
    startCountdown(15);
  });

  btnReroll.addEventListener('click', () => {
    engine.setChallenge();
    updateChallengeUI();
  });

  if (btnUnlockRetry) {
    btnUnlockRetry.addEventListener('click', () => {
      engine.setChallenge();
      updateChallengeUI();
    });
  }

  btnSound.addEventListener('click', () => {
    if (window.soundEngine) {
      window.soundEngine.enabled = !window.soundEngine.enabled;
      btnSound.innerText = window.soundEngine.enabled ? '🔊 Sound On' : '🔇 Muted';
    }
  });

  // Verify Action
  btnVerify.addEventListener('click', () => {
    if (isVerified) return;
    clearInterval(countdownTimer);

    const result = engine.verify();
    statusToast.classList.remove('hidden');

    if (result.success) {
      isVerified = true;
      statusToast.className = 'mt-3 p-3 rounded-xl border-2 border-emerald-600 bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-between shadow-sm';
      statusToast.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-xl">🎉</span>
          <div>
            <div class="font-black text-emerald-950">Proof of Humanity Verified!</div>
            <div class="text-xs text-emerald-800">Entropy Score: ${result.score}% | Category: ${result.category} (${result.confidence}%)</div>
          </div>
        </div>
        <span class="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg font-mono">TOKEN ISSUED</span>
      `;

      overlaySuccess.classList.remove('hidden');
      verifiedTokenText.innerText = result.token;
      btnVerify.disabled = true;
      btnVerify.classList.add('opacity-50', 'cursor-not-allowed');

      if (window.confetti) {
        window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      statusToast.className = 'mt-3 p-3 rounded-xl border-2 border-rose-600 bg-rose-100 text-rose-900 font-bold text-sm flex items-center gap-2 shadow-sm animate-shake';
      statusToast.innerHTML = `
        <span class="text-xl">⚠️</span>
        <div>
          <div class="font-black text-rose-950">Verification Failed</div>
          <div class="text-xs text-rose-800">${result.message}</div>
        </div>
      `;
    }
  });

  // E-Commerce Ticketmaster Demo Modal
  const btnOpenModalDemo = document.getElementById('btn-open-modal-demo');
  const demoModal = document.getElementById('demo-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalWidgetContainer = document.getElementById('modal-widget-container');
  const successEl = document.getElementById('demo-checkout-success');
  let modalWidgetInstance = null;

  function closeModal() {
    if (demoModal) {
      demoModal.classList.add('hidden');
      demoModal.classList.remove('flex');
    }
    if (modalWidgetInstance && modalWidgetInstance.timerInterval) {
      clearInterval(modalWidgetInstance.timerInterval);
    }
  }

  if (btnOpenModalDemo && demoModal) {
    btnOpenModalDemo.addEventListener('click', () => {
      // 1. Show the modal
      demoModal.classList.remove('hidden');
      demoModal.classList.add('flex');

      // 2. Reset the success display and show widget container
      if (successEl) successEl.classList.add('hidden');
      if (modalWidgetContainer) modalWidgetContainer.classList.remove('hidden');

      // 3. Clear existing widget container and initialize fresh instance each time
      modalWidgetContainer.innerHTML = '';
      modalWidgetInstance = new DoodleCaptchaWidget(modalWidgetContainer, {
        onVerify: (res) => {
          setTimeout(() => {
            if (successEl) successEl.classList.remove('hidden');
            if (modalWidgetContainer) modalWidgetContainer.classList.add('hidden');
          }, 800);
        }
      });
    });

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', closeModal);
    }

    // Close when clicking background outside the modal card
    demoModal.addEventListener('click', (e) => {
      if (e.target === demoModal) {
        closeModal();
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !demoModal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  // Initial load
  updateChallengeUI();
});
