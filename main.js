const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path')
const fs = require("fs");

function createWindow () {
  const mainWindow = new BrowserWindow({
    height: (1080 / 2),
    width: (1920 / 2),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  mainWindow.loadFile('src/views/index.html')
  mainWindow.maximize();

  mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow);

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


ipcMain.handle('dialog:save', async (_, options) => {
  return dialog.showSaveDialog(options);
});
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return { filePath, fileContent };
});

ipcMain.on('save-content-to-file', (event, filePath, content) => {
  // Convert content to a JSON string
  const contentString = JSON.stringify(content, null, 2); // Pretty-print JSON with indentation

  // Write to the file
  fs.writeFile(filePath, contentString, (err) => {
    if (err) {
      console.error('Failed to save the file:', err);
      return;
    }
    console.log('File saved successfully!');
  });
});
