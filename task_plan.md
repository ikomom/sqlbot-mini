# Task Plan: SQL Bot Mini - Natural Language to SQL Query System

## Goal
Create a minimal full-stack application that converts natural language queries to SQL, executes them, and visualizes results as charts. Frontend in React, backend in FastAPI, with configurable AI providers and database connections.

## Phases

### Phase 1: Project Structure Setup [complete]
- Create backend directory structure (FastAPI)
- Create frontend directory structure (React)
- Setup configuration files (package.json, requirements.txt, etc.)
- Create .gitignore and basic documentation

### Phase 2: Backend Core [complete]
- FastAPI application setup
- Database connection management (support multiple DB types)
- AI provider integration (configurable: OpenAI, Anthropic, etc.)
- Natural language to SQL conversion endpoint
- SQL execution and result formatting

### Phase 3: Frontend Core [complete]
- React application setup with Vite
- Database configuration UI
- Natural language query input
- Chart visualization component (using recharts or similar)
- API integration with backend

### Phase 4: Configuration & Environment [complete]
- Environment variable setup
- AI provider configuration
- Database connection configuration
- Basic error handling

### Phase 5: Integration & Testing [complete]
- Connect frontend to backend
- Test end-to-end flow
- Basic validation and error messages

## Key Decisions
- **Frontend Framework**: React with Vite (fast, modern)
- **Backend Framework**: FastAPI (async, fast, Python)
- **Chart Library**: recharts (React-friendly, simple)
- **AI Integration**: Support OpenAI and Anthropic Claude
- **Database Support**: Start with PostgreSQL and MySQL
- **State Management**: React hooks (keep it simple)

## Files to Create
### Backend
- `backend/main.py` - FastAPI app entry
- `backend/config.py` - Configuration management
- `backend/ai_provider.py` - AI integration
- `backend/db_manager.py` - Database connection handling
- `backend/requirements.txt` - Python dependencies

### Frontend
- `frontend/src/App.jsx` - Main React component
- `frontend/src/components/QueryInput.jsx` - Query input UI
- `frontend/src/components/ChartDisplay.jsx` - Chart visualization
- `frontend/src/components/DatabaseConfig.jsx` - DB configuration
- `frontend/package.json` - Node dependencies
- `frontend/vite.config.js` - Vite configuration

### Root
- `.env.example` - Environment variables template
- `README.md` - Project documentation

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| - | - | - |

## Notes
- Keep implementation minimal and focused
- Use environment variables for sensitive config
- Support both OpenAI and Anthropic APIs
- Database connections should be configurable at runtime
