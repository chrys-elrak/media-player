import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';

declare var ipcRenderer: any;
declare var remote: any;

@Injectable({
  providedIn: 'root'
})
export class IpcService {
  private ipcRender: any;
  private remote: any;

  constructor() {
    this.ipcRender = ipcRenderer;
    this.remote = remote;
  }

  on(eventName: string) {
    return new Observable(subscriber => {
      this.ipcRender.on(eventName, (event, data) => {
        subscriber.next(data);
      });
    });
  }

  send(eventName: string, data: any = null) {
    this.ipcRender.send(eventName, data);
  }


}
