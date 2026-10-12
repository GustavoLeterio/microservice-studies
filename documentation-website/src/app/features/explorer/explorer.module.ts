import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EndpointPanelComponent } from './endpoint-panel.component';
import { EndpointsCatalogComponent } from './endpoints-catalog.component';
import { ExplorerMapComponent } from './explorer-map.component';
import { ServiceDetailComponent } from './service-detail.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: ExplorerMapComponent, title: 'Mapa do sistema' },
  { path: 'endpoints', component: EndpointsCatalogComponent, title: 'Catálogo de endpoints' },
  { path: 'servicos/:id', component: ServiceDetailComponent, title: 'Serviço' },
];

@NgModule({
  declarations: [ExplorerMapComponent, EndpointsCatalogComponent, ServiceDetailComponent, EndpointPanelComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ExplorerModule {}
