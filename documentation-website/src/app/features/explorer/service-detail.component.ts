import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { UI } from '../../core/i18n/ui-text';
import { SITE_NAME } from '../../core/services/app-title.strategy';
import { LocaleService } from '../../core/services/locale.service';
import { PageContextService } from '../../core/services/page-context.service';
import { findService } from '../../shared/data/system';
import { SERVICE_KIND_LABEL, SERVICE_KIND_LABEL_EN } from '../../shared/models/system.models';

@Component({
  selector: 'app-service-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
})
export class ServiceDetailComponent {
  private readonly context = inject(PageContextService);
  private readonly title = inject(Title);
  private readonly locale = inject(LocaleService);

  protected readonly ui = computed(() => UI[this.locale.lang()]);
  protected readonly kindLabel = computed(() =>
    this.locale.lang() === 'en' ? SERVICE_KIND_LABEL_EN : SERVICE_KIND_LABEL,
  );
  protected readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly service = computed(() => findService(this.id(), this.locale.lang()));

  constructor() {
    effect(() => {
      const service = this.service();
      if (!service) {
        this.context.clear();
        return;
      }
      const ui = this.ui();
      this.title.setTitle(`${service.name} · ${SITE_NAME}`);
      const sections: { id: string; title: string }[] = [
        { id: 'sobre', title: ui.whatItDoes },
        { id: 'tecnologias', title: ui.technologies },
      ];
      if (service.dependencies?.length) sections.push({ id: 'dependencias', title: ui.dependencies });
      if (service.relations?.length) sections.push({ id: 'relacoes', title: ui.relations });
      if (service.routes?.length) sections.push({ id: 'rotas', title: ui.gatewayRoutes });
      if (service.endpointGroups?.length) sections.push({ id: 'endpoints', title: ui.endpoints });
      if (service.exceptions?.length) sections.push({ id: 'exceptions', title: ui.exceptions });
      if (service.env?.length) sections.push({ id: 'env', title: ui.env });
      if (service.config?.length) sections.push({ id: 'config', title: ui.configuration });
      if (service.sourceFiles?.length) sections.push({ id: 'fontes', title: ui.sourceFiles });
      this.context.setSections(sections);
    });
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }
}
