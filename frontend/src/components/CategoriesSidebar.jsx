import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export default function CategoriesSidebar({ tree = [] }) {
  const top = useMemo(() => tree.slice(0, 12), [tree]);
  if (!top.length) return null;

  return (
    <aside className="hidden lg:block">
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-700">Danh mục</div>
        <ul className="space-y-1">
          {top.map((c) => (
            <li key={c._id}>
              <Link
                className="block rounded-lg px-3 py-2 text-sm hover:bg-pink-50 hover:text-slate-900"
                to={`/products?${new URLSearchParams({ categorySlug: c.slug })}`}
                title={c.name}
              >
                {c.name}
              </Link>
              {Array.isArray(c.children) && c.children.length > 0 && (
                <div className="ml-3 mt-1 grid grid-cols-2 gap-1">
                  {c.children.slice(0, 6).map((s) => (
                    <Link
                      key={s._id}
                      className="truncate rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-pink-50 hover:text-slate-900"
                      to={`/products?${new URLSearchParams({ categorySlug: s.slug })}`}
                      title={s.name}
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
