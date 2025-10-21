//  Forked from https://github.com/ankurrsinghal/svelte-autoresize-textarea/blob/master/src/lib/core.ts
//  (Hard fork - changed almost everything lol)
//
//  This version:
//  - Generalized for any element, not just TextArea
//  - New really awesome Measurement API!
//  - No longer singleton pattern -
//    - Every proxy object corresponds directly to one element instead
//    - Prioritizes runtime performance over memory optimization
//    - It simplifies the code!
//    - Memory issues should be solved with virtualization
//
//
//  This fork was coded by hand and with zero vibes!
//  Enjoy :-)
//


import { getSizingData } from "./sizeData"
import type { SizeData, EvalToken } from "./types"
import { Measurement, MeasurementBasic } from './types'

const PROXY_ELEMENT_HIDDEN_STYLE = `
  visibility: hidden !important;
  position: absolute !important;
  z-index: -1000 !important;
  bottom: 0 !important;
  left: 0 !important;
  pointer-events: none !important;
  opacity: 0 !important;
`

const HIDDEN_STYLE = `
  height: 0 !important;
  visibility: hidden !important;
  position: absolute !important;
  z-index: -1000 !important;
  bottom: 0 !important;
  left: 0 !important;
  pointer-events: none !important;
  opacity: 0 !important;
`

const BOX_MODEL_STYLES = [
  "width",
  "padding-top",
  "padding-left",
  "padding-right",
  "padding-bottom",
  "border-width",
  "border-top-width",
  "border-left-width",
  "border-right-width",
  "border-bottom-width",
  "margin-top",
  "margin-left",
  "margin-right",
  "margin-bottom",
  "letter-spacing",
  "line-height",
  "font-family",
  "font-weight",
  "font-size",
  "text-rendering",
  "text-transform",
  "text-indent",
  "box-sizing",
]

export class ProxyElement<T extends HTMLElement = HTMLElement> {
  public children: ProxyElement[] = []
  private source: T
  private proxy: T
  
  public size: SizeData

  // cached values:
  public sourceStyles: CSSStyleDeclaration
  public isBorderBox: boolean
  public isContentBox: Boolean

  get proxyElement() {
    return this.proxy
  }

  get computedStyles() {
    return this.sourceStyles
  }

  /**
   * **TLDR;** *Copy computed size of source element to off-screen invisible proxy element.*
   * 
   * ## Measure with `JavaScript` what can't be measured in `CSS`
   * - Create a fake element with browser-computed pixel dimensions
   * - Measure computed size using the `measure`* methods!
   * 
   * Example:
   * ```ts
   * (textarea: HTMLTextAreaElement) => {
   *   const proxy = new ProxyElement(textarea)
   *   const outerScroll = proxy.measureScrollOuter()
   *   console.log(outerScroll.x, outerScroll.y)
   * }
   * ```
   * 
   * @param source - The element to source computed size styles from.
   * @param tag - (Optional) force the proxy HTML tag name
   * @returns `ProxyElement`
   */
  constructor(source: T, tag?: string) {
    this.source = source
    this.sourceStyles = getComputedStyle(source) // expensive
    this.size = getSizingData(this.sourceStyles) // cache
    this.isBorderBox  = this.size.boxSizing === 'border-box' // cache
    this.isContentBox = this.size.boxSizing === 'content-box' // cache
    
    // const tagName = tag ?? source.tagName.toLowerCase() ?? 'div'
    // this.proxy = document.createElement(tagName) as T

    this.proxy = source.cloneNode(true) as T
    this.setProxyStyles()
    
    // document.body.appendChild(this.proxy)
  }

  public fillSubtree(): void {
    for(const child of this.source.children) {
      const childProxy = new ProxyElement(child as HTMLElement)
      childProxy.copyAttributes()
      this.children.push(childProxy)
      this.proxy.appendChild(childProxy.proxyElement)
      
      childProxy.fillSubtree()
    }
  }

  public mount(): void {
    document.body.appendChild(this.proxy)
  }

  public setProxyStyles(): void {
    const boxStyles = BOX_MODEL_STYLES.map(
      (prop) => `${prop}:${this.sourceStyles.getPropertyValue(prop)}`
    ).join(";")
    
    this.proxy.setAttribute(
      "style",
      // `${boxStyles};${PROXY_ELEMENT_HIDDEN_STYLE}`
      `${boxStyles};${HIDDEN_STYLE}`
    )
  }

  get measure() {
    return {
      thickness: (...eagerly: EvalToken[]) => new Measurement({
        top: () => this.size.padding.top + this.size.border.top,
        left: () => this.size.padding.left + this.size.border.left,
        right: () => this.size.padding.right + this.size.border.right,
        bottom: () => this.size.padding.bottom + this.size.border.bottom,
      }, ...eagerly),
      outerScroll: (...eagerly: EvalToken[]) => new Measurement({
        x: () => this.proxy.scrollWidth
          + (this.isBorderBox  ? this.size.border.x  : 0)
          - (this.isContentBox ? this.size.padding.x : 0),
        y: () => this.proxy.scrollHeight
          + (this.isBorderBox  ? this.size.border.y  : 0)
          - (this.isContentBox ? this.size.padding.y : 0),
        top: () => this.proxy.scrollHeight
          + (this.isBorderBox  ? this.size.border.top  : 0)
          - (this.isContentBox ? this.size.padding.top : 0),
        left: () => this.proxy.scrollWidth
          + (this.isBorderBox  ? this.size.border.left  : 0)
          - (this.isContentBox ? this.size.padding.left : 0),
        right: () => this.proxy.scrollWidth
          + (this.isBorderBox  ? this.size.border.right  : 0)
          - (this.isContentBox ? this.size.padding.right : 0),
        bottom: () => this.proxy.scrollHeight
          + (this.isBorderBox  ? this.size.border.bottom  : 0)
          - (this.isContentBox ? this.size.padding.bottom : 0),
      }, ...eagerly),
      innerScroll: (...eagerly: EvalToken[]) => new MeasurementBasic({
        x: () => this.proxy.scrollWidth - this.size.padding.x,
        y: () => this.proxy.scrollHeight - this.size.padding.y
      }, ...eagerly)
    }
  }

  public cleanup(): void {
    this.proxy.remove()
  }

  public copyStyle(exclude: string[] = []): void {
    this.proxy.setAttribute('class', this.source.getAttribute('class') ?? '')
    
    const inlineStyle = this.source.getAttribute('style') ?? ''
    this.proxy.setAttribute(
      "style",
      `${inlineStyle};${this.proxy.getAttribute('style') ?? ''}`
    )
  }

  public copyAttributes(exclude: string[] = []): void {
    for (const {name, value} of this.source.attributes) {
      if (['class', 'style', ...exclude].includes(name)) continue
      this.proxy.setAttribute(name, value)
    }
  }

  set rows(n: number) {
    this.proxy.setAttribute('rows', String(n))
  }

  set content(content: string) {
    if ('value' in this.proxy)
      this.proxy.value = content
    else
      this.proxy.innerHTML = content
  }
}
