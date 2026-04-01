export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function MicrosoftMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  )
}

export function GoogleMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 12.2c0-.8-.1-1.4-.2-2.1H12v4h5.2c-.2 1.1-.9 2.7-2.4 3.7l-.1.3 3.4 2.6.2 0c2-1.9 3.1-4.6 3.1-8.5Z" />
      <path d="M12 21c2.5 0 4.7-.8 6.3-2.3l-3.5-2.7c-.9.6-2.1 1.1-3.7 1.1-2.5 0-4.6-1.7-5.4-4l-.3 0-3.5 2.7-.1.3C3.6 19 7.5 21 12 21Z" />
      <path d="M6.6 13.1c-.2-.6-.4-1.2-.4-1.9s.1-1.3.3-1.9l0-.3-3.6-2.7-.1 0C2.3 7.5 2 8.7 2 10s.3 2.5.8 3.7l3.8-.6Z" />
      <path d="M12 6c1.9 0 3.2.8 3.9 1.5L18.4 5C16.7 3.4 14.5 2.5 12 2.5 7.5 2.5 3.6 5 2 8.7l4 3.1C6.7 8.1 8.9 6 12 6Z" />
    </svg>
  )
}

export function GitHubMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.66.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.85c.85 0 1.71.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.56 1.41.21 2.45.11 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.91 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

export function SSOMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
