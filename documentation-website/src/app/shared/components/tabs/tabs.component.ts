import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { TabItem } from '../../models/doc.models';

let nextId = 0;

@Component({
  selector: 'app-tabs',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly tabs = input.required<TabItem[]>();

  protected readonly active = linkedSignal({ source: this.tabs, computation: () => 0 });
  protected readonly baseId = `tabs-${nextId++}`;

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.tabs().length;
    if (event.key === 'ArrowRight') {
      this.active.update((index) => (index + 1) % count);
    } else if (event.key === 'ArrowLeft') {
      this.active.update((index) => (index - 1 + count) % count);
    } else {
      return;
    }
    event.preventDefault();
    const tablist = (event.currentTarget as HTMLElement | null);
    tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[this.active()]?.focus();
  }
}
