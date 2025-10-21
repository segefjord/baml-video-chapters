/**
 * EvalTokens are used to selectively evaluate properties eagerly and give them a static measurement value
 */
export type EvalToken = 'x' | 'y' | 'top' | 'left' | 'right' | 'bottom'
export const x: EvalToken = 'x'
export const y: EvalToken = 'y'
export const top: EvalToken = 'top'
export const left: EvalToken = 'left'
export const right: EvalToken = 'right'
export const bottom: EvalToken = 'bottom'

export interface SizeData {
  boxSizing: string
  padding: Measurement
  border: Measurement
  margin: Measurement
}

export class MeasurementBasic {
  private _x: CachedValue<number>
  private _y: CachedValue<number>

  get x() { return this._x.value }
  get y() { return this._y.value }

  constructor({x, y}: {
    x: () => number,
    y: () => number
  }, ...eagerly: EvalToken[]) {
    this._x = new CachedValue(x)
    this._y = new CachedValue(y)

    // eagerly evaluate:
    for(const token of eagerly) {
      if(token === 'x') this.x
      if(token === 'y') this.y
    }
  }
}

export class Measurement extends MeasurementBasic {
  private _top: CachedValue<number>
  private _left: CachedValue<number>
  private _right: CachedValue<number>
  private _bottom: CachedValue<number>

  get top() { return this._top.value }
  get left() { return this._left.value }
  get right() { return this._right.value }
  get bottom() { return this._bottom.value }

  constructor({x, y, top, left, right, bottom}: {
    x?: () => number,
    y?: () => number,
    top: () => number,
    left: () => number,
    right: () => number,
    bottom: () => number,
  }, ...eagerly: EvalToken[]) {
    super({
      x: x ?? (() => left() + right()),
      y: y ?? (() => top() + bottom()),
    }, ...eagerly)

    this._top = new CachedValue(top)
    this._left = new CachedValue(left)
    this._right = new CachedValue(right)
    this._bottom = new CachedValue(bottom)

    // eagerly evaluate:
    for (const token of eagerly) {
      if(token === 'top') this.top
      if(token === 'left') this.left
      if(token === 'right') this.right
      if(token === 'bottom') this.bottom
    }
  }
}

class CachedValue<T> {
  private cache?: T
  private getter: () => T

  constructor(getter: () => T) {
    this.getter = getter
  }

  get value() {
    return this.cache ??= this.getter()
  }
}
