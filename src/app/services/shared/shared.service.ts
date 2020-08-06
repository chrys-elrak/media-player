import {Injectable} from '@angular/core';
import {IpcService} from "../ipc/ipc.service";

declare var remote: any;

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private remote: any;

  public updateSharedData(key: string, value: any) {
    this.remote.getGlobal('sharedData')[key] = value;
    this.ipcService.send('updateSharedData');
  }

  public getSharedData(key: string) {
    return this.remote.getGlobal('sharedData')[key];
  }

  constructor(private ipcService: IpcService) {
    this.remote = remote;
  }
}
