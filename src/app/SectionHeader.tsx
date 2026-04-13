import { Typography } from '@mui/material'

type SectionHeaderProps = {
  title: string
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Typography variant="overline" color="text.secondary" letterSpacing={1} sx={{ fontSize: '0.7rem' }}>
      {title.toUpperCase()}
    </Typography>
  )
}

export { SectionHeader }
