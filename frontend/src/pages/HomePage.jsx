import React, { useEffect, useMemo, useState } from "react";
import productApi from "../services/productService";  // Default import
import { categoryApi } from "../services/categoryService";
import ProductCard from "../components/ProductCard";
import BannerPage from "../components/BannerPage";
import CategoriesRail from "../components/CategoriesRail";

export default function Home() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    productApi.list({ sort: "moiNhat", limit: 12 }).then(r => setItems(r.items));
    categoryApi.tree({ active: true }).then(setCats).catch(() => setCats([]));
  }, []);

  const flatCats = useMemo(() => {
    const out = [];
    const walk = (a) => a.forEach(x => { out.push(x); x.children?.length && walk(x.children); });
    walk(cats || []);
    return out.slice(0, 24);
  }, [cats]);

  return (
    <>
      <BannerPage />
      <CategoriesRail items={flatCats} />
      <section className="mt-6">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900">
          Sản phẩm mới nhất
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 sm:gap-5">
          {items.map(p => <ProductCard key={p._id} p={p} />)}
        </div>
      </section>
    </>
  );
}
