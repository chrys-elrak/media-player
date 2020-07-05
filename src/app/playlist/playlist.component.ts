import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {eFileState, MediaFile} from "../models/MediaFile";

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css']
})
export class PlaylistComponent implements OnInit {
  @Input() public current: MediaFile;
  @Input() public playlist: MediaFile[] = [];
  public eStateFile = eFileState;
  public iconStates = {
    play: 'play_circle_filled',
    pause: 'pause_circle_filled',
    stop: 'stop',
    repeat: 'replay'
  };

  constructor() {
  }

  ngOnInit(): void {
  }

  setCurrent(item: MediaFile) {

  }

  removeFromList(item: MediaFile) {

  }

  getFileDetails(item: MediaFile) {

  }

  /*getFileDetails(file: MediaFile) {
    ipcRenderer.send('get-file-details', file);
  }

  removeFromList(file: MediaFile) {
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
  }*/

  stopPlaying() {

  }
}
