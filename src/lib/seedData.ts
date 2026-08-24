import type { Bin, Item } from '@/types'
import { createId, generatePlaceholderImage, nowIso } from '@/lib/utils'

export function createSeedData(): { bins: Bin[]; items: Item[] } {
  const now = nowIso()

  const christmasId = createId()
  const campingId = createId()
  const toolboxId = createId()

  const bins: Bin[] = [
    {
      id: christmasId,
      name: 'Christmas Decorations',
      description: 'Seasonal holiday decorations and lights.',
      category: 'Holiday',
      tags: ['holiday', 'seasonal'],
      location: 'Garage Shelf 3',
      previewImage: generatePlaceholderImage('Christmas Decorations', 12),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: campingId,
      name: 'Camping Gear',
      description: 'Weekend camping essentials.',
      category: 'Outdoors',
      tags: ['outdoors', 'camping'],
      location: 'Garage',
      previewImage: generatePlaceholderImage('Camping Gear', 155),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: toolboxId,
      name: 'Toolbox',
      description: 'Hand tools and power tools.',
      category: 'Tools',
      tags: ['tools', 'workshop'],
      location: 'Garage Workbench',
      previewImage: generatePlaceholderImage('Toolbox', 95),
      createdAt: now,
      updatedAt: now,
    },
  ]

  const items: Item[] = [
    { id: createId(), binId: christmasId, name: 'Christmas lights', tags: ['lights'], createdAt: now, updatedAt: now },
    { id: createId(), binId: christmasId, name: 'Tree topper', tags: ['decor'], createdAt: now, updatedAt: now },
    { id: createId(), binId: christmasId, name: 'Extension cords', tags: ['electrical'], createdAt: now, updatedAt: now },
    { id: createId(), binId: christmasId, name: 'Ornaments', tags: ['decor'], createdAt: now, updatedAt: now },
    { id: createId(), binId: campingId, name: 'Tent stakes', tags: ['camping'], createdAt: now, updatedAt: now },
    { id: createId(), binId: campingId, name: 'Camp stove', tags: ['cooking'], createdAt: now, updatedAt: now },
    { id: createId(), binId: campingId, name: 'Lantern', tags: ['lighting'], createdAt: now, updatedAt: now },
    { id: createId(), binId: campingId, name: 'Sleeping bag', tags: ['sleeping'], createdAt: now, updatedAt: now },
    { id: createId(), binId: toolboxId, name: 'Hammer', description: 'Claw hammer', tags: ['tool', 'hand tool'], createdAt: now, updatedAt: now },
    { id: createId(), binId: toolboxId, name: 'Cordless drill', tags: ['tool', 'power tool'], createdAt: now, updatedAt: now },
    { id: createId(), binId: toolboxId, name: 'Drill bits', tags: ['tool'], createdAt: now, updatedAt: now },
    { id: createId(), binId: toolboxId, name: 'Tape measure', tags: ['tool', 'hand tool'], createdAt: now, updatedAt: now },
  ]

  return { bins, items }
}
