const {app, BrowserWindow, Menu, dialog, ipcMain, Notification} = require("electron");
const path = require("path");
const url = require("url");
const moment = require('moment');
const File = require('./core/models/file');
const walk = require('./core/helpers/walkDirectories');
const {mergeItBox} = require('./core/helpers/box');
const eFileStat = require('./core/enums/state');
require('dotenv').config();

let win, current, playlist = new Set();
const extensions = ['mkv', 'avi', 'mp4', 'mp3', 'wav'], name = 'Files', height = 300, width = 600;

const openFileMenu = {
  label: 'Open file',
  accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
  async click() {
    if (win) {
      try {
        const f = await dialog.showOpenDialog({
          properties: ['openFile'], filters: [{name, extensions},]
        })
        if (f.canceled) return null;
        let merge = (playlist.size > 0) ? (await mergeItBox(dialog, win)).response === 0 : false;
        win.webContents.send('files-loaded', {playlist: setFiles(f.filePaths, merge).map(f => new File(f)), merge});
      } catch (e) {
        throw e;
      }
    }
  }
};
const openMultipleFileMenu = {
  label: 'Open files',
  accelerator: process.platform === 'darwin' ? 'Cmd+Shit+O' : 'Ctrl+Shift+O',
  async click() {
    if (win) {
      try {
        const f = await dialog.showOpenDialog({
          properties: ['openFile', "multiSelections"], filters: [{name, extensions},]
        });
        if (f.canceled) return null;
        let merge = (playlist.size > 0) ? (await mergeItBox(dialog, win)).response === 0 : false;
        win.webContents.send('files-loaded', {playlist: setFiles(f.filePaths, merge).map(f => new File(f)), merge});
      } catch (e) {
        throw e;
      }
    }
  }
};
const openDirectoryMenu = {
  label: 'Open folder',
  accelerator: process.platform === 'darwin' ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
  async click() {
    if (win) {
      try {
        const d = await dialog.showOpenDialog({
          properties: ['openDirectory'], filters: [{name, extensions},]
        });
        if (d.canceled) return null;
        const files = [];
        // Getting files from directory
        for await (const p of walk(d.filePaths[0], extensions)) {
          files.push(p);
        }
        let merge = (playlist.size > 0) ? (await mergeItBox(dialog, win)).response === 0 : false;
        win.webContents.send('files-loaded', {playlist: setFiles(files, merge).map(f => new File(f)), merge});
      } catch (e) {
        throw e;
      }
    }
  }
};

const menuTemplate = new Menu.buildFromTemplate([{
  label: 'Menu',
  submenu: [
    openFileMenu, openMultipleFileMenu, openDirectoryMenu,
    {
      label: 'Exit',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click() {
        let options = {
          type: 'info',
          title: 'Are you sure ?',
          buttons: ["Yes", "Cancel"],
          message: "Do you really want to quit?",
          checkboxLabel: 'Do not show it later',
        }
        dialog.showMessageBox(win, options).then(r => {
          if (r.response === 0) {
            app.quit();
          }
        }).catch();
      }
    }
  ]
}]);

function setFiles(files, merge = true) {
  if (!merge) {
    playlist.clear();
  }
  files.forEach(f => {
    playlist.add(f);
  });
  return [...playlist];
}

function createWindow() {
  win = new BrowserWindow({
    width,
    height,
    minWidth: 300,
    minHeight: 120,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/dist/media-player/index.html'),
      protocol: "file:",
      slashes: true
    })
  ).then().catch();

  win.setMenu(menuTemplate);

  win.on('minimize', () => {
    if (!!current) {
      const notification = new Notification({
        title: 'Media player is running',
        subtitle: 'You can change music/video from here',
        body: `${current.basename}`,
      });
      notification.show();
    }
  });

  win.on('maximize', (e) => {
    win.webContents.send('window-maximize', true);
  });
  win.on('unmaximize', (e) => {
    win.webContents.send('window-maximize', false);
  });
  process.env.ENV === 'dev' ? win.webContents.openDevTools() : null;
  win.on("closed", (e) => {
    win = null;
  });
}

ipcMain.on('playlist-updated', (event, newPlaylist) => {
  playlist = new Set(newPlaylist);
});

ipcMain.on('get-file-details', async (event, file) => {
  const r = await dialog.showMessageBox(win, {
    title: `Information`,
    message: `Title: ${file.basename}\nType: ${file.filetype}\nSize: ${(file.size / Math.pow(1024, 2)).toFixed(2)} MB\nCreated: ${moment(file.birthtime).format('MMMM Do YYYY, h:mm:ss a')}`,
    type: 'info',
  });
});

ipcMain.on('playing-state', (e, currentFile) => {
  if (currentFile.state === eFileStat.PLAY) {
    current = currentFile;
  } else {
    current = null;
  }
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

