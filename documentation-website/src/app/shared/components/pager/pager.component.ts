import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-pager',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let links = nav.neighbours();
    @if (links.previous || links.next) {
      <nav class="pager" aria-label="Navegação entre páginas">
        @if (links.previous; as previous) {
          <a class="pager__link" [routerLink]="previous.path">
            <span class="pager__hint"><app-icon name="arrow-left" /> Anterior</span>
            <span class="pager__title">{{ previous.title }}</span>
            <span class="pager__topic">{{ previous.topic.title }}</span>
          </a>
        } @else {
          <span></span>
        }
        @if (links.next; as next) {
          <a class="pager__link pager__link--next" [routerLink]="next.path">
            <span class="pager__hint">Próximo <app-icon name="arrow-right" /></span>
            <span class="pager__title">{{ next.title }}</span>
            <span class="pager__topic">{{ next.topic.title }}</span>
          </a>
        }
      </nav>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-top: 1.6rem;
      border-top: 1px solid var(--border);
    }

    .pager {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .pager__link {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.9rem 1.1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        text-decoration: none;
        border-color: var(--accent);
        box-shadow: var(--shadow);
      }

      &--next {
        grid-column: 2;
        text-align: right;
        align-items: flex-end;
      }
    }

    .pager__hint {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .pager__title {
      font-weight: 650;
      color: var(--heading);
    }

    .pager__topic {
      font-size: 0.78rem;
      color: var(--accent);
    }

    @media (max-width: 600px) {
      .pager {
        grid-template-columns: 1fr;
      }

      .pager__link--next {
        grid-column: 1;
      }
    }
  `,
})
export class PagerComponent {
  protected readonly nav = inject(NavigationService);
}
