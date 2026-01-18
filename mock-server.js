import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 假数据
const users = [
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    email: 'admin@example.com',
    mobile: '13800138000',
    deptId: 1,
    postIds: [1],
    status: 0,
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    username: 'user001',
    nickname: '张三',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'zhangsan@example.com',
    mobile: '13800138001',
    deptId: 2,
    postIds: [2],
    status: 0,
    createTime: '2024-01-02 10:00:00'
  },
  {
    id: 3,
    username: 'user002',
    nickname: '李四',
    avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    email: 'lisi@example.com',
    mobile: '13800138002',
    deptId: 2,
    postIds: [2],
    status: 0,
    createTime: '2024-01-03 10:00:00'
  },
  {
    id: 4,
    username: 'user003',
    nickname: '王五',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    email: 'wangwu@example.com',
    mobile: '13800138003',
    deptId: 3,
    postIds: [3],
    status: 1,
    createTime: '2024-01-04 10:00:00'
  },
  {
    id: 5,
    username: 'user004',
    nickname: '赵六',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'zhaoliu@example.com',
    mobile: '13800138004',
    deptId: 3,
    postIds: [3],
    status: 0,
    createTime: '2024-01-05 10:00:00'
  }
]

const roles = [
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    status: 0,
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    name: '普通用户',
    code: 'user',
    status: 0,
    createTime: '2024-01-01 10:00:00'
  }
]

const menus = [
  {
    id: 1,
    name: '系统管理',
    icon: 'Setting',
    path: '/system',
    component: null,
    sort: 1,
    visible: true,
    children: [
      {
        id: 11,
        name: '用户管理',
        icon: 'User',
        path: 'user',
        component: 'system/user',
        sort: 1,
        visible: true
      },
      {
        id: 12,
        name: '角色管理',
        icon: 'Lock',
        path: 'role',
        component: 'system/role',
        sort: 2,
        visible: true
      },
      {
        id: 13,
        name: '菜单管理',
        icon: 'Menu',
        path: 'menu',
        component: 'system/menu',
        sort: 3,
        visible: true
      }
    ]
  }
]

// 通用响应格式
const success = (data = null, msg = 'success') => ({
  code: 0,
  data,
  msg
})

const error = (msg = 'error', code = 1) => ({
  code,
  data: null,
  msg
})

// 登录接口
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body

  if (username === 'admin' && password === 'admin123') {
    const token = 'mock-jwt-token-' + Date.now()
    res.json(success({ token, user: users[0] }, '登录成功'))
  } else {
    res.status(401).json(error('用户名或密码错误', 401))
  }
})

// 获取用户信息接口
app.get('/auth/info', (req, res) => {
  res.json(
    success({
      ...users[0],
      roles: ['admin'],
      permissions: ['*:*:*']
    })
  )
})

// 获取当前用户菜单路由
app.get('/auth/menus', (req, res) => {
  // 返回后端菜单格式，由前端转换为路由
  const routes = [
    {
      path: '/system',
      name: 'System',
      component: null, // 父级路由不需要 component
      meta: {
        title: '系统管理',
        icon: 'Setting',
        visible: true
      },
      children: [
        {
          path: 'user',
          name: 'User',
          component: 'system/user/index',
          meta: {
            title: '用户管理',
            icon: 'User',
            visible: true
          }
        },
        {
          path: 'role',
          name: 'Role',
          component: 'system/role/index',
          meta: {
            title: '角色管理',
            icon: 'Lock',
            visible: true
          }
        },
        {
          path: 'menu',
          name: 'Menu',
          component: 'system/menu/index',
          meta: {
            title: '菜单管理',
            icon: 'Menu',
            visible: true
          }
        }
      ]
    }
  ]

  console.log('返回菜单数据:', JSON.stringify(routes, null, 2))
  res.json(success(routes))
})

// 退出登录接口
app.post('/auth/logout', (req, res) => {
  res.json(success(null, '退出成功'))
})

// 获取用户列表（分页）
app.get('/system/user/page', (req, res) => {
  const { pageNo = 1, pageSize = 10, username, status } = req.query

  let filteredUsers = [...users]

  // 过滤
  if (username) {
    filteredUsers = filteredUsers.filter((u) => u.username.includes(username))
  }
  if (status !== undefined && status !== '') {
    filteredUsers = filteredUsers.filter((u) => u.status === parseInt(status))
  }

  // 分页
  const start = (pageNo - 1) * pageSize
  const end = start + parseInt(pageSize)
  const list = filteredUsers.slice(start, end)

  res.json(
    success({
      list,
      total: filteredUsers.length
    })
  )
})

// 获取用户详情
app.get('/system/user/:id', (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id))
  if (user) {
    res.json(success(user))
  } else {
    res.json(error('用户不存在'))
  }
})

// 新增用户
app.post('/system/user', (req, res) => {
  const newUser = {
    id: users.length + 1,
    ...req.body,
    createTime: new Date().toLocaleString()
  }
  users.push(newUser)
  res.json(success(newUser, '创建成功'))
})

// 更新用户
app.put('/system/user', (req, res) => {
  const index = users.findIndex((u) => u.id === req.body.id)
  if (index > -1) {
    users[index] = { ...users[index], ...req.body }
    res.json(success(users[index], '更新成功'))
  } else {
    res.json(error('用户不存在'))
  }
})

// 删除用户
app.delete('/system/user/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id))
  if (index > -1) {
    users.splice(index, 1)
    res.json(success(null, '删除成功'))
  } else {
    res.json(error('用户不存在'))
  }
})

// 批量删除用户
app.delete('/system/user/batch', (req, res) => {
  const { ids } = req.body
  ids.forEach((id) => {
    const index = users.findIndex((u) => u.id === id)
    if (index > -1) {
      users.splice(index, 1)
    }
  })
  res.json(success(null, '删除成功'))
})

// 导出用户
app.get('/system/user/export', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx')
  res.send('Excel file content (mock)')
})

// 获取角色列表（分页）
app.get('/system/role/page', (req, res) => {
  const { pageNo = 1, pageSize = 10, name, status } = req.query

  let filteredRoles = [...roles]

  // 过滤
  if (name) {
    filteredRoles = filteredRoles.filter((r) => r.name.includes(name))
  }
  if (status !== undefined && status !== '') {
    filteredRoles = filteredRoles.filter((r) => r.status === parseInt(status))
  }

  // 分页
  const start = (pageNo - 1) * pageSize
  const end = start + parseInt(pageSize)
  const list = filteredRoles.slice(start, end)

  res.json(
    success({
      list,
      total: filteredRoles.length
    })
  )
})

// 获取所有角色
app.get('/system/role/list', (req, res) => {
  res.json(success(roles))
})

// 获取角色详情
app.get('/system/role/:id', (req, res) => {
  const role = roles.find((r) => r.id === parseInt(req.params.id))
  if (role) {
    res.json(success(role))
  } else {
    res.json(error('角色不存在'))
  }
})

// 新增角色
app.post('/system/role', (req, res) => {
  const newRole = {
    id: roles.length + 1,
    ...req.body,
    createTime: new Date().toLocaleString()
  }
  roles.push(newRole)
  res.json(success(newRole, '创建成功'))
})

// 更新角色
app.put('/system/role', (req, res) => {
  const index = roles.findIndex((r) => r.id === req.body.id)
  if (index > -1) {
    roles[index] = { ...roles[index], ...req.body }
    res.json(success(roles[index], '更新成功'))
  } else {
    res.json(error('角色不存在'))
  }
})

// 删除角色
app.delete('/system/role/:id', (req, res) => {
  const index = roles.findIndex((r) => r.id === parseInt(req.params.id))
  if (index > -1) {
    roles.splice(index, 1)
    res.json(success(null, '删除成功'))
  } else {
    res.json(error('角色不存在'))
  }
})

// 批量删除角色
app.delete('/system/role/batch', (req, res) => {
  const { ids } = req.body
  ids.forEach((id) => {
    const index = roles.findIndex((r) => r.id === id)
    if (index > -1) {
      roles.splice(index, 1)
    }
  })
  res.json(success(null, '删除成功'))
})

// 分配角色菜单
app.post('/system/role/menu', (req, res) => {
  const { roleId, menuIds } = req.body
  res.json(success(null, '分配成功'))
})

// 获取菜单列表
app.get('/system/menu/list', (req, res) => {
  res.json(success(menus))
})

// 获取菜单详情
app.get('/system/menu/:id', (req, res) => {
  const findMenu = (list, id) => {
    for (const menu of list) {
      if (menu.id === id) return menu
      if (menu.children) {
        const found = findMenu(menu.children, id)
        if (found) return found
      }
    }
    return null
  }

  const menu = findMenu(menus, parseInt(req.params.id))
  if (menu) {
    res.json(success(menu))
  } else {
    res.json(error('菜单不存在'))
  }
})

// 新增菜单
app.post('/system/menu', (req, res) => {
  const newMenu = {
    id: Date.now(),
    ...req.body
  }
  menus.push(newMenu)
  res.json(success(newMenu, '创建成功'))
})

// 更新菜单
app.put('/system/menu', (req, res) => {
  const updateMenuRecursive = (list, data) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === data.id) {
        list[i] = { ...list[i], ...data }
        return true
      }
      if (list[i].children) {
        if (updateMenuRecursive(list[i].children, data)) {
          return true
        }
      }
    }
    return false
  }

  if (updateMenuRecursive(menus, req.body)) {
    res.json(success(req.body, '更新成功'))
  } else {
    res.json(error('菜单不存在'))
  }
})

// 删除菜单
app.delete('/system/menu/:id', (req, res) => {
  const deleteMenuRecursive = (list, id) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list.splice(i, 1)
        return true
      }
      if (list[i].children) {
        if (deleteMenuRecursive(list[i].children, id)) {
          return true
        }
      }
    }
    return false
  }

  if (deleteMenuRecursive(menus, parseInt(req.params.id))) {
    res.json(success(null, '删除成功'))
  } else {
    res.json(error('菜单不存在'))
  }
})

// 获取用户菜单
app.get('/system/menu/user', (req, res) => {
  res.json(success(menus))
})

// 健康检查
app.get('/health', (req, res) => {
  res.json(success({ status: 'ok' }))
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`Mock server is running on http://localhost:${PORT}`)
  console.log(`API base URL: http://localhost:${PORT}/api`)
})
