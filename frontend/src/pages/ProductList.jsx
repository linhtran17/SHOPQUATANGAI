import React, { useEffect, useState, useMemo } from "react";
import productApi from "../services/productService";  // Default import
import { categoryApi } from "../services/categoryService";
import ProductCard from "../components/ProductCard";

export default function ProductList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    productApi.list({ sort: "moiNhat", limit: 12 }).then(r => setItems(r.items));
    categoryApi.tree({ active: true }).then(setCats).catch(() => setCats([]));
  }, []);

  return (
    <div>
      {items.map(p => (
        <ProductCard key={p._id} p={p} />
      ))}
    </div>
  );
}
