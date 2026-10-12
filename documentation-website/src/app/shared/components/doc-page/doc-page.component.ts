import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SITE_NAME } from '../../../core/services/app-title.strategy';
import { LocaleService } from '../../../core/services/locale.service';
import { PageContextService } from '../../../core/services/page-context.service';
import { LocalizedPage } from '../../content/doc-routes';

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
  private readonly locale = inject(LocaleService);
  private readonly title = inject(Title);

  private readonly bundle = toSignal(
    inject(ActivatedRoute).data.pipe(map((data) => data['page'] as LocalizedPage)),
  );

  readonly page = computed(() => {
    const bundle = this.bundle();
    if (!bundle) return undefined;
    return bundle[this.locale.lang()] ?? bundle.pt;
  });

  constructor() {
    effect(() => {
      const current = this.page();
      if (!current) return;
      this.title.setTitle(`${current.title} · ${SITE_NAME}`);
      this.context.setSections(current.sections.map(({ id, title }) => ({ id, title })));
    });
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }
}
