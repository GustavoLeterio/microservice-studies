export type CodeLanguage =
  | 'java'
  | 'yaml'
  | 'xml'
  | 'dockerfile'
  | 'bash'
  | 'json'
  | 'ini'
  | 'properties'
  | 'text';

export type CalloutVariant = 'info' | 'tip' | 'warning' | 'danger';

export type FlowTone = 'default' | 'accent' | 'platform' | 'data' | 'external' | 'observability';

export interface CodeSnippet {
  language: CodeLanguage;
  code: string;
  file?: string;
  caption?: string;
}

export interface FlowNode {
  label: string;
  sub?: string;
  tone?: FlowTone;
}

export interface TreeNode {
  label: string;
  note?: string;
  kind?: 'folder' | 'file' | 'module';
  highlight?: boolean;
  children?: TreeNode[];
}

export interface CardItem {
  title: string;
  html: string;
  link?: string;
  tag?: string;
}

export interface StepItem {
  title: string;
  html: string;
  code?: CodeSnippet;
}

export interface ColumnItem {
  title: string;
  blocks: DocBlock[];
}

export interface TabItem {
  label: string;
  blocks: DocBlock[];
}

export type DocBlock =
  | { type: 'text'; html: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | ({ type: 'code' } & CodeSnippet)
  | { type: 'callout'; variant: CalloutVariant; title?: string; html: string }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | { type: 'flow'; nodes: FlowNode[]; caption?: string }
  | { type: 'tree'; nodes: TreeNode[]; caption?: string }
  | { type: 'cards'; items: CardItem[] }
  | { type: 'steps'; items: StepItem[] }
  | { type: 'columns'; columns: ColumnItem[] }
  | { type: 'tabs'; tabs: TabItem[] }
  | { type: 'diagram'; name: 'architecture' };

export interface DocSection {
  id: string;
  title: string;
  blocks: DocBlock[];
}

export interface DocPage {
  title: string;
  lead: string;
  sections: DocSection[];
}
