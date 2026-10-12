import { Injectable, signal } from '@angular/core';
import { PageSection } from '../../shared/models/navigation.models';

/** Seções da página aberta: alimenta o sumário lateral ("Nesta página") e o 3º nível da sidebar. */
@Injectable({ providedIn: 'root' })
export class PageContextService {
  readonly sections = signal<PageSection[]>([]);
  readonly activeSection = signal<string | null>(null);

  setSections(sections: PageSection[]): void {
    this.sections.set(sections);
    this.activeSection.set(sections[0]?.id ?? null);
  }

  clear(): void {
    this.sections.set([]);
    this.activeSection.set(null);
  }
}
