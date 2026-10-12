import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CodeLanguage } from '../../models/doc.models';
import { HighlightService } from '../../services/highlight.service';

@Component({
  selector: 'app-code-block',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-block.component.html',
  styleUrl: './code-block.component.scss',
})
export class CodeBlockComponent {
  readonly code = input.required<string>();
  readonly language = input<CodeLanguage>('text');
  readonly file = input<string>();
  readonly caption = input<string>();

  private readonly highlighter = inject(HighlightService);

  protected readonly source = computed(() => normalize(this.code()));
  protected readonly html = computed(() => this.highlighter.highlight(this.source(), this.language()));
  protected readonly languageLabel = computed(() => this.highlighter.label(this.language()));
  protected readonly lineNumbers = computed(() =>
    Array.from({ length: this.source().split('\n').length }, (_, index) => index + 1),
  );
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.source());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      this.copied.set(false);
    }
  }
}

/** Remove linhas vazias nas pontas e a indentação comum, para que os trechos possam ser escritos indentados. */
function normalize(code: string): string {
  const lines = code.replace(/\t/g, '  ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^ */)![0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(common).trimEnd()).join('\n');
}
