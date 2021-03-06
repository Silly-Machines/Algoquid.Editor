'use strict';

// code based on : http://electron.atom.io/docs/tutorial/quick-start/

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const dialog = electron.dialog;

let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({width: 1800, height: 1200, icon: 'res/quid.png'});

  mainWindow.loadURL('file://' + __dirname + '/home.html');

  mainWindow.on('closed', () => {
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

// options

ipc.on ('show-options', (event, args) => {
    let optionWindow = new BrowserWindow({width: 1200, height: 800, resizable: false, icon: 'res/quid.png'});
    optionWindow.loadURL('file://' + __dirname + '/options.html');
    optionWindow.on('closed', () => {
        optionWindow = null;
    });
});

// File dialogs

ipc.on('open-file', (event, args) => {
    dialog.showOpenDialog(args, (files) => {
        event.sender.send ('file-opened', files)
    })
});

ipc.on('save-file', (event, args) => {
    dialog.showSaveDialog(args, (file) => {
        event.sender.send ('save-in', file);
    })
});

let openedFile;

ipc.on('load-level', (event, path) => {
    openedFile = path;
});

ipc.on ('editor-loaded' , (event, path) => {
    if (openedFile) {
        event.sender.send ('file-opened', [openedFile]);
        openedFile = undefined;
    } else {
        event.sender.send ('new-level');
    }
});
