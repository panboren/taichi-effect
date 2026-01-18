/**
 * XSS 防护工具
 */

const XSS_PATTERNS = {
  default: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<form[^>]*>.*?<\/form>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*>/g
  ],
  strict: [
    /<[^>]+>/g,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:[^;]*;base64/gi,
    /vbscript:/gi
  ]
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function escapeAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

export function sanitizeHtml(text: string, mode: 'default' | 'strict' = 'default'): string {
  let result = text

  XSS_PATTERNS[mode].forEach((pattern) => {
    result = result.replace(pattern, '')
  })

  return result
}

export function sanitizeUrl(url: string): string {
  const urlLower = url.toLowerCase()

  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'about:']

  for (const protocol of dangerousProtocols) {
    if (urlLower.startsWith(protocol)) {
      return '#'
    }
  }

  return url
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:' ||
      parsedUrl.protocol === 'mailto:' ||
      parsedUrl.protocol === 'tel:'
    )
  } catch {
    return false
  }
}

export function createSafeHtmlParser(): DOMParser {
  const parser = new DOMParser()
  const originalParseFromString = parser.parseFromString

  parser.parseFromString = function (str: string, type: string): Document {
    const sanitizedStr = sanitizeHtml(str, 'strict')
    return originalParseFromString.call(this, sanitizedStr, type)
  }

  return parser
}

export const vSafeHtml = {
  mounted(el: HTMLElement, binding: { value: string }) {
    el.innerHTML = sanitizeHtml(binding.value)
  },
  updated(el: HTMLElement, binding: { value: string }) {
    el.innerHTML = sanitizeHtml(binding.value)
  }
}

export const vSafeText = {
  mounted(el: HTMLElement, binding: { value: string }) {
    el.textContent = binding.value
  },
  updated(el: HTMLElement, binding: { value: string }) {
    el.textContent = binding.value
  }
}
