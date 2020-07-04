import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {eFileState, MediaFile} from "../models/MediaFile";

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css']
})
export class PlaylistComponent implements OnInit {
  @Input() public current: MediaFile;
  @Input() public playlist: MediaFile[];
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

  stopPlaying() {

  }
}
