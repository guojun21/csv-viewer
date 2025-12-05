import React from 'react'
import './EmptyState.css'

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 格式化相对时间
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString()
}

function EmptyState({ onFileSelect, isLoading, recentFiles = [], onOpenRecent, onClearRecent }) {
  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-text">正在加载数据...</p>
      </div>
    )
  }

  return (
    <div className="empty-state">
      {/* Logo 和标题 */}
      <div className="welcome-header">
        <div className="app-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
        </div>
        <h1 className="app-name">CSV Viewer</h1>
        <p className="app-tagline">轻量级 · 高性能</p>
      </div>

      {/* 操作按钮 */}
      <div className="action-cards">
        <button className="action-card" onClick={onFileSelect}>
          <div className="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="action-label">打开文件</span>
        </button>
      </div>

      {/* 最近打开的文件 */}
      {recentFiles.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <span className="recent-title">最近打开</span>
            <button className="view-all-btn" onClick={onClearRecent}>
              清除记录
            </button>
          </div>
          
          <div className="recent-list">
            {recentFiles.slice(0, 5).map((file, index) => (
              <button 
                key={file.id || index} 
                className="recent-item"
                onClick={() => onOpenRecent?.(file)}
              >
                <div className="recent-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="recent-item-info">
                  <span className="recent-item-name">{file.name}</span>
                  <span className="recent-item-meta">
                    {file.recordCount ? `${file.recordCount.toLocaleString()} 条记录` : ''}
                    {file.recordCount && file.openedAt ? ' · ' : ''}
                    {formatRelativeTime(file.openedAt)}
                  </span>
                </div>
                <span className="recent-item-size">{formatFileSize(file.size)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 拖放提示 */}
      <div className="drop-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>拖放 CSV 文件到此处</span>
      </div>
    </div>
  )
}

export default EmptyState

