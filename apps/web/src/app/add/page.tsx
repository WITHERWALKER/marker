import { AddForm } from "./add-form";

/**
 * Página de captura por URL. El GET /share-target (fallback sin SW)
 * redirige aquí con ?url=… prellenado.
 */

interface AddPageProps {
  searchParams: Promise<{ url?: string }>;
}

export default async function AddPage({ searchParams }: AddPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Guardar contenido</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pega la URL de un post, reel, video o artículo. Marker detecta la
          plataforma, saca título, miniatura y autor, y lo añade a tu feed.
        </p>
      </header>
      <AddForm initialUrl={params.url ?? ""} />
    </div>
  );
}
