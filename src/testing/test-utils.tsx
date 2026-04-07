import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/styles/theme'

// jsdom lacks ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper })
}

export { renderWithTheme }
