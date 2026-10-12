import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { UI } from '../../core/i18n/ui-text';
import { LocaleService } from '../../core/services/locale.service';
import { PageContextService } from '../../core/services/page-context.service';
import { SERVICE_KIND_ORDER, servicesFor } from '../../shared/data/system';
import { SERVICE_KIND_LABEL, SERVICE_KIND_LABEL_EN, ServiceKind } from '../../shared/models/system.models';

@Component({
  selector: 'app-explorer-map',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explorer-map.component.html',
  styleUrl: './explorer-map.component.scss',
})
export class ExplorerMapComponent {
  private readonly context = inject(PageContextService);
  private readonly locale = inject(LocaleService);

  protected readonly kinds = SERVICE_KIND_ORDER;
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  protected readonly kindLabel = computed(() =>
    this.locale.lang() === 'en' ? SERVICE_KIND_LABEL_EN : SERVICE_KIND_LABEL,
  );
  protected readonly services = computed(() => servicesFor(this.locale.lang()));

  constructor() {
    effect(() => {
      const labels = this.kindLabel();
      this.context.setSections(this.kinds.map((kind) => ({ id: kind, title: labels[kind] })));
    });
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }

  protected of(kind: ServiceKind) {
    return this.services().filter((service) => service.kind === kind);
  }
}
