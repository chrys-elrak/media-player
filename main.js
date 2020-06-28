const {app, BrowserWindow, Menu, dialog, ipcMain} = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
global.sharedData = {
  playlist: []
};
let win, playlist = new Set();
const extensions = ['mkv', 'avi', 'mp4'], name = 'Files', height = 1000, width = 632;
const menuTemplate = new Menu.buildFromTemplate([{
  label: 'File',
  submenu: [
    {
      label: 'Open file',
      accelerator: process.platform === 'darwin' ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
      click() {
        if (win) {
          dialog.showOpenDialog({
            properties: ['openFile'], filters: [{name, extensions},]
          }).then(f => {
            if (f.canceled) return null;
            win.webContents.send('files-loaded', {
              files: setFiles(f.filePaths)
            });
          }).catch(e => console.error(e));
        }
      }
    },
    {
      label: 'Open files',
      accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
      click: () => {
        if (win) {
          dialog.showOpenDialog({
            properties: ['openFile', "multiSelections"], filters: [{name, extensions},]
          }).then(f => {
            if (f.canceled) return null;
            win.webContents.send('files-loaded', {
              files: setFiles(f.filePaths)
            });
          }).catch(e => console.error(e));
        }
      }
    },
    {
      label: 'Open folder',
      accelerator: process.platform === 'darwin' ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
      click() {
        if (win) {
          dialog.showOpenDialog({
            properties: ['openDirectory'], filters: [{name, extensions},]
          }).then(async (d) => {
            if (d.canceled) return null;
            const files = [];
            for await (const p of walk(d.filePaths[0])) {
              files.push(p);
            }
            win.webContents.send('files-loaded', {
              files: setFiles(files)
            });
          }).catch(e => console.error(e));
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
          console.log(r);
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

function setFiles(files) {
  files.forEach(f => playlist.add(f));
  return [...playlist];
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
  win.webContents.openDevTools();
  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
