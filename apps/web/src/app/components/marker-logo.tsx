/** Marca de Marker: el marcador sustituye al avatar de usuario. */
export function MarkerLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      fill="currentColor"
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
    >
      <path d="M6 3a2 2 0 0 0-2 2v16l8-5 8 5V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}
