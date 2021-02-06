const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  Notification
} = require("electron");
const path = require("path");
const url = require("url");
const moment = require('moment');
require('dotenv').config();
const { configCapacitor } = require('@capacitor/electron');
const File = require('./core/models/file');
const walk = require('./core/helpers/walkDirectories');
const {
  broadCastEvent
} = require('./core/helpers/ipc');

/** CONSTANTS **/
const PATH_NAME = path.join(__dirname, '/app/media-player/index.html'),
  TITLE = 'CMP (Chrys Media Player)',
  EXT = ['mkv', 'avi', 'mp4', 'mp3', 'wav'],
  NAME = 'Files',
  HEIGHT = 300,
  WIDTH = 600;
const BROWSER_WINDOW_CONFIG = {
  width: WIDTH,
  height: HEIGHT,
  title: TITLE,
  minWidth: 620,
  minHeight: 120,
  webPreferences: {
    nodeIntegration: true,
    preload: path.join(__dirname, 'node_modules', '@capacitor', 'electron', 'dist', 'electron-bridge.js')
  }
};

/** GLOBAL VARIABLES**/
let mainWindow, playlistWindow;

/** SHARED DATA **/
global.sharedData = {
  playlist: [],
  current: null
};


/** MAIN PROCESS **/

app.on("ready", createWindow); // Main function

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/** INTER PROCESS COMMUNICATION **/

ipcMain.on('openPlaylist', async (e, arg) => {
  if (arg.open) {
    playlistWindow.close();
    mainWindow.webContents.send('playlistOpened', false);
  } else {
    initPlaylistWindow(true);
    playlistWindow.setMenu(null);
    playlistWindow.loadURL(`file://${__dirname}/app/index.html#/playlist`);
    playlistWindow.webContents.openDevTools();
    mainWindow.webContents.send('playlistOpened', true);
    playlistWindow.on('closed', () => {
      mainWindow.webContents.send('playlistOpened', false);
      playlistWindow = null;
    });
  }
});

ipcMain.on('getFileDetails', async (event, file) => {
  await dialog.showMessageBox(mainWindow, {
    title: `Information`,
    message: `Title: ${file.basename}\nType: ${file.filetype}\nSize: ${(file.size / Math.pow(1024, 2)).toFixed(2)} MB\nCreated: ${moment(file.birthtime).format('MMMM Do YYYY, h:mm:ss a')}`,
    type: 'info',
  });
});

ipcMain.on('removeFileFromPlaylist', (e, arg) => {
  global.sharedData.playlist = arg.playlist;
  global.sharedData.current = arg.current;
  broadCastEvent('sharedDataChanged', {});
});

ipcMain.on('updateSharedData', (e, arg) => {
  broadCastEvent('sharedDataChanged', global.sharedData);
});
/** FUNCTIONS **/

/**
 * Create the main window
 * We can found the core of the app here
 */
function createWindow() {
  mainWindow = new BrowserWindow(BROWSER_WINDOW_CONFIG);
  configCapacitor(mainWindow);

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.show();
  });
  // initPlaylistWindow(false);

  mainWindow.setMenu(buildMenu());

  mainWindow.on('minimize', () => {
    if (global.sharedData.current) {
      const notification = new Notification({
        title: 'Media player is running',
        subtitle: 'You can change music/video from here',
        body: `${global.sharedData.current.basename}`,
      });
      notification.show();
    }
  });

  process.env.ENV === 'dev' ? mainWindow.webContents.openDevTools() : null;

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Create an window playslist, show or hidden depends on show param
 * @param show{boolean}
 */
function initPlaylistWindow(show) {
  playlistWindow = new BrowserWindow(BROWSER_WINDOW_CONFIG);
  playlistWindow.setParentWindow(mainWindow);
  playlistWindow.setTitle(`${TITLE} - Playlist`);
  if (show) {
    playlistWindow.show();
  }
}

/**
 * Build menu bar, with those specific action
 * @return Menu
 */
function buildMenu() {
  const OPEN_FILE_MENU = {
    label: 'Open file',
    accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
    click: () => openFile(['openFile'])
  };
  const OPEN_MULTIPLE_FILE_MENU = {
    label: 'Open files',
    accelerator: process.platform === 'darwin' ? 'Cmd+Shit+O' : 'Ctrl+Shift+O',
    click: () => openFile(['openFile', "multiSelections"])
  };
  const OPEN_DIRECTORY_MENU = {
    label: 'Open folder',
    accelerator: process.platform === 'darwin' ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
    click: () => openFile(['openDirectory'], true)
  };

  return new Menu.buildFromTemplate([{
    label: 'Menu',
    submenu: [
      OPEN_FILE_MENU, OPEN_MULTIPLE_FILE_MENU, OPEN_DIRECTORY_MENU,
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
          };
          dialog.showMessageBox(mainWindow, options).then(r => {
            if (r.response === 0) {
              app.quit();
            }
          }).catch();
        }
      }
    ]
  }
  ]);
}

/*
* This function is called when user click on open file
* This open a dialog to browse file
* */
async function openFile(properties = [], dir = false) {
  let files = new Set();
  const f = await dialog.showOpenDialog({
    properties,
    filters: [{
      name: NAME,
      extensions: EXT
    },]
  });
  if (f.canceled) return null;
  if (dir) {
    // Getting files from directory
    for await (const ff of walk(f.filePaths[0], EXT)) {
      files.add(new File(ff));
    }
  } else {
    f.filePaths.forEach(ff => files.add(new File(ff)));
  }
  global.sharedData.playlist = [...files];
  global.sharedData.current = [...files][0];
  broadCastEvent('sharedDataChanged', {});
}

