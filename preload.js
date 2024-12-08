const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (options) => ipcRenderer.invoke('dialog:save', options),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveContentToFile: (filePath, content) => ipcRenderer.send('save-content-to-file', filePath, content)
});
