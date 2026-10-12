import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FlowNode } from '../../models/doc.models';

@Component({
  selector: 'app-flow',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flow.component.html',
  styleUrl: './flow.component.scss',
})
export class FlowComponent {
  readonly nodes = input.required<FlowNode[]>();
  readonly caption = input<string>();
}
