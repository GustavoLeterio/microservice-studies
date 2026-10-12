import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estrutura comum das páginas: artigo central, sumário "Nesta página" à direita e navegação anterior/próximo. */
@Component({
  selector: 'app-doc-layout',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout" [appScrollSpy]="spyKey()">
      <article class="layout__article" appInternalLinks>
        <ng-content />
        @if (showPager()) {
          <app-pager />
        }
      </article>
      @if (showToc()) {
        <aside class="layout__toc" aria-label="Nesta página">
          <app-toc />
        </aside>
      }
    </div>
  `,
  styleUrl: './doc-layout.component.scss',
})
export class DocLayoutComponent {
  readonly spyKey = input<unknown>();
  readonly showToc = input(true);
  readonly showPager = input(true);
}
