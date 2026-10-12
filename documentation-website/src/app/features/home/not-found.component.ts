import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UI } from '../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../core/services/locale.service';

@Component({
  selector: 'app-not-found',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="missing">
      <p class="missing__code">404</p>
      <h1>{{ ui().notFoundTitle }}</h1>
      <p>{{ ui().notFoundLead }}</p>
      <div class="missing__actions">
        <a class="btn btn--primary" routerLink="/">{{ ui().home }}</a>
        <a class="btn btn--ghost" routerLink="/explorador">{{ ui().explore }}</a>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .missing {
      max-width: 560px;
      margin: 0 auto;
      padding: 5rem 1.5rem;
      text-align: center;
    }
    .missing__code {
      font-size: 4rem;
      font-weight: 800;
      letter-spacing: -0.06em;
      color: var(--accent);
      line-height: 1;
    }
    h1 { margin: 0.8rem 0; }
    p { color: var(--text-soft); }
    .missing__actions {
      display: flex;
      justify-content: center;
      gap: 0.7rem;
      margin-top: 1.4rem;
    }
  `,
})
export class NotFoundComponent {
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
}
