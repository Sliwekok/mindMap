// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (options: any) => ipcRenderer.invoke('dialog:save', options),
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveContentToFile: (filePath: any, content: any) => ipcRenderer.send('save-content-to-file', filePath, content)
});
