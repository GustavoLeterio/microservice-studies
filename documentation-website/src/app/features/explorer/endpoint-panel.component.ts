import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI } from '../../core/i18n/ui-text';
import { LocaleService, watchLocale } from '../../core/services/locale.service';
import { Endpoint } from '../../shared/models/system.models';

@Component({
  selector: 'app-endpoint-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './endpoint-panel.component.html',
  styleUrl: './endpoint-panel.component.scss',
})
export class EndpointPanelComponent {
  private readonly locale = inject(LocaleService);
  protected readonly ui = computed(() => UI[this.locale.lang()]);
  private readonly localeWatch = watchLocale();
  readonly endpoint = input.required<Endpoint>();
}
