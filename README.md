# 旋转六边形弹跳球 🎮

基于Solid.js构建的物理引擎模拟游戏，展示了重力、摩擦力和弹性碰撞的物理效果。

## ✨ 功能特色

- 🎯 实时物理引擎模拟
- ⚙️ 可调节物理参数（重力、摩擦力、弹性）
- 🎮 交互式控制面板
- 📊 实时轨迹显示
- ⏸️ 暂停/继续动画
- 🔄 重置功能
- 📱 响应式设计

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或者
pnpm install
# 或者
yarn install
```

### 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
npm run build
```

构建完成后，文件将输出到 `dist` 文件夹中。

### 预览生产版本

```bash
npm run preview
```

## 🎮 使用说明

- **调整滑块**：实时改变重力、摩擦力和弹性等物理参数
- **暂停/继续**：点击按钮控制动画播放
- **重置**：重新开始模拟
- **轨迹显示**：开启/关闭小球运动轨迹

## 🛠️ 技术栈

- **框架**: [Solid.js](https://solidjs.com) - 高性能响应式UI框架
- **构建工具**: [Vite](https://vitejs.dev) - 快速构建工具
- **语言**: TypeScript - 类型安全的JavaScript
- **物理引擎**: 自定义实现的2D物理引擎

## 📁 项目结构

```
src/
├── components/          # 组件目录
│   └── BouncingBall.tsx # 主要的弹跳球组件
├── App.tsx             # 主应用组件
├── App.css             # 样式文件
└── index.tsx           # 应用入口
```

## 🔧 开发

### 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览构建结果

### 技术细节

该项目实现了一个简单但完整的2D物理引擎，包括：

- 重力系统
- 碰撞检测（六边形边界）
- 弹性碰撞响应
- 摩擦力计算
- 实时参数调节

## 🚀 部署

了解更多部署信息请查看 [Vite部署文档](https://vite.dev/guide/static-deploy.html)

## 📚 了解更多

- [Solid.js官网](https://solidjs.com) - 学习Solid.js框架
- [Solid.js Discord](https://discord.com/invite/solidjs) - 加入社区讨论
