import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CalloutVariant } from '../../models/doc.models';
import { IconName } from '../icon/icons';

const VARIANTS: Record<CalloutVariant, { icon: IconName; label: string }> = {
  info: { icon: 'info', label: 'Nota' },
  tip: { icon: 'lightbulb', label: 'Dica' },
  warning: { icon: 'warning', label: 'Atenção' },
  danger: { icon: 'danger', label: 'Cuidado' },
};

@Component({
  selector: 'app-callout',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'note', '[attr.data-variant]': 'variant()' },
  template: `
    <app-icon class="callout__icon" [name]="meta().icon" />
    <div class="callout__body">
      <p class="callout__title">{{ title() ?? meta().label }}</p>
      <ng-content />
    </div>
  `,
  styleUrl: './callout.component.scss',
})
export class CalloutComponent {
  readonly variant = input<CalloutVariant>('info');
  readonly title = input<string>();

  protected readonly meta = computed(() => VARIANTS[this.variant()]);
}
