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
const File = require('./core/models/file');
const walk = require('./core/helpers/walkDirectories');
const {
  mergeItBox
} = require('./core/helpers/box');
const eFileState = require('./core/enums/state');
const {
  broadCastEvent
} = require('./core/helpers/ipc');
require('dotenv').config();

/** CONSTANTS **/
const PATH_NAME = path.join(__dirname, '/dist/media-player/index.html'),
  TITLE = 'CMP (Chrys Media Player)';
const EXT = ['mkv', 'avi', 'mp4', 'mp3', 'wav'],
  NAME = 'Files',
  HEIGHT = 300,
  WIDTH = 600;

/** GLOBAL VARIABLES**/
let $win, $playlistWin;

/** SHARED DATA **/
global.sharedData = {
  playlist: [],
  current: null
}

/** MAIN PROCESS **/

app.on("ready", createWindow); // Main function

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/** INTER PROCESS COMMUNICATION **/

ipcMain.on('open-playlist', async (e, arg) => {
  if (arg.open) {
    $playlistWin.close();
    $win.webContents.send('playlist-opened', false);
  } else {
    initPlaylistWindow(true);
    $playlistWin.setMenu(null);
    await $playlistWin.loadURL(url.format({
      pathname: PATH_NAME,
      protocol: 'file:',
      slashes: true,
      hash: '/playlist'
    }));
    $playlistWin.webContents.openDevTools();
    $playlistWin.show();
    $win.webContents.send('playlist-opened', true);
    $playlistWin.on('closed', () => {
      $win.webContents.send('playlist-opened', false);
      $playlistWin = null;
    });
  }
});

/** FUNCTIONS **/

/**
 * Create the main window
 * We can found the core of the app here
 */
async function createWindow() {
  $win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    title: TITLE,
    minWidth: 620,
    minHeight: 120,
    webPreferences: {
      nodeIntegration: true
    }
  });

  await $win.loadURL(
    url.format({
      pathname: PATH_NAME,
      protocol: "file:",
      slashes: true
    })
  );

  initPlaylistWindow(false);

  $win.setMenu(buildMenu());

  $win.on('minimize', () => {
    if (!!current) {
      const notification = new Notification({
        title: 'Media player is running',
        subtitle: 'You can change music/video from here',
        body: `${current.basename}`,
      });
      notification.show();
    }
  });

  process.env.ENV === 'dev' ? $win.webContents.openDevTools() : null;

  $win.on("closed", (e) => {
    $win = null;
  });
}

/**
 * Create an window playslist, show or hidden depends on show param
 * @param show{boolean}
 */
function initPlaylistWindow(show) {
  $playlistWin = new BrowserWindow({
    parent: $win,
    width: WIDTH,
    height: HEIGHT,
    title: `${TITLE} - Playlist`,
    show,
    webPreferences: {
      nodeIntegration: true
    }
  });
}

/**
 * Build menu bar, with those specific action
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
          }
          dialog.showMessageBox($win, options).then(r => {
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
  try {
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
  } catch (e) {
    throw e;
  }
}

