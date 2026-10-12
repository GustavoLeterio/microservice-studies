import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { SERVICE_KIND_ORDER, SYSTEM_SERVICES } from '../../shared/data/system';
import { SERVICE_KIND_LABEL } from '../../shared/models/system.models';

@Component({
  selector: 'app-home',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly nav = inject(NavigationService);
  protected readonly kinds = SERVICE_KIND_ORDER;
  protected readonly kindLabel = SERVICE_KIND_LABEL;
  protected readonly services = SYSTEM_SERVICES;

  protected servicesOf(kind: (typeof SERVICE_KIND_ORDER)[number]) {
    return this.services.filter((service) => service.kind === kind);
  }
}
