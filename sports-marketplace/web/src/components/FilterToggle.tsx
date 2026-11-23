"use client";

/** On phones the filter panel is hidden until this is tapped. */
export function FilterToggle() {
  return (
    <button className="btn btn-ghost filter-toggle" type="button"
      onClick={(e) => {
        const open = document.getElementById("filters")?.classList.toggle("open");
        e.currentTarget.setAttribute("aria-expanded", String(!!open));
      }}
      aria-controls="filters" aria-expanded="false">
      Filters
    </button>
  );
}
