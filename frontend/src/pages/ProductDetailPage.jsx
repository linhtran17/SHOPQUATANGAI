import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import productService from '../services/productService';  // Default import

import ProductDetail from '../features/product/ProductDetail';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.detail(id);  // Gọi API từ productService
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    fetchProduct();
  }, [id]);

  return (
    <div>
      <h1>Product Details</h1>
      {product ? (
        <ProductDetail product={product} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ProductDetailPage;  // Default export
