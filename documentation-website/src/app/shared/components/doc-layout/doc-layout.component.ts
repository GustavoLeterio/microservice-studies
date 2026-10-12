import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI } from '../../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../../core/services/locale.service';

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
        <aside class="layout__toc" [attr.aria-label]="ui().onThisPage">
          <app-toc />
        </aside>
      }
    </div>
  `,
  styleUrl: './doc-layout.component.scss',
})
export class DocLayoutComponent {
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
  readonly spyKey = input<unknown>();
  readonly showToc = input(true);
  readonly showPager = input(true);
}
