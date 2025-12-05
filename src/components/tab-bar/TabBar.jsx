import React from 'react'
import './TabBar.css'

const TabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'data-viewer', label: '数据分析', icon: '📊' },
    { id: 'cursor-dashboard', label: '账户设置', icon: '⚙️' }
  ]

  return (
    <div className="tab-bar">
      <div className="tab-bar-inner">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {activeTab === tab.id && <div className="tab-indicator" />}
          </button>
        ))}
      </div>
      <div className="tab-bar-actions">
        {/* 可以放置全局操作按钮 */}
      </div>
    </div>
  )
}

export default TabBar

