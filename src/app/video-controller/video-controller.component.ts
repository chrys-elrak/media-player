import {MediaFile} from '../models/MediaFile';
import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {eFileState} from "../models/MediaFile";
import {IpcService} from "../services/ipc/ipc.service";
import {Subscription} from "rxjs";
import {SharedService} from "../services/shared/shared.service";


@Component({
  selector: 'app-video-controller',
  templateUrl: './video-controller.component.html',
  styleUrls: ['./video-controller.component.css']
})
export class VideoControllerComponent implements OnInit, OnDestroy {
  @Input() public state: eFileState = eFileState.STOP;
  @Input() public currentTime: number;
  @Input() public duration: number = 0;
  @Input() public volume: number = 1;
  @Output() private onSeek: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onVolumeChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onTogglePlay: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onNext: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onPrev: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onStop: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onUpdatePlayingState: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('videoController') public videoController: ElementRef;

  public eState = eFileState;
  public icons: Record<string, string> = {
    play: 'play_arrow',
    pause: 'pause',
    stop: 'stop',
    next: 'skip_next',
    prev: 'skip_previous',
    repeatOnce: 'repeat_once',
    repeatAll: 'repeat_all',
    shuffle: 'shuffle',
    playlist: 'playlist_play'
  };
  public currentDuration: string = '00:00';
  public timeDuration: string = '00:00';
  public hideControl: boolean = true;
  private playlistOpen: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private ipcService: IpcService, private sharedService: SharedService) {
  }

  ngOnInit(): void {
    let sub1 = this.ipcService.on('playlistOpened').subscribe((data: any) => {
      this.playlistOpen = data
    });

    this.subscriptions.push(sub1);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /*
  * TO FIX: Handle video having duration more than 60 minutesS
  * */
  updateDuration() {
    let curmins: any = Math.floor(this.currentTime / 60);
    let cursecs: any = Math.floor(this.currentTime - curmins * 60);
    let durmins: any = Math.floor(this.duration / 60);
    let dursecs: any = Math.floor(this.duration - durmins * 60);
    if (cursecs < 10) {
      cursecs = "0" + cursecs;
    }
    if (dursecs < 10) {
      dursecs = "0" + dursecs;
    }
    if (curmins < 10) {
      curmins = "0" + curmins;
    }
    if (durmins < 10) {
      durmins = "0" + durmins;
    }
    this.timeDuration = durmins + ":" + dursecs;
    this.currentDuration = curmins + ":" + cursecs;
  }

  seekTo(e) {
    this.onSeek.emit(e);
  }

  setVolumeTo(e) {
    this.onVolumeChange.emit(e);
  }


  /*
  * TO DO: Update playing state [shuffle, repeat, repeat_once]
  * */
  updatePlayingState() {
    this.onUpdatePlayingState.emit();
  }

  next() {
    this.onNext.emit();
  }

  prev() {
    this.onPrev.emit();
  }

  stop() {
    this.onStop.emit();
  }

  togglePlay() {
    this.onTogglePlay.emit();
  }

  togglePlaylistWindow() {
    this.ipcService.send('openPlaylist', {open: this.playlistOpen});
  }
}
