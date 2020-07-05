const {webContents} = require('electron');

function broadCastEvent(eventName, args) {
  webContents.getAllWebContents().forEach(wc => {
    wc.send(eventName, args);
  });
}

module.exports = {
  broadCastEvent
}
