import OlStyle from 'ol/style/Style'
import OlFill from 'ol/style/Fill'
import OlStroke from 'ol/style/Stroke'
import OlCircle from 'ol/style/Circle'
import OlIcon from 'ol/style/Icon'
import OlRegularShape from 'ol/style/RegularShape'
import OlText from 'ol/style/Text'
import type { StyleFunction } from 'ol/style/Style'
import type { FeatureStyle, LayerStyleDefinition } from '../types/style.types'
import type { LabelConfig } from '../types/layer.types'

export function convertFeatureStyle(style: FeatureStyle): OlStyle {
  return new OlStyle({
    fill: style.fill ? new OlFill({ color: style.fill.color }) : undefined,
    stroke: style.stroke
      ? new OlStroke({
          color: style.stroke.color,
          width: style.stroke.width,
          lineDash: style.stroke.lineDash,
          lineCap: style.stroke.lineCap,
          lineJoin: style.stroke.lineJoin,
        })
      : undefined,
    image: style.image ? convertImageStyle(style.image) : undefined,
    text: style.text
      ? new OlText({
          text: style.text.text,
          font: style.text.font,
          fill: style.text.fill
            ? new OlFill({ color: style.text.fill.color })
            : undefined,
          stroke: style.text.stroke
            ? new OlStroke({
                color: style.text.stroke.color,
                width: style.text.stroke.width,
              })
            : undefined,
          offsetX: style.text.offsetX,
          offsetY: style.text.offsetY,
          placement: style.text.placement,
          overflow: style.text.overflow,
        })
      : undefined,
    zIndex: style.zIndex,
  })
}

function convertImageStyle(
  image: NonNullable<FeatureStyle['image']>,
): OlCircle | OlIcon | OlRegularShape {
  switch (image.type) {
    case 'circle':
      return new OlCircle({
        radius: image.radius,
        fill: image.fill ? new OlFill({ color: image.fill.color }) : undefined,
        stroke: image.stroke
          ? new OlStroke({
              color: image.stroke.color,
              width: image.stroke.width,
            })
          : undefined,
      })
    case 'icon':
      return new OlIcon({
        src: image.src,
        anchor: image.anchor,
        scale: image.scale,
        rotation: image.rotation,
        opacity: image.opacity,
      })
    case 'regular-shape':
      return new OlRegularShape({
        points: image.points,
        radius: image.radius,
        rotation: image.rotation,
        fill: image.fill ? new OlFill({ color: image.fill.color }) : undefined,
        stroke: image.stroke
          ? new OlStroke({
              color: image.stroke.color,
              width: image.stroke.width,
            })
          : undefined,
      })
  }
}

export function convertLayerStyle(
  styleDef: LayerStyleDefinition,
): OlStyle | Array<OlStyle> {
  if (Array.isArray(styleDef)) {
    return styleDef.map((rule) => convertFeatureStyle(rule.style))
  }
  return convertFeatureStyle(styleDef)
}

/**
 * Wraps a base style with a label overlay that reads `labelConfig.property`
 * from each feature at render time. If `labelConfig` is undefined the base
 * style is returned unchanged so callers can always call this unconditionally.
 */
export function composeWithLabelConfig(
  baseStyle: OlStyle | Array<OlStyle> | StyleFunction | undefined,
  labelConfig: LabelConfig | undefined,
): StyleFunction | OlStyle | Array<OlStyle> | undefined {
  if (!labelConfig) return baseStyle

  return (feature, resolution) => {
    const base =
      typeof baseStyle === 'function'
        ? (baseStyle(feature, resolution) ?? [])
        : (baseStyle ?? [])
    const baseArr: Array<OlStyle> = Array.isArray(base) ? base : [base]

    const text = String(feature.get(labelConfig.property) ?? '')
    if (!text) return baseArr

    const labelStyle = new OlStyle({
      text: new OlText({
        text,
        font: labelConfig.font ?? '12px/1.4 sans-serif',
        fill: new OlFill({ color: labelConfig.color ?? '#333333' }),
        stroke: new OlStroke({
          color: labelConfig.haloColor ?? '#ffffff',
          width: labelConfig.haloWidth ?? 3,
        }),
        offsetX: labelConfig.offsetX ?? 0,
        offsetY: labelConfig.offsetY ?? -12,
        placement: labelConfig.placement,
        overflow: labelConfig.overflow ?? true,
        backgroundFill: labelConfig.showBackground
          ? new OlFill({ color: 'rgba(255,255,255,0.7)' })
          : undefined,
        padding: labelConfig.showBackground ? [2, 4, 2, 4] : undefined,
      }),
    })

    return [...baseArr, labelStyle]
  }
}
