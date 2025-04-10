"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Navigation } from "@/components/Navigation";
import { PartyCard } from "@/components/PartyCard";
import { ThemeSearch } from "@/components/ThemeSearch";
import { EscapeRoom } from "@/types/EscapeRoom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

// API에서 받는 모임 데이터 타입
interface PartyMainResponse {
  themeId?: number;
  themeName?: string;
  themeThumbnailUrl?: string;
  storeId?: number;
  storeName?: string;
  id?: number;
  title?: string;
  scheduledAt?: string;
  acceptedParticipantCount?: number;
  totalParticipants?: number;
}

// 페이지 응답 구조
interface PageResponse<T> {
  content: T[];
  pageable?: any;
  totalPages?: number;
  totalElements?: number;
  last?: boolean;
  size?: number;
  number?: number;
  sort?: any;
  numberOfElements?: number;
  first?: boolean;
  empty?: boolean;
}

// API에서 받는 응답 형태
interface SuccessResponseListPartyMainResponse {
  message?: string;
  data?: PartyMainResponse[] | PageResponse<PartyMainResponse>;
}

export default function PartiesPage() {
  const router = useRouter();
  const [parties, setParties] = useState<EscapeRoom[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const { ref, inView } = useInView();

  // 기본 베이스 URL 설정
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://api.ddobang.site";

  // API에서 받은 데이터를 EscapeRoom 형식으로 변환하는 함수
  const convertToEscapeRoom = (partyData: PartyMainResponse): EscapeRoom => {
    // scheduledAt이 있으면 날짜 포맷 변환
    const formattedDate = partyData.scheduledAt
      ? new Date(partyData.scheduledAt)
          .toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replace(/\. /g, ".")
          .replace(",", " ")
      : "";

    return {
      id: partyData.id?.toString(),
      title: partyData.title || "제목 없음",
      category: partyData.themeName || "",
      date: formattedDate,
      location: partyData.storeName || "",
      participants: `${partyData.acceptedParticipantCount || 0}/${
        partyData.totalParticipants || 0
      }명`,
      image: partyData.themeThumbnailUrl || "",
      host: {
        name: "모임장",
        image: "/profile_man.jpg",
      },
    };
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadParties();
  }, []);

  // 무한 스크롤
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreParties();
    }
  }, [inView, hasMore, loading]);

  // API에서 모임 데이터 로드
  const loadParties = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // API 요청
      const response = await axios.post<SuccessResponseListPartyMainResponse>(
        `${baseUrl}/api/v1/parties/search`,
        {
          keyword: searchKeyword,
          region: filterRegion,
        }
      );

      // 응답 데이터 구조 확인
      console.log("API 응답:", response.data);

      // 데이터가 있는지 확인하고 형식에 맞게 처리
      if (response.data.data) {
        let partyData: PartyMainResponse[] = [];

        // 데이터 타입에 따라 처리
        if (Array.isArray(response.data.data)) {
          // 배열 형태
          partyData = response.data.data;
        } else if (
          "content" in response.data.data &&
          Array.isArray(response.data.data.content)
        ) {
          // 페이지 형태
          partyData = response.data.data.content;

          // 페이지네이션 정보가 있으면 hasMore 설정
          if ("last" in response.data.data) {
            setHasMore(!response.data.data.last);
          }
        } else {
          console.error("예상치 못한 응답 구조:", response.data.data);
          setParties([]);
          setHasMore(false);
          return;
        }

        // 빈 데이터 처리
        if (partyData.length === 0) {
          setParties([]);
          setHasMore(false);
          return;
        }

        // API 응답 데이터를 EscapeRoom 형식으로 변환
        const convertedData = partyData.map(convertToEscapeRoom);

        // 중복 ID 제거 (무한 스크롤에서 중요)
        const uniqueParties = Array.from(
          new Map(convertedData.map((item) => [item.id, item])).values()
        );

        setParties(uniqueParties);
      } else {
        setParties([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("모임 데이터 로드 중 오류:", error);
      setParties([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // 무한 스크롤을 위한 더 많은 모임 로드 (실제로는 해당 API가 없으므로 mock)
  const loadMoreParties = async () => {
    // 기본 API는 pagination을 지원하지 않으므로 현재는 추가 로드 없음
    setHasMore(false);
  };

  // 검색 처리
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setParties([]);
    setPage(1);
    loadParties(); // 검색어가 API 요청에 포함되므로 바로 API 호출
  };

  // 필터 처리
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "region") {
      setFilterRegion(value);
      setParties([]);
      setPage(1);
      loadParties(); // 필터가 API 요청에 포함되므로 바로 API 호출
    }
  };

  // 카드 클릭 처리
  const handleCardClick = (room: EscapeRoom) => {
    router.push(`/parties/${room.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* 검색 및 필터 섹션 */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[40px]">
            <ThemeSearch
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
            />
          </div>
          <div className="w-[90px] h-[40px]">
            <Link
              href="/parties/create"
              className="w-full h-full flex items-center justify-center px-3 bg-[#FFB130] text-white text-sm rounded-lg hover:bg-[#F0A420]"
            >
              모임 등록
            </Link>
          </div>
        </div>
      </div>

      {/* 모임 목록 섹션 */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* 모임 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((room) => (
            <PartyCard key={room.id} room={room} onClick={handleCardClick} />
          ))}
        </div>

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        )}

        {/* 무한 스크롤 감지용 div */}
        {hasMore && <div ref={ref} className="h-10" />}

        {/* 데이터 없음 메시지 */}
        {parties.length === 0 && !loading && (
          <div className="w-full my-12">
            <div className="bg-gray-50 border border-gray-300 rounded-xl py-24 px-8 text-center">
              <p className="text-lg font-medium text-gray-700">
                데이터가 없습니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
