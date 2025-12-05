const { app, BrowserWindow, ipcMain, dialog, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let mainWindow;
let authWindow;
let store;

// 数据目录
const DATA_DIR = path.join(app.getPath('userData'), 'cursor-data');
// 主数据文件路径（单一文件，每次 Pull 覆盖）
const DATA_FILE_PATH = path.join(DATA_DIR, 'usage-data.csv');

// Cursor session 分区名
const CURSOR_PARTITION = 'persist:cursor-auth';

// 缓存 session 引用
let cursorSessionCache = null;

// 固定起始日期：2025年10月1日
const FIXED_START_DATE = new Date(2025, 9, 1, 0, 0, 0, 0).getTime(); // 月份从0开始，9表示10月

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return DATA_DIR;
}

// 动态导入 electron-store (ESM 模块)
async function initStore() {
  const Store = (await import('electron-store')).default;
  store = new Store({
    name: 'cursor-tracker-data',
    defaults: {
      recentFiles: [],
      syncInterval: 0, // 0 表示不自动同步，单位毫秒
      lastSyncTime: null
    }
  });
}

// 获取 Cursor Session（使用缓存确保一致性）
function getCursorSession() {
  if (!cursorSessionCache) {
    cursorSessionCache = session.fromPartition(CURSOR_PARTITION, { cache: true });
    console.log('创建新的 Cursor Session 分区:', CURSOR_PARTITION);
  }
  return cursorSessionCache;
}

function createWindow() {
  // 配置 Cursor 的 session
  const cursorSession = getCursorSession();
  
  // 设置 User-Agent 模拟真实 Chrome 浏览器
  cursorSession.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f0f'
  });

  // 开发模式加载本地服务器，生产模式加载打包后的文件
  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5180');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// 打开系统浏览器进行登录
ipcMain.handle('open-cursor-login', async () => {
  // 使用系统默认浏览器打开 Cursor Dashboard
  shell.openExternal('https://cursor.com/cn/dashboard?tab=usage');
  return { success: true, message: '已在系统浏览器中打开，请登录后返回应用' };
});

// 打开应用内登录窗口（备用方案，可能被 Google 阻止）
ipcMain.handle('open-cursor-login-window', async () => {
  if (authWindow) {
    authWindow.focus();
    return { success: false, error: '登录窗口已打开' };
  }

  const cursorSession = getCursorSession();
  
  // 设置更真实的 User-Agent
  cursorSession.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  authWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: CURSOR_PARTITION
    },
    title: 'Cursor 登录',
    backgroundColor: '#ffffff',
    autoHideMenuBar: true
  });

  // 加载 Cursor Dashboard
  authWindow.loadURL('https://cursor.com/cn/dashboard?tab=usage');

  // 监听登录成功
  authWindow.webContents.on('did-navigate', async (event, url) => {
    console.log('Auth window navigated to:', url);
    
    if (url.includes('cursor.com') && url.includes('dashboard') && !url.includes('authenticator')) {
      const cookies = await cursorSession.cookies.get({ url: 'https://cursor.com' });
      const hasAuthCookie = cookies.some(c => 
        c.name.includes('session') || 
        c.name.includes('auth') || 
        c.name.includes('token') ||
        c.name === 'WorkosCursorSessionToken'
      );
      
      if (hasAuthCookie) {
        mainWindow.webContents.send('cursor-login-success');
      }
    }
  });

  authWindow.on('closed', () => {
    authWindow = null;
    mainWindow.webContents.send('cursor-auth-window-closed');
  });

  return { success: true };
});

// 关闭登录窗口
ipcMain.handle('close-cursor-login', async () => {
  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }
  return { success: true };
});

// 检查登录状态
ipcMain.handle('check-cursor-login', async () => {
  try {
    const cursorSession = getCursorSession();
    const cookies = await cursorSession.cookies.get({ url: 'https://cursor.com' });
    
    console.log('检查登录状态，Cookie 数量:', cookies.length);
    console.log('Cookie 名称:', cookies.map(c => c.name));
    
    const hasAuthCookie = cookies.some(c => 
      c.name.includes('session') || 
      c.name.includes('auth') || 
      c.name.includes('token') ||
      c.name === 'WorkosCursorSessionToken'
    );
    
    console.log('是否有认证 Cookie:', hasAuthCookie);
    
    return { 
      success: true, 
      isLoggedIn: hasAuthCookie,
      cookieCount: cookies.length,
      cookieNames: cookies.map(c => c.name)
    };
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return { success: false, error: error.message };
  }
});

// 登出（清除 cookies）
ipcMain.handle('cursor-logout', async () => {
  try {
    const cursorSession = getCursorSession();
    await cursorSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'sessionstorage']
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 手动设置 Cookie（从用户输入）
ipcMain.handle('set-cursor-cookie', async (event, cookieString) => {
  try {
    const cursorSession = getCursorSession();
    
    let processedInput = cookieString.trim();
    
    // 智能检测：如果输入不包含 "=" 或者看起来像是 JWT token（包含 %3A%3A 或 ::）
    // 那么用户可能只粘贴了值，自动加上 Cookie 名称
    if (!processedInput.includes('=') || 
        (processedInput.includes('%3A%3A') && !processedInput.startsWith('WorkosCursorSessionToken'))) {
      processedInput = `WorkosCursorSessionToken=${processedInput}`;
      console.log('自动添加 Cookie 名称前缀');
    }
    
    // 解析 cookie 字符串 (格式: name=value; name2=value2)
    const cookies = processedInput.split(';').map(c => c.trim()).filter(c => c);
    
    console.log('准备设置 Cookie，共', cookies.length, '个');
    console.log('原始输入长度:', cookieString.length);
    
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('='); // 处理值中包含 = 的情况
      
      if (name && value) {
        const cookieObj = {
          url: 'https://cursor.com',
          name: name.trim(),
          value: value.trim(),
          domain: 'cursor.com', // 不带点号
          path: '/',
          secure: true,
          sameSite: 'no_restriction',
          expirationDate: Math.floor(Date.now() / 1000) + 86400 * 365 // 1年后过期
        };
        console.log('设置 Cookie:', name.trim(), '值长度:', value.trim().length);
        try {
          await cursorSession.cookies.set(cookieObj);
          console.log('Cookie 设置成功:', name.trim());
        } catch (cookieError) {
          console.error('单个 Cookie 设置失败:', name.trim(), cookieError.message);
        }
      }
    }
    
    // 强制刷新 Cookie 存储
    await cursorSession.cookies.flushStore();
    
    // 验证 Cookie 是否设置成功
    const savedCookies = await cursorSession.cookies.get({ url: 'https://cursor.com' });
    console.log('设置后的 Cookie 数量:', savedCookies.length);
    console.log('Cookie 名称:', savedCookies.map(c => c.name));
    
    return { success: true, cookieCount: savedCookies.length };
  } catch (error) {
    console.error('设置 Cookie 失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理文件选择
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    return { filePath, content, size: stats.size };
  }
  return null;
});

// 读取指定文件（通过路径）
ipcMain.handle('read-file-by-path', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    return { 
      success: true, 
      content, 
      filePath,
      size: stats.size,
      name: path.basename(filePath)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 获取最近打开的文件列表
ipcMain.handle('get-recent-files', async () => {
  if (!store) return [];
  return store.get('recentFiles', []);
});

// 保存最近打开的文件
ipcMain.handle('save-recent-file', async (event, fileInfo) => {
  if (!store) return [];
  const recent = store.get('recentFiles', []);
  // 移除同路径文件（如果存在）
  const filtered = recent.filter(f => f.filePath !== fileInfo.filePath);
  // 添加到开头，最多保存 10 个
  const updated = [fileInfo, ...filtered].slice(0, 10);
  store.set('recentFiles', updated);
  return updated;
});

// 清除最近打开的文件记录
ipcMain.handle('clear-recent-files', async () => {
  if (!store) return;
  store.set('recentFiles', []);
});

// Pull 数据 - 从固定起始日期到当前时间拉取数据
ipcMain.handle('pull-cursor-data', async (event) => {
  try {
    const cursorSession = getCursorSession();
    const cookies = await cursorSession.cookies.get({ url: 'https://cursor.com' });
    
    console.log('Pull 数据 - Cookie 数量:', cookies.length);
    
    if (!cookies || cookies.length === 0) {
      return { success: false, error: '未找到登录信息，请先登录' };
    }

    // 构建 cookie 字符串
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // 固定起始日期：2025.10.01，结束日期：当前时间
    const startDate = FIXED_START_DATE;
    const endDate = Date.now();

    const url = `https://cursor.com/api/dashboard/export-usage-events-csv?startDate=${startDate}&endDate=${endDate}&strategy=tokens`;
    
    console.log('Pull 数据:', url);
    console.log('时间范围:', new Date(startDate).toISOString(), '->', new Date(endDate).toISOString());

    // 确保数据目录存在
    ensureDataDir();

    // 下载到临时文件
    const tempFilePath = path.join(DATA_DIR, 'usage-data.tmp');

    // 下载文件
    return new Promise((resolve) => {
      const request = https.get(url, {
        headers: {
          'Cookie': cookieString,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/csv,application/csv,*/*',
          'Referer': 'https://cursor.com/cn/dashboard?tab=usage'
        }
      }, (response) => {
        // 检查响应状态
        if (response.statusCode === 401 || response.statusCode === 403) {
          resolve({ success: false, error: '登录已过期，请重新登录' });
          return;
        }
        
        if (response.statusCode !== 200) {
          resolve({ success: false, error: `服务器返回错误: ${response.statusCode}` });
          return;
        }

        // 写入临时文件
        const fileStream = fs.createWriteStream(tempFilePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          
          try {
            // 替换旧文件
            if (fs.existsSync(DATA_FILE_PATH)) {
              fs.unlinkSync(DATA_FILE_PATH);
            }
            fs.renameSync(tempFilePath, DATA_FILE_PATH);
            
            // 读取文件内容
            const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
            const stats = fs.statSync(DATA_FILE_PATH);
            
            // 更新最后同步时间
            const syncTime = Date.now();
            if (store) {
              store.set('lastSyncTime', syncTime);
            }
            
            console.log('Pull 完成:', DATA_FILE_PATH, '大小:', stats.size);
            
            // 通知渲染进程数据已更新
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('data-synced', {
                syncTime,
                recordCount: content.split('\n').length - 1 // 减去 header
              });
            }
            
            resolve({ 
              success: true, 
              filePath: DATA_FILE_PATH,
              fileName: 'usage-data.csv',
              content,
              size: stats.size,
              syncTime
            });
          } catch (err) {
            resolve({ success: false, error: `处理文件失败: ${err.message}` });
          }
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(tempFilePath, () => {}); // 删除临时文件
          resolve({ success: false, error: `写入文件失败: ${err.message}` });
        });
      });

      request.on('error', (err) => {
        resolve({ success: false, error: `网络请求失败: ${err.message}` });
      });

      request.setTimeout(30000, () => {
        request.destroy();
        resolve({ success: false, error: '请求超时' });
      });
    });
  } catch (error) {
    console.error('Pull 数据失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取当前数据文件内容
ipcMain.handle('get-current-data', async () => {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return { success: true, hasData: false };
    }
    
    const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const stats = fs.statSync(DATA_FILE_PATH);
    const lastSyncTime = store ? store.get('lastSyncTime') : null;
    
    return {
      success: true,
      hasData: true,
      content,
      size: stats.size,
      lastSyncTime
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 获取/设置同步间隔
ipcMain.handle('get-sync-interval', async () => {
  if (!store) return 0;
  return store.get('syncInterval', 0);
});

ipcMain.handle('set-sync-interval', async (event, interval) => {
  if (!store) return { success: false };
  store.set('syncInterval', interval);
  return { success: true, interval };
});

// 获取最后同步时间
ipcMain.handle('get-last-sync-time', async () => {
  if (!store) return null;
  return store.get('lastSyncTime', null);
});

// 打开数据目录
ipcMain.handle('open-data-dir', async () => {
  const dir = ensureDataDir();
  shell.openPath(dir);
  return { success: true };
});

app.whenReady().then(async () => {
  await initStore();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
