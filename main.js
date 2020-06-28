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
      label: 'Exit',
      click() {
        app.quit();
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
  win.webContents.openDevTools()
  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

ipcMain.on('init', (event) => {

});

ipcMain.on('open-files', (event, message) => {
  dialog.showOpenDialog({
    properties: ['openFile', "multiSelections"], filters: [{name, extensions},]
  }).then(f => {
    if (f.canceled) return null;
    event.sender.send('files-loaded', setFiles(f.filePaths));
  }).catch(e => console.error(e));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
