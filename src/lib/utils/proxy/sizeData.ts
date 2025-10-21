import type { SizeData } from './types'
import { Measurement } from './types'

export function getSizingData(styles: CSSStyleDeclaration): SizeData {
  const boxSizing = styles.getPropertyValue("box-sizing")

  function measureCssNumber(styles: CSSStyleDeclaration, prop: string) {
    return Number.parseFloat(styles.getPropertyValue(prop))
  }

  const padding = new Measurement({
    top: () => measureCssNumber(styles, "padding-top"),
    left: () => measureCssNumber(styles, "padding-left"),
    right: () => measureCssNumber(styles, "padding-right"),
    bottom: () => measureCssNumber(styles, "padding-bottom"),
  })

  const border = new Measurement({
    top: () => measureCssNumber(styles, "border-top-width"),
    left: () => measureCssNumber(styles, "border-left-width"),
    right: () => measureCssNumber(styles, "border-right-width"),
    bottom: () => measureCssNumber(styles, "border-bottom-width"),
  })

  const margin = new Measurement({
    top: () => measureCssNumber(styles, "margin-top"),
    left: () => measureCssNumber(styles, "margin-left"),
    right: () => measureCssNumber(styles, "margin-right"),
    bottom: () => measureCssNumber(styles, "margin-bottom"),
  })

  return { boxSizing, padding, border, margin }
}
