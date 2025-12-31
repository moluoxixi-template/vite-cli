export interface subMenuRouteMetaType {
  title?: string
  [key: string]: unknown
}

export interface subMenuRouteType {
  path?: string
  name?: string
  meta?: subMenuRouteMetaType
  children?: subMenuRouteType[]
}

export interface propsType {
  routes: subMenuRouteType[]
  menuHeight?: number
}
