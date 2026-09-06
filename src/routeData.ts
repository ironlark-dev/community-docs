import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

// Only `banner` is written: the sidebar and the previous/next links are already derived.
const BANNER =
  'Ironlark is in closed pre-alpha. <a href="https://discord.gg/jAQU93uMy4">Join the Discord for access</a>.'

export const onRequest = defineRouteMiddleware((context) => {
  const { entry } = context.locals.starlightRoute
  entry.data.banner ??= { content: BANNER }
})
