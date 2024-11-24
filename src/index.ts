const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');

const createWindow = (): void => {
    const mainWindow = new BrowserWindow({
        height: (1080 / 2),
        width: (1920 / 2),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    });
    mainWindow.loadFile('./src/views/index.html');
    mainWindow.maximize();

    mainWindow.webContents.openDevTools();
};

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

// Listen for dialog requests
ipcMain.handle('dialog:save', async (_: any, options: any) => {
    return dialog.showSaveDialog(options);
});
