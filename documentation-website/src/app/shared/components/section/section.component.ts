import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.id]': 'sectionId()', 'data-spy': '' },
  template: `
    <h2 class="section__title">
      <a class="section__anchor" [routerLink]="[]" [fragment]="sectionId()" aria-label="Link para esta seção">#</a>
      {{ heading() }}
    </h2>
    <div class="section__body">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      scroll-margin-top: calc(var(--header-h) + 16px);
    }

    .section__title {
      position: relative;
      margin-bottom: 1.1rem;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.015em;
    }

    .section__anchor {
      position: absolute;
      left: -1.3rem;
      padding-right: 0.4rem;
      color: var(--text-muted);
      opacity: 0;
      text-decoration: none;
      transition: opacity 0.15s ease;
    }

    .section__title:hover .section__anchor,
    .section__anchor:focus-visible {
      opacity: 1;
    }
  `,
})
export class SectionComponent {
  readonly sectionId = input.required<string>();
  readonly heading = input.required<string>();
}
