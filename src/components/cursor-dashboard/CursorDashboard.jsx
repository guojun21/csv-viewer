import React, { useEffect, useState, useCallback } from 'react'
import './CursorDashboard.css'

// 检查是否在 Electron 环境
const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer'

const getIpcRenderer = () => {
  if (isElectron) {
    return window.require('electron').ipcRenderer
  }
  return null
}

const CursorDashboard = ({ onDataPulled }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [showCookieInput, setShowCookieInput] = useState(false)
  const [cookieInput, setCookieInput] = useState('')

  // 检查登录状态
  const checkLoginStatus = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (!ipc) return

    try {
      const result = await ipc.invoke('check-cursor-login')
      if (result.success) {
        setIsLoggedIn(result.isLoggedIn)
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    } finally {
      setIsChecking(false)
    }
  }, [])

  // 初始化检查登录状态
  useEffect(() => {
    checkLoginStatus()
  }, [checkLoginStatus])

  // 监听登录成功事件
  useEffect(() => {
    const ipc = getIpcRenderer()
    if (!ipc) return

    const handleLoginSuccess = () => {
      console.log('登录成功')
      setIsLoggedIn(true)
    }

    const handleAuthWindowClosed = () => {
      checkLoginStatus()
    }

    ipc.on('cursor-login-success', handleLoginSuccess)
    ipc.on('cursor-auth-window-closed', handleAuthWindowClosed)

    return () => {
      ipc.removeListener('cursor-login-success', handleLoginSuccess)
      ipc.removeListener('cursor-auth-window-closed', handleAuthWindowClosed)
    }
  }, [checkLoginStatus])

  // 打开系统浏览器登录
  const handleOpenBrowser = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (!ipc) return

    try {
      await ipc.invoke('open-cursor-login')
    } catch (error) {
      console.error('打开浏览器失败:', error)
    }
  }, [])

  // 提交 Cookie
  const handleSubmitCookie = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (!ipc || !cookieInput.trim()) return

    try {
      setIsLoading(true)
      const result = await ipc.invoke('set-cursor-cookie', cookieInput.trim())
      setIsLoading(false)
      
      if (result.success) {
        setCookieInput('')
        setShowCookieInput(false)
        checkLoginStatus()
      } else {
        alert(`设置 Cookie 失败: ${result.error}`)
      }
    } catch (error) {
      setIsLoading(false)
      alert(`设置 Cookie 失败: ${error.message}`)
    }
  }, [cookieInput, checkLoginStatus])

  // 登出
  const handleLogout = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (!ipc) return

    try {
      await ipc.invoke('cursor-logout')
      setIsLoggedIn(false)
    } catch (error) {
      console.error('登出失败:', error)
    }
  }, [])

  // Pull 数据
  const handlePullData = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (!ipc) {
      alert('此功能仅在 Electron 环境下可用')
      return
    }

    try {
      setIsLoading(true)
      const result = await ipc.invoke('pull-cursor-data')
      setIsLoading(false)
      
      if (result.success) {
        if (onDataPulled) {
          onDataPulled({
            filePath: result.filePath,
            fileName: result.fileName,
            content: result.content,
            size: result.size,
            syncTime: result.syncTime
          })
        }
      } else {
        alert(`同步失败: ${result.error}`)
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Pull 数据失败:', error)
      alert(`同步失败: ${error.message}`)
    }
  }, [onDataPulled])

  // 打开数据目录
  const handleOpenDataDir = useCallback(async () => {
    const ipc = getIpcRenderer()
    if (!ipc) return
    await ipc.invoke('open-data-dir')
  }, [])

  // 非 Electron 环境显示提示
  if (!isElectron) {
    return (
      <div className="cursor-dashboard-placeholder">
        <div className="placeholder-content">
          <span className="placeholder-icon">🖥️</span>
          <h2>Cursor Dashboard</h2>
          <p>此功能仅在 Electron 桌面应用中可用</p>
          <p className="placeholder-hint">请使用桌面应用访问 Cursor Dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cursor-dashboard">
      <div className="dashboard-content">
        {isChecking ? (
          <div className="checking-status">
            <div className="loading-spinner"></div>
            <span>检查登录状态...</span>
          </div>
        ) : isLoggedIn ? (
          // 已登录状态
          <div className="logged-in-view">
            <div className="status-card success">
              <span className="status-icon">✅</span>
              <h2>已连接 Cursor</h2>
              <p>您可以在「数据分析」页面 Pull 最新数据</p>
            </div>

            <div className="action-cards">
              <div className="action-card primary" onClick={handlePullData}>
                {isLoading ? (
                  <>
                    <div className="loading-spinner small"></div>
                    <span className="action-title">正在同步...</span>
                  </>
                ) : (
                  <>
                    <span className="action-icon">📥</span>
                    <span className="action-title">Pull 数据</span>
                    <span className="action-desc">拉取最新使用数据</span>
                  </>
                )}
              </div>

              <div className="action-card" onClick={handleOpenDataDir}>
                <span className="action-icon">📁</span>
                <span className="action-title">打开数据目录</span>
                <span className="action-desc">查看本地数据文件</span>
              </div>

              <div className="action-card" onClick={handleOpenBrowser}>
                <span className="action-icon">🌐</span>
                <span className="action-title">打开 Dashboard</span>
                <span className="action-desc">在系统浏览器中查看</span>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        ) : (
          // 未登录状态
          <div className="login-view">
            <div className="login-card">
              <span className="login-icon">⚡</span>
              <h2>连接到 Cursor</h2>
              <p>需要登录您的 Cursor 账户以同步使用数据</p>
              
              <div className="login-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <span className="step-text">在浏览器中登录 Cursor</span>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <span className="step-text">复制 Cookie 到下方</span>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <span className="step-text">开始 Pull 数据</span>
                </div>
              </div>
              
              <button className="login-btn" onClick={handleOpenBrowser}>
                <span>🌐</span>
                打开 Cursor Dashboard
              </button>

              <button 
                className="cookie-btn"
                onClick={() => setShowCookieInput(!showCookieInput)}
              >
                {showCookieInput ? '隐藏 Cookie 输入' : '输入 Cookie'}
              </button>

              {showCookieInput && (
                <div className="cookie-input-section">
                  <p className="cookie-hint">
                    在浏览器中登录后，打开开发者工具 (F12) → Application → Cookies → cursor.com，
                    复制 <code>WorkosCursorSessionToken</code> 的值（直接粘贴值即可，无需带名称）
                  </p>
                  <textarea
                    className="cookie-textarea"
                    placeholder="直接粘贴 Cookie 值即可（例如: user_01JXX...）"
                    value={cookieInput}
                    onChange={(e) => setCookieInput(e.target.value)}
                    rows={3}
                  />
                  <button 
                    className="submit-cookie-btn"
                    onClick={handleSubmitCookie}
                    disabled={!cookieInput.trim() || isLoading}
                  >
                    {isLoading ? '设置中...' : '确认设置'}
                  </button>
                </div>
              )}
            </div>

            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <div className="feature-text">
                  <strong>自动同步</strong>
                  <span>设置间隔自动 Pull 最新数据</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div className="feature-text">
                  <strong>安全存储</strong>
                  <span>登录信息安全存储在本地</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <strong>实时分析</strong>
                  <span>Pull 后自动更新数据分析</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CursorDashboard
