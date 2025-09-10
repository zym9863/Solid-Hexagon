import BouncingBall from './components/BouncingBall'
import './App.css'

function App() {
  return (
    <div class="app">
      <header class="app-header">
        <h1>旋转六边形弹跳球</h1>
        <p class="subtitle">物理引擎模拟 - 重力、摩擦力、弹性碰撞</p>
      </header>
      
      <main class="app-main">
        <BouncingBall 
          width={900}
          height={700}
          hexagonRadius={250}
        />
      </main>
      
      <footer class="app-footer">
        <div class="instructions">
          <h3>使用说明：</h3>
          <ul>
            <li>调整滑块改变物理参数</li>
            <li>点击暂停/继续控制动画</li>
            <li>使用重置按钮重新开始</li>
            <li>开启/关闭轨迹显示</li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

export default App
