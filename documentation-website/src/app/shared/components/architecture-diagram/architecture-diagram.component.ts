import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UI } from '../../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../../core/services/locale.service';

@Component({
  selector: 'app-architecture-diagram',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './architecture-diagram.component.html',
  styleUrl: './architecture-diagram.component.scss',
})
export class ArchitectureDiagramComponent {
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();

  protected readonly services = computed(() => [
    { id: 'customer-microservice', name: 'customer-microservice', port: ':8091', detail: this.ui().customers, replicas: false },
    {
      id: 'product-microservice',
      name: 'product-microservice',
      port: ':8092',
      detail: this.ui().categoriesAndProducts,
      replicas: true,
    },
    { id: 'cart-microservice', name: 'cart-microservice', port: ':8093', detail: this.ui().cart, replicas: true },
  ]);

  protected readonly databases = [
    { id: 'mongodb', name: 'MongoDB', detail: 'customer_db', port: ':27017' },
    { id: 'postgres', name: 'PostgreSQL', detail: 'product_db', port: ':5432' },
    { id: 'mongodb', name: 'MongoDB', detail: 'cart_db', port: ':27017' },
  ];
}
