"use strict";

// code based on : http://electron.atom.io/docs/tutorial/quick-start/

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const dialog = electron.dialog;

let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({width: 800, height: 600});

  mainWindow.loadURL('file://' + __dirname + '/home.html');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// File dialogs

ipc.on('open-file', (event, args) => {
    dialog.showOpenDialog(args, (files) => {
        event.sender.send ('file-opened', files)
    })
});

ipc.on('load-level', (event, path) => {
    event.sender.send ('file-opened', [path]);
});
