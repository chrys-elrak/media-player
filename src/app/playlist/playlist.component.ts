import {Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import {eFileState, MediaFile} from "../models/MediaFile";
import {IpcService} from "../services/ipc/ipc.service";
import {Subscription} from "rxjs";
import {SharedService} from "../services/shared/shared.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css']
})
export class PlaylistComponent implements OnInit, OnDestroy {
  public current: MediaFile;
  public playlist: MediaFile[] = [];
  public eStateFile = eFileState;
  private subscriptions: Subscription[] = [];
  public iconStates = {
    play: 'play_circle_filled',
    pause: 'pause_circle_filled',
    stop: 'stop',
    repeat: 'replay'
  };

  constructor(private ipcService: IpcService, private sharedService: SharedService, private zone: NgZone, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    const sub1 = this.ipcService.on('sharedDataChanged').subscribe(_ => {
      this.zone.run(_ => {
        this.playlist = this.sharedService.getSharedData('playlist');
        this.setCurrent(this.sharedService.getSharedData('current'));
      });
    });
    this.subscriptions.push(sub1);
    this.playlist = this.sharedService.getSharedData('playlist');
    this.current = this.sharedService.getSharedData('current');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  setCurrent(item: MediaFile) {
    if (item) {
      this.current = item;
      return;
    }
    this.current = this.playlist[0];
  }

  removeFromList(item: MediaFile) {
    this.playlist = this.playlist.filter(f => f.ino !== item.ino);

    // play next when removing current
    if (this.current.ino === item.ino) {
      const idx = this.playlist.findIndex(f => f.ino === item.ino);
      if (idx < this.playlist.length - 1) {
        this.current = this.playlist[idx + 1];
      } else {
        this.current = null;
      }
    }
    this.ipcService.send('updateSharedData', {playlist: this.playlist, current: this.current});
    this.snackBar.open(`${item.basename} removed from playlist.`, null, {
      duration: 2000,
    });
  }

  getFileDetails(item: MediaFile) {
    this.ipcService.send('getFileDetails', item);
  }


  /*removeFromList(file: MediaFile) {


  }*/

  stopPlaying() {

  }
}
