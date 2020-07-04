import {Component, Input, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-video-controller',
  templateUrl: './video-controller.component.html',
  styleUrls: ['./video-controller.component.css']
})
export class VideoControllerComponent implements OnInit {
  @Input() public currentTime: number;
  @Input() public duration: number = 0;
  constructor() { }

  ngOnInit(): void {
  }

}
