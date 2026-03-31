"use client";

import PageButton from "@/components/button/PageButton";
import { getProducts } from "@/lib/api/products";
import { useSearchOptionStore } from "@/stores/searchOptionStore";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import ProductItem from "./ProductItem";
import ProductSort from "./ProductSort";

const ITEMS_PER_PAGE = 16;

const ProductList = () => {
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [sorted, setSorted] = useState("highRating"); // 정렬 옵션
  const { searchOption } = useSearchOptionStore();
  const params = useSearchParams();
  const search = params.get("search");

  const searchToUse = search ? search : "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", { page: currentPage, sort: sorted, ...searchOption, search: searchToUse }],
    queryFn: () =>
      getProducts({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        sort: sorted as any,
        ...searchOption,
        search: searchToUse,
      }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <div className="py-20 text-center text-xl font-bold">📡 상품 목록을 불러오는 중입니다...</div>;
  if (isError) return (
    <div className="py-20 text-center text-red-500 border-2 border-red-500 rounded-lg">
      <h3 className="text-2xl font-extrabold mb-4">❌ API 호출 에러 발생!</h3>
      <p className="mb-2">에러 내용: {(error as any)?.message || "알 수 없는 오류"}</p>
      <p className="text-sm">URL: http://localhost:8000/api/products</p>
      <p className="text-xs mt-4">CORS나 서버 연결 상태를 확인해주세요.</p>
    </div>
  );
  if (!data || data.list.length === 0) return <div className="py-20 text-center text-gray-500">🔍 검색 결과가 없습니다.</div>;

  const onSorted = (sort: string) => {
    setSorted(sort);
    setCurrentPage(1);
  };

  return (
    <>
      <ProductSort
        sorted={sorted}
        onClick={onSorted}
      />
      <div className="mt-15 mb-20 grid grid-cols-4 gap-x-5 gap-y-15">
        {data?.list.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            store
          />
        ))}
      </div>
      <PageButton
        total={data?.totalCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </>
  );
};

export default ProductList;
