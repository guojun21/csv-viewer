import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import './StatisticBar.css'

/**
 * CostStatCard - 费用统计卡片
 * 点击展开显示详细统计信息
 */
function CostStatCard({ stats, columnName, mode = 'liquid' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  // 点击外部关闭 - 现在通过 overlay 处理
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 检查点击是否在 dropdown 内
      const dropdown = document.querySelector('.stat-card-dropdown')
      if (dropdown && dropdown.contains(event.target)) {
        return
      }
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatCurrency = (value) => {
    return `$${value.toFixed(2)}`
  }

  // 计算 dropdown 位置
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="stat-card" ref={containerRef}>
      <button 
        ref={triggerRef}
        className={`stat-card-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
      >
        <div className="stat-card-icon cost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div className="stat-card-info">
          <div className="stat-card-label">Total Cost</div>
          <div className="stat-card-value cost">{formatCurrency(stats.total)}</div>
        </div>
        <svg className={`stat-card-chevron ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <div className="stat-card-overlay" onClick={() => setIsOpen(false)} />
          <div 
            className={`stat-card-dropdown animate-stat-in mode-${mode}`}
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            {/* 液态玻璃效果层 */}
            <div className="liquidGlass-effect"></div>
            <div className="liquidGlass-tint"></div>
            <div className="liquidGlass-shine"></div>
            
            {/* 内容层 */}
            <div className="liquidGlass-content">
              <div className="stat-detail-header">
                <div className="stat-card-icon cost">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <span className="stat-detail-title">Cost Statistics</span>
              </div>

              <div className="stat-items">
                <div className="stat-item">
                  <span className="stat-item-label">总计 (Total)</span>
                  <span className="stat-item-value highlight">{formatCurrency(stats.total)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">平均 (Average)</span>
                  <span className="stat-item-value">{formatCurrency(stats.avg)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">最高 (Max)</span>
                  <span className="stat-item-value">{formatCurrency(stats.max)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">最低 (Min)</span>
                  <span className="stat-item-value">{formatCurrency(stats.min)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item-label">记录数 (Count)</span>
                  <span className="stat-item-value">{stats.count.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* SVG 滤镜定义 */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <filter id="glass-distortion-stat" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
                  <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
                  <feComponentTransfer in="turbulence" result="mapped">
                    <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
                    <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
                    <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
                  </feComponentTransfer>
                  <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
                  <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white" result="specLight">
                    <fePointLight x="-200" y="-200" z="300" />
                  </feSpecularLighting>
                  <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
                  <feDisplacementMap in="SourceGraphic" in2="softMap" scale="150" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
            </svg>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default CostStatCard
