import type { Stream } from './pipe'

export type ParseChunk =
  | {
      type: 'content'
      content: string
    }
  | {
      type: 'escape'
      escape: string
    }

export function parse(): Stream<string, ParseChunk> {
  let cachedChunk: string = ''

  const reg = /^\x1b\[[\x30-\x3f]*[\x20-0x2f]*[\x40-\x7e]/

  return nextChunk => {
    const parsedChunks: ParseChunk[] = []

    cachedChunk += nextChunk.join('')

    while (true) {
      let escapeIndex = cachedChunk.indexOf('\x1b[')

      if (escapeIndex === -1) {
        if (cachedChunk.length > 0) {
          parsedChunks.push({
            type: 'content',
            content: cachedChunk
          })
          cachedChunk = ''
        }
        break
      }

      if (escapeIndex > 0) {
        parsedChunks.push({
          type: 'content',
          content: cachedChunk.substring(0, escapeIndex)
        })
        cachedChunk = cachedChunk.slice(escapeIndex)
      }

      let match = reg.exec(cachedChunk)
      if (match) {
        parsedChunks.push({
          type: 'escape',
          escape: match[0]
        })
        cachedChunk = cachedChunk.slice(match[0].length)
      } else {
        break
      }
    }

    return parsedChunks
  }
}
