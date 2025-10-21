import { createElementState, getElementState } from './elementState'

import { ProxyElement } from "./index"
import { x, y, top, left, right, bottom } from './types'
import { getNumberAttr, getEnumAttr, clamp, parseNumber } from "./helpers"

import type { Attachment } from "svelte/attachments"

interface AutoHeightTextareaState {
  prevHeight: number,
  userResizedHeight: number
}
const autoHeightTextareaState = createElementState<AutoHeightTextareaState>()

/**
 * Example:
 * ```svelte
 * <script>
 *   let myValue = $state("Hello world")
 * </script>
 * 
 * <textarea {@attach autoHeightTextarea([myValue]) }
 *   bind:value={myValue}
 *   rows=3
 * ></textarea>
 * ```
 * @param deps - Dependency array: pass in state that could impact the size of the textarea
 * @returns svelte `Attachment` for auto adjusting size of textarea as user types
 */
export function autoHeightTextarea(deps: any[] = []): Attachment {
  return function(element: Element) {
    const STATE = getElementState(autoHeightTextareaState, element)
    const textarea = element as HTMLTextAreaElement

    const minRows: number = getNumberAttr(textarea, 'rows', textarea.rows || 2)
    const maxRows: number = getNumberAttr(textarea, 'data-maxRows', Infinity)

    const proxy = new ProxyElement(textarea)
    proxy.copyAttributes()
    proxy.content = textarea.value
    proxy.mount()
    const outerScroll = proxy.measure.outerScroll(x, y)
    const thickness = proxy.measure.thickness(x, y)

    proxy.content = ''
    proxy.rows = 1
    const rowSize = proxy.measure.innerScroll(x, y)

    let minHeight = (rowSize.y * minRows)
    if(proxy.isBorderBox) minHeight += thickness.y

    let maxHeight = (rowSize.y * maxRows)
    if(proxy.isBorderBox) maxHeight += thickness.y


    // user resize event -----------------------------------------------
    let resizeStarted = false
    let probablyResized = false

    function onpointerdown(e: PointerEvent) {
      textarea.setPointerCapture(e.pointerId)
      resizeStarted = true
    }
    function onpointermove () {
      probablyResized = true
    }
    function onpointerup (e: PointerEvent) {
      textarea.releasePointerCapture(e.pointerId)
      resizeStarted = false
      if (probablyResized) {
        const newHeight = parseNumber(textarea.style.getPropertyValue('height'))
        if (newHeight !== STATE.prevHeight) {
          STATE.userResizedHeight = newHeight
          STATE.prevHeight = newHeight
        }
      }
      probablyResized = false
    }
    textarea.addEventListener('pointerdown', onpointerdown)
    textarea.addEventListener('pointermove', onpointermove)
    textarea.addEventListener('pointerup', onpointerup)


    // set textarea height ---------------------------------------------

    const preferredMinHeight = Math.max(minHeight, STATE.userResizedHeight || 0)

    const autoHeight = clamp(preferredMinHeight, outerScroll.y, maxHeight)

    textarea.style.setProperty("height", autoHeight + "px")



    // scroll side effects ---------------------------------------------
    type ScrollMode = false | ScrollBehavior
    const scrollOnMax = getEnumAttr<ScrollMode>(textarea, 'data-scrollOnMax', 'instant')
    const scrollWindowUp   = getEnumAttr<ScrollMode>(textarea, 'data-scrollWindowUp', 'instant')
    const scrollWindowDown = getEnumAttr<ScrollMode>(textarea, 'data-scrollWindowDown', 'instant')

    if (autoHeight == maxHeight && scrollOnMax) {
      textarea.scrollBy({
        left: 0,
        top: Number.MAX_SAFE_INTEGER,
        behavior: scrollOnMax
      })
    }

    if(STATE.prevHeight && (scrollWindowUp || scrollWindowDown)) {
      const delta = autoHeight - STATE.prevHeight
      const directionUp = delta < 0
      const scroll = { left: 0, top: delta }
      if(scrollWindowUp && directionUp)
        window.scrollBy({ ...scroll, behavior: scrollWindowUp })
      else if(scrollWindowDown && !directionUp)
        window.scrollBy({ ...scroll, behavior: scrollWindowDown })
    }
    
    STATE.prevHeight = autoHeight

    // clean-up -------------------------------------------------------
    return function() {
      proxy.cleanup()
      textarea.removeEventListener('pointerdown', onpointerdown)
      textarea.removeEventListener('pointermove', onpointermove)
      textarea.removeEventListener('pointerup', onpointerup)
    }
  }
}


// TODO: Attachment for list virtualization

// TODO: Attachment for skeleton loading rendering
