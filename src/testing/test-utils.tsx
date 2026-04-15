import { ThemeProvider } from '@mui/material/styles'
import { render } from '@testing-library/react'

import { theme } from '@/styles/theme'

// jsdom lacks ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>
  })
}

export { renderWithTheme }
