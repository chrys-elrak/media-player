const fs = require('fs');
const path = require('path');
const url = require('url');
const videoTypes = ['mkv', 'mp4', 'avi'], audioTypes = ['wav', 'mp3'], pictureTypes = ['gif', 'jpeg', 'jpg', 'png', 'bmp', 'svg'];

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
    this.filetype = path.extname(pathname).slice(1, -1);
    if (videoTypes.includes(this.filetype)) {
      this.mimetype = `video/${this.filetype}`;
    } else if (audioTypes.includes(this.filetype)) {
      this.mimetype = `audio/${this.filetype}`;
    } else if (pictureTypes.includes(this.filetype)) {
      this.mimetype = `images/${this.filetype}`;
    }
    this.url = url.format({
      pathname,
      protocol: 'file:',
    });
  }
}

module.exports = File;
