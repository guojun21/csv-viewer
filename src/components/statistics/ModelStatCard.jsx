import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import './StatisticBar.css'

/**
 * ModelStatCard - 模型分布统计卡片
 * 点击展开显示模型使用分布
 */
function ModelStatCard({ stats, columnName, mode = 'liquid' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  // 点击外部关闭
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

  // 获取最常用的模型
  const topModel = stats.models[0]
  const modelCount = stats.models.length

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
        <div className="stat-card-icon model">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div className="stat-card-info">
          <div className="stat-card-label">Models ({modelCount})</div>
          <div className="stat-card-value model">{topModel?.name || 'N/A'}</div>
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
                <div className="stat-card-icon model">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <span className="stat-detail-title">Model Distribution</span>
              </div>

              <div className="model-distribution">
                {stats.models.slice(0, 6).map((model, index) => (
                  <div className="model-item" key={model.name}>
                    <div className="model-item-header">
                      <span className="model-name">{model.name}</span>
                      <span className="model-count">
                        {model.count.toLocaleString()} ({model.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="model-bar-bg">
                      <div 
                        className={`model-bar color-${index % 6}`}
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                
                {stats.models.length > 6 && (
                  <div className="stat-item" style={{ marginTop: '8px' }}>
                    <span className="stat-item-label">其他模型</span>
                    <span className="stat-item-value">{stats.models.length - 6} 个</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* SVG 滤镜定义 - 使用不同 ID 避免冲突 */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <filter id="glass-distortion-stat-model" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
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

export default ModelStatCard
