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

let $win, $playlistWin, $playlist = new Set(); // GLOBAL VARIABLES

const PATH_NAME = path.join(__dirname, '/dist/media-player/index.html'),
  TITLE = 'CMP (Chrys Media Player)';
const EXT = ['mkv', 'avi', 'mp4', 'mp3', 'wav'],
  NAME = 'Files',
  HEIGHT = 300,
  WIDTH = 600;
const OPEN_FILE_MENU = {
  label: 'Open file',
  accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
  async click() {
    if ($win) {
      try {
        const f = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{
            name: NAME,
            extensions: EXT
          }, ]
        })
        if (f.canceled) return null;
        let merge = ($playlist.size > 0) ? (await mergeItBox(dialog, $win)).response === 0 : false; // Show prompt to user
        broadCastEvent('files-loaded', {
          playlist: setFiles(f.filePaths, merge).map(f => new File(f)),
          current: 0,
          merge
        })
      } catch (e) {
        throw e;
      }
    }
  }
};
const OPEN_MULTIPLE_FILE_MENU = {
  label: 'Open files',
  accelerator: process.platform === 'darwin' ? 'Cmd+Shit+O' : 'Ctrl+Shift+O',
  async click() {
    if ($win) {
      try {
        const f = await dialog.showOpenDialog({
          properties: ['openFile', "multiSelections"],
          filters: [{
            name: NAME,
            extensions: EXT
          }, ]
        });
        if (f.canceled) return null;
        let merge = ($playlist.size > 0) ? (await mergeItBox(dialog, $win)).response === 0 : false;
        broadCastEvent('files-loaded', {
          playlist: setFiles(f.filePaths, merge).map(f => new File(f)),
          merge
        });
      } catch (e) {
        throw e;
      }
    }
  }
};
const OPEN_DIRECTORY_MENU = {
  label: 'Open folder',
  accelerator: process.platform === 'darwin' ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
  async click() {
    if ($win) {
      try {
        const d = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          filters: [{
            name: NAME,
            extensions: EXT
          }, ]
        });
        if (d.canceled) return null;
        const files = [];
        // Getting files from directory
        for await (const p of walk(d.filePaths[0], EXT)) {
          files.push(p);
        }
        let merge = ($playlist.size > 0) ? (await mergeItBox(dialog, $win)).response === 0 : false;
        broadCastEvent('files-loaded', {
          playlist: setFiles(files, merge).map(f => new File(f)),
          merge
        });
      } catch (e) {
        throw e;
      }
    }
  }
};
const MENU_TEMPLATE = new Menu.buildFromTemplate([{
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
  },
  {
    label: 'View',
    submenu: [{
      label: 'Auto hide control',
      type: "checkbox",
      checked: true,
      click(menuItem, browserWindow) {
        browserWindow.webContents.send('hide-control', menuItem.checked);
      }
    }]
  }
]);

/**
 * Create an array of files path from $playlist and return an array of these paths without duplications
 * @param files{string[]}
 * @param merge{boolean}
 * @returns {string[]}
 */
function setFiles(files, merge = true) {
  if (!merge) {
    $playlist.clear();
  }
  files.forEach(f => {
    $playlist.add(f);
  });
  return [...$playlist];
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

  $win.setMenu(MENU_TEMPLATE);

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

/* IPC stuff  */

ipcMain.on('$playlist-updated', (event, newPlaylist) => {
  $playlist = new Set(newPlaylist);
});

ipcMain.on('get-file-details', async (event, file) => {
  const r = await dialog.showMessageBox($win, {
    title: `Information`,
    message: `Title: ${file.basename}\nType: ${file.filetype}\nSize: ${(file.size / Math.pow(1024, 2)).toFixed(2)} MB\nCreated: ${moment(file.birthtime).format('MMMM Do YYYY, h:mm:ss a')}`,
    type: 'info',
  });
});

ipcMain.on('playing-state', (e, currentFile) => {
  if (currentFile.state === eFileState.PLAY) {
    current = currentFile;
  } else {
    current = null;
  }
});

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
    $playlistWin.webContents.send("data", {
      playlist: arg.playlist,
      current: arg.current
    });
    $playlistWin.on('closed', () => {
      $win.webContents.send('playlist-opened', false);
      $playlistWin = null;
    });
  }
});

/* IPC stuff  */

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
