# Smart-Shelf: Collaborative Research Engine

🚀 A full-stack web application for researchers to discover, organize, and collaborate on open-access books with real-time updates and shared research notes.

## Features

- 🔍 **Advanced Book Discovery** - Search millions of books with filters (year, subject, availability)
- 📚 **Trello-Style Workspace** - Organize books in "To Read", "Reading", "Cited" columns with drag-and-drop
- 👥 **Real-Time Collaboration** - Invite team members and see updates instantly via WebSocket
- 📖 **Embedded Reader** - Read books directly with Google Books previewer
- 📝 **Research Notes** - Create Markdown notes attached to specific chapters/pages
- 💾 **Smart Caching** - 30-day cache for book metadata with automatic optimization

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Google Books API key

### Setup

1. **Clone and install**
```bash
cd server && npm install
cd ../client && npm install
```

2. **Create `.env` in server directory**
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
GOOGLE_BOOKS_API_KEY=your_api_key
```

3. **Start servers**
```bash
# Terminal 1 - Backend (from server folder)
npm start

# Terminal 2 - Frontend (from client folder)
npm run dev
```

4. **Open browser**
Visit http://localhost:5173

## Documentation

- 📖 **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Feature overview and API documentation
- 🧪 **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Comprehensive test cases and benchmarks
- 🛠️ **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Architecture, code examples, and best practices

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Socket.IO Client, dnd-kit

**Backend:** Node.js, Express, MongoDB, Socket.IO, JWT

**APIs:** Google Books API, Open Library API

## Project Structure

```
├── client/                 # React frontend
│   └── src/components/
│       ├── Reader/        # Book viewer with notes
│       ├── Workspace/     # Kanban board
│       ├── Searchbar/     # Discovery engine
│       └── Auth/          # Login/Register
│
└── server/                # Express backend
    └── src/
        ├── Controllers/   # Business logic
        ├── Models/        # MongoDB schemas
        ├── Router/        # API routes
        └── Config/        # Server config & Socket.IO
```

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Register new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/search?q=query` | Search books |
| POST | `/api/workspaces` | Create workspace |
| PATCH | `/api/workspaces/:id/move-card` | Move card |
| POST | `/api/workspaces/:id/collaborators` | Add collaborator |
| POST | `/api/notes` | Create research note |
| GET | `/api/notes/book/:volumeId` | Get book notes |

## Real-Time Features

- **Live Updates**: See workspace changes instantly
- **Collaborator Management**: Add/remove team members
- **Note Sharing**: All collaborators see notes in real-time
- **User Presence**: See who's currently active
- **Notifications**: Get notified of book additions and updates

## Performance

- ✅ Book search: **300-500ms** (first), **50-100ms** (cached)
- ✅ Real-time updates: **<100ms** latency
- ✅ Workspace load: **500-800ms**
- ✅ Smart caching: **30-day TTL** with automatic optimization

## Security

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control (owner/collaborator)
- ✅ Input validation on all endpoints
- ✅ CORS enabled

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request
