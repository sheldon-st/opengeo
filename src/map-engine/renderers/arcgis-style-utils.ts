import OlStyle from 'ol/style/Style'
import OlFill from 'ol/style/Fill'
import OlStroke from 'ol/style/Stroke'
import OlCircle from 'ol/style/Circle'
import OlIcon from 'ol/style/Icon'
import OlRegularShape from 'ol/style/RegularShape'
import type { FeatureLike } from 'ol/Feature'
import type { StyleFunction } from 'ol/style/Style'
import type {
  ArcGisDrawingInfo,
  ArcGisSymbol,
  ArcGisSymbolOutline,
} from '@/lib/arcgis-rest'

// ─── Color conversion ─────────────────────────────────────────────────────────

/** Convert ArcGIS [R, G, B, A] (A 0–255) to CSS rgba string */
function toRgba(color: number[] | undefined): string {
  if (!color || color.length < 3) return 'rgba(0,0,0,1)'
  const [r, g, b, a = 255] = color
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
}

// ─── Stroke helpers ───────────────────────────────────────────────────────────

const LINE_DASH: Record<string, number[]> = {
  esriSLSDash: [8, 4],
  esriSLSDot: [2, 4],
  esriSLSDashDot: [8, 4, 2, 4],
  esriSLSDashDotDot: [8, 4, 2, 4, 2, 4],
}

function makeStroke(outline: ArcGisSymbolOutline): OlStroke {
  return new OlStroke({
    color: toRgba(outline.color),
    width: outline.width ?? 1,
    lineDash: outline.style ? LINE_DASH[outline.style] : undefined,
  })
}

// ─── Default fallback ─────────────────────────────────────────────────────────

const FALLBACK_STYLE = new OlStyle({
  image: new OlCircle({
    radius: 5,
    fill: new OlFill({ color: 'rgba(128,128,128,0.8)' }),
    stroke: new OlStroke({ color: '#fff', width: 1 }),
  }),
  fill: new OlFill({ color: 'rgba(128,128,128,0.4)' }),
  stroke: new OlStroke({ color: 'rgba(128,128,128,0.8)', width: 1 }),
})

// ─── Symbol conversion ────────────────────────────────────────────────────────

export function convertSymbolToOLStyle(symbol: ArcGisSymbol): OlStyle {
  switch (symbol.type) {
    case 'esriSFS': {
      return new OlStyle({
        fill: symbol.color ? new OlFill({ color: toRgba(symbol.color) }) : undefined,
        stroke: symbol.outline?.color ? makeStroke(symbol.outline) : undefined,
      })
    }

    case 'esriSLS': {
      return new OlStyle({
        stroke: new OlStroke({
          color: toRgba(symbol.color),
          width: symbol.width ?? 1,
          lineDash: symbol.style ? LINE_DASH[symbol.style] : undefined,
        }),
      })
    }

    case 'esriSMS': {
      const fill = symbol.color ? new OlFill({ color: toRgba(symbol.color) }) : undefined
      const stroke = symbol.outline?.color ? makeStroke(symbol.outline) : undefined
      const radius = symbol.size ? symbol.size / 2 : 6

      switch (symbol.style) {
        case 'esriSMSSquare':
          return new OlStyle({
            image: new OlRegularShape({ points: 4, radius, angle: Math.PI / 4, fill, stroke }),
          })
        case 'esriSMSDiamond':
          return new OlStyle({
            image: new OlRegularShape({ points: 4, radius, angle: 0, fill, stroke }),
          })
        case 'esriSMSTriangle':
          return new OlStyle({
            image: new OlRegularShape({ points: 3, radius, angle: 0, fill, stroke }),
          })
        case 'esriSMSCross':
          return new OlStyle({
            image: new OlRegularShape({
              points: 4,
              radius,
              radius2: radius * 0.15,
              angle: 0,
              fill,
              stroke,
            }),
          })
        case 'esriSMSX':
          return new OlStyle({
            image: new OlRegularShape({
              points: 4,
              radius,
              radius2: radius * 0.15,
              angle: Math.PI / 4,
              fill,
              stroke,
            }),
          })
        default: // esriSMSCircle and fallback
          return new OlStyle({ image: new OlCircle({ radius, fill, stroke }) })
      }
    }

    case 'esriPMS': {
      if (symbol.imageData && symbol.contentType) {
        return new OlStyle({
          image: new OlIcon({
            src: `data:${symbol.contentType};base64,${symbol.imageData}`,
            width: symbol.width ?? undefined,
            height: symbol.height ?? undefined,
            rotation: symbol.angle ? (symbol.angle * Math.PI) / 180 : undefined,
          }),
        })
      }
      return FALLBACK_STYLE
    }

    case 'esriPFS': {
      // Picture fill — render outline only (full pattern support needs canvas)
      return new OlStyle({
        fill: symbol.color ? new OlFill({ color: toRgba(symbol.color) }) : undefined,
        stroke: symbol.outline?.color ? makeStroke(symbol.outline) : undefined,
      })
    }

    default:
      return FALLBACK_STYLE
  }
}

// ─── DrawingInfo → OL style / style function ──────────────────────────────────

export function convertDrawingInfoToOLStyle(
  drawingInfo: ArcGisDrawingInfo,
): OlStyle | StyleFunction {
  const renderer = drawingInfo.renderer
  if (!renderer) return FALLBACK_STYLE

  // Simple renderer — one style for all features
  if (renderer.type === 'simple') {
    return convertSymbolToOLStyle(renderer.symbol)
  }

  // Unique value renderer — style function keyed on a field value
  if (renderer.type === 'uniqueValue') {
    const field = renderer.field1 ?? ''
    const styleMap = new Map<string, OlStyle>()
    for (const info of renderer.uniqueValueInfos) {
      styleMap.set(String(info.value), convertSymbolToOLStyle(info.symbol))
    }
    const defaultStyle = renderer.defaultSymbol
      ? convertSymbolToOLStyle(renderer.defaultSymbol)
      : FALLBACK_STYLE

    const fn: StyleFunction = (feature: FeatureLike) => {
      const val = String(feature.get(field) ?? '')
      return styleMap.get(val) ?? defaultStyle
    }
    return fn
  }

  // Class breaks renderer — style function keyed on a numeric field
  if (renderer.type === 'classBreaks') {
    const field = renderer.field ?? ''
    const breaks = [...renderer.classBreakInfos].sort(
      (a, b) => a.classMaxValue - b.classMaxValue,
    )
    const breakStyles = breaks.map((b) => ({
      maxValue: b.classMaxValue,
      style: convertSymbolToOLStyle(b.symbol),
    }))
    const defaultStyle = renderer.defaultSymbol
      ? convertSymbolToOLStyle(renderer.defaultSymbol)
      : FALLBACK_STYLE

    const fn: StyleFunction = (feature: FeatureLike) => {
      const val = Number(feature.get(field))
      if (isNaN(val)) return defaultStyle
      for (const { maxValue, style } of breakStyles) {
        if (val <= maxValue) return style
      }
      return defaultStyle
    }
    return fn
  }

  return FALLBACK_STYLE
}
