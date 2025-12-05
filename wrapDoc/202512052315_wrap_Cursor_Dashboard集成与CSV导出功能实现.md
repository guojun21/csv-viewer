# 对话总结：Cursor Dashboard 集成与 CSV 导出功能实现

## 一、主要主题和目标

### 1.1 Cursor Dashboard 集成
- **目标**：在 CSV 查看器中集成 Cursor Dashboard，支持登录和 CSV 数据导出
- **需求**：
  - 添加 Tab 切换功能（CSV 查看器 / Cursor Dashboard）
  - 实现 Cursor 账户登录功能
  - 支持 Cookie 持久化存储
  - 实现自动下载 CSV 并打开功能

### 1.2 CSV 导出功能增强
- **目标**：在 CSV 查看器界面添加快捷导出按钮
- **需求**：
  - Header 中添加"从 Cursor 导出"按钮
  - 导出后自动打开 CSV 文件
  - Cookie 失效时自动跳转到登录页面

## 二、关键决策和原因

| 决策 | 原因 |
|------|------|
| 使用独立 BrowserWindow 而非 webview 进行登录 | Google OAuth 安全策略不允许在 webview 中登录，会显示"浏览器不安全"错误 |
| 使用系统默认浏览器打开登录页面 | 系统浏览器不会被 Google 识别为不安全环境，可以正常完成 OAuth 登录流程 |
| 手动输入 Cookie 而非自动获取 | 由于跨浏览器 Cookie 访问限制，采用用户手动复制 Cookie 的方式更可靠 |
| 使用 `persist:cursor-auth` 分区存储 Cookie | 确保登录信息持久化，应用重启后仍保持登录状态 |
| CSV 导出后自动切换到 CSV 查看器 Tab | 提升用户体验，无需手动切换标签页 |

## 三、修改/创建的文件列表

### 3.1 Tab 切换组件（新建）

#### `src/components/tab-bar/TabBar.jsx`
- **创建内容**：
  - Tab 切换组件，支持两个标签页：CSV 查看器、Cursor Dashboard
  - 激活状态指示器和动画效果
- **原因**：提供统一的 Tab 导航界面

#### `src/components/tab-bar/TabBar.css`
- **创建内容**：Tab 栏样式，深色主题，支持 macOS 窗口拖拽
- **原因**：美化界面，保持与应用整体风格一致

#### `src/components/tab-bar/index.js`
- **创建内容**：组件导出文件
- **原因**：统一导出规范

### 3.2 Cursor Dashboard 组件（新建）

#### `src/components/cursor-dashboard/CursorDashboard.jsx`
- **创建内容**：
  - 登录状态检查
  - 系统浏览器打开登录页面
  - Cookie 手动输入功能
  - CSV 导出功能
- **原因**：实现 Cursor Dashboard 集成和登录管理

#### `src/components/cursor-dashboard/CursorDashboard.css`
- **创建内容**：Dashboard 界面样式，包括登录卡片、功能列表、操作按钮等
- **原因**：提供美观的用户界面

#### `src/components/cursor-dashboard/index.js`
- **创建内容**：组件导出文件
- **原因**：统一导出规范

### 3.3 CSV 查看器组件重构

#### `src/components/csv-viewer/CSVViewer.jsx`
- **修改内容**：
  - 添加 `onNeedLogin` 回调支持
  - 添加 `handleExportFromCursor` 导出功能
  - 添加 `isExporting` 状态管理
  - Cookie 失效时自动跳转到 Dashboard
- **原因**：支持从 CSV 查看器直接导出 Cursor 数据

#### `src/components/csv-viewer/CSVViewer.css`
- **创建内容**：CSV 查看器容器样式
- **原因**：独立组件样式管理

#### `src/components/csv-viewer/index.js`
- **创建内容**：组件导出文件
- **原因**：统一导出规范

### 3.4 Header 组件增强

#### `src/components/header/Header.jsx`
- **修改内容**：
  - 添加 `onExportFromCursor` 和 `isExporting` props
  - 添加"从 Cursor 导出"按钮
  - 导出时显示加载状态
- **原因**：在 Header 中提供快捷导出入口

#### `src/components/header/Header.css`
- **修改内容**：
  - 添加 `.cursor-export-btn` 样式（紫色渐变按钮）
  - 添加 `.btn-spinner` 加载动画
- **原因**：美化导出按钮，提供视觉反馈

### 3.5 主应用文件

#### `src/App.jsx`
- **修改内容**：
  - 重构为 Tab 切换架构
  - 添加 `handleNeedLogin` 回调
  - 集成 CSVViewer 和 CursorDashboard 组件
- **原因**：实现整体应用架构重构

#### `src/App.css`
- **修改内容**：添加 `.tab-content` 样式
- **原因**：支持 Tab 内容区域布局

### 3.6 Electron 主进程

#### `main.cjs`
- **修改内容**：
  - 添加 `open-cursor-login` IPC 处理（使用系统浏览器）
  - 添加 `open-cursor-login-window` IPC 处理（备用方案）
  - 添加 `check-cursor-login` IPC 处理
  - 添加 `cursor-logout` IPC 处理
  - 添加 `set-cursor-cookie` IPC 处理（手动设置 Cookie）
  - 添加 `download-cursor-csv` IPC 处理（下载 CSV 文件）
  - 配置 `persist:cursor-auth` session 分区
  - 设置 CSV 下载目录为 `userData/cursor-csv-downloads`
- **原因**：实现登录管理、Cookie 存储和 CSV 下载功能

## 四、核心代码片段

### 4.1 Tab 切换实现

```jsx
// src/App.jsx
const [activeTab, setActiveTab] = useState('csv-viewer')

return (
  <div className="app">
    <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    <div className="tab-content">
      {activeTab === 'csv-viewer' && <CSVViewer onNeedLogin={handleNeedLogin} />}
      {activeTab === 'cursor-dashboard' && <CursorDashboard onExportCSV={handleExportCSV} />}
    </div>
  </div>
)
```

**功能**：实现两个 Tab 页面的切换显示  
**原因**：提供清晰的导航结构，分离 CSV 查看和 Dashboard 功能

### 4.2 系统浏览器登录

```javascript
// main.cjs
ipcMain.handle('open-cursor-login', async () => {
  shell.openExternal('https://cursor.com/cn/dashboard?tab=usage');
  return { success: true, message: '已在系统浏览器中打开，请登录后返回应用' };
});
```

**功能**：在系统默认浏览器中打开 Cursor Dashboard  
**原因**：绕过 Google OAuth 对 webview 的限制，使用真正的浏览器完成登录

### 4.3 Cookie 手动设置

```javascript
// main.cjs
ipcMain.handle('set-cursor-cookie', async (event, cookieString) => {
  const cursorSession = getCursorSession();
  const cookies = cookieString.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    await cursorSession.cookies.set({
      url: 'https://cursor.com',
      name: name.trim(),
      value: valueParts.join('=').trim(),
      domain: '.cursor.com',
      secure: true,
      expirationDate: Math.floor(Date.now() / 1000) + 86400 * 365
    });
  }
});
```

**功能**：解析并设置用户手动输入的 Cookie  
**原因**：由于跨浏览器限制，采用用户手动复制 Cookie 的方式更可靠

### 4.4 CSV 导出并自动打开

```javascript
// src/components/csv-viewer/CSVViewer.jsx
const handleExportFromCursor = useCallback(async () => {
  const result = await ipc.invoke('download-cursor-csv');
  if (result.success) {
    parseCSV(result.content, result.fileName, result.size, result.filePath);
  } else if (result.error.includes('登录') || result.error.includes('401')) {
    alert(`${result.error}\n\n请重新设置 Cookie`);
    if (onNeedLogin) onNeedLogin(); // 跳转到 Dashboard
  }
}, [parseCSV, onNeedLogin]);
```

**功能**：下载 CSV 后自动解析并显示，登录失效时跳转  
**原因**：提升用户体验，实现一键导出和自动处理

## 五、解决的问题

### 5.1 Google OAuth 登录被阻止
- **问题**：在 Electron webview 中尝试登录 Google 账户时，Google 显示"此浏览器或应用可能不安全"错误，拒绝登录
- **解决方案**：
  1. 改用系统默认浏览器打开登录页面（`shell.openExternal`）
  2. 用户在浏览器中完成登录后，手动复制 Cookie
  3. 在应用中手动设置 Cookie
- **结果**：成功绕过 Google 的安全限制，用户可以正常登录

### 5.2 Cookie 持久化存储
- **问题**：需要确保登录信息在应用重启后仍然有效
- **解决方案**：使用 Electron session 的 `persist:cursor-auth` 分区，设置 Cookie 时指定较长的过期时间（1年）
- **结果**：登录信息持久化存储，无需频繁重新登录

### 5.3 CSV 导出后自动打开
- **问题**：导出 CSV 后需要手动打开文件
- **解决方案**：在 `download-cursor-csv` IPC 处理中返回文件内容，前端直接解析并显示
- **结果**：导出后自动切换到 CSV 查看器并显示数据

### 5.4 Cookie 失效处理
- **问题**：Cookie 失效时用户不知道需要重新登录
- **解决方案**：检测到 401/403 错误或登录相关错误时，显示提示并自动跳转到 Cursor Dashboard Tab
- **结果**：用户体验更友好，能及时处理登录失效情况

## 六、未解决的问题/待办事项

1. **自动获取 Cookie**：当前需要用户手动复制 Cookie，未来可以考虑通过浏览器扩展或其他方式自动获取
2. **日期范围选择**：当前默认导出当月数据，可以添加日期范围选择功能
3. **多账户支持**：当前只支持单个账户，可以扩展支持多账户切换
4. **导出历史记录**：可以添加导出历史记录功能，方便查看之前导出的文件

## 七、技术细节和注意事项

### 7.1 Session 分区配置
- **分区名称**：`persist:cursor-auth`
- **用途**：存储 Cursor 登录相关的 Cookie
- **注意事项**：分区名称必须一致，否则无法访问之前存储的 Cookie

### 7.2 CSV 下载目录
- **路径**：`app.getPath('userData') + '/cursor-csv-downloads'`
- **用途**：存储从 Cursor 导出的 CSV 文件
- **注意事项**：目录会在首次使用时自动创建

### 7.3 Cookie 格式要求
- **格式**：`WorkosCursorSessionToken=xxx` 或 `name=value; name2=value2`
- **来源**：浏览器开发者工具 → Application → Cookies → cursor.com
- **注意事项**：必须包含 `WorkosCursorSessionToken` 这个关键的认证 Cookie

### 7.4 API 端点
- **导出接口**：`https://cursor.com/api/dashboard/export-usage-events-csv`
- **参数**：`startDate`（时间戳）、`endDate`（时间戳）、`strategy=tokens`
- **注意事项**：需要有效的 Cookie 才能访问，默认导出当月数据

## 八、达成的共识和方向

1. **用户体验优先**：采用系统浏览器登录 + 手动 Cookie 输入的方式，虽然步骤稍多，但更可靠
2. **功能完整性**：实现完整的登录 → 导出 → 查看流程，确保功能闭环
3. **错误处理**：完善的错误提示和自动跳转，提升用户体验
4. **代码组织**：采用组件化结构，每个功能模块独立，便于维护和扩展

## 九、文件清单

**修改的文件（6个）：**
- `src/App.jsx`
- `src/App.css`
- `src/components/header/Header.jsx`
- `src/components/header/Header.css`
- `src/components/csv-viewer/CSVViewer.jsx`
- `main.cjs`

**新建的文件（10个）：**
- `src/components/tab-bar/TabBar.jsx`
- `src/components/tab-bar/TabBar.css`
- `src/components/tab-bar/index.js`
- `src/components/cursor-dashboard/CursorDashboard.jsx`
- `src/components/cursor-dashboard/CursorDashboard.css`
- `src/components/cursor-dashboard/index.js`
- `src/components/csv-viewer/CSVViewer.jsx`
- `src/components/csv-viewer/CSVViewer.css`
- `src/components/csv-viewer/index.js`

**总计：16 个文件变更（6 修改 + 10 新建）**

## 十、当前状态

✅ **已完成**：
- Tab 切换功能实现
- Cursor Dashboard 集成
- 系统浏览器登录流程
- Cookie 手动设置功能
- CSV 自动导出并打开功能
- Cookie 失效自动跳转功能
- Header 中添加快捷导出按钮

✅ **运行状态**：
- Vite 开发服务器：运行在 `http://localhost:5180`
- Electron 应用：已启动并连接到开发服务器
- 所有功能：正常工作

✅ **使用流程**：
1. 切换到 "Cursor Dashboard" Tab
2. 点击"打开 Cursor Dashboard"在浏览器中登录
3. 复制 `WorkosCursorSessionToken` Cookie
4. 在应用中粘贴 Cookie 并确认
5. 点击"导出本月 CSV"或使用 Header 中的"从 Cursor 导出"按钮
6. CSV 自动下载并打开到查看器

---
**文档创建时间**：2025-12-05 23:15  
**最后更新**：2025-12-05 23:15

