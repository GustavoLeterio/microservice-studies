import { Routes } from '@angular/router';
import { DocPageComponent } from '../components/doc-page/doc-page.component';
import { DocPage } from '../models/doc.models';

/**
 * Gera as rotas de um módulo de documentação a partir de { slug: página }.
 * A primeira página vira o destino padrão do tópico e o conteúdo chega ao DocPageComponent pelo input `page`.
 */
export function docRoutes(pages: Record<string, DocPage>): Routes {
  const slugs = Object.keys(pages);
  return [
    { path: '', pathMatch: 'full', redirectTo: slugs[0] },
    ...slugs.map((slug) => ({
      path: slug,
      component: DocPageComponent,
      title: pages[slug].title,
      data: { page: pages[slug] },
    })),
  ];
}
