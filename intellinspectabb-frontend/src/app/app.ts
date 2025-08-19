import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // <-- We are importing RouterOutlet now

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // <-- We are ONLY importing RouterOutlet
  template: `
    <!-- This placeholder tells Angular where to display the screen for the current URL -->
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.scss'
})
export class AppComponent {
}
