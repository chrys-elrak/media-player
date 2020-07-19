import {Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import {eFileState, MediaFile} from "../models/MediaFile";
import {IpcService} from "../services/ipc/ipc.service";
import {Subscription} from "rxjs";
import {SharedService} from "../services/shared/shared.service";

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

  constructor(private ipcService: IpcService, private sharedService: SharedService, private zone: NgZone) {
  }

  ngOnInit(): void {
    const sub1 = this.ipcService.on('sharedDataChanged').subscribe(_=> {
      this.zone.run(_ => {
        this.playlist = this.sharedService.getSharedData('playlist');
        this.current = this.sharedService.getSharedData('current');
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
