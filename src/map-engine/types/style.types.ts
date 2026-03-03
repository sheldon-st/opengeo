export interface FillStyle {
  color: string
}

export interface StrokeStyle {
  color: string
  width: number
  lineDash?: Array<number>
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'bevel' | 'round' | 'miter'
}

export interface IconStyle {
  type: 'icon'
  src: string
  anchor?: [number, number]
  scale?: number
  rotation?: number
  opacity?: number
}

export interface CircleStyle {
  type: 'circle'
  radius: number
  fill?: FillStyle
  stroke?: StrokeStyle
}

export interface RegularShapeStyle {
  type: 'regular-shape'
  points: number
  radius: number
  rotation?: number
  fill?: FillStyle
  stroke?: StrokeStyle
}

export type ImageStyle = IconStyle | CircleStyle | RegularShapeStyle

export interface TextStyle {
  text: string
  font?: string
  fill?: FillStyle
  stroke?: StrokeStyle
  offsetX?: number
  offsetY?: number
  placement?: 'point' | 'line'
  overflow?: boolean
}

export interface FeatureStyle {
  fill?: FillStyle
  stroke?: StrokeStyle
  image?: ImageStyle
  text?: TextStyle
  zIndex?: number
}

export interface StyleRule {
  filter?: string | ((properties: Record<string, unknown>) => boolean)
  style: FeatureStyle
  minResolution?: number
  maxResolution?: number
}

export type LayerStyleDefinition = FeatureStyle | Array<StyleRule>
