import { createProductConfig as createConfig } from './product-env'

export {
  DEFAULT_PRODUCT_NAME,
  mergeProductEnv,
  resolveFeatureFlag,
  resolveAppBasePath,
  resolveProductName,
  resolveSsoLoginUrl,
  type ProductConfig,
  type ProductEnv,
} from './product-env'

export const createProductConfig = createConfig

export const productConfig = createProductConfig(import.meta.env)
