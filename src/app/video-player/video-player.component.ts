import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ExtractFilenamePipe} from '../extract-filename.pipe';

declare var ipcRenderer: any;
declare var remote: any;

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit {
  public playlist: string[] = [];
  public current: string;
  public iconStates = {
    play: 'play_circle_filled',
    pause: 'pause_circle_filled',
    stop: 'stop',
    repeat: 'replay'
  };
  public currentIcon;
  @ViewChild('video') public video: ElementRef;

  constructor(private snackBar: MatSnackBar, zone: NgZone,) {
    ipcRenderer.on('files-loaded', (event, arg) => {
      zone.run(() => {
        this.playlist = arg.files;
        this.setCurrent(this.playlist[0]);
      });
    });
  }

  private updateSharedData(key, value) {
    remote.getGlobal('sharedData')[key] = value;
  }

  ngOnInit(): void {
  }

  setCurrent(pathName = null) {
    if (pathName) {
      this.current = `file:///${pathName}`;
    } else {
      this.current = `file:///${this.playlist[0]}`;
    }
    this.video.nativeElement.src = this.current;
    this.video.nativeElement.load();
    this.video.nativeElement.play();
  }

  removeFromList(item2remove) {
    const fileNameExtractor = new ExtractFilenamePipe();
    this.playlist = this.playlist.filter(item => item !== item2remove);
    this.snackBar.open(`${fileNameExtractor.transform(item2remove)} removed from playlist.`, null, {
      duration: 2000,
    });
    console.log(item2remove, this.current);
    if ('file:///' + item2remove !== this.current) {
      return null;
    }
    if (!!this.playlist.length) {
      return this.setCurrent();
    }
    this.video.nativeElement.pause();
    this.video.nativeElement.currentTime = 0;
    this.video.nativeElement.src = '';
  }
}
