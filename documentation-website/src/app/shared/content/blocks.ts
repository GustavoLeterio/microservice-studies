import {
  CardItem,
  CodeLanguage,
  ColumnItem,
  DocBlock,
  DocPage,
  DocSection,
  FlowNode,
  StepItem,
  TabItem,
  TreeNode,
} from '../models/doc.models';

// Construtores curtos para escrever o conteúdo das páginas de forma declarativa.

export const page = (title: string, lead: string, ...sections: DocSection[]): DocPage => ({ title, lead, sections });

export const section = (id: string, title: string, ...blocks: DocBlock[]): DocSection => ({ id, title, blocks });

export const text = (html: string): DocBlock => ({ type: 'text', html });

export const h3 = (value: string): DocBlock => ({ type: 'subheading', text: value });

export const list = (items: string[], ordered = false): DocBlock => ({ type: 'list', items, ordered });

export const code = (language: CodeLanguage, source: string, file?: string, caption?: string): DocBlock => ({
  type: 'code',
  language,
  code: source,
  file,
  caption,
});

export const note = (html: string, title?: string): DocBlock => ({ type: 'callout', variant: 'info', html, title });

export const tip = (html: string, title?: string): DocBlock => ({ type: 'callout', variant: 'tip', html, title });

export const warn = (html: string, title?: string): DocBlock => ({ type: 'callout', variant: 'warning', html, title });

export const danger = (html: string, title?: string): DocBlock => ({ type: 'callout', variant: 'danger', html, title });

export const table = (headers: string[], rows: string[][], caption?: string): DocBlock => ({
  type: 'table',
  headers,
  rows,
  caption,
});

export const flow = (nodes: FlowNode[], caption?: string): DocBlock => ({ type: 'flow', nodes, caption });

export const tree = (nodes: TreeNode[], caption?: string): DocBlock => ({ type: 'tree', nodes, caption });

export const cards = (items: CardItem[]): DocBlock => ({ type: 'cards', items });

export const steps = (items: StepItem[]): DocBlock => ({ type: 'steps', items });

export const columns = (...items: ColumnItem[]): DocBlock => ({ type: 'columns', columns: items });

export const tabs = (...items: TabItem[]): DocBlock => ({ type: 'tabs', tabs: items });

export const architectureDiagram = (): DocBlock => ({ type: 'diagram', name: 'architecture' });
