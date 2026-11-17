# Marker

> Todo lo que guardas —Instagram, X, YouTube, la web— en un solo lugar,
> buscable con palabras, no con memoria.

**Fase actual: 3 (import de histórico)** — captura desde cualquier app del
Android (share target), desde el PC con un clic (extensión Chrome/Edge),
feed con filtros, búsqueda, dedupe automático y enriquecimiento de metadata,
más importación masiva de lo ya guardado en Instagram y X.

---

## Arquitectura

Monorepo pnpm con separación estricta de capas (SOLID):

```
apps/
  web/                        → Next.js 15 (App Router) + Tailwind v4
    src/
      core/                   → CORAZÓN: sin dependencias de framework
        domain/               → entidades y reglas (Item, URL, plataforma)
        application/          → casos de uso (SaveItem, ListItems, ImportItems)
      core/ports.ts           → contratos (ItemRepository, MetadataFetcher, ImportParser)
      infrastructure/         → implementaciones de los puertos
        supabase/             → repositorio + clientes Supabase
        metadata/             → fetcher OpenGraph/oEmbed
        auth/                 → tokens de API + JWT efímeros (extensión)
        import/               → parsers de exports (Instagram saved_posts, X archive)
        composition.ts        → composition root (inyección de dependencias)
      app/                    → presentación (rutas, server actions, UI)
      middleware.ts           → sesión + protección de rutas
  extension/                  → WXT (Manifest V3): menú contextual + popup
supabase/                     → proyecto local Supabase (config + migraciones)
packages/                     → código compartido (futuro)
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
   apps\web\node_modules\.bin\supabase start
   ```

   La primera vez arranca Docker Desktop si hace falta y descarga las
   imágenes. Copia la `API URL` y la `anon key` que imprime el comando a
   `.env.local`.

3. **Migraciones**

   ```sh
   apps\web\node_modules\.bin\supabase db reset
   ```

   > Nota: `supabase start` ya aplica las migraciones de `supabase/migrations/`
   > en su primer arranque; `db reset` las reaplica desde cero.

4. **Arrancar la app**

   ```sh
   pnpm install
   pnpm dev                 # http://localhost:3000
   ```

5. **Entrar**: login sin contraseña (magic link). En local, el correo llega a
   la bandeja de **Inbucket** → http://localhost:54334

   > Puertos elegidos para convivir con otros proyectos Supabase locales
   > (como `comal`): API `54331`, DB `54332`, Studio `54333`, Inbucket `54334`.

## Cómo configurar la extensión de navegador

1. **Genera un token**: en la web → **Ajustes** → «Tokens de API» → Generar.
   Cópialo (solo se muestra una vez).
2. **Compila la extensión**:

   ```sh
   pnpm --filter @marker/extension build
   ```

3. **Cárgala en Chrome/Edge**: `chrome://extensions` → modo desarrollador →
   «Cargar descomprimida» → `apps/extension/.output/chrome-mv3`.
4. **Conéctala**: icono de Marker → Configuración → URL de la API
   (`http://localhost:3000`) + pega el token → «Probar conexión».
5. **Úsala**: clic derecho sobre una página, enlace, imagen o selección →
   **«Guardar en Marker»**. El badge del icono confirma: ✓ guardado,
   2× duplicado, ¡ error, ? falta configurar.

> El token viaja como `Authorization: Bearer`; en BD vive solo su SHA-256.
> La operación corre como tu usuario con RLS activa (JWT efímero), sin
> service-role key.

## Cómo importar tu histórico

En la web → **Importar** → sube el archivo de export:

- **Instagram (posts guardados)**: App → Configuración → Tu actividad →
  *Descargar tu información* → pide solo «Posts guardados» en JSON. Del ZIP
  que llega a tu correo, sube `saved_posts.json`.
- **X (posts con «me gusta»)**: Configuración → Tu cuenta → *Descargar un
  archivo de tus datos*. Del ZIP, sube `data/like.js`.

Qué hace Marker con el archivo:

- **Autodetecta el formato** (parser por contenido, no por extensión) y
  rechaza lo que no reconoce con un aviso claro.
- **Preserva la fecha original** de cada guardado (`saved_at`), así el
  histórico respeta el orden temporal real.
- **Dedupe** por URL canónica, tanto dentro del lote como contra lo que ya
  tengas guardado: puedes subir el mismo archivo dos veces sin duplicar.
- **Sin enriquecimiento síncrono**: los items quedan en `status=pending`
  (importar miles de URLs no debe bloquear una petición HTTP).

El endpoint acepta multipart con un archivo de hasta 25 MB y redirige de
vuelta a `/import` con las estadísticas (`imported`, `duplicates`, `invalid`).

> Añadir un nuevo formato de export (Reddit, Pocket, YouTube…) = escribir un
> `ImportParser` nuevo y registrarlo en `AutoImportParser`; nada más se toca.

## Fases

| Fase | Qué entrega | Estado |
|---|---|---|
| 0 | Captura por URL, feed, búsqueda, dedupe, metadata | ✅ |
| 1 | PWA Android con share_target (compartir → Marker) | ✅ |
| 2 | Extensión de navegador (Chrome/Edge) con token de API | ✅ |
| 3 | Import histórico (saved_posts.json de Instagram, X) | ✅ |
| 4 | IA: auto-tags, búsqueda semántica, transcripciones | ⬜ |
| 5 | Auto-syncs (YouTube OAuth, X, Reddit) | ⬜ |
| 6 | Producto: multiusuario, billing, servidor MCP | ⬜ |
