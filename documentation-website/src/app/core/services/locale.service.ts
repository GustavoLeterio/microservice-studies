import { ChangeDetectorRef, DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type AppLocale = 'pt' | 'en';

const STORAGE_KEY = 'docs-locale';

const BRAZIL_TIME_ZONES = new Set([
  'America/Araguaina',
  'America/Bahia',
  'America/Belem',
  'America/Boa_Vista',
  'America/Campo_Grande',
  'America/Cuiaba',
  'America/Eirunepe',
  'America/Fortaleza',
  'America/Maceio',
  'America/Manaus',
  'America/Noronha',
  'America/Porto_Velho',
  'America/Recife',
  'America/Rio_Branco',
  'America/Santarem',
  'America/Sao_Paulo',
]);

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<AppLocale>(detectLocale());

  constructor() {
    effect(() => {
      const lang = this.lang();
      this.document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Sem localStorage o idioma vale só para esta visita.
      }
    });
  }

  use(lang: AppLocale): void {
    this.lang.set(lang);
  }
}

/** Marca o componente para redesenhar quando o idioma muda. */
export function watchLocale(): void {
  const locale = inject(LocaleService);
  const view = inject(ChangeDetectorRef);
  effect(() => {
    locale.lang();
    view.markForCheck();
  });
}

function detectLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    // Segue para o idioma do sistema.
  }

  const tags = (navigator.languages?.length ? navigator.languages : [navigator.language])
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());

  if (tags.some((tag) => tag.startsWith('pt'))) return 'pt';
  if (tags.some((tag) => tag.startsWith('en'))) return 'en';

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return BRAZIL_TIME_ZONES.has(timeZone) ? 'pt' : 'en';
}
