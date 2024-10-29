import type { Stream } from './pipe'
import type { Color, Color4, TransformChunk } from './transform'
import he from 'he'

export type GenerateChunk = {
  style: string
  text: string
  html: string
}

export type Palette = Record<Color4, [number, number, number]>

function makeColor(palette: Palette, color: Color) {
  switch (color.type) {
    case '4':
      return `rgb(${palette[color.color].join(',')})`
    case '8':
      switch (color.type8) {
        case 'base':
          return `rgb(${palette[color.color].join(',')})`
        case 'rgb':
          return `rgb(${color.red},${color.green},${color.blue})`
        case 'gray':
          let gc = Math.round((color.gray * 255) / 23)
          return `rgb(${gc},${gc},${gc})`
      }
    case '24':
      return `rgb(${color.red},${color.green},${color.blue})`
    case 'default':
      return null
  }
}

export const terminalPalette: Palette = {
  black: [0, 0, 0],
  red: [153, 0, 0],
  green: [0, 166, 0],
  yellow: [153, 153, 0],
  blue: [0, 0, 178],
  magenta: [178, 0, 178],
  cyan: [0, 166, 178],
  white: [191, 191, 191],
  'bright black': [102, 102, 102],
  'bright red': [233, 0, 0],
  'bright green': [0, 217, 0],
  'bright yellow': [230, 230, 0],
  'bright blue': [0, 0, 255],
  'bright magenta': [230, 0, 230],
  'bright cyan': [0, 230, 230],
  'bright white': [230, 230, 230]
}

export function htmlGenerate(palette: Palette): Stream<TransformChunk, GenerateChunk> {
  return nextChunk => {
    const parsedChunks: GenerateChunk[] = []

    for (const chunk of nextChunk) {
      const styles: string[] = []
      if (chunk.state.weight) {
        switch (chunk.state.weight) {
          case 'normal':
            break
          case 'bold':
            styles.push('font-weight:bolder;')
            break
          case 'light':
            styles.push('font-weight:lighter;')
            break
        }
      }
      if (chunk.state.italic) {
        styles.push('font-style:italic;')
      }
      if (chunk.state.underline) {
        styles.push('text-decoration:underline;')
      }
      if (chunk.state.blink) {
        // TODO
      }
      if (chunk.state.fg) {
        const c = makeColor(palette, chunk.state.fg)
        if (c) {
          styles.push(`color:${c};`)
        }
      }
      if (chunk.state.bg) {
        const c = makeColor(palette, chunk.state.bg)
        if (c) {
          styles.push(`background-color:${c};`)
        }
      }

      parsedChunks.push({
        text: chunk.text,
        style: styles.join(''),
        html: `<span style="${styles.join('')}">${he
          .encode(chunk.text)
          .replace('\n', '<br>')}</span>`
      })
    }

    return parsedChunks
  }
}
