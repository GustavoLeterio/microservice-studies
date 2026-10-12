import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-architecture-diagram',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './architecture-diagram.component.html',
  styleUrl: './architecture-diagram.component.scss',
})
export class ArchitectureDiagramComponent {
  protected readonly services = [
    { id: 'customer-microservice', name: 'customer-microservice', port: ':8091', detail: 'Clientes', replicas: false },
    { id: 'product-microservice', name: 'product-microservice', port: ':8092', detail: 'Categorias e produtos', replicas: true },
    { id: 'cart-microservice', name: 'cart-microservice', port: ':8093', detail: 'Carrinho', replicas: true },
  ];

  protected readonly databases = [
    { id: 'mongodb', name: 'MongoDB', detail: 'customer_db', port: ':27017' },
    { id: 'postgres', name: 'PostgreSQL', detail: 'product_db', port: ':5432' },
    { id: 'mongodb', name: 'MongoDB', detail: 'cart_db', port: ':27017' },
  ];
}
