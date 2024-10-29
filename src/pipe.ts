export type Stream<From, To> = (from: From[]) => To[]

export function pipe<X, XY, Y>(x: Stream<X, XY>, y: Stream<XY, Y>): Stream<X, Y> {
  return from => {
    return y(x(from))
  }
}
