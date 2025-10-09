// main.js - Main process for the Electron application

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      // Attach the preload script to the renderer process
      preload: path.join(__dirname, 'preload.js'),
      // Security best practices
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Maximize the window on startup
  mainWindow.maximize();

  if (isDev) {
    // In development, load from the Vite dev server.
    // Make sure to start the Vite dev server first (e.g., `npm run dev`).
    mainWindow.loadURL('http://localhost:5173');
    // Optional: Open the DevTools for debugging.
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html file.
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
  // Set up IPC handler to get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Securely provide the API key from the main process's environment to the renderer process
  ipcMain.handle('get-api-key', () => {
    return process.env.API_KEY;
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window when the dock icon is clicked
    // and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});