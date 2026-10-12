import { CodeSnippet } from './doc.models';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ServiceKind = 'negocio' | 'plataforma' | 'biblioteca' | 'dados' | 'observabilidade';

export interface EndpointParam {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  description: string;
}

export interface BodyField {
  name: string;
  type: string;
  required: boolean;
  rules?: string;
  description?: string;
}

export interface EndpointResponse {
  status: number;
  description: string;
  contentType?: string;
  example?: string;
}

export interface EndpointError {
  status: number;
  cause: string;
  /** Exception ou componente que gera o erro. */
  source: string;
  example?: string;
}

export interface Endpoint {
  /** Usado como âncora na página do serviço. */
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  handler: string;
  params?: EndpointParam[];
  body?: { type: string; fields: BodyField[]; example: string };
  responses: EndpointResponse[];
  errors: EndpointError[];
}

export interface EndpointGroup {
  title: string;
  basePath: string;
  description?: string;
  endpoints: Endpoint[];
}

export interface ServiceDependency {
  artifact: string;
  scope: string;
  origin: string;
  purpose: string;
}

export interface ServiceEnvVar {
  name: string;
  value: string;
  purpose: string;
}

export interface ServiceLink {
  label: string;
  url: string;
}

export interface ServiceRelation {
  label: string;
  targets: string[];
}

export interface SourceFile {
  path: string;
  role: string;
}

export interface ServiceException {
  name: string;
  status: string;
  when: string;
  handler: string;
}

export interface GatewayRoute {
  id: string;
  predicates: string[];
  uri: string;
  filters: string[];
}

export interface ServiceInfo {
  id: string;
  name: string;
  kind: ServiceKind;
  tagline: string;
  description: string;
  responsibilities: string[];
  port?: string;
  access: string;
  database?: string;
  image: string;
  technologies: string[];
  dependencies?: ServiceDependency[];
  relations?: ServiceRelation[];
  routes?: GatewayRoute[];
  endpointGroups?: EndpointGroup[];
  exceptions?: ServiceException[];
  config?: CodeSnippet[];
  env?: ServiceEnvVar[];
  links?: ServiceLink[];
  sourceFiles?: SourceFile[];
  docs?: { label: string; path: string }[];
}

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  negocio: 'Negócio',
  plataforma: 'Plataforma',
  biblioteca: 'Biblioteca',
  dados: 'Dados',
  observabilidade: 'Observabilidade',
};
