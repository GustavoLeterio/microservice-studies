import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArchitectureDiagramComponent } from './components/architecture-diagram/architecture-diagram.component';
import { CalloutComponent } from './components/callout/callout.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { DocBlocksComponent } from './components/doc-blocks/doc-blocks.component';
import { DocLayoutComponent } from './components/doc-layout/doc-layout.component';
import { DocPageComponent } from './components/doc-page/doc-page.component';
import { FlowComponent } from './components/flow/flow.component';
import { IconComponent } from './components/icon/icon.component';
import { MethodBadgeComponent } from './components/method-badge/method-badge.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { PagerComponent } from './components/pager/pager.component';
import { SectionComponent } from './components/section/section.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { TocComponent } from './components/toc/toc.component';
import { TreeComponent } from './components/tree/tree.component';
import { InternalLinksDirective } from './directives/internal-links.directive';
import { ScrollSpyDirective } from './directives/scroll-spy.directive';

const COMPONENTS = [
  ArchitectureDiagramComponent,
  CalloutComponent,
  CodeBlockComponent,
  DocBlocksComponent,
  DocLayoutComponent,
  DocPageComponent,
  FlowComponent,
  IconComponent,
  MethodBadgeComponent,
  PageHeaderComponent,
  PagerComponent,
  SectionComponent,
  TabsComponent,
  TocComponent,
  TreeComponent,
];

const DIRECTIVES = [InternalLinksDirective, ScrollSpyDirective];

/** Blocos visuais reutilizados por todos os módulos de funcionalidade. */
@NgModule({
  declarations: [...COMPONENTS, ...DIRECTIVES],
  imports: [CommonModule, RouterModule],
  exports: [CommonModule, RouterModule, ...COMPONENTS, ...DIRECTIVES],
})
export class SharedModule {}
