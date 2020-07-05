import {Component, ElementRef, HostListener, NgZone, OnInit, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {eFileState, MediaFile} from '../models/MediaFile';
import {VideoControllerComponent} from "../video-controller/video-controller.component";

declare var ipcRenderer: any;
declare var remote: any;

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit {
  public playlist: MediaFile[] = [];
  public current: MediaFile;
  public maximized: boolean = false;
  public duration: number = 0;
  public currentTime: number = 0;
  public volume: number = 1;
  @ViewChild('video') public video: ElementRef;
  @ViewChild('videoControllerComponent') public videoController: VideoControllerComponent;

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
        if (this.volume > .1) {
          this.volume -= .1;
          this.setVolume(this.volume);
        }
      }
      if (ev.shiftKey && ev.code === 'ArrowUp') {
        this.volume = this.volume !== 1 ? this.volume += .1 : 1;
        this.setVolume(this.volume);
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

  /*  private updateSharedData(key, value) {
      remote.getGlobal('sharedData')[key] = value;
    }*/

  ngOnInit(): void {
  }

  setCurrent(file: MediaFile = null) {
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

  loadMetaData() {
    this.duration = this.video.nativeElement.duration;
    this.currentTime = this.video.nativeElement.currentTime;
    this.videoController.duration = this.duration;
  }

  playNext() {
    const last = this.playlist[this.playlist.length - 1];
    const idx = this.playlist.findIndex(f => f.ino === this.current.ino);
    if (this.current.ino !== last.ino && idx < this.playlist.length) {
      this.setCurrent(this.playlist[idx + 1]);
    } else {
      this.stopPlaying();
    }
  }

  playPrevious() {
    const first = this.playlist[0];
    const idx = this.playlist.findIndex(f => f.ino === this.current.ino);
    if (this.current.ino !== first.ino) {
      this.setCurrent(this.playlist[idx - 1]);
    } else {
      this.replay();
    }
  }

  toggleState() {
    if (this.current) {
      if (this.current.state !== eFileState.PLAY) {
        this.current.state = eFileState.PLAY;
        this.video.nativeElement.play();
      } else {
        this.current.state = eFileState.PAUSE;
        this.video.nativeElement.pause();
      }
    }
  }

  updateProgressBar() {
    this.currentTime = this.video.nativeElement.currentTime;
    this.videoController.updateDuration()
  }

  seek(value: number) {
    this.video.nativeElement.currentTime = value;
  }

  setVolume(value: number) {
    this.video.nativeElement.volume = value;
  }

  private replay() {
    if (this.current) {
      this.video.nativeElement.currentTime = 0;
      this.video.nativeElement.play();
    }
  }

  onResize(e) {
    this.video.nativeElement.height = e.outerHeight;
    this.video.nativeElement.width = e.outerWidth;
  }

  toggleFullScreen() {
    if (document.fullscreenElement && document.fullscreenElement.nodeName == 'VIDEO') {
      this.video.nativeElement.webkitExitFullScreen();
    } else {
      this.video.nativeElement.webkitEnterFullScreen();
    }
  }

  fullScreenChange() {
    console.log('Press esc to exit full screen');
  }
}
