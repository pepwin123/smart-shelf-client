
# Smart-Shelf: Collaborative Research Engine

🚀 A full-stack web application for researchers to discover, organize, and collaborate on open-access books with real-time updates, shared research notes, and advanced reading features.


## Features

- 🔍 **Advanced Book Discovery**: Search millions of books with filters (year, subject, availability)
- 📚 **Trello-Style Workspace**: Organize books in "To Read", "Reading", "Cited" columns with drag-and-drop
- 👥 **Real-Time Collaboration**: Invite team members and see updates instantly via WebSocket
- 📖 **Embedded Reader**: Read books directly with Google Books previewer or local file preview (PDF, TXT, MD)
- 📝 **Research Notes**: Create Markdown notes attached to specific chapters/pages
- 💾 **Smart Caching**: 30-day cache for book metadata with automatic optimization
- 🗂️ **Local File Support**: Upload and preview local PDF and text files in the reader
- 🧩 **Custom Reader Hooks**: Modular hooks for Google Books and local file preview logic

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

**APIs:** Google Books API


## Project Structure

```
├── client/                 # React frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── api/            # API utilities
│       ├── assets/         # Images and icons
│       ├── components/
│       │   ├── Reader/         # Book viewer, Google Books integration, local file preview
│       │   │   ├── useReaderHooks.js  # Custom hooks for Google Books and local file preview
│       │   │   ├── ReaderViewport.jsx # Main reader viewport UI
│       │   │   └── ...
│       │   ├── Workspace/      # Kanban board
│       │   ├── Searchbar/      # Book search and results
│       │   └── Auth/           # Login/Register
│       └── App.jsx, main.jsx   # App entry points
│
└── server/                # Express backend
    └── src/
        ├── Controllers/   # Business logic
        ├── Middleware/    # Auth and error handling
        ├── Models/        # MongoDB schemas
        ├── Router/        # API routes
        ├── Config/        # Server config & Socket.IO
        └── __tests__/     # Backend tests
```
## Reader Component & Hooks

The `Reader` feature supports both Google Books previews and local file previews (PDF, TXT, MD, LOG). It uses custom hooks for modular logic:

- **useReaderHooks.js**
    - `useGoogleBooksViewer`: Handles Google Books Embedded Viewer initialization, loading, and cleanup.
    - `useLocalFilePreview`: Fetches and previews local text files (txt, md, log) for uploaded books.
- **ReaderViewport.jsx**: Displays the viewer, local file preview, loading/error states, and fallback book info.

**How it works:**
- If a Google Books preview is available, it is embedded in the app.
- If a local file (PDF or text) is uploaded, it is previewed directly in the reader.
- Loading and error states are handled for a smooth user experience.

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Register new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/search?q=query` | Search books |
| POST | `/api/workspaces` | Create workspace |
| PATCH | `/api/workspaces/:id/move-card` | Move card between columns |
| POST | `/api/workspaces/:id/collaborators` | Add collaborator to workspace |
| POST | `/api/notes` | Create research note |
| GET | `/api/notes/book/:volumeId` | Get notes for a book |

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


## License

This project is licensed under the MIT License.
