type State<T> = WeakMap<Element, T>

export function createElementState<T>(): State<T> {
  return new WeakMap<Element, T>()
}

class ElementState<T> {
  private state: State<Partial<T>>
  private key: Element
  
  constructor(state: State<T>, element: Element) {
    this.key = element
    this.state = state
  }

  private update(data: Partial<T>): void {
    this.state.set(this.key, {
      ...this.state.get(this.key),
      ...data
    })
  }
}

export function getElementState<T>(state: State<T>, element: Element): ElementState<T> & T {
  const elementState = new ElementState(state, element)
  return new Proxy(elementState, {
    get(target, prop) {
      if (prop in target) {
        return (target as any)[prop]
      }
      const state = target['state'].get(target['key'])
      return state?.[prop as keyof T]
    },
    set(target, prop, value) {
      if (prop in target) {
        (target as any)[prop] = value
        return true
      }
      target['update']({ [prop as keyof T]: value } as Partial<T>)
      return true
    }
  }) as ElementState<T> & T
}
