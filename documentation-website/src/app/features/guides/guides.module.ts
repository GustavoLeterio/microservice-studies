import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { docRoutes } from '../../shared/content/doc-routes';
import { SharedModule } from '../../shared/shared.module';
import { PAGES_EN } from './pages.en';
import { PAGES } from './pages';

@NgModule({
  imports: [SharedModule, RouterModule.forChild(docRoutes({ pt: PAGES, en: PAGES_EN }))],
})
export class GuidesModule {}
