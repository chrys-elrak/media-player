import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {VideoPlayerComponent} from "./video-player/video-player.component";
import {PlaylistComponent} from "./playlist/playlist.component";

const routes: Routes = [
  {path: '', component: VideoPlayerComponent},
  {path: 'playlist', component: PlaylistComponent}
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
