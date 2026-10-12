import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { UI } from '../../core/i18n/ui-text';
import { LocaleService } from '../../core/services/locale.service';
import { PageContextService } from '../../core/services/page-context.service';
import { businessEndpointsFor } from '../../shared/data/system';
import { HttpMethod } from '../../shared/models/system.models';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

@Component({
  selector: 'app-endpoints-catalog',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './endpoints-catalog.component.html',
  styleUrl: './endpoints-catalog.component.scss',
})
export class EndpointsCatalogComponent {
  private readonly context = inject(PageContextService);
  private readonly locale = inject(LocaleService);

  protected readonly methods = METHODS;
  protected readonly methodFilter = signal<HttpMethod | 'ALL'>('ALL');
  protected readonly serviceFilter = signal('ALL');
  protected readonly query = signal('');
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  protected readonly endpoints = computed(() => businessEndpointsFor(this.locale.lang()));

  protected readonly services = computed(() => [...new Set(this.endpoints().map((item) => item.service.name))]);

  protected readonly filtered = computed(() => {
    const method = this.methodFilter();
    const service = this.serviceFilter();
    const q = this.query().trim().toLowerCase();
    return this.endpoints().filter((item) => {
      if (method !== 'ALL' && item.method !== method) return false;
      if (service !== 'ALL' && item.service.name !== service) return false;
      if (!q) return true;
      return `${item.method} ${item.path} ${item.summary} ${item.handler}`.toLowerCase().includes(q);
    });
  });

  constructor() {
    effect(() => {
      const ui = this.ui();
      this.context.setSections([
        { id: 'filtros', title: ui.filters },
        { id: 'lista', title: ui.businessRoutes },
      ]);
    });
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }
}
