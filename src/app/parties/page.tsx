"use client";

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { PartyCard } from "@/components/PartyCard";
import { ThemeSearch } from "@/components/ThemeSearch";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getParties } from "@/lib/api/party";
import { PageLoading } from "@/components/PageLoading";
import { LoginMemberContext } from "@/stores/auth/loginMember";
import client from "@/lib/backend/client";

// API에서 받는 모임 데이터 타입
interface PartyMainResponse {
  themeId?: number;
  themeName?: string;
  themeThumbnailUrl?: string;
  storeId?: number;
  storeName?: string;
  id?: number;
  partyId?: number;
  title?: string;
  scheduledAt?: string;
  acceptedParticipantCount?: number;
  totalParticipants?: number;
}

// API에서 받는 응답 형태
interface SuccessResponseSliceDtoPartySummaryResponse {
  message?: string;
  data?: {
    content?: PartyMainResponse[];
    hasNext?: boolean;
  };
}

export default function PartiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLogin } = useContext(LoginMemberContext);
  const [parties, setParties] = useState<PartyMainResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const ITEMS_PER_PAGE = 30;

  // URL 파라미터에서 테마 정보를 읽어와서 초기 검색어 설정
  useEffect(() => {
    const themeName = searchParams.get('themeName');
    if (themeName) {
      setSearchKeyword(themeName);
    }
  }, [searchParams]);

  // 마지막 요소 관찰을 위한 ref callback
  const lastPartyElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadParties(false);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // 모임 데이터 로드
  const loadParties = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    try {
      if (reset) {
        setParties([]);
        setHasMore(true);
      }

      const lastParty = parties[parties.length - 1];
      const lastId = reset ? undefined : lastParty?.partyId;

      const searchCondition = {
        keyword: searchKeyword,
        regionIds: filterRegion ? [parseInt(filterRegion)] : undefined,
        themeId: searchParams.get('themeId') ? parseInt(searchParams.get('themeId')!) : undefined,
      };

      const response = await client.POST("/api/v1/parties/search", {
        params: {
          query: {
            lastId: lastId,
            size: ITEMS_PER_PAGE
          }
        },
        body: searchCondition
      });

      if (response?.data?.data) {
        const newParties = response.data.data.content || [];
        const hasNext = response.data.data.hasNext || false;
        
        // 새로운 데이터가 없거나 기존 데이터와 동일한 경우 hasMore를 false로 설정
        if (newParties.length === 0 || (newParties[0]?.partyId === lastId)) {
          setHasMore(false);
        } else {
          setHasMore(hasNext);
        }
        
        setParties(prev => reset ? newParties : [...prev, ...newParties]);
        
        console.log("파티 데이터 로드 완료:", newParties);
        console.log("다음 페이지 존재 여부:", hasNext);
      }
    } catch (error) {
      console.error("모임 데이터 로드 중 오류 발생:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadParties(true);
  }, []);

  // 더미 데이터 생성 함수
  const generateDummyParties = () => {
    return Array(8).fill(0).map((_, index) => ({
      id: index + 1,
      partyId: index + 1,
      title: `방탈출 모임 ${index + 1}`,
      themeName: ["좀비 연구소", "비밀의 방", "사망 이스케이프", "유령의 저택"][index % 4],
      themeThumbnailUrl: index % 2 === 0
        ? "https://i.postimg.cc/PJNVr12v/theme.jpg"
        : "https://i.postimages.org/PJNVr12v/theme.jpg",
      storeName: ["이스케이프 홍대점", "솔버 강남점", "마스터키 명동점", "키이스케이프 건대점"][index % 4],
      scheduledAt: new Date(Date.now() + (index % 3) * 2 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedParticipantCount: Math.floor(Math.random() * 3) + 2,
      totalParticipants: 6
    }));
  };

  // 검색 처리
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    loadParties(true); // 검색어가 변경되면 데이터 리셋 후 다시 로드
  };

  // 필터 처리
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "region") {
      setFilterRegion(value);
      loadParties(true); // 필터가 변경되면 데이터 리셋 후 다시 로드
    }
  };

  // 카드 클릭 처리
  const handleCardClick = (party: PartyMainResponse) => {
    console.log("이동할 모임:", party);
    if (party && (party.id || party.partyId)) {
      // id 또는 partyId 중 존재하는 값 사용
      const partyId = party.id || party.partyId;
      router.push(`/parties/${partyId}`);
    } else {
      console.error("모임의 ID가 없습니다", party);
    }
  };

  // 스켈레톤 카드 렌더링 함수
  const renderSkeletonCards = () => {
    return Array(8)
      .fill(0)
      .map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer h-[450px] flex flex-col"
        >
          {/* 이미지 섹션 */}
          <div className="relative h-[220px] bg-gray-200 animate-pulse"></div>

          {/* 내용 섹션 */}
          <div className="p-5 flex flex-col h-full">
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="mt-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="mt-auto">
              <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ));
  };

  const renderPartyCard = (party: PartyMainResponse, index: number) => {
    // 이미지 URL 처리 함수
    const getImageUrl = (url?: string) => {
      if (!url) return "https://i.postimg.cc/PJNVr12v/theme.jpg";

      // 내부 경로인 경우 그대로 사용
      if (url.startsWith("/")) {
        return url;
      }

      // 외부 이미지 URL은 그대로 사용
      return url;
    };

    // PartyCard 컴포넌트에 필요한 데이터 구조로 변환
    const cardData = {
      id: (party.id || party.partyId)?.toString() || "",
      image: getImageUrl(party.themeThumbnailUrl),
      title: party.title || "제목 없음",
      category: "모임",
      date: party.scheduledAt
        ? new Date(party.scheduledAt).toLocaleDateString()
        : "날짜 정보 없음",
      location: party.storeName || "위치 정보 없음",
      participants: `${party.acceptedParticipantCount || 0}/${
        party.totalParticipants || 0
      }`,
      tags: party.themeName ? [party.themeName] : ["테마 정보 없음"],
      host: {
        name: "모임장",
        image: "/profile_man.jpg",
      },
    };

    return (
      <div
        key={`party-${party.id || party.partyId}-${index}`}
        onClick={() => handleCardClick(party)}
        className="cursor-pointer"
      >
        <PartyCard room={cardData} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">모임 목록</h1>
          {isLogin && (
            <Link
              href="/parties/create"
              className="bg-black text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition"
            >
              모임 만들기
            </Link>
          )}
        </div>

        {/* 검색 및 필터 섹션 */}
        <ThemeSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />

        {initialLoading ? (
          <PageLoading />
        ) : (
          <div className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {parties.map((party, index) => (
                <div
                  key={`party-${party.id || party.partyId}-${index}`}
                  ref={index === parties.length - 1 ? lastPartyElementRef : undefined}
                >
                  {renderPartyCard(party, index)}
                </div>
              ))}
              {loading && renderSkeletonCards()}
            </div>
            {parties.length === 0 && !loading && (
              <div className="w-full my-12">
                <div className="bg-gray-50 border border-gray-300 rounded-xl py-24 px-8 text-center">
                  <p className="text-lg font-medium text-gray-400">
                    등록된 모임이 없습니다
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
