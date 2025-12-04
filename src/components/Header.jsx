import React from 'react'
import { LiquidGlassDatePicker } from './datepicker'
import './Header.css'

function Header({ 
  fileName, 
  recordCount,
  filteredCount,
  onFileSelect, 
  onRefresh, 
  onToggleSettings,
  showSettings,
  density,
  onDensityChange,
  dateRange,
  onDateRangeChange,
  hasData
}) {
  return (
    <header className="header drag-region">
      <div className="header-left">
        <div className="app-title">
          <svg className="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
          <span>CSV Viewer</span>
        </div>
        
        {fileName && (
          <div className="file-info animate-fade-in">
            <span className="file-name">{fileName}</span>
            <span className="record-count">
              {filteredCount !== recordCount 
                ? `${filteredCount.toLocaleString()} / ${recordCount.toLocaleString()} 条记录`
                : `${recordCount.toLocaleString()} 条记录`
              }
            </span>
          </div>
        )}
      </div>
      
      <div className="header-right no-drag">
        {/* 日期范围筛选 */}
        {hasData && (
          <LiquidGlassDatePicker
            value={dateRange}
            onChange={onDateRangeChange}
            mode="blur"
          />
        )}
        
        {/* 刷新按钮 */}
        <button 
          className="header-btn icon-btn" 
          onClick={onRefresh}
          title="刷新"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        
        {/* 密度切换 */}
        <div className="density-toggle" title="行密度">
          <button 
            className={`density-btn ${density === 'compact' ? 'active' : ''}`}
            onClick={() => onDensityChange('compact')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="3" y1="14" x2="21" y2="14"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button 
            className={`density-btn ${density === 'default' ? 'active' : ''}`}
            onClick={() => onDensityChange('default')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="5" x2="21" y2="5"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="19" x2="21" y2="19"/>
            </svg>
          </button>
          <button 
            className={`density-btn ${density === 'comfortable' ? 'active' : ''}`}
            onClick={() => onDensityChange('comfortable')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="4" x2="21" y2="4"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="20" x2="21" y2="20"/>
            </svg>
          </button>
        </div>
        
        {/* 列设置按钮 */}
        <button 
          className={`header-btn icon-btn ${showSettings ? 'active' : ''}`}
          onClick={onToggleSettings}
          title="列设置"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        
        {/* 打开文件按钮 */}
        <button 
          className="header-btn primary-btn"
          onClick={onFileSelect}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          打开文件
        </button>
      </div>
    </header>
  )
}

export default Header

