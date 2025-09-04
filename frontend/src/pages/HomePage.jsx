import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import productApi from "../services/productService";
import { categoryApi } from "../services/categoryService";
import ProductCard from "../components/ProductCard";
import BannerPage from "../components/BannerPage";
import CategoriesRail from "../components/CategoriesRail";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const { search } = useLocation();

  const params = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);

  useEffect(() => {
    categoryApi.tree({ active: true }).then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    const query = {
      q: params.q || undefined,
      categorySlug: params.categorySlug || params.cat || undefined,
      sort: params.sort || "moiNhat",
      page: Number(params.page || 1),
      limit: Number(params.limit || 12),
      min: params.min || undefined,
      max: params.max || undefined,
    };
    productApi.list(query).then((r) => setItems(r.items || [])).catch(() => setItems([]));
  }, [params]);

  const flatCats = useMemo(() => {
    const out = [];
    const walk = (arr = []) => arr.forEach(x => { out.push(x); x.children?.length && walk(x.children); });
    walk(cats || []);
    return out.slice(0, 24);
  }, [cats]);

  return (
    <>
      <BannerPage />
      <CategoriesRail items={flatCats} />
      <section className="mt-6">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900">Sản phẩm</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 sm:gap-5">
          {items.map(p => <ProductCard key={p._id} p={p} />)}
        </div>
      </section>
    </>
  );
}
