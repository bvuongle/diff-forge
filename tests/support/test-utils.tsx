import { ThemeProvider } from '@mui/material/styles'
import { render } from '@testing-library/react'

import { theme } from '@/styles/theme'

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>
  })
}

export { renderWithTheme }
