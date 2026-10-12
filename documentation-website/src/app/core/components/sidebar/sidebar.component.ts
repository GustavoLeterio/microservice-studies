import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { PageContextService } from '../../services/page-context.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly nav = inject(NavigationService);
  protected readonly context = inject(PageContextService);
}
