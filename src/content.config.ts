import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

// `kind` is the job a page does, and it is not in the URL: it is the least stable
// thing about a page — an explanation grows steps and becomes a how-to — so a URL
// encoding it moves whenever that happens. The sidebar reads this field, which
// makes a reclassification a one-word edit. `area` is what the page is about, and
// that is what the URL carries, because it changes rarely and in bulk.
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        kind: z.enum(['tutorial', 'how-to', 'reference', 'explanation']).optional(),
        area: z.string().optional(),
        // Absent means the page describes what works today. Only the exception is
        // marked: a badge carried by most pages is a background colour, not a signal.
        state: z.enum(['not-built', 'changing']).optional(),
      }),
    }),
  }),
}
