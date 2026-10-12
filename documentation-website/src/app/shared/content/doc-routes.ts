import { Routes } from '@angular/router';
import { AppLocale } from '../../core/services/locale.service';
import { DocPageComponent } from '../components/doc-page/doc-page.component';
import { DocPage } from '../models/doc.models';

export interface LocalizedPages {
  pt: Record<string, DocPage>;
  en: Record<string, DocPage>;
}

export type LocalizedPage = Record<AppLocale, DocPage>;

/** Rotas de um tópico. O DocPageComponent escolhe pt ou en conforme o idioma ativo. */
export function docRoutes(pages: LocalizedPages): Routes {
  const slugs = Object.keys(pages.pt);
  return [
    { path: '', pathMatch: 'full', redirectTo: slugs[0] },
    ...slugs.map((slug) => ({
      path: slug,
      component: DocPageComponent,
      data: {
        page: { pt: pages.pt[slug], en: pages.en[slug] } satisfies LocalizedPage,
      },
    })),
  ];
}
