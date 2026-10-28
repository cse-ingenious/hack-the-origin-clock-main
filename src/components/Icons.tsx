import type { ReactNode } from 'react'

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const make = (children: ReactNode) => () => <svg {...base}>{children}</svg>

export const IconPlay = () => <svg {...base} fill="currentColor" stroke="none"><path d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12-7.4a1 1 0 0 0 0-1.72l-12-7.4A1 1 0 0 0 7 4.6z" /></svg>
export const IconPause = () => <svg {...base} fill="currentColor" stroke="none"><rect x="6" y="4" width="4.2" height="16" rx="1.2" /><rect x="13.8" y="4" width="4.2" height="16" rx="1.2" /></svg>
export const IconSound = make(<><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></>)
export const IconMuted = make(<><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m22 9-6 6M16 9l6 6" /></>)
export const IconFullscreen = make(<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />)
export const IconSettings = make(<><path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1" /><circle cx="16" cy="6" r="2.2" /><circle cx="10" cy="12" r="2.2" /><circle cx="18" cy="18" r="2.2" /></>)
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />)
export const IconCode = make(<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />)
