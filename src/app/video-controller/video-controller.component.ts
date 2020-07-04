import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {eFileState} from "../models/MediaFile";

@Component({
  selector: 'app-video-controller',
  templateUrl: './video-controller.component.html',
  styleUrls: ['./video-controller.component.css']
})
export class VideoControllerComponent implements OnInit {
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
  @ViewChild('seekbar') public seekbar: ElementRef;

  public eState = eFileState;
  public icons: Record<string, string> = {
    play: 'play_arrow',
    pause: 'pause',
    stop: 'stop',
    next: 'skip_next',
    prev: 'skip_previous',
    repeatOnce: 'repeat_once',
    repeatAll: 'repeat_all',
    shuffle: 'shuffle'
  };

  constructor() {
  }

  ngOnInit(): void {
  }

  seekTo(e) {
    this.onSeek.emit(e);
  }

  setVolumeTo(e) {
    this.onVolumeChange.emit(e);
  }

  formatLabel(value: number) {
    return Math.round(value * 100) + '%';
  }

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
}
