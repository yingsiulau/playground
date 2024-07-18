import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CanvasBoxComponent } from './component/canvas-box/canvas-box.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CanvasBoxComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'playground';
}
