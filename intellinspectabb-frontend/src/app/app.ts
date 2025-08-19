import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // <-- We are importing RouterOutlet now
import { NavigationComponent } from './navigation/navigation.component'; // <-- 1. Import the new component

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent], // <-- We are ONLY importing RouterOutlet
  template: `
            <!-- The navigation bar will always be visible -->
    <app-navigation></app-navigation>

    <!-- The current screen will be displayed below the navbar -->
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.scss'
})
export class AppComponent {
}
