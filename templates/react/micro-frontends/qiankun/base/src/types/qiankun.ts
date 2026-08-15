/**
 * Qiankun lifecycle props consumed by the React entry renderer.
 */
export interface QiankunProps extends Record<string, unknown> {
  container?: Element
  activeRule?: unknown
  data?: {
    activeRule?: unknown
  }
}
