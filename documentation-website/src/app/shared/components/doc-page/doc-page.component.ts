import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { PageContextService } from '../../../core/services/page-context.service';
import { DocPage } from '../../models/doc.models';

/** Página de documentação genérica: o conteúdo chega pela propriedade `data.page` da rota. */
@Component({
  selector: 'app-doc-page',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (page(); as current) {
      <app-doc-layout [spyKey]="current">
        <app-page-header [heading]="current.title" [lead]="current.lead" />
        @for (section of current.sections; track section.id) {
          <app-section [sectionId]="section.id" [heading]="section.title">
            <app-doc-blocks [blocks]="section.blocks" />
          </app-section>
        }
      </app-doc-layout>
    }
  `,
})
export class DocPageComponent {
  private readonly context = inject(PageContextService);

  readonly page = toSignal(inject(ActivatedRoute).data.pipe(map((data) => data['page'] as DocPage)));

  constructor() {
    effect(() => {
      const current = this.page();
      if (current) {
        this.context.setSections(current.sections.map(({ id, title }) => ({ id, title })));
      }
    });
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }
}
