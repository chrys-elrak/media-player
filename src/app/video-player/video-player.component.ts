import {Component, ElementRef, HostListener, NgZone, OnInit, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {eFileState, File} from '../models/File';

declare var ipcRenderer: any;
declare var remote: any;

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit {
  public playlist: File[] = [];
  public current: File;
  public eStateFile = eFileState;
  public maximized: boolean = false;
  public duration: number = 0;
  public currentTime: number = 0;
  public iconStates = {
    play: 'play_circle_filled',
    pause: 'pause_circle_filled',
    stop: 'stop',
    repeat: 'replay'
  };
  @ViewChild('video') public video: ElementRef;
  @ViewChild('progressbar') public progressbar: ElementRef;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {
    if (this.current) {
      if (ev.code === 'Space') {
        if (this.current.state === eFileState.PAUSE) {
          this.current.state = eFileState.PLAY;
          this.video.nativeElement.play();
        } else {
          this.current.state = eFileState.PAUSE;
          this.video.nativeElement.pause();
        }
      }
      if (ev.shiftKey && ev.code === 'ArrowDown') {
        if (this.video.nativeElement.volume > .1) {
          this.video.nativeElement.volume -= .1;
        }
      }
      if (ev.shiftKey && ev.code === 'ArrowUp') {
        this.video.nativeElement.volume = this.video.nativeElement.volume !== 1 ? this.video.nativeElement.volume += .1 : 1;
      }
      if (ev.code === 'KeyN') {
        this.playNext();
      }
      if (ev.code === 'KeyP') {
        this.playPrevious();
      }
      if (ev.code === 'KeyS') {
        this.stopPlaying();
      }
      if (ev.shiftKey && ev.code === 'ArrowRight') {
        this.video.nativeElement.currentTime += 5;
      }
      if (ev.shiftKey && ev.code === 'ArrowLeft') {
        this.video.nativeElement.currentTime -= 5;
      }
    }
  }

  onWheel(event: WheelEvent) {
    if (this.current) {
      if (event.deltaY > 0) { // scroll down
        if (this.video.nativeElement.volume > .1) {
          this.video.nativeElement.volume -= .1;
        }
      } else if (event.deltaY < 0) { // scroll up
        if (this.video.nativeElement.volume < 1) {
          this.video.nativeElement.volume += .1;
        }
      }
    }
  }

  constructor(private snackBar: MatSnackBar, zone: NgZone) {
    ipcRenderer.on('files-loaded', (event, arg) => {
      zone.run(() => {
        this.playlist = arg.playlist;
        if (!this.current || !arg.merge) {
          this.setCurrent(this.playlist[0]);
        }
        // TO FIX
        if (arg.merge && this.current.ino === this.playlist[0].ino) {
          this.current.state = eFileState.PLAY;
          this.playlist[0].state = eFileState.PLAY;
        }
      });
    });

    ipcRenderer.on('window-maximize', (event, value) => {
      this.maximized = value;
    });
  }

  private updateSharedData(key, value) {
    remote.getGlobal('sharedData')[key] = value;
  }

  ngOnInit(): void {
  }

  setCurrent(file: File = null) {
    if (file) {
      if (this.current) {
        if (this.current.ino !== file.ino) {
          this.current.state = eFileState.STOP;
        }
        if (this.current.ino === file.ino) {
          if (this.current.state === eFileState.PLAY) {
            this.current.state = eFileState.PAUSE;
            this.video.nativeElement.pause();
          } else {
            this.current.state = eFileState.PLAY;
            this.video.nativeElement.play();
          }
          return ipcRenderer.send('playing-state', this.current);
        }
      }
      this.current = file;
    } else {
      this.current = this.playlist[0];
    }
    this.snackBar.open(`Now playing ${this.current.basename}.`, null, {
      duration: 2000,
    });
    this.current.state = eFileState.PLAY;
    this.video.nativeElement.src = this.current.url;
    this.video.nativeElement.load();
    this.video.nativeElement.play();
    ipcRenderer.send('playing-state', this.current);
  }

  stopPlaying() {
    this.current.state = eFileState.STOP;
    this.video.nativeElement.pause();
    this.video.nativeElement.currentTime = 0;
    ipcRenderer.send('playing-state', this.current);
  }

  getFileDetails(file: File) {
    ipcRenderer.send('get-file-details', file);
  }

  removeFromList(file: File) {
    this.playlist = this.playlist.filter(item => item.ino !== file.ino);
    ipcRenderer.send('playlist-updated', this.playlist);
    this.snackBar.open(`${file.basename} removed from playlist.`, null, {
      duration: 2000,
    });
    if (this.current.ino === file.ino) {
      this.video.nativeElement.pause();
      this.video.nativeElement.currentTime = 0;
      this.video.nativeElement.src = '';
    }
  }

  loadMetaData() {
    this.duration = this.video.nativeElement.duration;
    this.currentTime = this.video.nativeElement.currentTime;
    this.progressbar.nativeElement.max = this.duration;
  }

  playNext(end: boolean = false) {
    const last = this.playlist[this.playlist.length - 1];
    const idx = this.playlist.findIndex(f => f.ino === this.current.ino);
    if (this.current.ino !== last.ino && idx < this.playlist.length) {
      this.setCurrent(this.playlist[idx + 1]);
    } else {
      if (!end) {
        this.replay();
      }
    }
  }

  toggleState() {
    if (this.current) {
      if (this.current.state === eFileState.PLAY) {
        this.current.state = eFileState.PAUSE;
      } else if (this.current.state === eFileState.PAUSE) {
        this.current.state = eFileState.PLAY;
      }
    }
  }

  setState(pause = false) {
    if (this.current) {
      if (pause) {
        this.current.state = eFileState.PAUSE;
      } else {
        this.current.state = eFileState.PLAY;
      }
    }
  }

  private playPrevious() {
    const first = this.playlist[0];
    const idx = this.playlist.findIndex(f => f.ino === this.current.ino);
    if (this.current.ino !== first.ino) {
      this.setCurrent(this.playlist[idx - 1]);
    } else {
      this.replay();
    }
  }

  updateProgressBar() {
    this.currentTime = this.video.nativeElement.currentTime;
  }

  private replay() {
    if (this.current) {
      this.video.nativeElement.currentTime = 0;
      this.video.nativeElement.play();
    }
  }
}
