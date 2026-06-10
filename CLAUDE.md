# Project Overview
Frontend dashboard app built with Vite + React (JavaScript). Uses JWT authentication, a sidebar-based layout, and communicates with a REST backend via Axios.

# Tech Stack
- React 18 + Vite
- React Router DOM (routing)
- Tailwind CSS v4 (via @tailwindcss/vite)
- shadcn/ui (component library, components live in src/components/ui/)
- Axios (API calls)
- JWT (authentication)

# Project Structure
src/
├── api/               # Axios client + endpoint functions per resource
├── components/ui/     # shadcn auto-generated components (do not edit manually)
├── components/common/ # Shared custom components
├── context/           # AuthContext (JWT state, login, logout)
├── hooks/             # Custom hooks (useAuth, useFetch, etc.)
├── layouts/           # AppLayout (sidebar + outlet), AuthLayout
├── pages/             # One folder per feature/route
├── router/            # AppRouter, PrivateRoute, route constants
├── utils/             # tokenUtils, formatters, validators
└── assets/            # Static files

# Path Aliases
@ maps to src/ — always use @/ imports, never relative paths like ../../

# Environment Variables
- VITE_API_BASE_URL — backend base URL
- .env.development   → http://localhost:8080/api
- .env.production    → real backend URL (never committed)

# API Layer
- src/api/axiosClient.js is the base Axios instance
- It reads VITE_API_BASE_URL from env
- JWT interceptors will be added once AuthContext is set up
- All API calls go through axiosClient, never raw fetch

# Auth
- JWT token stored in localStorage via src/utils/tokenUtils.js
- AuthContext provides: user, token, login(), logout(), isAuthenticated
- PrivateRoute wraps all protected routes and redirects to /login if not authenticated

# Routing Convention
- Public routes use AuthLayout (centered card)
- Protected routes use PrivateRoute → AppLayout (sidebar + topbar)
- Route path constants defined in src/router/routes.js

# Component Conventions
- shadcn components: added via `npx shadcn@latest add <component>`, never written manually
- Custom shared components go in src/components/common/
- Feature-specific components go inside the page folder (e.g. src/pages/users/components/)

# Commands
- npm run dev       → start dev server
- npm run build     → production build
- npm run preview   → preview production build