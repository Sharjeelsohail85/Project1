import { describe, it, expect } from 'vitest'
import { resolvePlaybackSource } from './videoSource'

describe('videoSource Utilities - resolvePlaybackSource', () => {
  it('should resolve default HTML5 source when url is missing', () => {
    const result = resolvePlaybackSource()
    expect(result.mode).toBe('html5')
    expect(result.src).toBe('resources/video.mp4')
    expect(result.provider).toBe('direct')
  })

  it('should correctly resolve Google Drive streams', () => {
    const streamUrl = '/api/v1/google-drive/stream/file-123'
    const result = resolvePlaybackSource({ sourceUrl: streamUrl, title: 'Drive Test' })
    expect(result.mode).toBe('html5')
    expect(result.src).toBe(streamUrl)
    expect(result.provider).toBe('direct')
  })

  it('should extract and resolve YouTube URLs to iframe embeds', () => {
    const ytUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ'
    ]

    for (const url of ytUrls) {
      const result = resolvePlaybackSource({ sourceUrl: url, title: 'YT Test', sourceType: 'uploadyoutube' })
      expect(result.mode).toBe('iframe')
      expect(result.src).toContain('dQw4w9WgXcQ')
      expect(result.provider).toBe('youtube')
    }
  })

  it('should extract and resolve Google Drive URLs to preview iframe', () => {
    const driveUrl = 'https://drive.google.com/file/d/1A_B_C_D_12345/view?usp=sharing'
    const result = resolvePlaybackSource({ sourceUrl: driveUrl, title: 'Drive Doc', sourceType: 'uploadgoogle' })
    expect(result.mode).toBe('iframe')
    expect(result.src).toBe('https://drive.google.com/file/d/1A_B_C_D_12345/preview')
    expect(result.provider).toBe('google')
  })

  it('should format Dropbox links to direct stream links', () => {
    const dropboxUrl = 'https://www.dropbox.com/s/abcdefg/my-video.mp4?dl=0'
    const result = resolvePlaybackSource({ sourceUrl: dropboxUrl, title: 'Dropbox Video', sourceType: 'uploaddropbox' })
    expect(result.mode).toBe('html5')
    expect(result.src).toBe('https://dl.dropboxusercontent.com/s/abcdefg/my-video.mp4?raw=1')
    expect(result.provider).toBe('dropbox')
  })

  it('should recognize direct MP4/WebM files as HTML5 direct video', () => {
    const directUrl = 'https://archive.org/download/test/sample.mp4'
    const result = resolvePlaybackSource({ sourceUrl: directUrl, title: 'Archive Video' })
    expect(result.mode).toBe('html5')
    expect(result.src).toBe(directUrl)
    expect(result.provider).toBe('direct')
  })

  it('should fallback to general iframe for unidentified external URLs', () => {
    const externalUrl = 'https://vimeo.com/987654321'
    const result = resolvePlaybackSource({ sourceUrl: externalUrl, title: 'External Video' })
    expect(result.mode).toBe('iframe')
    expect(result.src).toBe(externalUrl)
    expect(result.provider).toBe('external')
  })
})
