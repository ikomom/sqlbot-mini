"""
测试 SQL 错误自动修复功能

这个脚本模拟一个会失败的 SQL 查询，验证 AI 能否自动修复
"""
import asyncio
import sys
import os

# 添加 backend 目录到 Python 路径
sys.path.insert(0, os.path.dirname(__file__))

from ai_provider import AIProvider
from db_manager import db_manager
from config import settings


async def test_sql_retry():
    """测试 SQL 重试机制"""
    print("=" * 60)
    print("测试 SQL 错误自动修复功能")
    print("=" * 60)
    
    # 1. 连接数据库
    print("\n1. 连接数据库...")
    try:
        db_config = {
            "type": settings.default_db_type,
            "host": settings.default_db_host,
            "port": settings.default_db_port,
            "database": settings.default_db_name,
            "username": settings.default_db_user,
            "password": settings.default_db_password,
        }
        db_manager.connect(db_config)
        
        if not db_manager.test_connection():
            print("❌ 数据库连接失败")
            return
        
        print("✅ 数据库连接成功")
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return
    
    # 2. 获取数据库结构
    print("\n2. 获取数据库结构...")
    try:
        schema = db_manager.get_schema_context()
        print(f"✅ 获取到 {len(schema)} 字符的结构信息")
        print(f"   前 200 字符: {schema[:200]}...")
    except Exception as e:
        print(f"❌ 获取结构失败: {e}")
        return
    
    # 3. 测试正常查询
    print("\n3. 测试正常查询...")
    ai = AIProvider(provider=settings.ai_provider)
    natural_query = "查询所有表的记录数"
    
    try:
        sql = await ai.generate_sql(natural_query, schema)
        print(f"✅ 生成 SQL: {sql}")
        
        result = db_manager.execute_query(sql)
        print(f"✅ 查询成功，返回 {result['row_count']} 行")
    except Exception as e:
        print(f"⚠️  查询失败: {e}")
    
    # 4. 测试错误修复（构造一个会失败的查询）
    print("\n4. 测试 SQL 错误修复...")
    print("   构造一个包含错误字段名的查询...")
    
    # 手动构造一个错误的 SQL（假设表中没有 nonexistent_column 字段）
    bad_sql = "SELECT nonexistent_column FROM users LIMIT 10"
    print(f"   错误 SQL: {bad_sql}")
    
    try:
        result = db_manager.execute_query(bad_sql)
        print(f"⚠️  意外成功（可能表中真的有这个字段）")
    except Exception as e:
        error_msg = str(e)
        print(f"✅ 预期错误: {error_msg[:100]}...")
        
        # 让 AI 修复
        print("\n   让 AI 修复 SQL...")
        try:
            fixed_sql = await ai.fix_sql_error(
                natural_query="查询用户表的前10条记录",
                original_sql=bad_sql,
                error_message=error_msg,
                schema_context=schema
            )
            print(f"✅ AI 修复后的 SQL: {fixed_sql}")
            
            # 尝试执行修复后的 SQL
            result = db_manager.execute_query(fixed_sql)
            print(f"✅ 修复后查询成功，返回 {result['row_count']} 行")
        except Exception as fix_error:
            print(f"❌ 修复失败: {fix_error}")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_sql_retry())
