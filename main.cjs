const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let store;

// 动态导入 electron-store (ESM 模块)
async function initStore() {
  const Store = (await import('electron-store')).default;
  store = new Store({
    name: 'csv-viewer-data',
    defaults: {
      recentFiles: []
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f0f'
  });

  // 开发模式加载本地服务器，生产模式加载打包后的文件
  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

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

