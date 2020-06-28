const fs = require('fs');
const path = require('path');
const url = require('url');
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

module.exports = File;
