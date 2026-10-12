import { DestroyRef, Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { PageContextService } from '../../core/services/page-context.service';

/**
 * Observa os elementos [data-spy] dentro do host e marca como ativa a primeira seção visível.
 * O valor do input é só uma "chave": quando muda (outra página), os elementos são observados de novo.
 */
@Directive({
  selector: '[appScrollSpy]',
  standalone: false,
})
export class ScrollSpyDirective {
  readonly appScrollSpy = input<unknown>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly context = inject(PageContextService);
  private observer?: IntersectionObserver;

  constructor() {
    afterRenderEffect(() => {
      this.appScrollSpy();
      this.observe();
    });
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  private observe(): void {
    this.observer?.disconnect();
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[data-spy]'));
    if (!sections.length) return;

    const visible = new Set<string>();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = sections.find((section) => visible.has(section.id));
        if (first) this.context.activeSection.set(first.id);
      },
      { rootMargin: '-90px 0px -55% 0px' },
    );
    sections.forEach((section) => this.observer!.observe(section));
  }
}
