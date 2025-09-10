# Opus AI Transcriber Web App

A web application for transcribing Opus and OGG audio files using AssemblyAI's speech-to-text API.

## Features

- Upload Opus or OGG audio files via drag & drop or file picker
- German language transcription with speaker labels
- Modern, responsive UI built with React and Tailwind CSS
- Dockerized for easy deployment

## Deployment

### Using Docker Compose

1. Build and start the service:
   ```bash
   docker-compose up -d
   ```

2. The app will be available at:
   - Local: http://localhost:3846
   - Production: https://transcriber.valosoft.de (via Caddy reverse proxy)

### Manual Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/transcribe` - Transcribe audio file
  - Body: `{ "base64Audio": "data:audio/opus;base64,...", "mimeType": "audio/opus" }`
  - Response: `{ "transcription": "..." }`

- `GET /*` - Serve the React frontend

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js server
- **AI Service**: AssemblyAI API for transcription
- **Deployment**: Docker + Caddy reverse proxy

## Configuration

The app is configured to:
- Run on port 3000 inside the container
- Map to host port 3846
- Use German language transcription
- Include speaker labels and punctuation
- Handle files up to 50MB# opus-ai-transcriber
