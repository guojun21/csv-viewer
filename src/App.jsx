import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import { StatisticBar } from './components/statistics'
import DataTable from './components/DataTable'
import ColumnSettings from './components/ColumnSettings'
import EmptyState from './components/EmptyState'
import Papa from 'papaparse'
import './App.css'

// 检查是否在 Electron 环境
const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

// 获取 ipcRenderer (仅 Electron 环境)
const getIpcRenderer = () => {
  if (isElectron) {
    return window.require('electron').ipcRenderer
  }
  return null
}

function App() {
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [visibleColumns, setVisibleColumns] = useState([])
  const [columnOrder, setColumnOrder] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [density, setDensity] = useState('default') // 'compact', 'default', 'comfortable'
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [recentFiles, setRecentFiles] = useState([])

  // 初始化加载最近文件列表
  useEffect(() => {
    const loadRecentFiles = async () => {
      const ipc = getIpcRenderer()
      if (ipc) {
        const files = await ipc.invoke('get-recent-files')
        setRecentFiles(files || [])
      }
    }
    loadRecentFiles()
  }, [])

  // 解析 CSV 数据
  const parseCSV = useCallback((content, name, fileSize = 0, filePath = '') => {
    setIsLoading(true)
    
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data
        const cols = results.meta.fields || []
        
        setData(parsedData)
        setColumns(cols)
        setVisibleColumns(cols)
        setColumnOrder(cols)
        setFileName(name)
        setSortConfig({ key: null, direction: 'asc' })
        setIsLoading(false)
        
        // 保存到最近打开的文件 (通过 IPC)
        const ipc = getIpcRenderer()
        if (ipc && filePath) {
          const fileInfo = {
            id: Date.now(),
            name,
            filePath,
            size: fileSize,
            recordCount: parsedData.length,
            openedAt: Date.now()
          }
          const updated = await ipc.invoke('save-recent-file', fileInfo)
          setRecentFiles(updated || [])
        }
      },
      error: (error) => {
        console.error('CSV 解析错误:', error)
        setIsLoading(false)
      }
    })
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (ipc) {
      const result = await ipc.invoke('select-file')
      if (result) {
        const name = result.filePath.split('/').pop()
        parseCSV(result.content, name, result.size || 0, result.filePath)
      }
    } else {
      // 浏览器环境下使用 file input (不支持持久化路径)
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.csv'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            parseCSV(event.target.result, file.name, file.size, '')
          }
          reader.readAsText(file)
        }
      }
      input.click()
    }
  }, [parseCSV])

  // 处理拖放
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader()
      // 拖放的文件可以获取 path (Electron 环境)
      const filePath = file.path || ''
      reader.onload = (event) => {
        parseCSV(event.target.result, file.name, file.size, filePath)
      }
      reader.readAsText(file)
    }
  }, [parseCSV])

  // 清除最近文件记录
  const handleClearRecent = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (ipc) {
      await ipc.invoke('clear-recent-files')
    }
    setRecentFiles([])
  }, [])

  // 处理点击最近打开的文件（直接读取文件）
  const handleOpenRecent = useCallback(async (fileInfo) => {
    const ipc = getIpcRenderer()
    if (ipc && fileInfo.filePath) {
      setIsLoading(true)
      const result = await ipc.invoke('read-file-by-path', fileInfo.filePath)
      if (result.success) {
        parseCSV(result.content, result.name, result.size, result.filePath)
      } else {
        // 文件不存在或读取失败，提示用户
        console.error('读取文件失败:', result.error)
        alert(`无法打开文件: ${result.error}`)
        setIsLoading(false)
      }
    }
  }, [parseCSV])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  // 排序
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // 查找日期列
  const dateColumn = React.useMemo(() => {
    return columns.find(col => col.toLowerCase().includes('date'))
  }, [columns])

  // 根据日期范围筛选数据
  const filteredData = React.useMemo(() => {
    if (!dateRange.start && !dateRange.end) return data
    if (!dateColumn) return data

    return data.filter(row => {
      const dateValue = row[dateColumn]
      if (!dateValue) return false
      
      const rowDate = new Date(dateValue)
      if (isNaN(rowDate)) return false

      // 设置日期边界（开始日期的开始时刻，结束日期的结束时刻）
      if (dateRange.start && dateRange.end) {
        const startOfDay = new Date(dateRange.start)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(dateRange.end)
        endOfDay.setHours(23, 59, 59, 999)
        return rowDate >= startOfDay && rowDate <= endOfDay
      }
      
      if (dateRange.start) {
        const startOfDay = new Date(dateRange.start)
        startOfDay.setHours(0, 0, 0, 0)
        return rowDate >= startOfDay
      }
      
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end)
        endOfDay.setHours(23, 59, 59, 999)
        return rowDate <= endOfDay
      }

      return true
    })
  }, [data, dateRange, dateColumn])

  // 获取排序后的数据
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      
      // 尝试作为日期比较
      if (sortConfig.key.toLowerCase().includes('date')) {
        const dateA = new Date(aVal)
        const dateB = new Date(bVal)
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
        }
      }
      
      // 尝试作为数字比较
      const numA = parseFloat(aVal)
      const numB = parseFloat(bVal)
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA
      }
      
      // 字符串比较
      const strA = String(aVal || '')
      const strB = String(bVal || '')
      return sortConfig.direction === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA)
    })
  }, [filteredData, sortConfig])

  // 切换列可见性
  const toggleColumnVisibility = useCallback((column) => {
    setVisibleColumns(prev => 
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }, [])

  // 重置列设置
  const resetColumns = useCallback(() => {
    setVisibleColumns(columns)
    setColumnOrder(columns)
  }, [columns])

  // 刷新数据
  const handleRefresh = useCallback(() => {
    if (data.length > 0) {
      // 重新应用排序
      setSortConfig(prev => ({ ...prev }))
    }
  }, [data])

  return (
    <div 
      className="app" 
      onDrop={handleDrop} 
      onDragOver={handleDragOver}
    >
      <Header 
        fileName={fileName}
        recordCount={data.length}
        filteredCount={filteredData.length}
        onFileSelect={handleFileSelect}
        onRefresh={handleRefresh}
        onToggleSettings={() => setShowColumnSettings(!showColumnSettings)}
        showSettings={showColumnSettings}
        density={density}
        onDensityChange={setDensity}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        hasData={data.length > 0}
      />
      
      {/* 统计栏 - 放在 main-content 外面避免 overflow 裁剪 */}
      {data.length > 0 && (
        <StatisticBar 
          data={filteredData}
          columns={columns}
          glassMode="blur"
        />
      )}
      
      <main className="main-content">
        {data.length === 0 ? (
          <EmptyState 
            onFileSelect={handleFileSelect} 
            isLoading={isLoading}
            recentFiles={recentFiles}
            onOpenRecent={handleOpenRecent}
            onClearRecent={handleClearRecent}
          />
        ) : (
          <DataTable 
            data={sortedData}
            columns={columnOrder.filter(c => visibleColumns.includes(c))}
            sortConfig={sortConfig}
            onSort={handleSort}
            density={density}
          />
        )}
      </main>

      {showColumnSettings && (
        <ColumnSettings 
          columns={columns}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onToggleVisibility={toggleColumnVisibility}
          onReorder={setColumnOrder}
          onReset={resetColumns}
          onClose={() => setShowColumnSettings(false)}
        />
      )}
    </div>
  )
}

export default App

