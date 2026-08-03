import { index, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  index('./routes/home.tsx'),
  route('explore', './routes/explore.tsx'),
  route('following', './routes/following.tsx'),
  route('upload', './routes/upload.tsx'),
  route('works/:id', './routes/works.$id.tsx'),
  route('creator/:handle', './routes/creator.$handle.tsx'),
  route('api/works', './routes/api.works.ts'),
  route('api/works/:id', './routes/api.works.$id.ts'),
  route('*', './routes/not-found.tsx'),
] satisfies RouteConfig
