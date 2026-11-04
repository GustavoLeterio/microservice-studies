import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TestsCatalogComponent } from './tests-catalog.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: TestsCatalogComponent, title: 'Catálogo de testes' },
];

@NgModule({
  declarations: [TestsCatalogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class TestsModule {}
