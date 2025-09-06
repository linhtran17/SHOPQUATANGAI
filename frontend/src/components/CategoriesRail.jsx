import React from "react";
import { Link } from "react-router-dom";

export default function CategoriesRail({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {items.map((c) => (
          <Link
            key={c._id}
            to={`/products?${new URLSearchParams({ categorySlug: c.slug })}`}
            className="whitespace-nowrap rounded-full border px-3 py-1.5 text-sm text-slate-700 hover:bg-pink-50 hover:text-slate-900"
            title={c.name}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
