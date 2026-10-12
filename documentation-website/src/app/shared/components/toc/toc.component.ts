import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UI } from '../../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../../core/services/locale.service';
import { PageContextService } from '../../../core/services/page-context.service';

@Component({
  selector: 'app-toc',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (context.sections().length) {
      <p class="toc__title"><app-icon name="list" /> {{ ui().onThisPage }}</p>
      <ul class="toc__list">
        @for (section of context.sections(); track section.id) {
          <li>
            <a
              class="toc__link"
              [class.is-active]="context.activeSection() === section.id"
              [routerLink]="[]"
              [fragment]="section.id"
              >{{ section.title }}</a
            >
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .toc__title {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.7rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .toc__list {
      margin: 0;
      padding: 0;
      list-style: none;
      border-left: 1px solid var(--border);
    }

    .toc__link {
      display: block;
      margin-left: -1px;
      padding: 0.3rem 0 0.3rem 0.85rem;
      border-left: 2px solid transparent;
      font-size: 0.84rem;
      line-height: 1.4;
      color: var(--text-soft);

      &:hover {
        color: var(--heading);
        text-decoration: none;
      }

      &.is-active {
        color: var(--accent);
        font-weight: 600;
        border-left-color: var(--accent);
      }
    }
  `,
})
export class TocComponent {
  protected readonly context = inject(PageContextService);
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
}
