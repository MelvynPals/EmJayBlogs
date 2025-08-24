# EmJayBlogs

Full‑stack blogging & social reading platform built with **React (Vite)** on the frontend and **Node.js / Express / MongoDB** on the backend. It combines long‑form posts with lightweight social features: reactions (multi‑type), favorites, follows, user profiles with cover + avatar, rich search across posts & users, and an admin panel.

## Features

- Create, edit, delete posts with cover image upload
- Rich post view with hero layout, word/reading time metadata
- Reactions system (like / dislike / love) + favorites with animated states
- Comments with nested UI refinements
- User accounts: avatar, cover image, follower/following counts
- Follow / Unfollow + smart "Who to follow" (mutual / popularity based)
- Global search (posts + users) with highlighting & tabs
- Settings page (profile + password) with strength meter
- Admin seeding & role field (basic groundwork)
- Responsive glass / gradient design system (cards, buttons, surfaces)

## Monorepo Structure

```text
blog-web-app/
	backend/    Express API (authentication, posts, users, reactions, search)
	frontend/   React (Vite) SPA
```

## Prerequisites

- Node.js 18+ (recommended LTS)
- MongoDB running locally (or a connection string to Atlas)

## 1. Clone & Install Dependencies

From the project root:

 
```bash
git clone <your-repo-url> blog-web-app
cd blog-web-app
```

Install backend deps:
 
```bash
cd backend
npm install
```

Install frontend deps:
 
```bash
cd ../frontend
npm install
```

## 2. Environment Variables

Backend expects a `.env` file in `backend/`. An example is provided as `.env.example`:

 
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/blogDB
JWT_SECRET=changeme_generate_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
ADMIN_EMAIL=admin123@example.com
ADMIN_PASSWORD=supersecurepassword
```

Create your own copy:

 
```powershell
cd backend
Copy-Item .env.example .env
```

Update `JWT_SECRET` to a long random string. Adjust `CLIENT_URL` if the frontend runs on a different origin.

### Frontend Env (optional)

Currently the frontend uses relative paths to the backend via a preconfigured Axios instance (e.g. `/api/...`). If you deploy separately, add a Vite env var (e.g. `VITE_API_BASE=https://api.example.com`) and reference it in the Axios instance.

## 3. Running in Development

Open two terminals (or split panes):

Terminal 1 – Backend:
 
```bash
cd backend
npm run dev   # or: node server.js (if nodemon not configured)
```

Terminal 2 – Frontend:
 
```bash
cd frontend
npm run dev
```

Navigate to: <http://localhost:5173>

The backend seeds an admin user if one does not exist (see `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## 4. Build & Production

Frontend production build:
 
 

```bash
cd frontend
npm run build
```
Output goes to `dist/`. Serve it behind any static host or integrate with the backend (e.g. copy `dist` and have Express serve it).

## 5. Key API Endpoints (High Level)

- `POST /api/auth/signup` & `POST /api/auth/login` – Auth
- `GET /api/auth/me` – Current user
- `POST /api/posts` / `PUT /api/posts/:id` / `DELETE /api/posts/:id`
- `POST /api/posts/:id/reaction` – React to a post
- `POST /api/posts/:id/favorite` – Toggle favorite
- `GET /api/search?q=` – Unified search
- `POST /api/users/:id/follow` – Follow / Unfollow
- `GET /api/users/suggestions` – Who to follow

## 6. Development Notes

- Images are stored locally in `backend/uploads/` and served via `/uploads/*`.
- Replace local storage with S3 / Cloudinary in production.
- Reaction + favorite counts are recalculated per request.

## 7. Scripts

Backend (inside `backend/`):

- `npm start` – Start server
- `npm run dev` – Start with nodemon (if configured)

Frontend (inside `frontend/`):

- `npm run dev` – Vite dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build locally

## 8. Future Enhancements (Ideas)

- Dark mode toggle
- Markdown editor & rendering for posts
- Image optimization + cropping
- Pagination & infinite scroll for feed/search
- Notifications (follows, reactions, comments)
- Role‑based admin dashboard expansion

---

Happy building! Suggestions welcome.
