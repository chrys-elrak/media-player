import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ExtractFilenamePipe} from '../extract-filename.pipe';
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
  public iconStates = {
    play: 'play_circle_filled',
    pause: 'pause_circle_filled',
    stop: 'stop',
    repeat: 'replay'
  };
  @ViewChild('video') public video: ElementRef;

  constructor(private snackBar: MatSnackBar, zone: NgZone,) {
    ipcRenderer.on('files-loaded', (event, arg) => {
      zone.run(() => {
        this.playlist = arg.playlist;
        this.setCurrent(this.playlist[0]);
      });
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
          return null;
        }
      }
      this.current = file;
    } else {
      this.current = this.playlist[0];
    }
    this.current.state = eFileState.PLAY;
    this.video.nativeElement.src = this.current.url;
    this.video.nativeElement.load();
    this.video.nativeElement.play();
  }

  stop() {
    this.current.state = eFileState.STOP;
    this.video.nativeElement.pause();
    this.video.nativeElement.currentTime = 0;
  }

  removeFromList(item2remove) {
    const fileNameExtractor = new ExtractFilenamePipe();
    this.playlist = this.playlist.filter(item => item !== item2remove);
    this.snackBar.open(`${fileNameExtractor.transform(item2remove)} removed from playlist.`, null, {
      duration: 2000,
    });
    console.log(item2remove, this.current);
    if (!!this.playlist.length) {
      return this.setCurrent();
    }
    this.video.nativeElement.pause();
    this.video.nativeElement.currentTime = 0;
    this.video.nativeElement.src = '';
  }
}
