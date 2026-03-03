from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
from typing import Dict, List, Any, Optional
from config import settings
import random


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
    
    def generate_query_suggestions(self) -> List[Dict[str, Any]]:
        """根据数据库表结构生成查询提示词，包含图表类型建议"""
        if not self.engine:
            raise ValueError("Database not connected")
        
        tables_info = self.get_tables_info()
        suggestions = []
        
        for table in tables_info:
            table_name = table['name']
            columns = table['columns']
            
            # 1. 表格类查询 - 适合查看详细数据
            suggestions.append({
                "query": f"查询 {table_name} 表的前10条记录",
                "category": "表格",
                "chart_type": "table",
                "icon": "📋"
            })
            
            # 2. 统计类查询 - 适合柱状图
            suggestions.append({
                "query": f"统计 {table_name} 表的记录总数",
                "category": "统计",
                "chart_type": "bar",
                "icon": "📊"
            })
            
            # 3. 分类统计 - 适合饼图或柱状图
            if 'status' in columns:
                suggestions.append({
                    "query": f"统计 {table_name} 中各状态的数量分布",
                    "category": "分类统计",
                    "chart_type": "pie",
                    "icon": "🥧"
                })
            
            if 'type' in columns or 'category' in columns:
                col = 'type' if 'type' in columns else 'category'
                suggestions.append({
                    "query": f"统计 {table_name} 中各 {col} 的数量",
                    "category": "分类统计",
                    "chart_type": "pie",
                    "icon": "🥧"
                })
            
            # 4. 时间序列 - 适合折线图
            if 'created_at' in columns or 'create_time' in columns or 'date' in columns:
                date_col = 'created_at' if 'created_at' in columns else ('create_time' if 'create_time' in columns else 'date')
                suggestions.append({
                    "query": f"统计 {table_name} 每天的新增数量",
                    "category": "时间趋势",
                    "chart_type": "line",
                    "icon": "📈"
                })
                suggestions.append({
                    "query": f"查询 {table_name} 最近7天的数据趋势",
                    "category": "时间趋势",
                    "chart_type": "line",
                    "icon": "📈"
                })
            
            # 5. 排名类 - 适合横向柱状图
            if 'amount' in columns or 'price' in columns or 'count' in columns:
                value_col = 'amount' if 'amount' in columns else ('price' if 'price' in columns else 'count')
                suggestions.append({
                    "query": f"查询 {table_name} 中 {value_col} 最高的前10条记录",
                    "category": "排名",
                    "chart_type": "bar",
                    "icon": "🏆"
                })
            
            # 6. 对比分析 - 适合柱状图
            if 'name' in columns or 'title' in columns:
                name_col = 'name' if 'name' in columns else 'title'
                suggestions.append({
                    "query": f"对比 {table_name} 中不同 {name_col} 的数据",
                    "category": "对比分析",
                    "chart_type": "bar",
                    "icon": "📊"
                })
        
        # 限制返回数量，每个类别最多2个，并随机选择
        categorized = {}
        for s in suggestions:
            cat = s['category']
            if cat not in categorized:
                categorized[cat] = []
            categorized[cat].append(s)
        
        # 从每个类别中随机选择最多2个
        result = []
        for items in categorized.values():
            random.shuffle(items)  # 随机打乱
            result.extend(items[:2])  # 取前2个
        
        # 最后再随机打乱所有结果
        random.shuffle(result)
        return result[:12]  # 最多返回12个提示词
    
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
