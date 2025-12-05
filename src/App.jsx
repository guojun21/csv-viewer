import React, { useState, useCallback } from 'react'
import TabBar from './components/tab-bar'
import CSVViewer from './components/csv-viewer'
import CursorDashboard from './components/cursor-dashboard'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('data-viewer')
  const [pulledData, setPulledData] = useState(null)

  // 处理从 Dashboard Pull 的数据
  const handleDataPulled = useCallback((data) => {
    // data 包含 { filePath, fileName, content, size, syncTime }
    setPulledData(data)
    // 自动切换到数据分析 Tab
    setActiveTab('data-viewer')
  }, [])

  // 清除外部数据引用
  const handleClearPulledData = useCallback(() => {
    setPulledData(null)
  }, [])

  // 需要登录时跳转到 Cursor Dashboard
  const handleNeedLogin = useCallback(() => {
    setActiveTab('cursor-dashboard')
  }, [])

  return (
    <div className="app">
      <TabBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <div className="tab-content">
        {activeTab === 'data-viewer' && (
          <CSVViewer 
            externalCSV={pulledData}
            onClearExternalCSV={handleClearPulledData}
            onNeedLogin={handleNeedLogin}
          />
        )}
        
        {activeTab === 'cursor-dashboard' && (
          <CursorDashboard 
            onDataPulled={handleDataPulled}
          />
        )}
      </div>
    </div>
  )
}

export default App
