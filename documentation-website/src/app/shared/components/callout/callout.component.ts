import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI } from '../../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../../core/services/locale.service';
import { CalloutVariant } from '../../models/doc.models';
import { IconName } from '../icon/icons';

const ICONS: Record<CalloutVariant, IconName> = {
  info: 'info',
  tip: 'lightbulb',
  warning: 'warning',
  danger: 'danger',
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
  private readonly locale = inject(LocaleService);
  private readonly localeWatch = watchLocale();

  readonly variant = input<CalloutVariant>('info');
  readonly title = input<string>();

  protected readonly meta = computed(() => {
    const ui = UI[this.locale.lang()];
    const labels: Record<CalloutVariant, string> = {
      info: ui.calloutInfo,
      tip: ui.calloutTip,
      warning: ui.calloutWarning,
      danger: ui.calloutDanger,
    };
    const variant = this.variant();
    return { icon: ICONS[variant], label: labels[variant] };
  });
}
