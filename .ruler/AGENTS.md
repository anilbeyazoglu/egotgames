# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run lint     # Run ESLint
npm run deploy   # Deploy to Firebase hosting
```

## Architecture Overview

This is a Next.js 16 application for EgotGames, a game creation platform where users build 2D games using p5.js with either Blockly visual blocks or JavaScript code. The app uses the App Router with internationalization.

### Routing Structure

Routes are organized under `app/[locale]/` with route groups:

- `(marketing)/` - Public landing pages
- `(auth)/` - Login/signup pages
- `(app)/` - Authenticated app pages (dashboard, games, assets, profile, etc.)
- `(editor)/` - Game editor at `editor/[gameId]`
- `play/[gameSlug]/` - Public game player route
- `/su/` - Admin panel (no locale prefix, Basic Auth protected)

### Internationalization (next-intl)

- **Locales**: English (`en`), Turkish (`tr`) - configured in `i18n/routing.ts`
- **Message files**: `messages/en.json`, `messages/tr.json`
- **Navigation**: Use `Link`, `useRouter`, `usePathname` from `@/i18n/routing` instead of Next.js equivalents
- **Middleware**: `middleware.ts` handles locale routing and admin Basic Auth

### Authentication & Firebase

Firebase Authentication via `lib/firebase.ts`:
- Email/password, Google OAuth, Magic link sign-in
- Firebase config uses `NEXT_PUBLIC_FIREBASE_*` environment variables
- Firestore uses a named database `egotgames-prod` with persistent local cache
- Also uses Firebase Storage (`storage`) and Realtime Database (`rtdb`)

### Game Editor Architecture

The game editor (`components/game-editor/`) is the core feature:

- **EditorContext** (`editor-context.tsx`) - Manages editor state
- **GameEditor** (`game-editor.tsx`) - Main editor component with resizable panels
- **BlocklyEditor** (`blockly-editor.tsx`) - Visual block programming interface
- **CodeEditor** (`code-editor.tsx`) - Monaco-based JavaScript editor
- **GamePreview** (`game-preview.tsx`) - p5.js game preview in iframe
- **AIAssistantPanel** (`ai-assistant-panel.tsx`) - Chat interface with AI

Game creation modes: `blockly` | `javascript` (defined in `lib/types.ts`)

### AI Integration

- AI chat routes in `app/api/ai/chat/` (Blockly mode) and `app/api/ai/js-chat/` (JS mode)
- Uses Vercel AI SDK with Anthropic Claude (`claude-sonnet-4-5`)
- AI has `str_replace_based_edit_tool` to view/modify Blockly workspace JSON
- Chat sessions and messages stored in Firestore (`hooks/use-chat-sessions.ts`)
- Checkpoint system for saving/restoring game states

### Blockly Blocks System

Custom p5.js blocks are defined in:
- `components/game-editor/blockly-p5-blocks.ts` - Block definitions
- `components/game-editor/blockly-p5-generators.ts` - JavaScript code generation

### UI Components

- `components/ui/` - shadcn/ui components (Radix UI + Tailwind)
- `components/ai-elements/` - AI chat UI components (message, prompt-input, tool, etc.)
- `components/marketing/` - Marketing page components
- `components/PixelBlast.tsx` - Three.js WebGL animated background effect

### Key Types

Core types in `lib/types.ts`:
- `Game` - Game entity with status, visibility, creation mode
- `ChatSession`, `ChatMessage`, `ChatCheckpoint` - AI chat persistence
- `PublicAsset` - Asset library items

### Path Aliases

`@/*` maps to project root (configured in tsconfig.json)
