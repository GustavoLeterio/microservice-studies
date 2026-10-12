import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI } from '../../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../../core/services/locale.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-page-header',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <nav class="breadcrumbs" [attr.aria-label]="ui().home">
        <a routerLink="/">{{ ui().home }}</a>
        @if (nav.activeTopic(); as topic) {
          <app-icon name="chevron-right" />
          <a [routerLink]="topic.pages[0].path">{{ topic.title }}</a>
        }
      </nav>
      @if (eyebrow()) {
        <p class="page-header__eyebrow">{{ eyebrow() }}</p>
      }
      <h1 class="page-header__title">{{ heading() }}</h1>
      @if (lead()) {
        <p class="page-header__lead prose" [innerHTML]="lead()"></p>
      }
      <ng-content />
    </header>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly lead = input<string>();
  readonly eyebrow = input<string>();

  protected readonly nav = inject(NavigationService);
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
}
