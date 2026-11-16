# Marker

> Todo lo que guardas —Instagram, X, YouTube, la web— en un solo lugar,
> buscable con palabras, no con memoria.

**Fase actual: 0 (MVP)** — captura por URL, feed con filtros, búsqueda, dedupe
automático y enriquecimiento de metadata (título, miniatura, autor).

---

## Arquitectura

Monorepo pnpm con separación estricta de capas (SOLID):

```
apps/
  web/                        → Next.js 15 (App Router) + Tailwind v4
    src/
      core/                   → CORAZÓN: sin dependencias de framework
        domain/               → entidades y reglas (Item, URL, plataforma)
        application/          → casos de uso (SaveItem, ListItems)
      core/ports.ts           → contratos (ItemRepository, MetadataFetcher)
      infrastructure/         → implementaciones de los puertos
        supabase/             → repositorio + clientes Supabase
        metadata/             → fetcher OpenGraph/oEmbed
        composition.ts        → composition root (inyección de dependencias)
      app/                    → presentación (rutas, server actions, UI)
      middleware.ts           → sesión + protección de rutas
packages/                     → código compartido (extensión, etc.)
```

**Regla de dependencias:** `app → core ← infrastructure`. Los casos de uso
solo conocen puertos; cambiar Supabase por otra cosa no toca el negocio.

## Puesta en marcha (modo local, sin cuenta en la nube)

1. **Variables de entorno**

   ```sh
   cd apps/web
   copy .env.example .env.local
   ```

2. **Supabase local** (requiere Docker), desde la raíz del repo:

   ```sh
   npx supabase init        # solo la primera vez
   npx supabase start       # levanta Postgres, Auth, Storage...
   ```

   Copia la `API URL` y la `anon key` que imprime el comando a `.env.local`.

3. **Migraciones**

   ```sh
   npx supabase db reset    # aplica apps/web/supabase/migrations/*
   ```

   > Nota: `supabase/config.toml` apunta a `apps/web/supabase` como
   > directorio de migraciones.

4. **Arrancar la app**

   ```sh
   pnpm install
   pnpm dev                 # http://localhost:3000
   ```

5. **Entrar**: login sin contraseña (magic link). En local, el correo llega a
   la bandeja de **Inbucket** → http://localhost:54324

## Fases

| Fase | Qué entrega | Estado |
|---|---|---|
| 0 | Captura por URL, feed, búsqueda, dedupe, metadata | ✅ en curso |
| 1 | PWA Android con share_target (compartir → Marker) | ⬜ |
| 2 | Extensión de navegador (Chrome/Edge) | ⬜ |
| 3 | Import histórico (saved_posts.json de Instagram, X) | ⬜ |
| 4 | IA: auto-tags, búsqueda semántica, transcripciones | ⬜ |
| 5 | Auto-syncs (YouTube OAuth, X, Reddit) | ⬜ |
| 6 | Producto: multiusuario, billing, servidor MCP | ⬜ |
