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
  @ViewChild('video') public video: ElementRef;

  constructor(zone: NgZone) {
    ipcRenderer.on('files-loaded', (event, arg: string[]) => {
      zone.run(() => {
        this.playlist = [].concat([], arg);
        remote.getGlobal('sharedData').playlist = this.playlist;
        if (this.current === undefined) {
          this.setCurrent(this.playlist[0]);
          console.log('current is undefined');
        }
        console.log(this.playlist);
      });
    });
  }

  ngOnInit(): void {
    ipcRenderer.send('init');
  }

  openFiles() {
    ipcRenderer.send('open-files');
  }

  setCurrent(pathName) {
    this.current = `file:///${pathName}`;
    this.video.nativeElement.src = this.current;
    this.video.nativeElement.load();
    this.video.nativeElement.play();
  }
}
