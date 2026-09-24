<div align="center">
  <img src="public/favicon.ico" width="80" alt="EMO Logo" style="border-radius: 12px; margin-bottom: 8px;" />
  <h1>EMO Application</h1>
  <p><strong>A Next-Generation Emotional Intelligence & Visual Tracking Interface</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)](https://threejs.org/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

<br/>

## 🌌 Overview
EMO is a highly-interactive web application designed to help users track, understand, and share their emotional state natively in the browser. Utilizing biometric facial tracking and a dynamic WebGL particle engine, the platform transforms abstract human emotion into a fluid, responsive 3D visual language. 

## ✨ Key Features
- **Live Facial Tracking (`face-api.js` + WebAssembly):** Captures multi-point metrics natively in the client to determine Valence (Pleasantness) and Energy (Arousal) using zero server dependencies.
- **WebGL Emotion Engine:** A custom physics-based `Three.js` particle orb that alters color gradients, physical bounds, and drift speeds dynamically based on your direct emotional inputs.
- **Composite Report Cards:** A built-in Canvas generation tool that binds your webcam snapshot, emotion parameters, and visual sphere into one monolithic PNG for easy sharing.
- **Dynamic Local Storage mapping:** Localized check-in tracking built into an interactive monthly flow calendar.
- **Community Feeds:** Opt-in anonymous boards for observing global emotions in real-time.

## 🛠️ Technology Stack
- **Framework:** Next.js 14, React 18, TypeScript
- **Styling & Animation:** Tailwind CSS, Framer Motion
- **3D / Graphics:** Three.js, HTML5 Canvas API
- **AI Processing:** `face-api.js`, ONNX Runtime Web

## 🚀 Quick Start
```bash
# Clone this repository
git clone https://github.com/ketarora/EMO.git

# Navigate into the project
cd EMO

# Install essential dependencies
npm install

# Spin up the development server
npm run dev
```

## 🔒 Privacy & Architecture
- **Zero-Server Tracking:** Facial analysis models are compressed securely onto the client. No images or streams are ever sent to an external server.
- **Engine Control:** The core emotion physics engine is abstracted in `EmoEngine.ts`, which safely controls all rendering and dynamic parameter lerping without locking the main thread.
