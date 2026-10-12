import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NavPage, NavTopic } from '../../shared/models/navigation.models';
import { NAVIGATION } from '../data/navigation.data';

export interface FlatNavPage extends NavPage {
  topic: NavTopic;
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  readonly topics: readonly NavTopic[] = NAVIGATION;
  readonly pages: readonly FlatNavPage[] = NAVIGATION.flatMap((topic) =>
    topic.pages.map((page) => ({ ...page, topic })),
  );

  private readonly url = signal(this.router.url);
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  readonly sidebarOpen = signal(false);
  readonly currentPath = computed(() => this.url().split(/[?#]/)[0] || '/');
  readonly activePage = computed(() => this.pages.find((page) => page.path === this.currentPath()) ?? null);
  readonly activeTopic = computed(() => {
    const path = this.currentPath();
    return (
      this.activePage()?.topic ??
      this.topics.find((topic) => path === topic.basePath || path.startsWith(`${topic.basePath}/`)) ??
      null
    );
  });
  readonly neighbours = computed(() => {
    const index = this.pages.findIndex((page) => page.path === this.currentPath());
    if (index < 0) return { previous: null, next: null };
    return { previous: this.pages[index - 1] ?? null, next: this.pages[index + 1] ?? null };
  });

  constructor() {
    const topic = this.activeTopic();
    if (topic) this.expand(topic.id);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.url.set(event.urlAfterRedirects);
        const current = this.activeTopic();
        if (current) this.expand(current.id);
        this.sidebarOpen.set(false);
      });
  }

  isExpanded(topicId: string): boolean {
    return this.expanded().has(topicId);
  }

  toggle(topicId: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  expand(topicId: string): void {
    if (!this.isExpanded(topicId)) {
      this.expanded.update((current) => new Set(current).add(topicId));
    }
  }

  expandAll(): void {
    this.expanded.set(new Set(this.topics.map((topic) => topic.id)));
  }

  collapseAll(): void {
    const active = this.activeTopic();
    this.expanded.set(new Set(active ? [active.id] : []));
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
