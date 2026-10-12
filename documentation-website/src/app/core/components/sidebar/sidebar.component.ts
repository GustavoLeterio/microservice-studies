import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UI } from '../../i18n/ui-text';
import { LocaleService, watchLocale } from '../../services/locale.service';
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
  protected readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
}
