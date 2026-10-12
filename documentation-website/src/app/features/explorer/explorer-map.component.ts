import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { PageContextService } from '../../core/services/page-context.service';
import { SERVICE_KIND_ORDER, SYSTEM_SERVICES } from '../../shared/data/system';
import { SERVICE_KIND_LABEL, ServiceKind } from '../../shared/models/system.models';

@Component({
  selector: 'app-explorer-map',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explorer-map.component.html',
  styleUrl: './explorer-map.component.scss',
})
export class ExplorerMapComponent {
  private readonly context = inject(PageContextService);

  protected readonly kinds = SERVICE_KIND_ORDER;
  protected readonly kindLabel = SERVICE_KIND_LABEL;
  protected readonly services = SYSTEM_SERVICES;

  constructor() {
    this.context.setSections(this.kinds.map((kind) => ({ id: kind, title: SERVICE_KIND_LABEL[kind] })));
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }

  protected of(kind: ServiceKind) {
    return this.services.filter((service) => service.kind === kind);
  }
}
