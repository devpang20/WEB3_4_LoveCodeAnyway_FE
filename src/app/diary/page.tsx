"use client";

import { useState, useEffect } from "react";
import { DiarySearch } from "@/components/DiarySearch";
import { useInView } from "react-intersection-observer";
import axios from "axios";

// 기본 다이어리 인터페이스
interface Diary {
  id: number;
  title: string;
  date: string;
  success: boolean;
  theme: string;
  location: string;
  participants: string[];
  content: string;
}

// API 응답 타입 정의
interface DiaryApiResponse {
  id: number;
  title: string;
  playDate: string;
  isSuccess: boolean;
  themeName: string;
  storeName: string;
  participants: string[];
  content: string;
}

// 페이지네이션 응답 타입
interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: any;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// API 응답 전체 타입
interface ApiResponse {
  message?: string;
  data?: PageResponse<DiaryApiResponse>;
}

// 필터 값 인터페이스
interface FilterValues {
  success: boolean | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
}

export default function DiaryPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    success: null,
    dateRange: null,
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [diaries, setDiaries] = useState<Diary[]>([]);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  // 기본 베이스 URL 설정
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://api.ddobang.site";

  // API 응답을 Diary 형식으로 변환하는 함수
  const convertApiToDiary = (apiDiary: DiaryApiResponse): Diary => {
    return {
      id: apiDiary.id,
      title: apiDiary.title,
      date: apiDiary.playDate,
      success: apiDiary.isSuccess,
      theme: apiDiary.themeName,
      location: apiDiary.storeName,
      participants: apiDiary.participants || [],
      content: apiDiary.content || "",
    };
  };

  const loadMoreDiaries = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      // API 요청 파라미터
      const requestData = {
        page: page,
        size: 12,
        keyword: searchKeyword || undefined,
        isSuccess: activeFilters.success !== null ? activeFilters.success : undefined,
        startDate: activeFilters.dateRange?.start || undefined,
        endDate: activeFilters.dateRange?.end || undefined,
      };

      // API 호출
      const response = await axios.post<ApiResponse>(
        `${baseUrl}/api/v1/diaries/list`,
        requestData
      );

      if (response.data.data) {
        const apiDiaries = response.data.data.content || [];

        if (apiDiaries.length === 0) {
          setHasMore(false);
        } else {
          const newDiaries = apiDiaries.map(convertApiToDiary);
          setDiaries((prev) => [...prev, ...newDiaries]);
          setPage((prev) => prev + 1);
          setHasMore(!response.data.data.last);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading diaries:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (diaries.length === 0 && hasMore) {
      loadMoreDiaries();
    }
  }, [diaries.length]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreDiaries();
    }
  }, [inView]);

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setDiaries([]);
    setPage(0);
    setHasMore(true);
    setTimeout(loadMoreDiaries, 0);
  };

  const handleFilterApply = (filters: FilterValues) => {
    setActiveFilters(filters);
    setDiaries([]);
    setPage(0);
    setHasMore(true);
    setTimeout(loadMoreDiaries, 0);
  };

  // 필터 초기화 함수
  const resetAllFilters = () => {
    setSearchKeyword("");
    setActiveFilters({
      success: null,
      dateRange: null,
    });
    setDiaries([]);
    setPage(0);
    setHasMore(true);
    setTimeout(loadMoreDiaries, 0);
  };

  // 특정 필터 제거 함수
  const removeFilter = (filterType: 'keyword' | 'success' | 'date') => {
    switch (filterType) {
      case 'keyword':
        setSearchKeyword("");
        break;
      case 'success':
        setActiveFilters(prev => ({ ...prev, success: null }));
        break;
      case 'date':
        setActiveFilters(prev => ({ ...prev, dateRange: null }));
        break;
    }
    setDiaries([]);
    setPage(0);
    setHasMore(true);
    setTimeout(loadMoreDiaries, 0);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">다이어리</h1>

        <div className="mb-8">
          <DiarySearch
            onSearch={handleSearch}
            searchTerm={searchKeyword}
            onSearchTermChange={setSearchKeyword}
            isFilterModalOpen={isFilterOpen}
            onFilterModalOpenChange={setIsFilterOpen}
            currentFilters={activeFilters}
            onFilterApply={handleFilterApply}
          />
        </div>

        {/* 활성화된 필터 표시 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {searchKeyword && (
            <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
              <span>검색어: {searchKeyword}</span>
              <button
                onClick={() => removeFilter('keyword')}
                className="ml-1.5 hover:text-gray-600"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          {activeFilters.success !== null && (
            <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
              <span>성공 여부: {activeFilters.success ? "성공" : "실패"}</span>
              <button
                onClick={() => removeFilter('success')}
                className="ml-1.5 hover:text-gray-600"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          {activeFilters.dateRange && (
            <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
              <span>날짜: {activeFilters.dateRange.start} ~ {activeFilters.dateRange.end}</span>
              <button
                onClick={() => removeFilter('date')}
                className="ml-1.5 hover:text-gray-600"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          {(searchKeyword || activeFilters.success !== null || activeFilters.dateRange) && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs hover:bg-gray-300"
            >
              필터 초기화
            </button>
          )}
        </div>

        <div className="space-y-4">
          {diaries.map((diary) => (
            <div
              key={diary.id}
              className="bg-white rounded-lg shadow-sm p-5 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-lg font-bold">{diary.title}</h2>
                  <p className="text-sm text-gray-500">{diary.date}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs ${
                    diary.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {diary.success ? "성공" : "실패"}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-gray-600 text-sm">{diary.content}</p>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                <span>{diary.theme}</span>
                <span>•</span>
                <span>{diary.location}</span>
                <span>•</span>
                <span>{diary.participants.join(", ")}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}

          {!hasMore && diaries.length > 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              더 이상의 다이어리가 없습니다.
            </div>
          )}

          {diaries.length === 0 && !loading && (
            <div className="text-center py-8 text-sm text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}

          <div ref={ref} className="h-8" />
        </div>
      </div>
    </div>
  );
}
