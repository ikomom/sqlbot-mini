// API 基础配置
const API_BASE_URL = '/api'

/**
 * 通用请求处理函数
 */
async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || `请求失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

/**
 * 数据库相关 API
 */
export const databaseApi = {
  /**
   * 连接数据库
   * @param {Object} config - 数据库配置
   * @param {string} config.type - 数据库类型 (postgresql, mysql, sqlite)
   * @param {string} config.host - 主机地址
   * @param {number} config.port - 端口号
   * @param {string} config.database - 数据库名
   * @param {string} config.username - 用户名
   * @param {string} config.password - 密码
   */
  connect: (config) => {
    return request('/database/connect', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  },

  /**
   * 检查数据库连接状态
   */
  getStatus: () => {
    return request('/database/status')
  },

  /**
   * 获取数据库结构信息
   */
  getSchema: () => {
    return request('/database/schema')
  }
}

/**
 * 查询相关 API
 */
export const queryApi = {
  /**
   * 执行自然语言查询
   * @param {string} naturalQuery - 自然语言查询
   * @param {string} aiProvider - AI 提供商 (可选)
   */
  executeNaturalQuery: (naturalQuery, aiProvider = null) => {
    return request('/query', {
      method: 'POST',
      body: JSON.stringify({
        natural_query: naturalQuery,
        ai_provider: aiProvider
      })
    })
  },

  /**
   * 执行原始 SQL 查询
   * @param {string} sql - SQL 语句
   */
  executeSql: (sql) => {
    return request('/query/sql', {
      method: 'POST',
      body: JSON.stringify({ sql })
    })
  }
}
