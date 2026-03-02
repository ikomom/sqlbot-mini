from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
from typing import Dict, List, Any, Optional
from config import settings


class DatabaseManager:
    def __init__(self):
        self.engine: Optional[Engine] = None
        self.current_config: Optional[Dict] = None
    
    def connect(self, db_config: Dict[str, Any]) -> None:
        """Connect to database with given configuration"""
        db_type = db_config.get("type", "postgresql")
        host = db_config.get("host", "localhost")
        port = db_config.get("port", 5432)
        database = db_config.get("database", "testdb")
        username = db_config.get("username", "postgres")
        password = db_config.get("password", "")
        
        # Build connection string
        if db_type == "postgresql":
            conn_str = f"postgresql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "mysql":
            conn_str = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "sqlite":
            conn_str = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
        
        self.engine = create_engine(conn_str, pool_pre_ping=True)
        self.current_config = db_config
    
    def get_schema_context(self) -> str:
        """Get database schema information for AI context"""
        if not self.engine:
            raise ValueError("Database not connected")
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        schema_parts = []
        for table in tables:
            columns = inspector.get_columns(table)
            col_defs = []
            for col in columns:
                col_type = str(col['type'])
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                col_defs.append(f"  {col['name']} {col_type} {nullable}")
            
            schema_parts.append(f"Table: {table}\n" + "\n".join(col_defs))
        
        return "\n\n".join(schema_parts)
    
    def get_tables_info(self) -> List[Dict[str, Any]]:
        """获取数据库表的详细信息"""
        if not self.engine:
            raise ValueError("Database not connected")
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        tables_info = []
        for table in tables:
            columns = inspector.get_columns(table)
            tables_info.append({
                "name": table,
                "columns": [col['name'] for col in columns],
                "column_count": len(columns)
            })
        
        return tables_info
    
    def generate_query_suggestions(self) -> List[str]:
        """根据数据库表结构生成查询提示词"""
        if not self.engine:
            raise ValueError("Database not connected")
        
        tables_info = self.get_tables_info()
        suggestions = []
        
        for table in tables_info:
            table_name = table['name']
            columns = table['columns']
            
            # 基础查询
            suggestions.append(f"查询 {table_name} 表的所有数据")
            suggestions.append(f"统计 {table_name} 表的记录数量")
            
            # 如果有常见字段，生成更具体的提示
            if 'name' in columns or 'title' in columns:
                name_col = 'name' if 'name' in columns else 'title'
                suggestions.append(f"按 {name_col} 查询 {table_name}")
            
            if 'created_at' in columns or 'create_time' in columns:
                suggestions.append(f"查询 {table_name} 最近创建的记录")
            
            if 'status' in columns:
                suggestions.append(f"查询 {table_name} 中不同状态的统计")
            
            # 如果有 id 字段
            if 'id' in columns:
                suggestions.append(f"查询 {table_name} 的前10条记录")
        
        # 限制返回数量
        return suggestions[:8]
    
    def execute_query(self, sql: str, limit: int = 100) -> Dict[str, Any]:
        """Execute SQL query and return results"""
        if not self.engine:
            raise ValueError("Database not connected")
        
        # Add LIMIT if not present (safety measure)
        sql_upper = sql.upper().strip()
        if "LIMIT" not in sql_upper and sql_upper.startswith("SELECT"):
            sql = f"{sql.rstrip(';')} LIMIT {limit}"
        
        with self.engine.connect() as conn:
            result = conn.execute(text(sql))
            
            # Fetch results
            rows = result.fetchall()
            columns = list(result.keys())
            
            # Convert to list of dicts
            data = []
            for row in rows:
                data.append(dict(zip(columns, row)))
            
            return {
                "columns": columns,
                "data": data,
                "row_count": len(data)
            }
    
    def test_connection(self) -> bool:
        """Test if database connection is working"""
        if not self.engine:
            return False
        
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
    
    def disconnect(self) -> None:
        """Close database connection"""
        if self.engine:
            self.engine.dispose()
            self.engine = None
            self.current_config = None


# Global database manager instance
db_manager = DatabaseManager()
