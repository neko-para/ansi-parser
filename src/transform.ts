import type { ParseChunk } from './parse'
import type { Stream } from './pipe'

export type Color4 =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'bright black'
  | 'bright red'
  | 'bright green'
  | 'bright yellow'
  | 'bright blue'
  | 'bright magenta'
  | 'bright cyan'
  | 'bright white'

export const Color4Normal = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white'
] as const

export const Color4Bright = [
  'bright black',
  'bright red',
  'bright green',
  'bright yellow',
  'bright blue',
  'bright magenta',
  'bright cyan',
  'bright white'
] as const

export type Color =
  | {
      type: '4'
      color: Color4
    }
  | ({
      type: '8'
    } & (
      | {
          type8: 'base'
          color: Color4
        }
      | {
          type8: 'rgb'
          red: number // 0 ~ 5
          green: number // 0 ~ 5
          blue: number // 0 ~ 5
        }
      | {
          type8: 'gray'
          gray: number // 0 ~ 23
        }
    ))
  | {
      type: '24'
      red: number // 0 ~ 255
      green: number // 0 ~ 255
      blue: number // 0 ~ 255
    }
  | {
      type: 'default'
    }

export type TransformState = {
  // CSI 1, 2, 22
  weight?: 'normal' | 'bold' | 'light'
  // CSI 3, 23
  italic?: boolean
  // CSI 4, 24
  underline?: boolean
  // CSI 5, 25
  blink?: boolean

  // CSI 30-37, 90-97, 38, 39
  fg?: Color
  // CSI 40-47, 100, 107, 48, 49
  bg?: Color
}

export type TransformChunk = {
  text: string
  state: TransformState
}

export type TransformOption = {}

export function transform(initState: TransformState = {}): Stream<ParseChunk, TransformChunk> {
  let state = {
    ...initState
  }

  return nextChunk => {
    const parsedChunk: TransformChunk[] = []

    for (const chunk of nextChunk) {
      if (chunk.type === 'content') {
        parsedChunk.push({
          text: chunk.content,
          state: {
            ...state
          }
        })
      } else if (chunk.type === 'escape') {
        let SGR = /^\x1b\[(\d+(?:;\d+)*)?m$/
        let SGRm = SGR.exec(chunk.escape)

        if (SGRm) {
          const codes = (SGRm[1] ?? '0').split(';').map(x => parseInt(x))
          let codeIter = codes.values()
          while (true) {
            let cmd = codeIter.next()
            if (cmd.done) {
              break
            }
            switch (cmd.value) {
              case 0:
                state = {}
                break
              case 1:
                state.weight = 'bold'
                break
              case 2:
                state.weight = 'light'
                break
              case 3:
                state.italic = true
                break
              case 4:
                state.underline = true
                break
              case 5:
                state.blink = true
                break
              case 22:
                state.weight = 'normal'
                break
              case 23:
                state.italic = false
                break
              case 24:
                state.underline = false
                break
              case 25:
                state.blink = false
                break
              case 30:
              case 31:
              case 32:
              case 33:
              case 34:
              case 35:
              case 36:
              case 37:
                state.fg = {
                  type: '4',
                  color: Color4Normal[cmd.value - 30]
                }
                break
              case 38: {
                let type = codeIter.next()
                if (type.done) {
                  break
                }
                switch (type.value) {
                  case 5: {
                    let val = codeIter.next()
                    if (val.done) {
                      break
                    }
                    let index = val.value
                    if (index < 0 || index > 255) {
                      break
                    }
                    if (index <= 7) {
                      state.fg = {
                        type: '8',
                        type8: 'base',
                        color: Color4Normal[index]
                      }
                    } else if (index <= 15) {
                      state.fg = {
                        type: '8',
                        type8: 'base',
                        color: Color4Bright[index - 8]
                      }
                    } else if (index <= 231) {
                      const cube = index - 16
                      const red = Math.floor(cube / 36)
                      const green = Math.floor((cube % 36) / 6)
                      const blue = cube % 6
                      state.fg = {
                        type: '8',
                        type8: 'rgb',
                        red,
                        green,
                        blue
                      }
                    } else {
                      state.fg = {
                        type: '8',
                        type8: 'gray',
                        gray: index - 232
                      }
                    }
                    break
                  }
                  case 2: {
                    const rgb = Array.from({ length: 3 }).map(() => {
                      let val = codeIter.next()
                      return val.done ? 0 : val.value
                    })
                    state.fg = {
                      type: '24',
                      red: rgb[0],
                      green: rgb[1],
                      blue: rgb[2]
                    }
                    break
                  }
                }
                break
              }
              case 39:
                state.fg = {
                  type: 'default'
                }
                break
              case 40:
              case 41:
              case 42:
              case 43:
              case 44:
              case 45:
              case 46:
              case 47:
                state.bg = {
                  type: '4',
                  color: Color4Normal[cmd.value - 40]
                }
                break
              case 48: {
                let type = codeIter.next()
                if (type.done) {
                  break
                }
                switch (type.value) {
                  case 5: {
                    let val = codeIter.next()
                    if (val.done) {
                      break
                    }
                    let index = val.value
                    if (index < 0 || index > 255) {
                      break
                    }
                    if (index <= 7) {
                      state.bg = {
                        type: '8',
                        type8: 'base',
                        color: Color4Normal[index]
                      }
                    } else if (index <= 15) {
                      state.bg = {
                        type: '8',
                        type8: 'base',
                        color: Color4Bright[index - 8]
                      }
                    } else if (index <= 231) {
                      const cube = index - 16
                      const red = Math.floor(cube / 36)
                      const green = Math.floor((cube % 36) / 6)
                      const blue = cube % 6
                      state.bg = {
                        type: '8',
                        type8: 'rgb',
                        red,
                        green,
                        blue
                      }
                    } else {
                      state.bg = {
                        type: '8',
                        type8: 'gray',
                        gray: index - 232
                      }
                    }
                    break
                  }
                  case 2: {
                    const rgb = Array.from({ length: 3 }).map(() => {
                      let val = codeIter.next()
                      return val.done ? 0 : val.value
                    })
                    state.bg = {
                      type: '24',
                      red: rgb[0],
                      green: rgb[1],
                      blue: rgb[2]
                    }
                    break
                  }
                }
                break
              }
              case 49:
                state.bg = {
                  type: 'default'
                }
                break
              case 90:
              case 91:
              case 92:
              case 93:
              case 94:
              case 95:
              case 96:
              case 97:
                state.fg = {
                  type: '4',
                  color: Color4Bright[cmd.value - 90]
                }
                break

              case 100:
              case 101:
              case 102:
              case 103:
              case 104:
              case 105:
              case 106:
              case 107:
                state.bg = {
                  type: '4',
                  color: Color4Bright[cmd.value - 100]
                }
                break
            }
          }
        } else {
          console.log(chunk.escape)
        }
      }
    }

    return parsedChunk
  }
}
