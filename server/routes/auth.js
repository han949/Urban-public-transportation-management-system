const express = require('express');
const router = express.Router();

// 模拟用户数据
const users = [
  { username: 'a', password: '1' },
  { username: 'user', password: 'password' },
];

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '账号和密码不能为空' }); // 确保返回 JSON
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    res.json({ message: '登录成功' }); // 确保返回 JSON
  } else {
    res.status(401).json({ message: '账号或密码错误' }); // 确保返回 JSON
  }
});

module.exports = router;
