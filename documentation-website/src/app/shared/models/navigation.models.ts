import { IconName } from '../components/icon/icons';

export interface NavPage {
  title: string;
  /** Caminho absoluto da rota, ex.: /docker/dockerfile */
  path: string;
  summary: string;
  keywords?: string[];
  /** Legenda exibida na sidebar antes desta página (agrupa itens de um mesmo tópico). */
  group?: string;
}

export interface NavTopic {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  basePath: string;
  pages: NavPage[];
}

export interface PageSection {
  id: string;
  title: string;
}
