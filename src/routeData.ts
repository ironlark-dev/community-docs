import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

// The pre-alpha notice belongs on every page and in exactly one place. Setting it
// here rather than in each page's frontmatter means it cannot be forgotten on a new
// page, and changing the wording is one edit rather than forty.
//
// Only `banner` is written. The sidebar and the previous/next links are derived
// before this runs, so touching either here would leave them disagreeing.
const BANNER =
  'Ironlark is in closed pre-alpha. What is documented here works — what is missing is on <a href="/boundary/">the boundary today</a>.'

export const onRequest = defineRouteMiddleware((context) => {
  const { entry } = context.locals.starlightRoute
  entry.data.banner ??= { content: BANNER }
})
