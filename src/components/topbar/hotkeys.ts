type Combo = { chips: string[]; note?: string }
type Hotkey = { description: string; combos: Combo[] }
type HotkeySection = { title: string; hotkeys: Hotkey[] }

const HOTKEY_SECTIONS: HotkeySection[] = [
  {
    title: 'Project',
    hotkeys: [
      {
        description: 'Export topology to <project>.forge.json',
        combos: [{ chips: ['mod', 'S'] }]
      },
      {
        description: 'Open / switch workspace folder',
        combos: [{ chips: ['mod', 'O'] }]
      }
    ]
  },
  {
    title: 'Canvas',
    hotkeys: [
      {
        description: 'Remove selected nodes and edges',
        combos: [{ chips: ['Delete'] }, { chips: ['Backspace'] }]
      },
      {
        description: 'Select all nodes',
        combos: [{ chips: ['mod', 'A'] }]
      },
      {
        description: 'Temporarily toggle pan mode',
        combos: [{ chips: ['Space'], note: 'hold' }]
      },
      {
        description: 'Pan viewport',
        combos: [
          { chips: ['Right-click'], note: 'drag' },
          { chips: ['Middle-click'], note: 'drag' }
        ]
      },
      {
        description: 'Zoom in / out',
        combos: [{ chips: ['Mouse Wheel'] }]
      },
      {
        description: 'Marquee-select nodes',
        combos: [{ chips: ['Left-click'], note: 'drag on empty canvas' }]
      },
      {
        description: 'Create a connection between nodes',
        combos: [{ chips: ['Drag'], note: 'from port to port' }]
      }
    ]
  },
  {
    title: 'Catalog',
    hotkeys: [
      {
        description: 'Drop component onto canvas',
        combos: [{ chips: ['Drag'], note: 'card from sidebar' }]
      },
      {
        description: 'Inspect component metadata',
        combos: [{ chips: ['Click'], note: 'on card' }]
      }
    ]
  }
]

export { HOTKEY_SECTIONS }
export type { Combo }
