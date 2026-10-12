import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationService } from './core/services/navigation.service';

@Component({
  selector: 'app-root',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly nav = inject(NavigationService);
}
