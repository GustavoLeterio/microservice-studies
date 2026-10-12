import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TreeNode } from '../../models/doc.models';
import { IconName } from '../icon/icons';

@Component({
  selector: 'app-tree',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
})
export class TreeComponent {
  readonly nodes = input.required<TreeNode[]>();
  readonly caption = input<string>();

  protected iconFor(node: TreeNode): IconName {
    const kind = node.kind ?? (node.children?.length ? 'folder' : 'file');
    return kind === 'module' ? 'box' : kind;
  }
}
