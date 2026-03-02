import httpx
from typing import Optional
from config import settings


class AIProvider:
    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or settings.ai_provider
        
    async def generate_sql(self, natural_query: str, schema_context: str) -> str:
        """Convert natural language to SQL using configured AI provider"""
        if self.provider == "openai":
            return await self._openai_generate(natural_query, schema_context)
        elif self.provider == "anthropic":
            return await self._anthropic_generate(natural_query, schema_context)
        elif self.provider == "deepseek":
            return await self._deepseek_generate(natural_query, schema_context)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    async def _openai_generate(self, natural_query: str, schema_context: str) -> str:
        """Generate SQL using OpenAI API"""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        prompt = self._build_prompt(natural_query, schema_context)
        
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
                        {"role": "system", "content": "You are a SQL expert. Generate only valid SQL queries without explanations."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            sql = result["choices"][0]["message"]["content"].strip()
            return self._extract_sql(sql)
    
    async def _anthropic_generate(self, natural_query: str, schema_context: str) -> str:
        """Generate SQL using Anthropic Claude API"""
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        prompt = self._build_prompt(natural_query, schema_context)
        
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
                    "system": "You are a SQL expert. Generate only valid SQL queries without explanations."
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            sql = result["content"][0]["text"].strip()
            return self._extract_sql(sql)
    
    async def _deepseek_generate(self, natural_query: str, schema_context: str) -> str:
        """使用 DeepSeek API 生成 SQL"""
        if not settings.deepseek_api_key:
            raise ValueError("DeepSeek API key not configured")
        
        prompt = self._build_prompt(natural_query, schema_context)
        
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
                        {"role": "system", "content": "You are a SQL expert. Generate only valid SQL queries without explanations."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            sql = result["choices"][0]["message"]["content"].strip()
            return self._extract_sql(sql)
    
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
