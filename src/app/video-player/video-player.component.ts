import {Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {eFileState, MediaFile} from '../models/MediaFile';
import {VideoControllerComponent} from "../video-controller/video-controller.component";
import {IpcService} from "../services/ipc/ipc.service";
import {Subscription} from "rxjs";
import {SharedService} from "../services/shared/shared.service";

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  public playlist: MediaFile[] = [];
  public current: MediaFile;
  public duration: number = 0;
  public currentTime: number = 0;
  public volume: number = 1;
  private subscriptions: Subscription[] = [];
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
      if (ev.code === 'ArrowDown') {
        if (this.volume > .1) {
          this.volume -= .1;
          this.setVolume(this.volume);
        }
      }
      if (ev.code === 'ArrowUp') {
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
      if (ev.code === 'ArrowRight') {
        this.video.nativeElement.currentTime += 5;
      }
      if (ev.code === 'ArrowLeft') {
        this.video.nativeElement.currentTime -= 5;
      }
    }
  }
  onWheel(ev: WheelEvent) {
    if (this.current) return;
    if (ev.deltaY < 0) { // scroll down
      this.volume = this.volume !== 1 ? this.volume += .1 : 1;
      this.setVolume(this.volume);
    } else if (ev.deltaY > 0) { // scroll up
      if (this.volume > .1) {
        this.volume -= .1;
        this.setVolume(this.volume);
      }
    }
  }

  constructor(private snackBar: MatSnackBar, private zone: NgZone, private ipcService: IpcService, private sharedService: SharedService) {
  }

  ngOnInit(): void {
    const sub1 = this.ipcService.on('sharedDataChanged').subscribe(_ => {
      this.playlist = this.sharedService.getSharedData('playlist');
      this.setCurrent(this.sharedService.getSharedData('current'));
    });
    this.subscriptions.push(sub1);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setCurrent(file: MediaFile = null) {
    if (file) {
      if (this.current && this.current.ino === file.ino) {
        return this.stopPlaying();
      }
      this.current = file;
      return this.play();
    }
    this.stopPlaying();
    this.current = null;

  }

  private play() {
    this.snackBar.open(`Now playing ${this.current.basename}.`, null, {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: 1000,
      politeness: 'polite',
    });
    this.current.state = eFileState.PLAY;
    this.video.nativeElement.src = this.current.url;
    this.video.nativeElement.load();
    this.video.nativeElement.play();
    this.ipcService.send('playing-state', this.current);
  }

  stopPlaying() {
    if (!this.current) return;
    this.current.state = eFileState.STOP;
    this.video.nativeElement.pause();
    this.video.nativeElement.currentTime = 0;
    this.ipcService.send('playing-state', this.current);
  }

  loadMetaData() {
    this.duration = this.video.nativeElement.duration;
    this.currentTime = this.video.nativeElement.currentTime;
    this.videoController.duration = this.duration;
  }

  playNext() {
    if (!this.playlist.length) return;
    const last = this.playlist[this.playlist.length > 0 ? this.playlist.length - 1 : 0];
    const idx = this.playlist.findIndex(f => f.ino === this.current.ino);
    if (this.current.ino !== last.ino && idx < this.playlist.length) {
      return this.setCurrent(this.playlist[idx + 1]);
    }
    if (document.fullscreenElement && document.fullscreenElement.nodeName === 'VIDEO') {
      this.video.nativeElement.webkitExitFullScreen();
      this.stopPlaying();
    }
    this.replay();

  }

  playPrevious() {
    if (!this.playlist.length) return;
    const first = this.playlist[0];
    const idx = this.playlist.findIndex(f => f.ino === this.current.ino);
    if (this.current.ino !== first.ino) {
      return this.setCurrent(this.playlist[idx - 1]);
    }
    this.replay();
  }

  toggleState() {
    if (!this.current) return;
    if (this.current.state !== eFileState.PLAY) {
      this.current.state = eFileState.PLAY;
      return this.video.nativeElement.play();
    }
    this.current.state = eFileState.PAUSE;
    this.video.nativeElement.pause();
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
      this.current.state = eFileState.PLAY;
      this.video.nativeElement.currentTime = 0;
      this.video.nativeElement.play();
    }
  }

  onResize(e) {
    this.video.nativeElement.height = e.outerHeight - 150;
    this.video.nativeElement.width = e.outerWidth;
  }

  toggleFullScreen() {
    if (document.fullscreenElement && document.fullscreenElement.nodeName == 'VIDEO') {
      return this.video.nativeElement.webkitExitFullScreen();
    }
    this.video.nativeElement.webkitEnterFullScreen();
  }

}
