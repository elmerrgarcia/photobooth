# PhotoBooth Application

A production-ready photobooth application similar to dslrBooth, built with Electron + React + TypeScript.

## Features

- **Live Camera Preview**: Real-time webcam preview with countdown timer
- **Multi-Photo Sessions**: Support for 1-4 photos per session
- **Template System**: Photo strips, collages, and single photo layouts
- **Delivery Options**: Print, email, USB save, and QR code sharing
- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Kiosk Mode**: Fullscreen operation for photobooth deployments

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron
- **Build**: Webpack + TypeScript
- **Image Processing**: Sharp, Canvas API
- **Styling**: CSS with modern features

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Package application:
   ```bash
   npm run package
   ```

## Project Structure

```
src/
├── main/           # Electron main process
│   └── main.ts
├── renderer/       # React frontend
│   ├── components/
│   ├── screens/
│   ├── App.tsx
│   └── index.tsx
└── shared/         # Shared types and utilities
```

## Usage

1. **Welcome Screen**: Click "Start Photo Session"
2. **Options Screen**: Choose number of photos and template style
3. **Preview Screen**: Capture photos with countdown timer
4. **Delivery Screen**: Choose how to receive your photos

## Development

The application uses separate webpack configurations for the main Electron process and the React renderer process. This allows for hot reloading during development.

### Scripts

- `npm run dev`: Start development servers for both processes
- `npm run build`: Build for production
- `npm run start`: Run the built application
- `npm run package`: Create distributable packages

## Roadmap

- [ ] DSLR camera support via gPhoto2
- [ ] Green screen/chroma key functionality
- [ ] Advanced template editor
- [ ] Admin dashboard
- [ ] Social media integration
- [ ] GIF and boomerang support
- [ ] Multi-station synchronization

## License

MIT
