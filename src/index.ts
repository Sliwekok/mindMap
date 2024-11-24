const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');

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

ipcMain.on('save-content-to-file', (event: any, filePath: any, content: any) => {
    // Convert content to a JSON string
    const contentString = JSON.stringify(content, null, 2); // Pretty-print JSON with indentation

    // Write to the file
    fs.writeFile(filePath, contentString, (err: any) => {
        if (err) {
            console.error('Failed to save the file:', err);
            return;
        }
        console.log('File saved successfully!');
    });
});
