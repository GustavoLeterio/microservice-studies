import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UI } from '../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../core/services/locale.service';
import { NavigationService } from '../../core/services/navigation.service';
import { SERVICE_KIND_ORDER, servicesFor } from '../../shared/data/system';
import { SERVICE_KIND_LABEL, SERVICE_KIND_LABEL_EN } from '../../shared/models/system.models';

@Component({
  selector: 'app-home',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly locale = inject(LocaleService);
  private readonly localeWatch = watchLocale();

  protected readonly nav = inject(NavigationService);
  protected readonly kinds = SERVICE_KIND_ORDER;
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  protected readonly kindLabel = computed(() =>
    this.locale.lang() === 'en' ? SERVICE_KIND_LABEL_EN : SERVICE_KIND_LABEL,
  );
  protected readonly services = computed(() => servicesFor(this.locale.lang()));

  protected servicesOf(kind: (typeof SERVICE_KIND_ORDER)[number]) {
    return this.services().filter((service) => service.kind === kind);
  }
}
