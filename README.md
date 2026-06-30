# 🌿 Cleanity

> **Hyperlocal Community Problem Solver** — Empowering citizens to identify, report, validate, track, and resolve local community hazards and infrastructural challenges through collaboration, spatial data, and intelligent automation.

---

## 📋 Table of Contents
- [📖 Problem Statement](#-problem-statement)
- [✨ Solution Overview](#-solution-overview)
- [🚀 Key Features](#-key-features)
- [🛠️ Technologies Used](#️-technologies-used)
- [🌐 Google Technologies Utilized](#-google-technologies-utilized)
- [💻 Setup & Installation](#-setup--installation)
- [🏛️ Architecture & Database Structure](#-architecture--database-structure)

---

## 📖 Problem Statement
**Challenge Category:** *Community Hero - Hyperlocal Problem Solver*

Communities frequently face issues such as potholes, water leakages, damaged streetlights, waste management concerns, and public infrastructure challenges. However, the process of reporting and resolving these problems is typically:
- **Fragmented:** Citizens don't know where or whom to report issues to.
- **Opaque:** There is zero visibility into whether municipal authorities have received or are acting on a report.
- **Unverified:** Spam reports or outdated issues clutter city databases, wasting public resources.
- **Disengaged:** Citizens feel isolated from their local governance, leading to low participation.

---

## ✨ Solution Overview
**Cleanity** bridges the gap between active citizens and local governance. It is a full-stack, real-time civic portal designed to crowdsource community issue reporting with high spatial accuracy and absolute transparency. 

By combining a clean, high-contrast interactive map with **server-side Gemini AI**, Cleanity automates the triage process:
1. **Report & Auto-Categorize:** Citizens upload an image/description; Gemini automatically determines the hazard category, coordinates, severity, and suggested action.
2. **Community Ground-Truth Validation:** Peer validation through upvoting and physical inspections keeps data pristine.
3. **Gamified Citizenship:** Users earn XP, rise in levels, and gain active-citizen badges (e.g., *Hazard Spotter*, *Cleanity Pillar*) to drive continuous engagement.
4. **Predictive Analytics Dashboard:** Municipal authorities gain access to hotspot detection and predictive insights generated dynamically by AI analyzing cumulative municipal trends.

---

## 🚀 Key Features

### 🗺️ Precision Mapping & Reverse Geocoding
- **Interactive Leaflet Map:** Clean, high-contrast municipal coordinates overlay utilizing CARTO Voyager maps (zero unnecessary noise or gradients).
- **Point-and-Click Reporting:** Drag pins or tap directly on the map to automatically retrieve human-readable addresses via OpenStreetMap (Nominatim).

### 🤖 Server-Side Gemini AI Triage
- **Smart Report Auto-Fill:** Analyze text descriptions dynamically using `gemini-3.5-flash` to extract precise categorization, severity rankings, and municipal action items instantly.
- **Predictive Spotting:** City dashboards leverage Gemini to process historical reports and generate spatial forecasts, prioritizing where municipal crews should deploy next.

### 🏆 Gamified Civic Engagement
- **Dynamic XP Engine:** Citizens earn experience points (XP) for reporting, voting, verifying, and resolving issues.
- **Visual Milestones:** Interactive level-ups with custom community honor badges like *Hazard Spotter*, *Cleanity Pillar*, and *Eagle Eye*.
- **Streaks System:** Incentivizes daily checks and local problem-solving.

### 📊 Comprehensive Impact Dashboards
- **Visual Analytics:** Interactive municipal charts (powered by Recharts) detailing status breakdowns, priority distributions, and neighborhood resolution rates.
- **Real-Time Issue Timelines:** Audit logs showing every single transition from *Reported* ➔ *Under Review* ➔ *In Progress* ➔ *Resolved*, absolute accountability at every stage.

---

## 🛠️ Technologies Used

### Frontend
- **React 18 & Vite:** High-performance, lightning-fast Single Page Application (SPA) architecture.
- **Tailwind CSS:** Exceptionally clean, high-contrast, responsive visual system utilizing professional off-white/charcoal tones.
- **Framer Motion:** Smooth micro-interactions, layout transitions, and fluid page states.
- **Leaflet:** Interactive map rendering for coordinate tracking and pin placement.
- **Recharts & Lucide React:** Data-driven municipal visualizations and crisp vector iconography.

### Backend
- **Express & Node.js (TypeScript):** Highly robust REST API backend compiling safely down to clean Node CommonJS at build-time.
- **Full-Stack Proxying:** Secure server-side routing ensures all external APIs and sensitive keys are guarded completely from the browser.

---

## 🌐 Google Technologies Utilized

### 🧠 Gemini API (`gemini-3.5-flash`)
Cleanity utilizes the **official, modern `@google/genai` TypeScript SDK** on the server side to perform complex data triaging and predictive forecasting.

1. **Automated Classification Endpoint (`/api/gemini/analyze`):**
   When a user writes an issue description, Gemini parses it to return structured JSON containing:
   - **Category:** Waste Management, Roads, Water & Sewage, Power & Lighting, Public Facilities, or Hazards.
   - **Severity:** Low, Medium, High, or Critical.
   - **Suggested Actions:** Real-time instructions for municipal dispatch crews.

2. **Predictive Analytics Engine (`/api/gemini/insights`):**
   Gemini parses all municipal reports dynamically, identifying trends (e.g., repeating sewage issues in specific quadrants) and generating proactive, actionable summaries for community organizers.

*All key actions are performed server-side with zero key exposure, providing a highly secure production-grade architecture.*

---

## 💻 Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Set Up Environment Variables
Create a `.env` file in the root directory (using `.env.example` as a template):
```env
# Required for Gemini AI analysis and predictive forecasting
GEMINI_API_KEY="your_google_gemini_api_key"

# Self-referential URL for dev hosting
APP_URL="http://localhost:3000"
```

### 3. Installation & Local Development
```bash
# Install package dependencies
npm install

# Run the full-stack development server (Express + Vite Proxy)
npm run dev
```
The application will boot on **http://localhost:3000** automatically handling both backend API endpoints and hot-reloading frontend assets.

### 4. Build for Production
To bundle both the compiled React client and the Node backend for production deployment:
```bash
npm run build
```
This produces:
- A fully compiled static frontend in `dist/`
- A bundled, self-contained server script in `dist/server.cjs`

To launch:
```bash
npm run start
```

---

## 🏛️ Architecture & Database Structure
- **`server.ts`**: Express backend containing custom middleware proxying, Gemini API clients, reverse geocoding integrations, and mock-database fallbacks.
- **`src/App.tsx`**: Primary user interface managing state, gamification dashboards, municipal statistics, and main views.
- **`src/components/InteractiveMap.tsx`**: Modular map container rendering geographic pins, popups, and click-to-pin location capture.
- **`src/components/GridBackgroundAnimation.tsx`**: Elegant municipal coordinate matrix animation supporting the minimalist visual theme.

---

*Cleanity was designed with clean aesthetics, zero cluttered telemetry, and robust full-stack logic to make our cities a cleaner, safer, and better place to live.*
