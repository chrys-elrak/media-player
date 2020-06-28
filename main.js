const {app, BrowserWindow, Menu, dialog, ipcMain} = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
require('dotenv').config();

let win, playlist = new Set();
const extensions = ['mkv', 'avi', 'mp4', 'mp3', 'wav'], name = 'Files', height = 1000, width = 632;
const menuTemplate = new Menu.buildFromTemplate([{
  label: 'File',
  submenu: [
    {
      label: 'Open file',
      accelerator: process.platform === 'darwin' ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
      async click() {
        if (win) {
          try {
            const f = await dialog.showOpenDialog({
              properties: ['openFile'], filters: [{name, extensions},]
            })
            if (f.canceled) return null;
            let merge = (playlist.size > 0) ? (await mergeItBox()).response === 0 : false;
            win.webContents.send('files-loaded', {playlist: setFiles(f.filePaths, merge), merge});
          } catch (e) {
            throw e;
          }
        }
      }
    },
    {
      label: 'Open files',
      accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
      async click() {
        if (win) {
          try {
            const f = await dialog.showOpenDialog({
              properties: ['openFile', "multiSelections"], filters: [{name, extensions},]
            });
            if (f.canceled) return null;
            let merge = (playlist.size > 0) ? (await mergeItBox()).response === 0 : false;
            win.webContents.send('files-loaded', {playlist: setFiles(f.filePaths, merge), merge});
          } catch (e) {
            throw e;
          }
        }
      }
    },
    {
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
            for await (const p of walk(d.filePaths[0])) {
              files.push(p);
            }
            let merge = (playlist.size > 0) ? (await mergeItBox()).response === 0 : false;
            win.webContents.send('files-loaded', {playlist: setFiles(files, merge), merge});
          } catch (e) {
            throw e;
          }
        }
      }
    },
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

async function* walk(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(entry);
    } else if (d.isFile() && extensions.includes(path.extname(d.name).slice(1))) {
      yield entry;
    }
  }
}

function setFiles(files, merge = true) {
  if (!merge) {
    playlist.clear();
  }
  files.forEach(f => {
    playlist.add(new File(f));
  });
  return [...playlist];
}

async function mergeItBox() {
  return dialog.showMessageBox(win, {
    title: 'Merge files',
    type: 'info',
    buttons: ['Yes', 'No'],
    message: 'Do you want to merge the content of the folder to the exist playlist ?'
  });
}

function createWindow() {
  win = new BrowserWindow({
    width,
    height,
    minWidth: 632,
    minHeight: 600,
    maxHeight: height,
    maximizable: false,
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
  process.env.ENV === 'dev' ? win.webContents.openDevTools() : null;
  win.on("closed", () => {
    win = null;
  });
}

function getFileMetaData(f) {
  return new Promise((resole, reject) => {
    ffmpeg.ffprobe(f, (err, meta) => {
      if (err) reject(err);
      else resole(meta);
    });
  });


}

ipcMain.on('playlist-updated', (event, newPlaylist) => {
  playlist = new Set(newPlaylist);
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

class File {
  constructor(pathname) {
    const stat = fs.statSync(pathname);
    this.pathname = pathname;
    this.basename = path.basename(pathname);
    this.ino = stat.ino;
    this.size = stat.size;
    this.atime = stat.atime;
    this.mtime = stat.mtime;
    this.ctime = stat.ctime;
    this.birthtime = stat.birthtime;
    this.url = url.format({
      pathname,
      protocol: 'file:',
    });
  }
}
