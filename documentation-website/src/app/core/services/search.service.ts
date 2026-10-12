import { Injectable, computed, inject } from '@angular/core';
import { servicesFor } from '../../shared/data/system';
import { HttpMethod, SERVICE_KIND_LABEL, SERVICE_KIND_LABEL_EN } from '../../shared/models/system.models';
import { NAVIGATION_EN } from '../data/navigation.en';
import { NAVIGATION } from '../data/navigation.data';
import { LocaleService } from './locale.service';

export type SearchKind = 'page' | 'service' | 'endpoint';

export interface SearchEntry {
  kind: SearchKind;
  title: string;
  subtitle: string;
  path: string;
  fragment?: string;
  method?: HttpMethod;
  normalizedTitle: string;
  haystack: string;
}

const KIND_WEIGHT: Record<SearchKind, number> = { page: 3, service: 2, endpoint: 1 };

/** Minúsculas e sem acentos, para "configuracao" encontrar "Configuração". */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const entry = (
  kind: SearchKind,
  title: string,
  subtitle: string,
  path: string,
  terms: string[],
  extra: Partial<SearchEntry> = {},
): SearchEntry => ({
  kind,
  title,
  subtitle,
  path,
  normalizedTitle: normalize(title),
  haystack: normalize([title, subtitle, ...terms].join(' ')),
  ...extra,
});

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly locale = inject(LocaleService);

  private readonly entries = computed(() => {
    const lang = this.locale.lang();
    const navigation = lang === 'en' ? NAVIGATION_EN : NAVIGATION;
    const services = servicesFor(lang);
    const labels = lang === 'en' ? SERVICE_KIND_LABEL_EN : SERVICE_KIND_LABEL;
    return [
      ...navigation.flatMap((topic) =>
        topic.pages
          .filter((page) => !page.path.startsWith('/explorador/servicos/'))
          .map((page) => entry('page', page.title, topic.title, page.path, [page.summary, ...(page.keywords ?? [])])),
      ),
      ...services.map((service) =>
        entry(
          'service',
          service.name,
          `${labels[service.kind]} · ${service.tagline}`,
          `/explorador/servicos/${service.id}`,
          [service.description, ...service.technologies, service.port ?? ''],
        ),
      ),
      ...services.flatMap((service) =>
        (service.endpointGroups ?? []).flatMap((group) =>
          group.endpoints.map((endpoint) =>
            entry(
              'endpoint',
              endpoint.path,
              `${service.name} · ${endpoint.summary}`,
              `/explorador/servicos/${service.id}`,
              [endpoint.method, endpoint.handler, group.title],
              { method: endpoint.method, fragment: endpoint.id },
            ),
          ),
        ),
      ),
    ];
  });

  search(query: string, limit = 10): SearchEntry[] {
    const normalizedQuery = normalize(query.trim());
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];

    return this.entries()
      .filter((item) => tokens.every((token) => item.haystack.includes(token)))
      .map((item) => ({ item, score: this.score(item, normalizedQuery, tokens) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item);
  }

  private score(item: SearchEntry, query: string, tokens: string[]): number {
    let score = KIND_WEIGHT[item.kind];
    if (item.normalizedTitle === query) score += 10;
    if (item.normalizedTitle.startsWith(query)) score += 5;
    score += tokens.filter((token) => item.normalizedTitle.includes(token)).length * 2;
    return score;
  }
}
