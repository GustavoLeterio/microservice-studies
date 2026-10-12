import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Endpoint } from '../../shared/models/system.models';

@Component({
  selector: 'app-endpoint-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './endpoint-panel.component.html',
  styleUrl: './endpoint-panel.component.scss',
})
export class EndpointPanelComponent {
  readonly endpoint = input.required<Endpoint>();
}
