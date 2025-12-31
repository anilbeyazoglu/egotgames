# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run lint     # Run ESLint
npm run deploy   # Deploy to Firebase hosting
```

## Architecture Overview

This is a Next.js 16 application for EgotGames, a game creation platform. The app uses the App Router with internationalization.

### Routing Structure

Routes are organized under `app/[locale]/` with three route groups:

- `(marketing)/` - Public landing pages
- `(auth)/` - Login/signup pages (login, signup)
- `(app)/` - Authenticated app pages (dashboard, editor/[gameId])
- `play/[gameSlug]/` - Game player route

### Internationalization (next-intl)

- **Locales**: English (`en`), Turkish (`tr`) - configured in `i18n/routing.ts`
- **Message files**: `messages/en.json`, `messages/tr.json`
- **Navigation**: Use `Link`, `useRouter`, `usePathname` from `@/i18n/routing` instead of Next.js equivalents
- **Server components**: Use `getMessages()` and `useTranslations()` from next-intl
- **Middleware**: `middleware.ts` handles locale routing

### Authentication

Firebase Authentication via `lib/firebase.ts`:

- Email/password sign-in
- Google OAuth
- Magic link email sign-in

Firebase config uses `NEXT_PUBLIC_FIREBASE_*` environment variables.

### UI Components

- `components/ui/` - shadcn/ui components (Radix UI + Tailwind)
- `components/marketing/` - Marketing page components
- `components/PixelBlast.tsx` - Three.js WebGL animated background effect with postprocessing

### Key Dependencies

- **UI**: Radix UI primitives, Tailwind CSS 4, lucide-react icons
- **3D**: Three.js with postprocessing for PixelBlast effects
- **i18n**: next-intl for localization
- **Auth**: Firebase v12

### Path Aliases

`@/*` maps to project root (configured in tsconfig.json)
