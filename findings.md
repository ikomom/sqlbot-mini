# Findings: SQL Bot Mini

## Project Requirements Analysis

### Core Features
1. **Natural Language Input**: User enters query in plain language (Chinese or English)
2. **SQL Generation**: AI converts natural language to SQL
3. **Query Execution**: Execute SQL against configured database
4. **Chart Visualization**: Display results as charts/graphs
5. **Configurable Database**: Support multiple database types
6. **Configurable AI**: Support multiple AI providers

### Technical Stack Decisions

#### Backend (FastAPI)
- **FastAPI**: Modern, fast, async Python framework
- **SQLAlchemy**: Database ORM for multiple DB support
- **httpx**: Async HTTP client for AI API calls
- **python-dotenv**: Environment variable management

#### Frontend (React)
- **Vite**: Fast build tool and dev server
- **React 18**: Modern React with hooks
- **recharts**: Simple, composable chart library
- **axios**: HTTP client for API calls

#### AI Providers
- **OpenAI**: GPT-4/GPT-3.5 for SQL generation
- **Anthropic**: Claude for SQL generation
- Configurable via environment variables

#### Database Support
- **PostgreSQL**: Primary target
- **MySQL**: Secondary target
- **SQLite**: For testing/demo
- Use SQLAlchemy for abstraction

## Architecture

```
Frontend (React)
    ↓ HTTP
Backend (FastAPI)
    ↓
AI Provider (OpenAI/Claude) → SQL Generation
    ↓
Database (PostgreSQL/MySQL) → Query Execution
    ↓
Results → Chart Data
    ↓
Frontend → Visualization
```

## Key Implementation Notes
- Use async/await throughout for better performance
- Validate SQL before execution (prevent injection)
- Limit query results to prevent overwhelming charts
- Store database schema context for better SQL generation
- Cache AI responses to reduce API costs
