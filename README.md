# InterviewIQ.AI / AI Resume Analyzer

## Project Overview
InterviewIQ.AI is a full-stack AI-enabled interview preparation platform. It helps users upload a resume, analyze it automatically, and generate role-specific mock interview questions in a format that feels like a real interview.

## Why this project?
- Problem: Most interview practice tools are generic and do not use the candidate's actual resume or career context.
- Why I chose it: I wanted to build a solution that combines AI, resume understanding, and full-stack web development to create a personalized interview preparation experience.
- Impact: The platform makes practice more relevant, saves time, and helps users build confidence by focusing on the right skills and projects.

## Solution
InterviewIQ.AI solves the problem by:
- Authenticating users with Google sign-in
- Allowing resume upload and parsing text from PDF
- Using AI to infer role, experience level, skills, and projects from the resume
- Generating interview questions that match the candidate's profile and chosen interview mode
- Providing a path to track interview history and performance over time

## Tech Stack
### Frontend
- React 19
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router DOM
- Firebase Authentication
- Axios
- motion / framer-motion for animated UI elements
- React Icons

### Backend
- Node.js + Express 5
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- PDF parsing with `pdfjs-dist`
- AI integration via OpenRouter API
- CORS, cookie-parser, dotenv

### Database
- MongoDB (local or cloud)
- User and interview session storage

## Project Structure

### Root
- `README.md` - Project documentation
- `client/` - Frontend application
- `server/` - Backend API server

### `client/`
- `package.json` - frontend dependencies and dev scripts
- `src/`
  - `App.jsx` - main routing, user fetch logic
  - `main.jsx` - renders React app with router and Redux provider
  - `pages/` - page-level views like `home`, `Auth`, and `InterviewPage`
  - `components/` - UI components and interview flow steps
  - `redux/` - Redux store and user slice
  - `utils/firebase.js` - Firebase authentication configuration
- `public/` - static assets

### `server/`
- `index.js` - Express server setup and route registration
- `package.json` - backend dependencies and dev scripts
- `config/`
  - `connectdb.js` - MongoDB connection
  - `token.js` - JWT creation utility
- `controller/`
  - `auth.controller.js` - Google auth and logout handlers
  - `interview.controller.js` - resume analysis and interview generation logic
  - `user.controller.js` - user profile fetch endpoint
- `middleware/`
  - `isAuth.js` - JWT cookie authentication middleware
  - `multer.js` - file upload handling using Multer
- `models/`
  - `user.model.js` - user schema and credits tracking
  - `interview.model.js` - interview session and question schema
- `route/`
  - `auth.route.js` - auth API routes
  - `interview.route.js` - interview-related API routes
  - `user.route.js` - user API route
- `services/`
  - `openrouter.services.js` - AI service wrapper using OpenRouter API

## Architecture
1. User opens the React app and authenticates using Google.
2. Client fetches authenticated user data and displays the interview flow.
3. User uploads a resume and selects role, experience, and interview mode.
4. The client sends the resume to the backend API.
5. Backend parses the resume PDF, extracts text, and calls the AI service.
6. AI returns inferred role, skills, projects, and experience level.
7. The user can then begin the interview flow based on parsed resume data.
8. Interview questions and evaluation results can be recorded and stored in MongoDB.

## Interview-Friendly Project Explanation
### Project Name
InterviewIQ.AI — an AI resume analyzer and mock interview platform.

### Problem Statement
Job seekers often struggle to prepare effectively because interview practice is too generic and not based on their actual resume or career strengths.

### Why This Approach
I chose this project because it blends AI and user-centered design to make interview preparation more meaningful. It also demonstrates end-to-end full-stack development skills.

### How It Works
The platform reads resume content, infers relevant details, and generates customized interview questions. This makes practice tailored to the candidate rather than one-size-fits-all.

### Architecture Summary
- Client: React + Vite + Redux for user experience and state
- Server: Express + MongoDB + PDF parsing for backend logic
- AI: OpenRouter-powered chat model for resume analysis and question generation

### Challenges Faced
- Parsing PDF files reliably and extracting clean text.
- Designing AI prompts that return consistent JSON output.
- Securing the application with authentication and cookie-based JWT.
- Managing user state and resume analysis results in the frontend.

### How I Solved It
- Used `pdfjs-dist` to extract text from PDF resumes.
- Built a dedicated AI wrapper service to centralize prompt calls.
- Added JWT-based auth middleware and persisted user session with cookies.
- Kept UI state simple with Redux and modularized interview flow components.

### Impact
- Helps candidates practice interviews that are actually relevant to their background.
- Reduces preparation time by generating questions from resume content.
- Supports improved confidence through AI-guided, context-aware mock interviews.

## Setup Instructions
### Backend
1. Go to `server/`
2. Create a `.env` file with:
   - `PORT=8000`
   - `MONGO_URL=<your-mongodb-connection-string>`
   - `JWT_SECRET=<your-secret>`
   - `OPENROUTER_API_KEY=<your-openrouter-api-key>`
3. Install dependencies:
   - `npm install`
4. Start server:
   - `npm run dev`

### Frontend
1. Go to `client/`
2. Install dependencies:
   - `npm install`
3. Start app:
   - `npm run dev`

## Notes
- Do not commit secret values from `.env` to source control.
- The backend expects the frontend at `http://localhost:5173` and uses cookies for auth.
- The AI integration is powered by OpenRouter with the `gpt-4o-mini` model.

---

This README is designed to be easy to explain in interviews and to help future maintainers understand the project quickly