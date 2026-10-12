import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { PageContextService } from '../../core/services/page-context.service';
import { BUSINESS_ENDPOINTS } from '../../shared/data/system';
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

  protected readonly methods = METHODS;
  protected readonly methodFilter = signal<HttpMethod | 'ALL'>('ALL');
  protected readonly serviceFilter = signal('ALL');
  protected readonly query = signal('');

  protected readonly services = [...new Set(BUSINESS_ENDPOINTS.map((item) => item.service.name))];

  protected readonly filtered = computed(() => {
    const method = this.methodFilter();
    const service = this.serviceFilter();
    const q = this.query().trim().toLowerCase();
    return BUSINESS_ENDPOINTS.filter((item) => {
      if (method !== 'ALL' && item.method !== method) return false;
      if (service !== 'ALL' && item.service.name !== service) return false;
      if (!q) return true;
      return `${item.method} ${item.path} ${item.summary} ${item.handler}`.toLowerCase().includes(q);
    });
  });

  constructor() {
    this.context.setSections([
      { id: 'filtros', title: 'Filtros' },
      { id: 'lista', title: 'Rotas de negócio' },
    ]);
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }
}
