import { NgModule } from '@angular/core';
import { RouterModule, Routes, TitleStrategy } from '@angular/router';
import { AppTitleStrategy } from './core/services/app-title.strategy';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/home/home.module').then((m) => m.HomeModule),
    pathMatch: 'full',
  },
  {
    path: 'visao-geral',
    loadChildren: () => import('./features/overview/overview.module').then((m) => m.OverviewModule),
  },
  {
    path: 'explorador',
    loadChildren: () => import('./features/explorer/explorer.module').then((m) => m.ExplorerModule),
  },
  {
    path: 'microservicos',
    loadChildren: () => import('./features/microservices/microservices.module').then((m) => m.MicroservicesModule),
  },
  {
    path: 'codigo',
    loadChildren: () => import('./features/code/code.module').then((m) => m.CodeModule),
  },
  {
    path: 'arquitetura',
    loadChildren: () => import('./features/architecture/architecture.module').then((m) => m.ArchitectureModule),
  },
  {
    path: 'docker',
    loadChildren: () => import('./features/docker/docker.module').then((m) => m.DockerModule),
  },
  {
    path: 'observabilidade',
    loadChildren: () => import('./features/observability/observability.module').then((m) => m.ObservabilityModule),
  },
  {
    path: 'guias',
    loadChildren: () => import('./features/guides/guides.module').then((m) => m.GuidesModule),
  },
  {
    path: '**',
    loadChildren: () => import('./features/home/not-found.module').then((m) => m.NotFoundModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      bindToComponentInputs: true,
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      scrollOffset: [0, 80],
    }),
  ],
  exports: [RouterModule],
  providers: [{ provide: TitleStrategy, useClass: AppTitleStrategy }],
})
export class AppRoutingModule {}
