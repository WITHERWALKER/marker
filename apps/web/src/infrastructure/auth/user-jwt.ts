import { createHmac, randomUUID } from "node:crypto";

/**
 * JWT efímeros con rol `authenticated` para la API de tokens (extensión).
 *
 * En vez de la service-role key (que SALTARÍA RLS y debilitaría el invariant
 * "un usuario nunca toca lo de otro"), firmamos un JWT con el JWT secret del
 * proyecto y el `sub` del usuario verificado: PostgREST valida la firma y
 * TODAS las policies RLS aplican igual que en una sesión web.
 *
 * `iss` = "supabase-demo", el mismo valor de las claves del proyecto, para
 * atravesar la validación del gateway local (Kong) sin tocar nada más.
 */

interface JwtHeader {
  alg: "HS256";
  typ: "JWT";
}

interface JwtClaims {
  sub: string;
  role: "authenticated";
  aud: "authenticated";
  iss: string;
  iat: number;
  exp: number;
  jti: string;
}

const ISSUER = "supabase-demo";
const DEFAULT_TTL_SECONDS = 300;

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signClaims(claims: JwtClaims, secret: string): string {
  const header = JSON.stringify({ alg: "HS256", typ: "JWT" } satisfies JwtHeader);
  const signingInput = `${encodeBase64Url(header)}.${encodeBase64Url(JSON.stringify(claims))}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

export function signUserJwt(
  userId: string,
  secret: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  return signClaims(
    {
      sub: userId,
      role: "authenticated",
      aud: "authenticated",
      iss: ISSUER,
      iat: now,
      exp: now + ttlSeconds,
      jti: randomUUID(),
    },
    secret,
  );
}

/**
 * Encapsula el secreto de firma; los casos de uso nunca lo conocen.
 * Este módulo solo se importa desde rutas server (runtime node).
 */
export class UserTokenIssuer {
  constructor(private readonly secret: string) {}

  issue(userId: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
    return signUserJwt(userId, this.secret, ttlSeconds);
  }
}
