import { AppLocale } from '../../../core/services/locale.service';
import { Endpoint, EndpointGroup, ServiceInfo, ServiceKind } from '../../models/system.models';
import { CART_SERVICE } from './cart.data';
import { CART_SERVICE_EN } from './cart.en';
import { CUSTOMER_SERVICE } from './customer.data';
import { CUSTOMER_SERVICE_EN } from './customer.en';
import {
  COMMON_EXCEPTIONS_LIB,
  GRAFANA_SERVICE,
  MONGODB_SERVICE,
  POSTGRES_SERVICE,
  PROMETHEUS_SERVICE,
} from './infrastructure.data';
import {
  COMMON_EXCEPTIONS_LIB_EN,
  GRAFANA_SERVICE_EN,
  MONGODB_SERVICE_EN,
  POSTGRES_SERVICE_EN,
  PROMETHEUS_SERVICE_EN,
} from './infrastructure.en';
import { API_GATEWAY_SERVICE, CONFIG_SERVER_SERVICE, DISCOVERY_SERVER_SERVICE } from './platform.data';
import { API_GATEWAY_SERVICE_EN, CONFIG_SERVER_SERVICE_EN, DISCOVERY_SERVER_SERVICE_EN } from './platform.en';
import { PRODUCT_SERVICE } from './product.data';
import { PRODUCT_SERVICE_EN } from './product.en';

export const SYSTEM_SERVICES: readonly ServiceInfo[] = [
  CUSTOMER_SERVICE,
  PRODUCT_SERVICE,
  CART_SERVICE,
  API_GATEWAY_SERVICE,
  CONFIG_SERVER_SERVICE,
  DISCOVERY_SERVER_SERVICE,
  COMMON_EXCEPTIONS_LIB,
  MONGODB_SERVICE,
  POSTGRES_SERVICE,
  PROMETHEUS_SERVICE,
  GRAFANA_SERVICE,
];

export const SYSTEM_SERVICES_EN: readonly ServiceInfo[] = [
  CUSTOMER_SERVICE_EN,
  PRODUCT_SERVICE_EN,
  CART_SERVICE_EN,
  API_GATEWAY_SERVICE_EN,
  CONFIG_SERVER_SERVICE_EN,
  DISCOVERY_SERVER_SERVICE_EN,
  COMMON_EXCEPTIONS_LIB_EN,
  MONGODB_SERVICE_EN,
  POSTGRES_SERVICE_EN,
  PROMETHEUS_SERVICE_EN,
  GRAFANA_SERVICE_EN,
];

export const servicesFor = (lang: AppLocale): readonly ServiceInfo[] =>
  lang === 'en' ? SYSTEM_SERVICES_EN : SYSTEM_SERVICES;

export const SERVICE_KIND_ORDER: readonly ServiceKind[] = ['negocio', 'plataforma', 'biblioteca', 'dados', 'observabilidade'];

export const findService = (id: string, lang: AppLocale = 'pt'): ServiceInfo | undefined =>
  servicesFor(lang).find((service) => service.id === id);

export const businessEndpointsFor = (lang: AppLocale): readonly CatalogEndpoint[] =>
  servicesFor(lang)
    .filter((service) => service.kind === 'negocio')
    .flatMap((service) =>
      (service.endpointGroups ?? []).flatMap((group) =>
        group.endpoints.map((endpoint) => ({ ...endpoint, service, group })),
      ),
    );

export interface CatalogEndpoint extends Endpoint {
  service: ServiceInfo;
  group: EndpointGroup;
}

/** Endpoints REST de negócio (os que passam pelo gateway). */
export const BUSINESS_ENDPOINTS: readonly CatalogEndpoint[] = businessEndpointsFor('pt');
