import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatVideoModule} from 'mat-video';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCardModule} from '@angular/material/card';
import {VideoPlayerComponent} from './video-player/video-player.component';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { VideoControllerComponent } from './video-controller/video-controller.component';
import { PlaylistComponent } from './playlist/playlist.component';
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatSliderModule} from "@angular/material/slider";
import { AppRoutingModule } from './app-routing.module';


@NgModule({
  declarations: [
    AppComponent,
    VideoPlayerComponent,
    VideoControllerComponent,
    PlaylistComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatVideoModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatGridListModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSliderModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
