import {Injectable} from '@angular/core';

declare var remote: any;

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private remote: any;

  public updateSharedData(key: string, value: any) {
    this.remote.getGlobal('sharedData')[key] = value;
  }

  public getSharedData(key: string) {
    return this.remote.getGlobal('sharedData')[key];
  }

  constructor() {
    this.remote = remote;
  }
}
