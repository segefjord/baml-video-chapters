<script lang="ts" module>
  export const registeredDropZones: HTMLElement[] = []

  export function* getDropTargets(): Iterable<[HTMLElement, number]> {
    let index = 0
    for (const target of registeredDropZones) {
      if (!target) continue
      if (!document.contains(target)) continue
      yield [target, index]
      index++
    }
  }

  type DropTarget = {
    element?: HTMLElement,
    name: string | null,
    id: string | null
  }
  type PageDropEvent = (data: DataTransfer, target: DropTarget) => void
  const onPageDropEvents: PageDropEvent[] = []
  export const onPageDrop = (callback: PageDropEvent) => {
    onPageDropEvents.push(callback)
  }
</script>

<script lang="ts">
  function clamp(min: number, x: number, max: number) {
    return Math.max(min, Math.min(x, max))
  }

  const BORDER = 0
  const EDGE = 45
  const STRETCH = 1.05

  let overlayTracker: HTMLElement[] = []
  let highlights: HTMLElement[] = []
  let overlayActive = false

  function cleanup() {
    for(const overlay of overlayTracker) overlay.remove()
    for(const highlight of highlights) highlight.remove()
    overlayTracker = []
    highlights = []
    overlayActive = false
  }

  function hoverHighlight(highlightContainer: HTMLElement) {
    highlightContainer.style.filter = 'brightness(1)'
    highlightContainer.style.background = 'rgba(255,255,255, 0.65)'
    // highlightContainer.style.border = `${BORDER}px solid rgba(255,255,255, 0.5)`
  }
  
  function unhoverHighlight(highlightContainer: HTMLElement) {
    highlightContainer.style.background = 'rgba(255,255,255, 0.5)'
    highlightContainer.style.filter = 'brightness(0.97)'
    // highlightContainer.style.border = `${BORDER}px solid rgba(255,255,255, 0.25)`
  }

  function distFromTarget({target, mouseX, mouseY}: {
    target: HTMLElement,
    mouseX: number,
    mouseY: number
  }): number[] {
    const rect = target.getBoundingClientRect()
    const targetTop = rect.top + window.scrollY - (EDGE/2)
    const targetLeft = rect.left + window.scrollX - (EDGE/2)
    const targetRight = rect.right + window.scrollX + (EDGE/2)
    const targetBottom = rect.bottom + window.scrollY + (EDGE/2)

    const x = Math.abs(mouseX - clamp(targetLeft, mouseX, targetRight))
    const y = Math.abs(mouseY - clamp(targetTop, mouseY, targetBottom))
    return [x, y]
  }

  function drawOverlay() {
    if(overlayActive) return
    overlayActive = true
    const overlay = document.createElement('div')
    overlay.style.background = 'rgba(0,0,0, 0.12)'
    overlay.style.backdropFilter = "blur(18px)"
    overlay.style.zIndex = '99999999999'
    overlay.style.position = 'absolute'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = `${Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    )}px`
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 150ms cubic-bezier(.1,.5,.15,1)'
    document.documentElement.appendChild(overlay)
    overlayTracker.push(overlay)
    setTimeout(()=>{overlay.style.opacity = '100'},1)
    
    for(const [ target, i ] of getDropTargets()) {
      const highlight = target.cloneNode(true) as HTMLElement
      const rect = target.getBoundingClientRect()

      highlight.style.position = 'absolute'
      highlight.style.top = (EDGE/2)-BORDER + 'px'
      highlight.style.left = ((EDGE*STRETCH)/2)-BORDER + 'px'
      highlight.style.height = rect.height + 'px'
      highlight.style.width = rect.width + 'px'

      const computedStyle = getComputedStyle(target)
      const tlr = parseFloat(computedStyle.getPropertyValue('border-top-left-radius'))
      const trr = parseFloat(computedStyle.getPropertyValue('border-top-right-radius'))
      const blr = parseFloat(computedStyle.getPropertyValue('border-bottom-left-radius'))
      const brr = parseFloat(computedStyle.getPropertyValue('border-bottom-right-radius'))

      const highlightContainer = document.createElement('div')
      highlightContainer.style.backdropFilter = "blur(5px)"
      highlightContainer.style.position = 'absolute'
      highlightContainer.style.top = (rect.top + window.scrollY)-(EDGE/2) + 'px'
      highlightContainer.style.left = (rect.left + window.scrollX)-((EDGE*STRETCH)/2) + 'px'
      highlightContainer.style.height = rect.height+EDGE + 'px'
      highlightContainer.style.width = rect.width+(EDGE*STRETCH) + 'px'
      highlightContainer.style.zIndex = '99999999999'
      highlightContainer.style.borderTopLeftRadius = tlr + (EDGE/4) + 'px'
      highlightContainer.style.borderTopRightRadius = trr + (EDGE/4) + 'px'
      highlightContainer.style.borderBottomLeftRadius = blr + (EDGE/4) + 'px'
      highlightContainer.style.borderBottomRightRadius = brr + (EDGE/4) + 'px'
      highlightContainer.appendChild(highlight)

      unhoverHighlight(highlightContainer)
      
      document.documentElement.appendChild(highlightContainer)
      highlights.push(highlightContainer as HTMLElement)
    }
  }

  function ondragstart(e: DragEvent) {
    // if(e.dataTransfer) e.dataTransfer.effectAllowed = 'link'
  }

  let dragDepth = 0
  function ondragenter(e: DragEvent) {
    dragDepth++
    if (e.dataTransfer?.types.includes('Files')) {
      drawOverlay()
    }
  }
  function ondragleave(e: DragEvent) {
    dragDepth--
    dragDepth = Math.max(dragDepth, 0) // clamp to 0
    if (dragDepth === 0) {
      cleanup()
    }
  }
  // cleanup recovery fallback:
  function onmousemove(e: MouseEvent) {
    if (!overlayActive) return
    dragDepth = 0
    setTimeout(cleanup, 10)
  }
  
  function ondragover(e: DragEvent) {
    e.preventDefault()
    // if(e.dataTransfer) e.dataTransfer.effectAllowed = 'link'
    for(const [ target, i ] of getDropTargets()) {
      const [x, y] = distFromTarget({target,
        mouseX: e.pageX,
        mouseY: e.pageY
      })

      if (x < 50 && y < 10)
        hoverHighlight(highlights[i])
      else
        unhoverHighlight(highlights[i])
    }
  }

  function ondrop(e: DragEvent) {
    e.preventDefault()
    cleanup()
    if(!e.dataTransfer) return //early

    const targets = Array.from(getDropTargets())
    const unsortedDistances = targets.map(([target, i])=> {
      const [x, y] = distFromTarget({target,
        mouseX: e.pageX,
        mouseY: e.pageY
      })
      const distance = (x+y) // simplified distance function
      return [distance, i]
    })
    const shortestDistance = unsortedDistances.sort()?.[0]
    if (!shortestDistance) return // early

    const [dist, shortestDistanceIndex] = shortestDistance
    if (dist < 50 || targets.length === 1) {
      const [target, index] = targets[shortestDistanceIndex]
      
      const targetInput = target.querySelector('input[type="file"]')
      const targetName = targetInput?.getAttribute("name") ?? null
      const targetId = targetInput?.getAttribute("id") ?? null

      for(const onPageDrop of onPageDropEvents) {
        onPageDrop(e.dataTransfer, {
          element: targetInput as HTMLElement,
          name: targetName,
          id: targetId
        })
      }
    }
  }
</script>

<svelte:window {onmousemove} {ondragstart} {ondragenter} {ondragleave} {ondrop} {ondragover} />
