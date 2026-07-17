# GhostTrack Driver App

The in-cab companion app for **GhostTrack** — an AI-powered blind-spot information system for Heavy Commercial Vehicles. This app puts live GPS navigation and real-time blind-spot camera footage on one screen, designed to work *with* GhostTrack's physical alert system, not replace it.

🔗 **Live app:** [Ahttps://ghosttrackdriveapp-git-7b2cba-leharinshainsha05-stacks-projects.vercel.app/]

---

## What This App Does

GhostTrack's core hardware (dual radar + dual camera + ESP32 fusion logic) already warns the driver of danger through a physical buzzer and directional LEDs — no screen required. This app is the **second-stage detail view**: it stays quiet during normal driving and only comes into focus once the hardware has already flagged something.

**The core idea:** the buzzer and LED tell the driver *where* to look. This app shows them *what's* there.

### Key Features

- **Live GPS navigation** — real-time driver location tracking with map auto-follow, built on Leaflet with CartoDB Dark Matter tiles for a dashboard-friendly dark theme
- **Turn-by-turn routing** — real road-based routes and directions via OSRM, with geocoding search so drivers can search for a destination by name/address
- **Dual camera feed panel** — live LEFT/RIGHT blind-spot camera thumbnails alongside the map
- **Alert-gated visibility** — camera thumbnails stay small and neutral by default; they highlight (yellow) or expand with a pulsing border (red) only when the corresponding side reports AWARENESS or CRITICAL, mirroring the physical LED color language
- **Driver Mode** — a fullscreen, edge-to-edge view (`isDriverMode` / `?driver=true`) for mounting a real phone/tablet in the truck cab
- **Developer Simulator Mode** — renders the UI inside a high-fidelity 19.5:9 smartphone bezel mockup for development and demos, without needing a physical device

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React](https://react.dev/) (v19) |
| Build tool | [Vite](https://vite.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) (glassmorphism UI) |
| Map engine | [Leaflet](https://leafletjs.com/) + CartoDB Dark Matter tiles |
| Routing | [OSRM](http://project-osrm.org/) via `leaflet-routing-machine` |
| Live location | Browser Geolocation API |

---

## Design Philosophy

This app deliberately does **not** try to be a constant-attention dashboard. It follows the same principle as GhostTrack's physical hardware: an *active* safety system should ask for driver attention only when something actually warrants it.

- Navigation is the dominant, default use of the screen at all times
- Camera feeds are secondary and passive until an alert is live
- The haptic buzzer and LED remain the primary alert — this app never carries sound or vibration, so the safety system still works even without the phone
- Alert visuals auto-resolve — no manual dismissal needed; the UI shrinks back the moment the hazard clears, just like the physical LED does

---

## Getting Started

```bash
# install dependencies
npm install

# run the dev server
npm run dev

# build for production
npm run build
```

### Environment / Config Notes

- Camera feed and alert-state data are expected from the GhostTrack hardware stack (Raspberry Pi MJPEG stream + ESP32 fused alert state) over the local network
- Routing defaults to OSRM's public demo server — for production/demo-day reliability, consider self-hosting an OSRM instance if rate limits become an issue

---

## Project Structure

```
├── public/              # static assets
├── src/                 # app source (components, hooks, map logic)
├── index.html           # main entry
├── server.py            # local dev/utility server
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Part of the GhostTrack Ecosystem

This app is the driver-facing companion to the main GhostTrack hardware system — dual radar, dual camera (YOLO), ESP32 sensor fusion, directional LEDs, and haptic feedback. See the main GhostTrack technical documentation for the full system architecture.

**Team:** GhostTruck
- S Leharin Nisha — Lead Creator & System Architect
- Rajamaran — Hardware Prototyping Contributor
- Sumith — Hardware Prototyping Contributor
