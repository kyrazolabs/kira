// Platform detection — URL matching + input selectors for each platform

const PLATFORMS = {
  twitter: {
    match: (url) => /twitter\.com|x\.com/.test(url.hostname),
    inputSelector: '[data-testid="tweetTextarea_0"], [contenteditable="true"][role="textbox"]',
    name: 'X / Twitter',
    maxLength: 280
  },
  linkedin: {
    match: (url) => /linkedin\.com/.test(url.hostname),
    inputSelector: '.ql-editor[contenteditable="true"], [role="textbox"][contenteditable="true"]',
    name: 'LinkedIn',
    maxLength: 3000
  },
  reddit: {
    match: (url) => /reddit\.com/.test(url.hostname),
    inputSelector: 'textarea, [contenteditable="true"]',
    name: 'Reddit',
    maxLength: 10000
  },
  threads: {
    match: (url) => /threads\.net/.test(url.hostname),
    inputSelector: '[contenteditable="true"][role="textbox"], textarea',
    name: 'Threads',
    maxLength: 500
  },
  generic: {
    match: () => true,
    inputSelector: 'textarea, [contenteditable="true"]',
    name: 'Web',
    maxLength: 10000
  }
}

export function detectPlatform(url) {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.match(url)) return { key, ...platform }
  }
  return { key: 'generic', ...PLATFORMS.generic }
}

export function getPlatform(name) {
  return PLATFORMS[name] || PLATFORMS.generic
}

export { PLATFORMS }
