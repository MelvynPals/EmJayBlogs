# EmJayBlogs Architecture

> High-level documentation of the full‑stack codebase: technology stack, directory purposes, data flow, and extensibility guidelines.

## 1. Overview

EmJayBlogs is a full‑stack blogging + lightweight social platform. Users create posts (with optional cover images), react (multi‑type), favorite, comment, follow other users, and discover content via search and suggestions. The system consists of:

- Frontend: React (Vite) SPA styled with Tailwind utility classes + custom gradient/glass utilities.
- Backend: Node.js / Express REST API with MongoDB via Mongoose.
- Auth: JWT (signed, httpOnly cookie) with role support (user/admin).
- Media: Local disk storage under `backend/uploads/` (statics served at `/uploads/*`).

```text
[Browser SPA] ⇄ (Axios JSON + cookies) ⇄ [Express API] ⇄ [MongoDB]
```

Key flows:

- Login/Signup issues JWT cookie, client stores only basic user object.
- Subsequent API calls send cookie implicitly (credentials: true).
- Reactions/Favorites mutate Post documents and return updated counts.
- Suggestions endpoint derives mutual / popular users.

## 2. Repository Layout

```text
blog-web-app/
  backend/
    models/        # Mongoose schemas (User, Post, Comment)
    routes/        # Express route modules (auth, posts, users, search, comments, admin)
    middleware/    # auth middleware (protect)
    uploads/       # Saved uploaded images (cover/avatar)
    server.js      # App bootstrap & DB connect
  frontend/
    src/
      api/         # Axios instance configuration
      components/  # Reusable UI (cards, layout, reactions, sidebar, etc.)
      context/     # AuthProvider + context wiring
      pages/       # Route-level pages (Login, Signup, PostView, Search, Settings, Profile...)
      utils/       # Helpers (resolveMediaUrl)
      assets/      # Static images, SVG icons, favicon
      index.css    # Global styles + custom design tokens (gradients, surfaces)
    index.html     # Vite entry
  ARCHITECTURE.md  # (this file)
  README.md        # Quick start + env setup
```

## 3. Backend

### 3.1 Server Bootstrap (`backend/server.js`)

- Loads env vars (`dotenv`).
- Configures Express (JSON, cookieParser, CORS with `CLIENT_URL`).
- Registers route modules under `/api/*` prefixes.
- Serves `/uploads` static directory.
- Connects to MongoDB and optionally seeds an admin user.

### 3.2 Middleware

- `protect` (middleware/auth.js): Verifies JWT from httpOnly cookie `token`, attaches `req.user` (hydrated User document). Rejects unauthorized requests.

### 3.3 Models

- `User`: identity (name, email, password hash), role, avatar/cover, followers, following, favoritePosts, banned flag.
- `Post`: title, content, coverUrl, author ref, reactions (embedded docs `{user,type}`), favorites (user refs), timestamps.
- `Comment`: post ref, author ref, content, parentComment (optional for nesting), timestamps.

### 3.4 Route Modules (Controllers Inline)

- `auth.js`: signup, login (JWT issue), logout, current user (`/me`). Minimal responses include counts & following list.
- `posts.js`: CRUD (create with optional upload integration upstream), reaction toggle (`/posts/:id/reaction`), favorite toggle, list & detail endpoints.
- `users.js`: profile fetch, follow/unfollow, upload avatar/cover, personalized suggestions (mutual first then popular), current user's posts, small updates (name/email).
- `comments.js`: create, list (and possibly delete) comments tied to a post. (Check file for exact operations if extending.)
- `search.js`: unified search across posts (title/content) & users (name/email) returning trimmed snippets + counts.
- `admin.js`: administrative listing endpoints (e.g., enumerating posts/users) and future moderation operations.

### 3.5 Reactions & Favorites Logic

- Reaction endpoint ensures at most one reaction per (user, post) by replacing existing reaction of same user.
- Favorite endpoint toggles user presence in `post.favorites` array.

### 3.6 Suggestions Algorithm

1. Collect user following list.
2. Fetch "friends-of-friends" (users followed by those the user follows), compute mutual counts.
3. Sort by mutualCount then follower count.
4. Fill remaining slots with globally popular users (by follower count) excluding already followed/self.

### 3.7 Error Handling & Responses

- Simple try/catch blocks returning `{ message: 'Server error' }` on failures.
- Validation errors produce 400 with explanatory message.

### 3.8 Security Considerations

- JWT in httpOnly cookie (mitigates XSS token theft).
- CORS restricts origin via `CLIENT_URL` (adjust for production multi-origin scenarios).
- Passwords hashed with bcrypt pre-save hook.
- No rate limiting yet (recommended for auth & search endpoints in production).

## 4. Frontend

### 4.1 App Entry

- `index.html` loads `src/main.jsx` which mounts `<App/>`.
- Global CSS (`index.css`) defines gradient buttons (`g-btn-*`), surfaces (`g-surface-card`, glass), animations (`reaction-pop`), typography gradients.

### 4.2 Routing & Layout
- Layout components compose header, left/right sidebars, featured post section, footer.
- Pages consume layout wrappers to hide/show sidebars (e.g., auth pages vs main feed).

### 4.3 State Management
- `AuthContext` stores authenticated user object (id, name, avatarUrl, following array, followersCount etc.).
- Refresh on login/signup; stored only in memory (no localStorage persistence presently).

### 4.4 API Layer
- Axios instance sets `withCredentials` allowing cookie-based auth.
- Relative paths (`/api/...`) proxied by dev server or same-origin in production.

### 4.5 Components Highlights
- Post Cards (feed/profile/featured): show title, snippet, author avatar, reaction bar.
- Reaction Icons: SVG wrappers with `active`, `preview` (hover), and click animation classes.
- CreateStory: drag & drop cover, live word/char metrics.
- Settings: profile + password forms with strength indicator.
- Search Page: debounced query, abortable requests, tabs (all/users/posts), highlight matches, skeleton loaders.
- SidebarLeft: navigation with gradient active state.
- SidebarRight: current user summary + "Who to follow" suggestions showing mutual counts.

### 4.6 Utilities
- `resolveMediaUrl(path)`: prepends backend base when needed (currently usually direct path).
- Word count / read time calculations in PostView (useMemo based on content length).

### 4.7 Reactions UI Flow
1. Hover sets `preview` (scaled, semi-active icon).
2. Click triggers API; on success update counts + animation (`animate-reaction-pop`).
3. Favorites button parallels reaction style with distinct color accent.

### 4.8 Design System Tokens
- Buttons: `.g-btn-primary`, `.g-btn-emerald`, `.g-btn-neutral`, `.g-btn-white`.
- Surfaces: `.g-surface-card`, glass backgrounds (blur + translucency).
- Animations: `@keyframes reaction-pop` applied via utility class.

## 5. Data Model Summary

| Model   | Key Fields (selected)                                        | Notes |
|---------|--------------------------------------------------------------|-------|
| User    | name, email, password(hash), role, avatarUrl, coverUrl, followers[], following[], favoritePosts[] | Title removed; favorites separate from reactions. |
| Post    | title, content, coverUrl, author, reactions[], favorites[], createdAt | Reactions embed (user+type) for quick aggregation. |
| Comment | post, author, content, parentComment, createdAt              | Enables threaded replies (single-level or deeper). |

## 6. Environment Variables
(See `.env.example` for authoritative list.)

| Variable        | Description | Default (dev) |
|-----------------|-------------|---------------|
| PORT            | API port | 5000 |
| MONGO_URI       | Mongo connection string | mongodb://127.0.0.1:27017/blogDB |
| JWT_SECRET      | JWT signing secret | (required manual set) |
| JWT_EXPIRES_IN  | Token lifetime | 1d |
| CLIENT_URL      | Frontend origin for CORS | http://localhost:5173 |
| NODE_ENV        | Environment mode | development |
| ADMIN_EMAIL     | Seeded admin login email | admin123@example.com |
| ADMIN_PASSWORD  | Seeded admin password | supersecurepassword |

## 7. Adding New Features

### 7.1 New Backend Endpoint
1. Create route file or extend existing module in `routes/`.
2. Add path under `server.js` with `app.use('/api/<name>', require('./routes/<name>'))`.
3. Define Mongoose interactions (consider schema indexes if querying large sets).
4. Protect with `protect` if authentication required.
5. Return minimal JSON needed by client (avoid over-fetching arrays or large objects).

### 7.2 New Frontend Page
1. Add component to `pages/`.
2. Wire route (inside router config / App component).
3. Reuse layout wrappers and design tokens.
4. Add API calls inside `useEffect` with abort controller if user-typed.

### 7.3 Extending Reactions
- Update `REACTION_TYPES` constant with new enum & icon.
- Add condition in Post reaction route to allow new type.
- Provide SVG asset pairs (idle, active).

## 8. Performance & Scaling Considerations
- Current queries use simple filters; consider indexes on `Post.author`, `Post.createdAt`, `User.followers`, `User.following` for large scale.
- Repeated per-request counting could be cached or denormalized if traffic grows.
- Image storage should move to external object storage (S3, Cloudinary) in production.
- Add pagination to feed, search, and suggestions endpoints.

## 9. Security & Hardening TODO
- Rate limiting (login, search, reactions).
- Helmet for security headers.
- CSRF considerations (cookie + same-site currently mitigates some risk; evaluate token approach for unsafe verbs if cross-site embedding possible).
- Input sanitization / validation library (e.g., Zod / Joi) instead of ad hoc checks.

## 10. Testing Strategy (Future)
- Unit: model hooks (password hashing), utility functions.
- Integration: auth & reaction flows with an in-memory Mongo (MongoMemoryServer).
- E2E: Cypress or Playwright for critical user journeys (signup, create post, react, search).

## 11. Glossary
- Reaction: One of (like|dislike|love) stored inline in `Post.reactions`.
- Favorite: Independent boolean flag per (user, post) represented by presence of user id in `favorites` array.
- Mutual Count: Number of users both current user follows who also follow a suggested user.

## 12. Roadmap Ideas
- Dark mode theme switch
- Markdown post authoring & rendering
- Rich text or WYSIWYG editor
- Notification center (follows, favorites, comments, reactions)
- Soft delete / moderation queues
- Tagging system for posts + faceted search

---
_Last updated: 2025-08-25_
