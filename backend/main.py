from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import asyncio
import json
import logging
from datetime import datetime
from config import settings
from db_manager import db_manager
from ai_provider import AIProvider

# 配置日志
logger = logging.getLogger(__name__)

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
    log_info: Dict[str, Any]  # 新增字段


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
    """Convert natural language to SQL and execute with auto-retry on errors"""
    try:
        # 记录开始时间
        start_time = datetime.now()
        
        # Check database connection
        if not db_manager.test_connection():
            raise HTTPException(status_code=400, detail="Database not connected")
        
        # Get schema context
        schema_context = db_manager.get_schema_context()
        
        # Generate SQL using AI
        ai_provider = AIProvider(provider=request.ai_provider)
        sql, ai_metadata = await ai_provider.generate_sql(request.natural_query, schema_context)
        
        # 创建 attempts 列表收集所有尝试
        attempts = []
        
        # 尝试执行 SQL，最多重试 3 次
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{max_retries}: Executing SQL")
                result = db_manager.execute_query(sql)
                
                # 记录成功的尝试
                attempts.append({
                    "attempt": attempt + 1,
                    "sql": sql,
                    "success": True,
                    "row_count": result["row_count"],
                    "ai_request": {
                        "prompt": ai_metadata["prompt"],
                        "schema_context": ai_metadata["schema_context"]
                    },
                    "ai_response": {
                        "raw_content": ai_metadata["raw_response"],
                        "model": ai_metadata["model"],
                        "usage": ai_metadata.get("usage", {})
                    }
                })
                
                # 构建 log_info
                log_info = {
                    "ai_provider": request.ai_provider or settings.ai_provider,
                    "natural_query": request.natural_query,
                    "timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "attempts": attempts,
                    "total_attempts": len(attempts),
                    "final_status": "success"
                }
                
                # 成功执行
                return QueryResponse(
                    sql=sql,
                    columns=result["columns"],
                    data=result["data"],
                    row_count=result["row_count"],
                    log_info=log_info
                )
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Attempt {attempt + 1} failed: {error_msg}")
                
                # 记录失败的尝试
                attempts.append({
                    "attempt": attempt + 1,
                    "sql": sql,
                    "success": False,
                    "error": error_msg,
                    "ai_request": {
                        "prompt": ai_metadata["prompt"],
                        "schema_context": ai_metadata["schema_context"]
                    },
                    "ai_response": {
                        "raw_content": ai_metadata["raw_response"],
                        "model": ai_metadata["model"],
                        "usage": ai_metadata.get("usage", {})
                    }
                })
                
                # 如果还有重试机会，让 AI 修复 SQL
                if attempt < max_retries - 1:
                    logger.info(f"Asking AI to fix SQL error...")
                    sql, ai_metadata = await ai_provider.fix_sql_error(
                        request.natural_query,
                        sql,
                        error_msg,
                        schema_context
                    )
                    logger.info(f"AI generated fixed SQL: {sql}")
        
        # 所有重试都失败，构建 log_info 并返回错误
        log_info = {
            "ai_provider": request.ai_provider or settings.ai_provider,
            "natural_query": request.natural_query,
            "timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "attempts": attempts,
            "total_attempts": len(attempts),
            "final_status": "failed"
        }
        
        error_detail = {
            "message": f"SQL 执行失败，已尝试 {max_retries} 次",
            "log_info": log_info
        }
        raise HTTPException(status_code=500, detail=error_detail)
        
    except HTTPException:
        raise
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
