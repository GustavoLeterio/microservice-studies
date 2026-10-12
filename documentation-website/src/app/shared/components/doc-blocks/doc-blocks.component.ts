import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  readonly blocks = input.required<DocBlock[]>();
}
