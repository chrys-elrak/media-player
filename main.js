const {app, BrowserWindow, Menu, dialog, ipcMain} = require("electron");
const path = require("path");
const url = require("url");
global.sharedData = {
  playlist: []
};
let win, playlist = new Set();
const extensions = ['mkv', 'avi', 'mp4'], name = 'Files';
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
            console.log(f);
            win.webContents.send('open-file', {
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

function setFiles(files) {
  files.forEach(f => playlist.add(f));
  return [...playlist];
}

function createWindow() {
  win = new BrowserWindow({
    width: 800, height: 600, webPreferences: {
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
