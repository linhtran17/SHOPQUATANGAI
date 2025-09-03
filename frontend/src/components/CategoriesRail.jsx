import React from "react";
import { Link } from "react-router-dom";

export default function CategoriesRail({ items=[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {items.map(c => (
          <Link
            key={c._id}
            to={`/products?${new URLSearchParams({ categorySlug: c.slug })}`}
            className="chip whitespace-nowrap hover:border-pink-600"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
