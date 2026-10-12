import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI } from '../../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../../core/services/locale.service';
import { DocBlock } from '../../models/doc.models';

/** Renderiza a lista de blocos de conteúdo de uma seção (texto, código, tabelas, diagramas...). */
@Component({
  selector: 'app-doc-blocks',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doc-blocks.component.html',
  styleUrl: './doc-blocks.component.scss',
})
export class DocBlocksComponent {
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
  readonly blocks = input.required<DocBlock[]>();
}
