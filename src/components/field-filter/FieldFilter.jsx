import React, { useState, useEffect, useRef } from 'react'
import './FieldFilter.css'

/**
 * FieldFilter - 字段筛选组件
 * 支持多选筛选，带搜索功能
 */
function FieldFilter({ 
  fieldName,           // 字段名称
  data,                // 所有数据
  selectedValues,      // 已选中的值
  onChange,            // 选中值变化回调
  mode = 'blur'        // 效果模式: 'blur' (毛玻璃)
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const dropdownRef = useRef(null)

  // 获取该字段的所有唯一值
  const uniqueValues = React.useMemo(() => {
    if (!data || !fieldName) return []
    
    const valuesSet = new Set()
    data.forEach(row => {
      const value = row[fieldName]
      if (value !== null && value !== undefined && value !== '') {
        valuesSet.add(String(value))
      }
    })
    
    return Array.from(valuesSet).sort()
  }, [data, fieldName])

  // 过滤后的值列表
  const filteredValues = React.useMemo(() => {
    if (!searchText) return uniqueValues
    const search = searchText.toLowerCase()
    return uniqueValues.filter(val => 
      String(val).toLowerCase().includes(search)
    )
  }, [uniqueValues, searchText])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

  // 切换值的选中状态
  const toggleValue = (value) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newSelected)
  }

  // 全选
  const selectAll = () => {
    onChange([...uniqueValues])
  }

  // 清空
  const clearAll = () => {
    onChange([])
  }

  // 显示文本
  const displayText = React.useMemo(() => {
    if (!selectedValues || selectedValues.length === 0) {
      return `全部 ${fieldName}`
    }
    if (selectedValues.length === uniqueValues.length) {
      return `全部 ${fieldName}`
    }
    if (selectedValues.length === 1) {
      return selectedValues[0]
    }
    return `${selectedValues.length} 项已选`
  }, [selectedValues, uniqueValues.length, fieldName])

  const hasFilter = selectedValues && selectedValues.length > 0 && selectedValues.length < uniqueValues.length

  return (
    <div className="field-filter" ref={dropdownRef}>
      <button 
        className={`field-filter-trigger ${hasFilter ? 'has-filter' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`筛选 ${fieldName}`}
      >
        <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span className="filter-label">{displayText}</span>
        {hasFilter && (
          <span className="filter-badge">{selectedValues.length}</span>
        )}
        <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div className={`field-filter-dropdown ${mode}`}>
          {/* 搜索框 */}
          <div className="filter-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={`搜索 ${fieldName}...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoFocus
            />
            {searchText && (
              <button 
                className="clear-search"
                onClick={() => setSearchText('')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="filter-actions">
            <button 
              className="filter-action-btn"
              onClick={selectAll}
            >
              全选
            </button>
            <button 
              className="filter-action-btn"
              onClick={clearAll}
            >
              清空
            </button>
          </div>

          {/* 值列表 */}
          <div className="filter-values">
            {filteredValues.length === 0 ? (
              <div className="no-results">无匹配结果</div>
            ) : (
              filteredValues.map(value => (
                <label key={value} className="filter-value-item">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(value)}
                    onChange={() => toggleValue(value)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="value-text">{value}</span>
                </label>
              ))
            )}
          </div>

          {/* 统计信息 */}
          <div className="filter-stats">
            已选 {selectedValues.length} / {uniqueValues.length} 项
          </div>
        </div>
      )}
    </div>
  )
}

export default FieldFilter

