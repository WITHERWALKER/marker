import { listUserTags } from "../actions";
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
  const knownTags = await listUserTags();

  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <div className="w-full max-w-lg">
        <AddForm initialUrl={params.url ?? ""} knownTags={knownTags} />
      </div>
    </div>
  );
}
