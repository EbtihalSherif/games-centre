import { forwardRef, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

// Tiny history router shared by the shell and every game, so navigating between
// a game and the games centre never costs a full page load.

export function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export function navigate(to: string): void {
  if (to === currentPath()) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function usePath(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onPop = () => setPath(currentPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

// The part of the URL a game owns, e.g. basePath "/two-truths" + "/two-truths/play" -> "/play".
export function useSubPath(basePath: string): string {
  const path = usePath()
  if (!basePath || basePath === '/') return path
  if (path === basePath) return '/'
  return path.startsWith(basePath + '/') ? path.slice(basePath.length) : path
}

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  children?: ReactNode
}

// Forwards its ref so MUI can use it via `component={Link}`.
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, children, onClick, ...rest },
  ref
) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return (
    <a ref={ref} href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
})
