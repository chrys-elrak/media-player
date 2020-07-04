export class MediaFile {
  constructor(public pathname: string, public basename: string, public url: string, public ino: number, public size: number,
              public filetype: string, public mimetype: string,
              public ctime: Date, public atime: Date, public mtime: Date, public birthtime: Date, public state: eFileState = eFileState.STOP) {
  }
}

export enum eFileState {
  STOP,
  PLAY,
  PAUSE
}
