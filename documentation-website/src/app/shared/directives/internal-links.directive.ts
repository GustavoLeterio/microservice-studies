import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Links internos dentro de HTML injetado via [innerHTML] não passam pelo RouterLink.
 * Esta diretiva intercepta o clique em <a href="/..."> e navega pelo Router, sem recarregar a página.
 */
@Directive({
  selector: '[appInternalLinks]',
  standalone: false,
  host: { '(click)': 'onClick($event)' },
})
export class InternalLinksDirective {
  private readonly router = inject(Router);

  protected onClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    const anchor = (event.target as Element | null)?.closest('a');
    const href = anchor?.getAttribute('href');
    if (!anchor || !href || !href.startsWith('/') || anchor.target === '_blank') {
      return;
    }
    event.preventDefault();
    void this.router.navigateByUrl(href);
  }
}
