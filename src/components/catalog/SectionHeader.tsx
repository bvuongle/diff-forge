import { Typography } from '@mui/material'

type SectionHeaderProps = {
  title: string
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      letterSpacing={1}
      noWrap
      sx={{ fontSize: '0.7rem', minWidth: 0 }}
    >
      {title.toUpperCase()}
    </Typography>
  )
}

export { SectionHeader }
