from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import asyncio
import json
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


@app.post("/database/connect/default")
async def connect_default_database():
    """使用 .env 中的默认配置连接数据库"""
    try:
        default_config = {
            "type": settings.default_db_type,
            "host": settings.default_db_host,
            "port": settings.default_db_port,
            "database": settings.default_db_name,
            "username": settings.default_db_user,
            "password": settings.default_db_password,
        }
        db_manager.connect(default_config)
        
        # Test connection
        if not db_manager.test_connection():
            raise HTTPException(status_code=400, detail="无法连接到默认数据库，请检查 .env 配置")
        
        return {"status": "connected", "message": "成功连接到默认数据库"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"连接默认数据库失败: {str(e)}")


@app.get("/database/connect/stream")
async def connect_database_stream():
    """使用 SSE 流式推送数据库连接状态"""
    async def event_generator():
        try:
            # 发送开始连接消息
            yield f"data: {json.dumps({'status': 'connecting', 'message': '正在连接数据库...'})}\n\n"
            await asyncio.sleep(0.5)
            
            # 尝试连接
            default_config = {
                "type": settings.default_db_type,
                "host": settings.default_db_host,
                "port": settings.default_db_port,
                "database": settings.default_db_name,
                "username": settings.default_db_user,
                "password": settings.default_db_password,
            }
            
            db_manager.connect(default_config)
            
            # 测试连接
            if not db_manager.test_connection():
                yield f"data: {json.dumps({'status': 'error', 'message': '无法连接到数据库，请检查 .env 配置'})}\n\n"
            else:
                yield f"data: {json.dumps({'status': 'connected', 'message': '成功连接到数据库'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': f'连接失败: {str(e)}'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


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


@app.get("/database/suggestions")
async def get_query_suggestions():
    """获取基于数据库表结构的查询提示词"""
    try:
        suggestions = db_manager.generate_query_suggestions()
        return {"suggestions": suggestions}
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
