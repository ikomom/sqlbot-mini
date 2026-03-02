from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from config import settings
from db_manager import db_manager
from ai_provider import AIProvider

app = FastAPI(title="SQL Bot Mini")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class DatabaseConfig(BaseModel):
    type: str  # postgresql, mysql, sqlite
    host: str = "localhost"
    port: int = 5432
    database: str
    username: str = ""
    password: str = ""


class QueryRequest(BaseModel):
    natural_query: str
    ai_provider: Optional[str] = None


class QueryResponse(BaseModel):
    sql: str
    columns: list
    data: list
    row_count: int


# Endpoints
@app.get("/")
async def root():
    return {"message": "SQL Bot Mini API", "version": "1.0.0"}


@app.post("/database/connect")
async def connect_database(config: DatabaseConfig):
    """Connect to a database"""
    try:
        db_manager.connect(config.dict())
        
        # Test connection
        if not db_manager.test_connection():
            raise HTTPException(status_code=400, detail="Failed to connect to database")
        
        return {"status": "connected", "message": "Successfully connected to database"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/database/status")
async def database_status():
    """Check database connection status"""
    is_connected = db_manager.test_connection()
    return {
        "connected": is_connected,
        "config": db_manager.current_config if is_connected else None
    }


@app.get("/database/schema")
async def get_schema():
    """Get database schema information"""
    try:
        schema = db_manager.get_schema_context()
        return {"schema": schema}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/query", response_model=QueryResponse)
async def execute_natural_query(request: QueryRequest):
    """Convert natural language to SQL and execute"""
    try:
        # Check database connection
        if not db_manager.test_connection():
            raise HTTPException(status_code=400, detail="Database not connected")
        
        # Get schema context
        schema_context = db_manager.get_schema_context()
        
        # Generate SQL using AI
        ai_provider = AIProvider(provider=request.ai_provider)
        sql = await ai_provider.generate_sql(request.natural_query, schema_context)
        
        # Execute SQL
        result = db_manager.execute_query(sql)
        
        return QueryResponse(
            sql=sql,
            columns=result["columns"],
            data=result["data"],
            row_count=result["row_count"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query/sql")
async def execute_sql(sql: str):
    """Execute raw SQL query"""
    try:
        if not db_manager.test_connection():
            raise HTTPException(status_code=400, detail="Database not connected")
        
        result = db_manager.execute_query(sql)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
