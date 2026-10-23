/**
 * DoodleCheck Drop-In Embeddable Widget
 * Clean API for developers to embed into forms, logins, and checkout pages.
 */

(function (window) {
  class DoodleCaptchaWidget {
    constructor(containerSelector, options = {}) {
      this.container = typeof containerSelector === 'string' 
        ? document.querySelector(containerSelector) 
        : containerSelector;

      this.options = Object.assign({
        theme: 'light',
        onVerify: null,
        onFail: null,
        autoResetOnFail: true
      }, options);

      this.engine = null;
      this.timerInterval = null;
      this.secondsRemaining = 0;
      this.verified = false;

      this.render();
    }

    render() {
      if (!this.container) return;

      this.container.innerHTML = `
        <div class="dc-widget-card border-4 border-slate-900 bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-5 max-w-md w-full select-none transition-all">
          <!-- Header Banner -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400 border-2 border-slate-900 text-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                ✏️
              </span>
              <div>
                <h3 class="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                  DoodleCheck <span class="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-indigo-300">v1.0</span>
                </h3>
                <p class="text-[11px] text-slate-500 font-medium">Proof of Humanity Through Play</p>
              </div>
            </div>

            <!-- Timer / Status Badge -->
            <div id="dc-timer-badge" class="flex items-center gap-1.5 bg-slate-100 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-800">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span id="dc-timer-text">READY</span>
            </div>
          </div>

          <!-- Prompt Box -->
          <div class="bg-amber-50 border-2 border-dashed border-amber-400 rounded-xl p-3 mb-3 text-center">
            <p class="text-xs uppercase font-bold text-amber-800 tracking-wider mb-0.5">Your Human Challenge</p>
            <div class="flex items-center justify-center gap-2">
              <span id="dc-challenge-emoji" class="text-2xl animate-bounce">🐱</span>
              <h2 id="dc-challenge-title" class="text-lg font-black text-slate-900">Draw a Cat</h2>
            </div>
            <p id="dc-challenge-hint" class="text-[11px] text-slate-500 mt-0.5 font-medium">Head + 2 pointy ears + whiskers</p>
          </div>

          <!-- Drawing Canvas -->
          <div class="relative bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-inner mb-3">
            <canvas id="dc-canvas" class="w-full h-52 block cursor-crosshair touch-none bg-radial from-slate-50 to-white"></canvas>

            <!-- Locked Screen Overlay (15s Time Expired) -->
            <div id="dc-locked-overlay" class="hidden absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-opacity z-20">
              <div class="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-xl font-black mb-1 animate-bounce">
                🔒
              </div>
              <h4 class="font-extrabold text-sm">Screen Locked</h4>
              <p class="text-[10px] text-rose-200 mt-0.5">15-second time limit expired</p>
              <button id="dc-btn-retry-locked" class="mt-2 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg transition">
                Try Again
              </button>
            </div>

            <!-- Success Overlay (Hidden by default) -->
            <div id="dc-success-overlay" class="hidden absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white transition-opacity z-30">
              <div class="w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black shadow-lg mb-2">
                ✓
              </div>
              <h4 class="font-extrabold text-lg">Human Verified!</h4>
              <p id="dc-verified-token" class="text-[11px] font-mono text-emerald-100 opacity-90 mt-1">Token: dc_89f72b_verified</p>
            </div>
          </div>

          <!-- Controls: Color & Actions -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-1">
              <button id="dc-btn-undo" title="Undo Stroke" class="p-1.5 border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 active:translate-y-0.5 rounded-lg text-xs font-bold text-slate-700 transition">
                ↩ Undo
              </button>
              <button id="dc-btn-clear" title="Clear Canvas" class="p-1.5 border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 active:translate-y-0.5 rounded-lg text-xs font-bold text-slate-700 transition">
                🗑 Clear
              </button>
              <button id="dc-btn-refresh" title="New Prompt" class="p-1.5 border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 active:translate-y-0.5 rounded-lg text-xs font-bold text-slate-700 transition">
                🔄 Reroll
              </button>
            </div>

            <!-- Sound Toggle -->
            <button id="dc-btn-sound" class="px-2 py-1 border-2 border-slate-900 bg-amber-200 hover:bg-amber-300 rounded-lg text-xs font-bold text-slate-800 transition">
              🔊 Sound On
            </button>
          </div>

          <!-- Submit Button -->
          <button id="dc-btn-verify" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-2">
            <span>✨ Verify I'm Human</span>
          </button>

          <!-- Feedback Status Toast -->
          <div id="dc-status-msg" class="hidden mt-2 p-2 rounded-lg text-xs font-bold text-center border-2"></div>
        </div>
      `;

      this.initEvents();
    }

    initEvents() {
      const canvasEl = this.container.querySelector('#dc-canvas');
      this.engine = new DoodleEngine(canvasEl, {
        brushColor: '#0f172a',
        brushSize: 4.5
      });

      this.updatePromptUI();

      // Undo, Clear, Reroll
      this.container.querySelector('#dc-btn-undo').addEventListener('click', () => {
        this.engine.undo();
      });

      this.container.querySelector('#dc-btn-clear').addEventListener('click', () => {
        this.engine.reset();
        this.unlockWidget();
        this.startTimer(15);
      });

      this.container.querySelector('#dc-btn-refresh').addEventListener('click', () => {
        this.engine.setChallenge();
        this.updatePromptUI();
      });

      const retryLockedBtn = this.container.querySelector('#dc-btn-retry-locked');
      if (retryLockedBtn) {
        retryLockedBtn.addEventListener('click', () => {
          this.engine.setChallenge();
          this.updatePromptUI();
        });
      }

      // Sound toggle
      const soundBtn = this.container.querySelector('#dc-btn-sound');
      soundBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          window.soundEngine.enabled = !window.soundEngine.enabled;
          soundBtn.innerText = window.soundEngine.enabled ? '🔊 Sound On' : '🔇 Muted';
        }
      });

      // Verify button
      const verifyBtn = this.container.querySelector('#dc-btn-verify');
      verifyBtn.addEventListener('click', () => {
        this.handleVerification();
      });
    }

    startTimer(seconds = 15) {
      clearInterval(this.timerInterval);
      this.secondsRemaining = seconds;
      this.updateTimerBadge();

      this.timerInterval = setInterval(() => {
        this.secondsRemaining--;
        this.updateTimerBadge();

        if (this.secondsRemaining <= 3 && this.secondsRemaining > 0) {
          if (window.soundEngine) window.soundEngine.playTick(true);
        } else if (this.secondsRemaining > 3) {
          if (window.soundEngine) window.soundEngine.playTick(false);
        }

        if (this.secondsRemaining <= 0) {
          clearInterval(this.timerInterval);
          this.lockWidget();
        }
      }, 1000);
    }

    updateTimerBadge() {
      const timerBadge = this.container.querySelector('#dc-timer-badge');
      const timerText = this.container.querySelector('#dc-timer-text');
      if (!timerText) return;

      timerText.innerText = `${this.secondsRemaining}s left`;
      if (this.secondsRemaining <= 3) {
        timerBadge.className = 'flex items-center gap-1.5 bg-rose-100 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-rose-800 animate-pulse';
      } else {
        timerBadge.className = 'flex items-center gap-1.5 bg-slate-100 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-800';
      }
    }

    lockWidget() {
      if (this.engine) this.engine.lock();
      const timerBadge = this.container.querySelector('#dc-timer-badge');
      const timerText = this.container.querySelector('#dc-timer-text');
      if (timerText) timerText.innerText = 'LOCKED (15s)';
      if (timerBadge) {
        timerBadge.className = 'flex items-center gap-1.5 bg-rose-100 border-2 border-slate-900 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-rose-800 animate-pulse';
      }

      const lockedOverlay = this.container.querySelector('#dc-locked-overlay');
      if (lockedOverlay) lockedOverlay.classList.remove('hidden');

      const verifyBtn = this.container.querySelector('#dc-btn-verify');
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      if (window.soundEngine) window.soundEngine.playBotAlert();
    }

    unlockWidget() {
      if (this.engine) this.engine.unlock();
      const lockedOverlay = this.container.querySelector('#dc-locked-overlay');
      if (lockedOverlay) lockedOverlay.classList.add('hidden');

      const verifyBtn = this.container.querySelector('#dc-btn-verify');
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    updatePromptUI() {
      const ch = this.engine.currentChallenge;
      this.container.querySelector('#dc-challenge-emoji').innerText = ch.emoji;
      this.container.querySelector('#dc-challenge-title').innerText = `Draw ${ch.label}`;
      this.container.querySelector('#dc-challenge-hint').innerText = ch.hint;

      const overlay = this.container.querySelector('#dc-success-overlay');
      if (overlay) overlay.classList.add('hidden');

      const msg = this.container.querySelector('#dc-status-msg');
      if (msg) msg.classList.add('hidden');

      this.unlockWidget();
      this.startTimer(ch.timeLimit || 15);
    }

    handleVerification() {
      if (this.verified) return;
      clearInterval(this.timerInterval);

      const result = this.engine.verify();
      const msgEl = this.container.querySelector('#dc-status-msg');
      msgEl.classList.remove('hidden');

      if (result.success) {
        this.verified = true;
        msgEl.className = 'mt-2 p-2 rounded-lg text-xs font-bold text-center border-2 bg-emerald-50 border-emerald-500 text-emerald-800';
        msgEl.innerText = `✓ Authenticated! Humanity score: ${result.score}%`;

        const overlay = this.container.querySelector('#dc-success-overlay');
        overlay.classList.remove('hidden');
        this.container.querySelector('#dc-verified-token').innerText = `Token: ${result.token}`;

        // Trigger confetti if available
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        }

        if (typeof this.options.onVerify === 'function') {
          this.options.onVerify(result);
        }
      } else {
        msgEl.className = 'mt-2 p-2 rounded-lg text-xs font-bold text-center border-2 bg-rose-50 border-rose-500 text-rose-800 animate-shake';
        msgEl.innerText = `✕ ${result.message}`;

        if (typeof this.options.onFail === 'function') {
          this.options.onFail(result);
        }
      }
    }
  }

  window.DoodleCaptchaWidget = DoodleCaptchaWidget;
})(window);
