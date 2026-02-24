# StudyHive 🐝

A collaborative virtual study room platform that helps students study together, stay focused, and learn smarter using AI tools.

## Tech Stack

- **Frontend:** React.js + Tailwind CSS + Vite
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Real-time:** Socket.io
- **State Management:** React Context API
- **Charts:** Chart.js

## Features

✅ JWT Authentication & User Profiles  
✅ Create/Join Study Rooms with room codes  
✅ Real-time Group Chat via Socket.io  
✅ Shared Whiteboard with live sync  
✅ Pomodoro Focus Timer (synced across room)  
✅ Focus Score & Productivity Tracking  
✅ AI Quiz Generator from notes  
✅ AI Chat Summary  
✅ Study Session Scheduler  
✅ Leaderboard with badges & streaks  
✅ Notes & File Sharing  
✅ Toast Notifications  
✅ Dark/Light Mode  
✅ Responsive Design  

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

## Setup & Installation

### 1. Clone and install

```bash
# Backend
cd server
cp .env.example .env    # Edit with your MongoDB URI and secrets
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment variables

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studyhive   # or your Atlas URI
JWT_SECRET=your_secret_key_here
AI_API_KEY=your_openai_api_key                    # optional, for AI features
CLIENT_URL=http://localhost:5173
```

### 3. Run the application

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
StudyHive/
├── server/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routes
│   ├── socket/index.js       # Socket.io handlers
│   ├── uploads/              # File uploads
│   └── server.js             # Entry point
├── client/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # Auth, Theme, Socket contexts
│   │   ├── pages/            # Login, Signup, Dashboard, Room
│   │   ├── utils/api.js      # Axios config
│   │   └── App.jsx           # Router & providers
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/join` | Join by code |
| GET | `/api/rooms/discover` | Browse rooms |
| GET | `/api/messages/:roomId` | Get messages |
| POST | `/api/focus` | Record session |
| GET | `/api/focus/leaderboard` | Leaderboard |
| POST | `/api/ai/quiz` | Generate quiz |
| POST | `/api/ai/summary` | Summarize chat |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client → Server | Join a room |
| `leaveRoom` | Client → Server | Leave a room |
| `sendMessage` | Client → Server | Send message |
| `newMessage` | Server → Client | Receive message |
| `drawStroke` | Bidirectional | Whiteboard sync |
| `timerSync` | Bidirectional | Timer sync |
| `roomUsers` | Server → Client | Online users |
| `userJoined` | Server → Client | User joined |
| `userLeft` | Server → Client | User left |
