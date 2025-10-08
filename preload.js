// preload.js - Bridges the main and renderer processes

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (the web app).
contextBridge.exposeInMainWorld('electronAPI', {
  // The main process (which runs in Node.js) can access environment variables.
  // This function provides a secure way for the renderer process to get the API key
  // without exposing the entire `process` object.
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  // This function allows the renderer to securely ask for the app's version.
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
