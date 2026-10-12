import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SITE_NAME } from '../../core/services/app-title.strategy';
import { PageContextService } from '../../core/services/page-context.service';
import { findService } from '../../shared/data/system';
import { SERVICE_KIND_LABEL } from '../../shared/models/system.models';

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

  protected readonly kindLabel = SERVICE_KIND_LABEL;
  protected readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id') ?? '')), {
    initialValue: '',
  });
  protected readonly service = computed(() => findService(this.id()));

  constructor() {
    effect(() => {
      const service = this.service();
      if (!service) {
        this.context.clear();
        return;
      }
      this.title.setTitle(`${service.name} · ${SITE_NAME}`);
      const sections = [
        { id: 'sobre', title: 'O que faz' },
        { id: 'tecnologias', title: 'Tecnologias' },
      ];
      if (service.dependencies?.length) sections.push({ id: 'dependencias', title: 'Dependências' });
      if (service.relations?.length) sections.push({ id: 'relacoes', title: 'Relações' });
      if (service.routes?.length) sections.push({ id: 'rotas', title: 'Rotas do gateway' });
      if (service.endpointGroups?.length) sections.push({ id: 'endpoints', title: 'Endpoints' });
      if (service.exceptions?.length) sections.push({ id: 'exceptions', title: 'Exceptions' });
      if (service.env?.length) sections.push({ id: 'env', title: 'Variáveis de ambiente' });
      if (service.config?.length) sections.push({ id: 'config', title: 'Configuração' });
      if (service.sourceFiles?.length) sections.push({ id: 'fontes', title: 'Arquivos-fonte' });
      this.context.setSections(sections);
    });
    inject(DestroyRef).onDestroy(() => this.context.clear());
  }
}
