import React, { useState, useCallback } from 'react'
import TabBar from './components/tab-bar'
import CSVViewer from './components/csv-viewer'
import CursorDashboard from './components/cursor-dashboard'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('csv-viewer')
  const [externalCSV, setExternalCSV] = useState(null)

  // 处理从 Dashboard 导出的 CSV
  const handleExportCSV = useCallback((csvData) => {
    // csvData 包含 { filePath, fileName, content, size }
    setExternalCSV(csvData)
    // 自动切换到 CSV 查看器 Tab
    setActiveTab('csv-viewer')
  }, [])

  // 清除外部 CSV 引用
  const handleClearExternalCSV = useCallback(() => {
    setExternalCSV(null)
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
        {activeTab === 'csv-viewer' && (
          <CSVViewer 
            externalCSV={externalCSV}
            onClearExternalCSV={handleClearExternalCSV}
            onNeedLogin={handleNeedLogin}
          />
        )}
        
        {activeTab === 'cursor-dashboard' && (
          <CursorDashboard 
            onExportCSV={handleExportCSV}
          />
        )}
      </div>
    </div>
  )
}

export default App
