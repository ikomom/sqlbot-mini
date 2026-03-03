import httpx
import logging
from typing import Optional, Tuple, Dict, Any
from config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIProvider:
    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or settings.ai_provider
        
    async def generate_sql(self, natural_query: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """Convert natural language to SQL using configured AI provider"""
        if self.provider == "openai":
            return await self._openai_generate(natural_query, schema_context)
        elif self.provider == "anthropic":
            return await self._anthropic_generate(natural_query, schema_context)
        elif self.provider == "deepseek":
            return await self._deepseek_generate(natural_query, schema_context)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    async def fix_sql_error(self, original_query: str, sql: str, error: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """根据错误信息修复 SQL"""
        prompt = f"""原始查询: {original_query}

数据库结构:
{schema_context}

生成的 SQL:
{sql}

执行错误:
{error}

请分析错误原因并生成修正后的 SQL。只返回修正后的 SQL 语句，不要任何解释。"""

        if self.provider == "openai":
            return await self._openai_fix(prompt, schema_context)
        elif self.provider == "anthropic":
            return await self._anthropic_fix(prompt, schema_context)
        elif self.provider == "deepseek":
            return await self._deepseek_fix(prompt, schema_context)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    async def _openai_generate(self, natural_query: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """Generate SQL using OpenAI API"""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        prompt = self._build_prompt(natural_query, schema_context)
        
        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Calling OpenAI API with model: {settings.openai_model}")
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.openai_model,
                        "messages": [
                            {"role": "system", "content": "You are a SQL expert. Generate only valid SQL queries without explanations."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                raw_content = result["choices"][0]["message"]["content"].strip()
                sql = self._extract_sql(raw_content)
                logger.info(f"OpenAI API response received successfully")
                
                # 构建 metadata
                metadata = {
                    "prompt": prompt,
                    "schema_context": schema_context,
                    "raw_response": raw_content,
                    "model": settings.openai_model,
                    "usage": result.get("usage", {})
                }
                
                return sql, metadata
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"OpenAI API 请求失败: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"OpenAI API request error: {str(e)}")
            raise ValueError(f"OpenAI API 网络错误: {str(e)}")
        except Exception as e:
            logger.error(f"OpenAI API unexpected error: {str(e)}")
            raise ValueError(f"OpenAI API 未知错误: {str(e)}")
    
    async def _anthropic_generate(self, natural_query: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """Generate SQL using Anthropic Claude API"""
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        prompt = self._build_prompt(natural_query, schema_context)
        
        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Calling Anthropic API with model: {settings.anthropic_model}")
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.anthropic_api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.anthropic_model,
                        "max_tokens": 1024,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "system": "You are a SQL expert. Generate only valid SQL queries without explanations."
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                raw_content = result["content"][0]["text"].strip()
                sql = self._extract_sql(raw_content)
                logger.info(f"Anthropic API response received successfully")
                
                # 构建 metadata
                metadata = {
                    "prompt": prompt,
                    "schema_context": schema_context,
                    "raw_response": raw_content,
                    "model": settings.anthropic_model,
                    "usage": result.get("usage", {})
                }
                
                return sql, metadata
        except httpx.HTTPStatusError as e:
            logger.error(f"Anthropic API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"Anthropic API 请求失败: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Anthropic API request error: {str(e)}")
            raise ValueError(f"Anthropic API 网络错误: {str(e)}")
        except Exception as e:
            logger.error(f"Anthropic API unexpected error: {str(e)}")
            raise ValueError(f"Anthropic API 未知错误: {str(e)}")
    
    async def _deepseek_generate(self, natural_query: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """使用 DeepSeek API 生成 SQL"""
        if not settings.deepseek_api_key:
            raise ValueError("DeepSeek API key not configured")
        
        prompt = self._build_prompt(natural_query, schema_context)
        
        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Calling DeepSeek API with model: {settings.deepseek_model}")
                response = await client.post(
                    f"{settings.deepseek_base_url}/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.deepseek_model,
                        "messages": [
                            {"role": "system", "content": "You are a SQL expert. Generate only valid SQL queries without explanations."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                raw_content = result["choices"][0]["message"]["content"].strip()
                sql = self._extract_sql(raw_content)
                logger.info(f"DeepSeek API response received successfully")
                
                # 构建 metadata
                metadata = {
                    "prompt": prompt,
                    "schema_context": schema_context,
                    "raw_response": raw_content,
                    "model": settings.deepseek_model,
                    "usage": result.get("usage", {})
                }
                
                return sql, metadata
        except httpx.HTTPStatusError as e:
            logger.error(f"DeepSeek API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"DeepSeek API 请求失败: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"DeepSeek API request error: {str(e)}")
            raise ValueError(f"DeepSeek API 网络错误: {str(e)}")
        except Exception as e:
            logger.error(f"DeepSeek API unexpected error: {str(e)}")
            raise ValueError(f"DeepSeek API 未知错误: {str(e)}")
    
    def _build_prompt(self, natural_query: str, schema_context: str) -> str:
        """Build prompt for AI model"""
        return f"""Given the following database schema:

{schema_context}

Generate a SQL query for: {natural_query}

Return ONLY the SQL query, no explanations or markdown formatting."""
    
    def _extract_sql(self, text: str) -> str:
        """Extract SQL from AI response, removing markdown code blocks if present"""
        text = text.strip()
        
        # Remove markdown code blocks
        if text.startswith("```sql"):
            text = text[6:]
        elif text.startswith("```"):
            text = text[3:]
        
        if text.endswith("```"):
            text = text[:-3]
        
        return text.strip()
    
    async def _openai_fix(self, prompt: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """使用 OpenAI 修复 SQL"""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.openai_model,
                        "messages": [
                            {"role": "system", "content": "You are a SQL expert. Fix the SQL error and return only the corrected SQL."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                raw_content = result["choices"][0]["message"]["content"].strip()
                sql = self._extract_sql(raw_content)
                
                # 构建 metadata
                metadata = {
                    "prompt": prompt,
                    "schema_context": schema_context,
                    "raw_response": raw_content,
                    "model": settings.openai_model,
                    "usage": result.get("usage", {})
                }
                
                return sql, metadata
        except Exception as e:
            logger.error(f"OpenAI fix error: {str(e)}")
            raise
    
    async def _anthropic_fix(self, prompt: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """使用 Anthropic 修复 SQL"""
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.anthropic_api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.anthropic_model,
                        "max_tokens": 1024,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "system": "You are a SQL expert. Fix the SQL error and return only the corrected SQL."
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                raw_content = result["content"][0]["text"].strip()
                sql = self._extract_sql(raw_content)
                
                # 构建 metadata
                metadata = {
                    "prompt": prompt,
                    "schema_context": schema_context,
                    "raw_response": raw_content,
                    "model": settings.anthropic_model,
                    "usage": result.get("usage", {})
                }
                
                return sql, metadata
        except Exception as e:
            logger.error(f"Anthropic fix error: {str(e)}")
            raise
    
    async def _deepseek_fix(self, prompt: str, schema_context: str) -> Tuple[str, Dict[str, Any]]:
        """使用 DeepSeek 修复 SQL"""
        if not settings.deepseek_api_key:
            raise ValueError("DeepSeek API key not configured")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.deepseek_base_url}/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.deepseek_model,
                        "messages": [
                            {"role": "system", "content": "You are a SQL expert. Fix the SQL error and return only the corrected SQL."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                raw_content = result["choices"][0]["message"]["content"].strip()
                sql = self._extract_sql(raw_content)
                
                # 构建 metadata
                metadata = {
                    "prompt": prompt,
                    "schema_context": schema_context,
                    "raw_response": raw_content,
                    "model": settings.deepseek_model,
                    "usage": result.get("usage", {})
                }
                
                return sql, metadata
        except Exception as e:
            logger.error(f"DeepSeek fix error: {str(e)}")
            raise
