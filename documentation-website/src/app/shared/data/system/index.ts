import { Endpoint, EndpointGroup, ServiceInfo, ServiceKind } from '../../models/system.models';
import { CART_SERVICE } from './cart.data';
import { CUSTOMER_SERVICE } from './customer.data';
import {
  COMMON_EXCEPTIONS_LIB,
  GRAFANA_SERVICE,
  MONGODB_SERVICE,
  POSTGRES_SERVICE,
  PROMETHEUS_SERVICE,
} from './infrastructure.data';
import { API_GATEWAY_SERVICE, CONFIG_SERVER_SERVICE, DISCOVERY_SERVER_SERVICE } from './platform.data';
import { PRODUCT_SERVICE } from './product.data';

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

export const SERVICE_KIND_ORDER: readonly ServiceKind[] = ['negocio', 'plataforma', 'biblioteca', 'dados', 'observabilidade'];

export const findService = (id: string): ServiceInfo | undefined => SYSTEM_SERVICES.find((service) => service.id === id);

export interface CatalogEndpoint extends Endpoint {
  service: ServiceInfo;
  group: EndpointGroup;
}

/** Endpoints REST de negócio (os que passam pelo gateway). */
export const BUSINESS_ENDPOINTS: readonly CatalogEndpoint[] = SYSTEM_SERVICES.filter(
  (service) => service.kind === 'negocio',
).flatMap((service) =>
  (service.endpointGroups ?? []).flatMap((group) => group.endpoints.map((endpoint) => ({ ...endpoint, service, group }))),
);
