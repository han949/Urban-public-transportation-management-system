const { Pool } = require('pg');

// 创建数据库连接池配置
const pool = new Pool({
  user: 'postgres',      // 数据库用户名，需要根据实际情况修改
  host: 'localhost',     // 数据库主机地址
  database: 'busSystem', // 数据库名称，需要提前在PostgreSQL中创建
  password: '123456',  // 数据库密码，需要根据实际情况修改
  port: 5432,           // PostgreSQL默认端口
});

// 测试数据库连接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功，当前时间:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};