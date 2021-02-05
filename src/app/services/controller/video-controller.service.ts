import {Injectable} from '@angular/core';
import {eFileState, MediaFile} from '../../models/MediaFile';
import {SharedService} from '../shared/shared.service';

@Injectable({
  providedIn: 'root'
})
export class VideoControllerService {

  constructor(private sharedService: SharedService) {
  }

  play() {
  }

  pause() {
  }

  stop() {
  }

  get playlist(): MediaFile[] {
    return this.sharedService.getSharedData('playlist') as MediaFile[];
  }

  set playlist(files: MediaFile[]) {
    this.sharedService.updateSharedData('playlist', files);
  }

  get current(): MediaFile {
    return this.playlist.find(f => f.state === eFileState.PLAY || eFileState.PAUSE);
  }

  set current(file: MediaFile) {
    if (this.current) {
      this.current.state = eFileState.STOP;
    }
    this.playlist.forEach(f => f.ino === file.ino ? f = file : null);
  }
}
