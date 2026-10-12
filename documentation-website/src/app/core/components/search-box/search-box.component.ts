import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../i18n/ui-text';
import { LocaleService, watchLocale } from '../../services/locale.service';
import { SearchEntry, SearchService } from '../../services/search.service';

@Component({
  selector: 'app-search-box',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.scss',
  host: {
    '(document:keydown)': 'onGlobalKeydown($event)',
  },
})
export class SearchBoxComponent {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private readonly locale = inject(LocaleService);
  private readonly localeWatch = watchLocale();

  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  protected readonly results = computed(() => this.searchService.search(this.query()));
  protected readonly kindLabel = computed(
    (): Record<SearchEntry['kind'], string> => ({
      page: this.ui().kindPage,
      service: this.ui().kindService,
      endpoint: this.ui().kindEndpoint,
    }),
  );

  protected onInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
    this.open.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const total = this.results().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (total) this.activeIndex.update((index) => (index + 1) % total);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (total) this.activeIndex.update((index) => (index - 1 + total) % total);
        break;
      case 'Enter': {
        const selected = this.results()[this.activeIndex()];
        if (selected) this.select(selected);
        break;
      }
      case 'Escape':
        this.close();
        this.input().nativeElement.blur();
        break;
    }
  }

  protected onGlobalKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    const shortcut = (event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey);
    if (shortcut || (event.key === '/' && !typing)) {
      event.preventDefault();
      this.input().nativeElement.focus();
      this.open.set(true);
    }
  }

  protected select(item: SearchEntry): void {
    this.router.navigate([item.path], { fragment: item.fragment });
    this.query.set('');
    this.close();
    this.input().nativeElement.blur();
  }

  protected close(): void {
    this.open.set(false);
  }
}
