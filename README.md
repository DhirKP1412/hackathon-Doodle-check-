# ✏️ DoodleCheck — Proof of Humanity Through Play

DoodleCheck replaces frustrating puzzle grids and distorted text with a quick, creative doodle. Our Neuromuscular Biometric Engine analyzes sub-movement tremor, minimum-jerk acceleration curves, and organic stroke cadence in real time to differentiate human users from automated bots.

---

## 💡 The Core Thesis

Traditional CAPTCHAs are broken:
1. **AI Solves Traditional Puzzles Better Than Humans:** Modern Multimodal LLMs and Vision Models detect crosswalks, stairs, and distorted text with 99.8% accuracy.
2. **High Friction:** They are frustrating, aesthetically disruptive, and cause drop-offs on e-commerce checkouts and logins.
3. **Surveillance-Based:** Traditional invisible CAPTCHAs track user cookies, browsing history, and IP reputation across domains.

**DoodleCheck flips the script:**
Instead of testing humans on robot tasks, we test humans on what AI bots **cannot fake**:
- **Neuromuscular Tremor Entropy:** Biological muscles produce physiological tremor (8–12 Hz) and non-linear deceleration curves at corners (Fitts's Law).
- **Spontaneous Imperfection:** AI produces sterile, mathematically smooth paths or instantaneous vectors. Humans draw charmingly flawed doodles.
- **Cognitive Reaction Latency:** Real humans pause 250–600ms before drawing to perceive and plan. Bots act immediately.

---

## 🚀 How to Run Locally

```bash
cd "C:\Users\LapTop2\.gemini\antigravity\scratch\doodle-check"
python server.py
```
This automatically starts a local server on `http://localhost:8000` and opens it in your default web browser.

---

## 📦 Developer Integration

Include DoodleCheck on any website with 3 lines of JavaScript:

```html
<!-- 1. Include DoodleCheck Bundle -->
<script src="doodlecheck-widget.js"></script>

<!-- 2. Mount Container -->
<div id="doodle-captcha"></div>

<!-- 3. Initialize with Callback -->
<script>
  new DoodleCaptchaWidget('#doodle-captcha', {
    onVerify: (result) => {
      console.log('Human verified! Token:', result.token);
      document.getElementById('submit-btn').disabled = false;
    }
  });
</script>
```

---

## 🛠️ Project Structure

```
doodle-check/
├── index.html            # Showcase landing page & live sandbox
├── styles.css            # Neobrutalist design system & responsive styling
├── doodle-engine.js      # Core canvas drawing, biometric telemetry & semantic classifier
├── doodlecheck-widget.js # Standalone, drop-in embeddable widget component
├── audio-synth.js        # Pure Web Audio API sound synthesizer (zero external mp3s)
├── app.js                # App orchestration & telemetry bindings
├── server.py             # Local development server with auto-launch
└── README.md             # Project documentation
```
