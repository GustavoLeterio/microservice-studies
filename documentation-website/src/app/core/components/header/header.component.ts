import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UI } from '../../i18n/ui-text';
import { LocaleService, watchLocale } from '../../services/locale.service';
import { NavigationService } from '../../services/navigation.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly nav = inject(NavigationService);
  protected readonly theme = inject(ThemeService);
  protected readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
}
