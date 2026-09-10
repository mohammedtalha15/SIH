# 3D Warehouse — Engineer Onboarding Project

> Build an interactive 3D cargo warehouse visualization

Welcome to Belli AI! This onboarding project will get you hands-on with our product while building something visual and satisfying.

---

## 🎯 What You're Building

An interactive 3D model of a **cargo warehouse terminal** — inspired by [Narita Airport's Air Cargo Terminal](https://www.narita-airport.jp/en/), one of the world's busiest air cargo hubs.

**Your warehouse should include:**
- Cargo buildings and storage areas
- Roadways and vehicle paths
- Interactive elements (click to see info)
- Basic animations (cargo moving, doors opening)

Think of it like a miniature airport logistics simulator.

---

## 🏗️ Reference: Narita Air Cargo Terminal

Narita International Airport handles **60% of Japan's international air cargo** — about 2 million tons annually. The cargo area includes:

| Area | What Happens There |
|------|-------------------|
| **Cargo Buildings** | 8+ massive warehouses for sorting and storage |
| **Export Flow** | Products arrive by truck → customs → loaded onto aircraft |
| **Import Flow** | Aircraft unloads → customs inspection → sorted → shipped domestically |
| **Apron/Tarmac** | Where aircraft park for loading/unloading |
| **Internal Roads** | Forklifts and trucks move cargo between buildings |

Use this as inspiration — you don't need to recreate it exactly. Make it your own!

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start the app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your warehouse.

---

## 📁 Project Structure

```
3d_warehouse/
├── app/                    # Pages and layouts
├── components/
│   ├── canvas/             # 3D scene components
│   └── ui/                 # 2D overlays and controls
├── public/
│   └── models/             # 3D model files (.glb)
└── lib/                    # Utilities
```

---

## 🛠 Tech Stack

- **Next.js** — React framework
- **Three.js** — 3D graphics engine
- **React Three Fiber** — React bindings for Three.js
- **Drei** — Helpful 3D components
- **Tailwind CSS** — Styling

Don't worry if you're new to 3D — Cursor can help you figure it out as you go!

---

## ✅ When You're Done

1. Make sure your warehouse runs locally
2. Write a few notes about your approach in `NOTES.md`
3. Create a PR with a screenshot or screen recording
4. Tag your onboarding buddy for review

---

## ❓ Questions?

Reach out in **#engineering** on Slack or ping your onboarding buddy.

Happy building! 🏗️
