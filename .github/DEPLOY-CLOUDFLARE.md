# Deploy Marker → Cloudflare Workers

Workflow: [`.github/workflows/deploy-cloudflare.yml`](workflows/deploy-cloudflare.yml)

En **GitHub Actions** solo va el secret `CLOUDFLARE_API_TOKEN` (permiso Workers Scripts / Edit). Sin este secret el workflow falla de inmediato. Nada de claves de Supabase ni JWT en el repositorio ni en el YAML.

## Variables de la app (Cloudflare, no GitHub)

En el dashboard: **Workers & Pages → marker → Settings → Variables and Secrets**

Configura ahí (como Variables o Secrets según corresponda):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (URL pública del worker, p. ej. `https://marker.<tu-subdominio>.workers.dev`)
- `SUPABASE_JWT_SECRET` (Secret)

OpenNext necesita las `NEXT_PUBLIC_*` también en el **entorno de build**. Si el build en Actions falla por env vacío, usa **Workers Builds** (conectar el repo en Cloudflare) y define las mismas variables en la configuración de build del dashboard — el build corre en Cloudflare, no en GitHub.

## Ejecutar

- Push a `master` (paths del workflow) o **Actions → Deploy Cloudflare → Run workflow**.

## Auth en Supabase

Redirects y `site_url` deben coincidir con la URL pública del worker (`/auth/callback`).