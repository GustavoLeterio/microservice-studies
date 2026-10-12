import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { docRoutes } from '../../shared/content/doc-routes';
import { SharedModule } from '../../shared/shared.module';
import { PAGES } from './pages';

@NgModule({
  imports: [SharedModule, RouterModule.forChild(docRoutes(PAGES))],
})
export class OverviewModule {}
