export function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(x, max))
}

export function getNumberAttr(element: Element, name: string, fallback: number): number {
  return Number(
    element.getAttribute(name) || fallback)
}

export function getBoolAttr(element: Element, name: string): boolean {
  const attr = element.getAttribute(name)
  return !(attr=="false") && (typeof attr === 'string')
}

export function getEnumAttr<T>(element: Element, name: string, fallback: T): T {
  const attr = element.getAttribute(name)
  const bool = !(attr=="false") && (typeof attr === 'string')
  if (!bool) return false as T
  else if (attr === "") return fallback
  else return attr as T
}

export function parseNumber(value: number | string | undefined): number {
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// export function parseNumber(value: number | string | undefined): number {
//   if (value) {
//     if (typeof value === "string") {
//       const parsedValue = Number.parseInt(value, 10)
//       if (!Number.isNaN(parsedValue)) {
//         return parsedValue
//       }
//     }

//     if (typeof value === "number") return value
//   }

//   return 0
// }
