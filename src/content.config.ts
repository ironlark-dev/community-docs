import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

// `kind` stays out of the URL: it is the least stable thing about a page.
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        kind: z.enum(['tutorial', 'how-to', 'reference', 'explanation']).optional(),
        area: z.string().optional(),
        // Absent means the page describes what works today.
        state: z.enum(['not-built', 'changing']).optional(),
      }),
    }),
  }),
}
