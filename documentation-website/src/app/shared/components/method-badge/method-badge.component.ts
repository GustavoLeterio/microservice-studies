import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HttpMethod } from '../../models/system.models';

@Component({
  selector: 'app-method-badge',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-method]': 'method()' },
  template: `{{ method() }}`,
  styles: `
    :host {
      --method-color: var(--method-any);

      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 3.6rem;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--method-color);
      background: color-mix(in srgb, var(--method-color) 13%, transparent);
      border: 1px solid color-mix(in srgb, var(--method-color) 35%, transparent);
    }

    :host([data-method='GET']) { --method-color: var(--method-get); }
    :host([data-method='POST']) { --method-color: var(--method-post); }
    :host([data-method='PUT']) { --method-color: var(--method-put); }
    :host([data-method='PATCH']) { --method-color: var(--method-patch); }
    :host([data-method='DELETE']) { --method-color: var(--method-delete); }
  `,
})
export class MethodBadgeComponent {
  readonly method = input.required<HttpMethod>();
}
