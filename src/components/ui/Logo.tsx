export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Connexions (lignes) */}
      <line x1="20" y1="8" x2="10" y2="18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="8" x2="30" y2="18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="14" y2="30" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="18" x2="26" y2="30" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="30" y2="18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="30" x2="26" y2="30" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="8" x2="20" y2="36" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="10" y1="18" x2="26" y2="30" stroke="url(#grad1)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <line x1="30" y1="18" x2="14" y2="30" stroke="url(#grad1)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

      {/* Nœuds (cercles) */}
      <circle cx="20" cy="8" r="3.5" fill="url(#grad2)" />
      <circle cx="10" cy="18" r="3" fill="url(#grad2)" />
      <circle cx="30" cy="18" r="3" fill="url(#grad2)" />
      <circle cx="14" cy="30" r="2.5" fill="url(#grad3)" />
      <circle cx="26" cy="30" r="2.5" fill="url(#grad3)" />
      <circle cx="20" cy="36" r="2" fill="url(#grad3)" />

      {/* Reflets lumineux sur les nœuds principaux */}
      <circle cx="19" cy="7" r="1.2" fill="white" opacity="0.4" />
      <circle cx="9.2" cy="17" r="1" fill="white" opacity="0.3" />
      <circle cx="29.2" cy="17" r="1" fill="white" opacity="0.3" />

      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="grad2" x1="10" y1="5" x2="30" y2="20">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="grad3" x1="10" y1="25" x2="30" y2="40">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
    </svg>
  );
}
