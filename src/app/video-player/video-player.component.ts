import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import * as url from 'url';

declare var ipcRenderer: any;
declare var remote: any;

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit {
  // public src = 'http://static.videogular.com/assets/videos/videogular.mp4';
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

  constructor(zone: NgZone) {
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
}
