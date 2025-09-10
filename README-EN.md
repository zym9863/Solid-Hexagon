# Rotating Hexagon Bouncing Ball 🎮

> **语言 / Language**: [中文](README.md) | [English](README-EN.md)

A physics engine simulation game built with Solid.js, demonstrating gravity, friction, and elastic collision effects.

## ✨ Features

- 🎯 Real-time physics engine simulation
- ⚙️ Adjustable physics parameters (gravity, friction, elasticity)
- 🎮 Interactive control panel
- 📊 Real-time trajectory display
- ⏸️ Pause/resume animation
- 🔄 Reset functionality
- 📱 Responsive design

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Build for Production

```bash
npm run build
```

The build files will be output to the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 🎮 How to Use

- **Adjust Sliders**: Real-time modification of physics parameters like gravity, friction, and elasticity
- **Pause/Resume**: Click the button to control animation playback
- **Reset**: Restart the simulation
- **Trajectory Display**: Toggle ball movement trajectory on/off

## 🛠️ Tech Stack

- **Framework**: [Solid.js](https://solidjs.com) - High-performance reactive UI framework
- **Build Tool**: [Vite](https://vitejs.dev) - Fast build tool
- **Language**: TypeScript - Type-safe JavaScript
- **Physics Engine**: Custom-implemented 2D physics engine

## 📁 Project Structure

```
src/
├── components/          # Components directory
│   └── BouncingBall.tsx # Main bouncing ball component
├── App.tsx             # Main app component
├── App.css             # Style file
└── index.tsx           # Application entry point
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview build result

### Technical Details

This project implements a simple but complete 2D physics engine, including:

- Gravity system
- Collision detection (hexagonal boundaries)
- Elastic collision response
- Friction calculation
- Real-time parameter adjustment

## 🚀 Deployment

Learn more about deployment at [Vite Deployment Documentation](https://vite.dev/guide/static-deploy.html)

## 📚 Learn More

- [Solid.js Website](https://solidjs.com) - Learn about the Solid.js framework
- [Solid.js Discord](https://discord.com/invite/solidjs) - Join community discussions