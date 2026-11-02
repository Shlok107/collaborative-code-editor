# Real-Time Collaborative Code Editor

A small full-stack experiment in multi-user code editing using Monaco Editor, React, FastAPI, and WebSockets.

> **Project status:** Early MVP / learning project. The current implementation supports joining a room, broadcasting editor text updates, and displaying connected usernames. Cursor positions are sent and displayed as text, but remote cursor decorations are not rendered inside Monaco. There is no operational-transform or CRDT layer, persistence, authentication, or production deployment configuration.

## Current functionality

- Join a room using a username and room ID.
- Edit code in the Monaco editor.
- Broadcast code-change messages to other WebSocket connections in the same room.
- Broadcast the current room's connected-user list.
- Send cursor-position messages and show received cursor coordinates in a separate panel.

## Technology

| Layer | Technologies |
|---|---|
| Frontend | React, Create React App, Monaco Editor |
| Backend | Python, FastAPI, Uvicorn |
| Realtime transport | WebSockets |
| State | In-memory room and connection state |

## Run locally

### Prerequisites

- Python 3.10+ (or a compatible Python version)
- Node.js and npm

### 1. Start the backend

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

The frontend currently connects to `ws://127.0.0.1:8001/ws/{room_id}`. That address is hardcoded in the client and must be changed for a different host or deployment.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000 in a browser. Open a second browser window, join the same room with a different username, and try editing code.

## Message flow

The browser opens a WebSocket connection for a room. The backend's in-memory connection manager stores active sockets by room ID and broadcasts received messages to the room. A separate user-list message is broadcast when a connection joins or disconnects.

## Known limitations and next steps

- **No persistence:** Room contents and membership exist only in backend memory and are lost when the process restarts.
- **Single-process state:** The in-memory connection manager does not coordinate across multiple backend workers or instances.
- **No conflict-resolution algorithm:** Simultaneous edits are broadcast as whole document values; there is no OT or CRDT synchronization.
- **Remote cursors are incomplete:** Cursor coordinates are displayed in a panel rather than rendered as Monaco decorations.
- **No authentication or authorization:** Room IDs and usernames are not protected by an identity system.
- **No production WebSocket configuration:** The frontend URL is hardcoded to localhost and uses `ws://`.
- **No automated test suite is currently documented.**

## Repository layout

```text
backend/
  app/
    main.py
    websocket/
      manager.py
frontend/
  src/
    App.js
```

## License

No license file is currently included. All rights are reserved by default unless a license is added by the repository owner.
