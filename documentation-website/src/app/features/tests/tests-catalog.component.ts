import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UI } from '../../core/i18n/ui-text';
import { LocaleService } from '../../core/services/locale.service';
import { PageContextService } from '../../core/services/page-context.service';
import { SITE_NAME } from '../../core/services/app-title.strategy';
import { normalize } from '../../core/services/search.service';
import { TEST_CASES, TEST_MODULES, classNote } from '../../shared/data/tests';
import { FlowNode } from '../../shared/models/doc.models';

@Component({
  selector: 'app-tests-catalog',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tests-catalog.component.html',
  styleUrl: './tests-catalog.component.scss',
})
export class TestsCatalogComponent {
  private readonly context = inject(PageContextService);
  private readonly locale = inject(LocaleService);
  private readonly title = inject(Title);
  private readonly route = inject(ActivatedRoute);

  protected readonly modules = TEST_MODULES;
  protected readonly moduleFilter = signal('ALL');
  protected readonly query = signal('');
  protected readonly fragment = signal<string | null>(null);
  protected readonly ui = computed(() => UI[this.locale.lang()]);

  protected readonly layers = computed((): FlowNode[] => {
    const ui = this.ui();
    return [
      { label: ui.testsLayerDomain, sub: ui.testsLayerDomainSub },
      { label: ui.testsLayerService, sub: ui.testsLayerServiceSub },
      { label: ui.testsLayerHttp, sub: ui.testsLayerHttpSub },
    ];
  });

  protected readonly groups = computed(() => {
    const lang = this.locale.lang();
    const moduleId = this.moduleFilter();
    const tokens = normalize(this.query().trim()).split(/\s+/).filter(Boolean);

    return TEST_MODULES.filter((module) => moduleId === 'ALL' || module.id === moduleId)
      .map((module) => {
        const tests = TEST_CASES.filter((test) => test.moduleId === module.id).filter((test) => {
          if (!tokens.length) return true;
          const note = classNote(test.className);
          const haystack = normalize(
            [test.anchor, test.method, test.className, test.summary[lang], test.reason[lang], test.code, test.file, note?.summary[lang]]
              .filter(Boolean)
              .join(' '),
          );
          return tokens.every((token) => haystack.includes(token));
        });
        const classNames = [...new Set(tests.map((test) => test.className))];
        return {
          id: module.id,
          name: module.name[lang],
          summary: module.summary[lang],
          classes: classNames.map((name) => ({
            name,
            slug: `${module.id}-${name}`,
            summary: classNote(name)?.summary[lang] ?? '',
            tests: tests.filter((test) => test.className === name),
          })),
        };
      })
      .filter((group) => group.classes.length > 0);
  });

  protected readonly matchCount = computed(() =>
    this.groups().reduce((total, group) => total + group.classes.reduce((sum, klass) => sum + klass.tests.length, 0), 0),
  );

  constructor() {
    this.route.fragment.pipe(takeUntilDestroyed()).subscribe((fragment) => this.fragment.set(fragment));

    effect(() => {
      const ui = this.ui();
      this.title.setTitle(`${ui.testsTitle} · ${SITE_NAME}`);
      this.context.setSections([
        { id: 'organizacao', title: ui.testsHow },
        { id: 'busca', title: ui.filters },
        ...this.groups().map((group) => ({ id: group.id, title: group.name })),
      ]);
    });

    inject(DestroyRef).onDestroy(() => this.context.clear());
  }

  protected text(value: { pt: string; en: string }): string {
    return value[this.locale.lang()];
  }

  protected isOpen(id: string): boolean {
    return this.fragment() === id;
  }
}
