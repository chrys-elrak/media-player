import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'app-video-controller',
  templateUrl: './video-controller.component.html',
  styleUrls: ['./video-controller.component.css']
})
export class VideoControllerComponent implements OnInit {
  @Input() public currentTime: number;
  @Input() public duration: number = 0;
  @Input() public volume: number = 1;
  @Output() private onSeek: EventEmitter<any> = new EventEmitter<any>();
  @Output() private onVolumeChange: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('seekbar') public seekbar: ElementRef;

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

  }

  next() {

  }

  prev() {

  }

  stop() {

  }

  togglePlay() {

  }
}
