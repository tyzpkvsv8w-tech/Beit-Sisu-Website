"use client";

import { useI18n } from "@/i18n/client";

/** On phones the filter panel is hidden until this is tapped. */
export function FilterToggle() {
  const { m } = useI18n();
  return (
    <button className="btn btn-ghost filter-toggle" type="button"
      onClick={(e) => {
        const open = document.getElementById("filters")?.classList.toggle("open");
        e.currentTarget.setAttribute("aria-expanded", String(!!open));
      }}
      aria-controls="filters" aria-expanded="false">
      {m.browse.filters}
    </button>
  );
}
