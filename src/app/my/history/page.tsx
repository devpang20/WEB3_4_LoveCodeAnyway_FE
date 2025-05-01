"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGlobalLoginMember } from "@/stores/auth/loginMember";
import client from "@/lib/backend/client";
import PartyReviewModal from "@/components/PartyReviewModal";
import { KakaoMap } from "@/components/KakaoMap";


// 모임 타입 정의
type PartyType = {
  id: number;
  title: string;
  themeThumbnailUrl: string;
  themeTitle: string;
  role: "HOST" | "MEMBER";
  participantsNeeded: number;
  totalParticipants: number;
  dateTime: string;
  location: string;
  reviewStatus: "WRITABLE" | "COMPLETED" | "NOT_WRITABLE";
  status: "RECRUITING" | "FULL" | "PENDING" | "COMPLETED" | "CANCELLED";
  reviewed: boolean;
  themeId: number;
};

// API 응답 타입 정의
type PartyResponse = {
  partyId: number;
  title: string;
  scheduledAt: string;
  acceptedParticipantsCount: number;
  totalParticipants: number;
  rookieAvailable: boolean;
  storeName: string;
  themeId: number;
  themeName: string;
  themeThumbnailUrl: string;
  hostId: number;
  hostNickname: string;
  hostProfilePictureUrl: string;
  status: string;
  reviewed: boolean;
};

type ApiResponse = {
  message: string | null;
  data: {
    currentPageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    items: PartyResponse[];
  };
};

export default function HistoryPage() {
  const router = useRouter();
  const { loginMember, isLogin } = useGlobalLoginMember();
  // 상태 관리
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "WRITABLE" | "COMPLETED" | "NOT_WRITABLE"
  >("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "HOST" | "MEMBER">(
    "ALL"
  );
  const [allParties, setAllParties] = useState<PartyType[]>([]);
  const [filteredParties, setFilteredParties] = useState<PartyType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMapParty, setSelectedMapParty] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [selectedThemeDetail, setSelectedThemeDetail] = useState<any>(null);

  // 모임 데이터 가져오기
  useEffect(() => {
    if (!isLogin || !loginMember?.id) {
      setError('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 전체 데이터를 한 번에 가져오기
    client.GET('/api/v1/parties/joins/me', {
      params: {
        path: {
          id: loginMember.id
        },
        query: {
          page: 0,
          size: 100 // 충분히 큰 수를 지정하여 모든 데이터를 가져옴
        }
      }
    })
      .then((response) => {
        console.log('API 응답 데이터:', response);

        if (!response.data?.data?.items) {
          setError('데이터를 불러오는데 실패했습니다.');
          setIsLoading(false);
          return;
        }

        // API 응답 데이터를 PartyType으로 변환
        const partiesData: PartyType[] = response.data.data.items.map(item => {
          const id = item.partyId || 0;
          const title = item.title || '';
          const dateTime = item.scheduledAt || new Date().toISOString();
          const location = item.storeName || '';
          const totalParticipants = item.totalParticipants || 0;
          const acceptedParticipants = item.acceptedParticipantsCount || 0;
          const themeThumbnailUrl = item.themeThumbnailUrl || '';
          const themeTitle = item.themeName || '';

          return {
            id,
            title,
            dateTime,
            location,
            participantsNeeded: Math.max(0, totalParticipants - acceptedParticipants),
            totalParticipants,
            themeThumbnailUrl,
            themeTitle,
            role: item.hostId === loginMember.id ? "HOST" : "MEMBER",
            reviewStatus: item.reviewed ? "COMPLETED" : "WRITABLE",
            status: item.status,
            reviewed: item.reviewed,
            themeId: item.themeId
          };
        });

        setAllParties(partiesData);
        setIsLoading(false);
      })
      .catch((error: Error) => {
        console.error('API 요청 에러:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      });
  }, [isLogin, loginMember?.id]);

  // 필터링 로직
  useEffect(() => {
    if (allParties.length === 0) return;

    let filteredData = [...allParties];

    // 날짜 기준으로 분류
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (activeTab === "upcoming") {
      filteredData = filteredData.filter((party) => {
        const partyDate = new Date(party.dateTime);
        return partyDate >= now;
      });
    } else {
      filteredData = filteredData.filter((party) => {
        const partyDate = new Date(party.dateTime);
        return partyDate < now;
      });
    }

    // 리뷰 상태 필터
    if (statusFilter !== "ALL") {
      filteredData = filteredData.filter(
        (party) => party.reviewStatus === statusFilter
      );
    }

    // 역할 필터
    if (roleFilter !== "ALL") {
      filteredData = filteredData.filter(
        (party) => party.role === roleFilter
      );
    }

    setFilteredParties(filteredData);
    setCurrentPage(1); // 필터가 변경될 때마다 첫 페이지로 리셋
  }, [allParties, activeTab, statusFilter, roleFilter]);

  // 마감 임박 모임 필터링
  const getDeadlineParties = () => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    return allParties.filter(party => {
      const partyDate = new Date(party.dateTime);
      return partyDate >= now && partyDate <= threeDaysLater;
    }).slice(0, 3); // 최대 3개만 표시
  };

  // 현재 페이지의 파티 목록 계산
  const getCurrentPageParties = () => {
    const itemsPerPage = 5;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredParties.slice(startIndex, endIndex);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredParties.length / 5);

  // 필터 초기화
  const resetFilters = () => {
    setActiveTab("upcoming");
    setStatusFilter("ALL");
    setRoleFilter("ALL");
  };

  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

    return `${year}.${month}.${day} (${dayOfWeek}) ${hours}:${minutes}`;
  };

  // 이미지 URL 처리 함수
  const getImageUrl = (url: string, partyId: number) => {
    // 5개의 이미지를 번갈아가며 표시
    const imageUrls = [
      "https://i.postimg.cc/rs2bByH8/interior-2505229-640.jpg",
      "https://i.postimg.cc/7hL7Y0dX/interior-2505229-640.jpg",
      "https://i.postimg.cc/fT3s132T/image.jpg",
      "https://i.postimg.cc/bJHXqpxr/image.jpg",
      "https://naverbooking-phinf.pstatic.net/20230612_144/1686513263098ppWzR_JPEG/%C7%EF%B8%AE%C4%DF%C5%CD_%B4%BA_%C6%F7%BD%BA%C5%CD.jpg",
    ];

    // 모임 ID를 기준으로 이미지 선택
    return imageUrls[partyId % 5];
  };

  // 모달 열기 함수
  const openModal = (partyId: number) => {
    setSelectedPartyId(partyId);
    setIsModalOpen(true);
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPartyId(null);
    // 페이지 새로고침
    window.location.reload();
  };

  // 리뷰 버튼 표시 여부 및 스타일 결정 함수
  const getReviewButton = (party: PartyType) => {
    const now = new Date();
    const partyDate = new Date(party.dateTime);

    if (partyDate > now) {
      // 예정된 모임인 경우 버튼 없음
      return null;
    } else if (!party.reviewed) {
      // 리뷰 작성 가능한 경우
      return (
        <button
          onClick={() => openModal(party.id)}
          className="px-6 py-2 bg-[#FFB130] text-white text-sm rounded hover:bg-[#FFA000] transition-colors"
        >
          리뷰 작성
        </button>
      );
    } else {
      // 리뷰 작성 완료된 경우
      return (
        <button className="px-6 py-2 bg-gray-700 text-gray-300 text-sm rounded cursor-default">
          작성완료
        </button>
      );
    }
  };

  // 상태에 따른 뱃지 스타일 반환 함수
  const getStatusBadgeStyle = (status: PartyType["status"]) => {
    switch (status) {
      case "RECRUITING":
        return "bg-green-600 text-white";
      case "FULL":
        return "bg-blue-600 text-white";
      case "PENDING":
        return "bg-yellow-600 text-white";
      case "COMPLETED":
        return "bg-purple-600 text-white";
      case "CANCELLED":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  // 상태 텍스트 반환 함수
  const getStatusText = (status: PartyType["status"]) => {
    switch (status) {
      case "RECRUITING":
        return "모집중";
      case "FULL":
        return "정원마감";
      case "PENDING":
        return "모집마감";
      case "COMPLETED":
        return "진행완료";
      case "CANCELLED":
        return "취소됨";
      default:
        return status;
    }
  };

  // 테마 상세 정보 가져오기
  const fetchThemeDetail = async (themeId: number) => {
    try {
      const response = await client.GET(`/api/v1/themes/${themeId}`, {
        params: {
          path: {
            id: themeId
          }
        }
      });

      if (response?.data?.data) {
        setSelectedThemeDetail(response.data.data);
      }
    } catch (err) {
      console.error("테마 상세 정보 가져오기 오류:", err);
    }
  };

  // 지도 토글 시 테마 정보도 함께 가져오기
  const toggleMap = async (partyId: number) => {
    const party = allParties.find(p => p.id === partyId);
    if (selectedMapParty === partyId) {
      setSelectedMapParty(null);
      setSelectedThemeDetail(null);
    } else {
      setSelectedMapParty(partyId);
      if (party && party.themeId) {
        await fetchThemeDetail(party.themeId);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 마감 임박 모임 섹션 추가 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-100 mb-4">
            마감 임박 모임
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 마감 임박 모임 카드 */}
            {getDeadlineParties().map((party) => (
              <div
                key={`deadline-${party.id}`}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={getImageUrl(party.themeThumbnailUrl, party.id)}
                    alt={party.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover opacity-80"
                    unoptimized
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <h3 className="text-white font-bold text-lg">
                      {party.title}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-200 text-sm">
                        {party.themeTitle}
                      </span>
                      <span className="bg-[#FFB130] text-white text-xs px-2 py-1 rounded-full">
                        D-
                        {Math.floor(
                          (new Date(party.dateTime).getTime() -
                            new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center text-gray-300 text-sm mb-2">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{party.location}</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        {new Date(party.dateTime).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-300">
                      인원: {party.participantsNeeded} /{" "}
                      {party.totalParticipants}명
                    </div>
                    <Link
                      href={`/parties/${party.id}`}
                      className="px-3 py-1 bg-[#FFB130] text-white text-xs rounded hover:bg-[#FFA000] transition-colors"
                    >
                      모임 정보
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 상단 - 타이틀 + 필터 영역 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-100">
              나의 모임 히스토리
            </h1>
            <Link
              href="/parties/new"
              className="bg-[#FFB230] text-white px-4 py-2 text-sm font-medium rounded-md"
            >
              모임 만들기
            </Link>
          </div>

          {/* 탭 필터 */}
          <div className="flex mb-4 border-b border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === "upcoming"
                ? "text-[#FFB230] border-b-2 border-[#FFB230]"
                : "text-gray-400 hover:text-gray-200"
                }`}
              onClick={() => setActiveTab("upcoming")}
            >
              예정된 모임
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === "past"
                ? "text-[#FFB230] border-b-2 border-[#FFB230]"
                : "text-gray-400 hover:text-gray-200"
                }`}
              onClick={() => setActiveTab("past")}
            >
              지난 모임
            </button>
          </div>

          {/* 세부 필터 */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300">
                  리뷰 상태:
                </label>
                <select
                  className="rounded-md bg-gray-800 border-gray-700 text-gray-200 shadow-sm px-3 py-1.5 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">전체</option>
                  <option value="WRITABLE">작성 가능</option>
                  <option value="COMPLETED">작성 완료</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300">
                  내 역할:
                </label>
                <select
                  className="rounded-md bg-gray-800 border-gray-700 text-gray-200 shadow-sm px-3 py-1.5 text-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                >
                  <option value="ALL">전체</option>
                  <option value="HOST">모임장</option>
                  <option value="MEMBER">모임원</option>
                </select>
              </div>
            </div>
            <button
              className="text-sm text-gray-400 hover:text-gray-200"
              onClick={resetFilters}
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 중단 - 카드 리스트 영역 */}
        {isLoading ? (
          <div className="flex justify-center py-12 text-gray-300">
            <p>모임 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900 text-red-200 p-4 rounded-md">{error}</div>
        ) : filteredParties.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>조건에 맞는 모임이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {getCurrentPageParties().map((party) => (
                <div
                  key={party.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${party.role === "HOST"
                          ? "bg-blue-900 text-blue-200"
                          : "bg-gray-700 text-gray-300"
                          }`}
                      >
                        {party.role === "HOST" ? "모임장" : "모임원"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeStyle(party.status)}`}
                      >
                        {getStatusText(party.status)}
                      </span>
                    </div>
                    <div>{getReviewButton(party)}</div>
                  </div>
                  <div className="flex mt-3 gap-4">
                    {party.themeThumbnailUrl ? (
                      <div className="w-24 h-24 bg-gray-700 rounded overflow-hidden relative flex-shrink-0">
                        <Image
                          src={getImageUrl(party.themeThumbnailUrl, party.id)}
                          alt={party.title}
                          fill
                          sizes="(max-width: 96px) 100vw, 96px"
                          className="object-cover opacity-90"
                          unoptimized
                          onError={(e) => {
                            const fallbackImage =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzMzMzMzMyIvPjxwYXRoIGQ9Ik00NSA0NUgzMFY3NUg5MFY0NUg3NVYzMEg0NVY0NVpNNzUgOTBIMzBWNzVIOTBWNDVINzVWOTBaIiBmaWxsPSIjNjY2NjY2Ii8+PC9zdmc+";
                            (e.target as HTMLImageElement).src = fallbackImage;
                            (e.target as HTMLImageElement).onerror = null;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold mb-1 text-gray-100">
                        {party.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>{formatDate(party.dateTime)}</p>
                        <p>테마: {party.themeTitle}</p>
                        <div className="flex items-center">
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            장소: {party.location}
                          </p>
                          <button
                            className="ml-2 text-sm text-[#FFB130] hover:text-[#FFA000] flex items-center"
                            onClick={() => toggleMap(party.id)}
                          >
                            {selectedMapParty === party.id
                              ? "지도 닫기"
                              : "지도 보기"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-300">
                            인원: {party.participantsNeeded} /{" "}
                            {party.totalParticipants}명
                          </p>
                          <Link
                            href={`/parties/${party.id}`}
                            className="px-4 py-2 bg-gray-700 text-gray-200 text-xs rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            모임 정보
                          </Link>
                          
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 지도 이미지 영역 */}
                  {selectedMapParty === party.id && (
                    <div className="mt-4 w-full h-64 bg-gray-700 rounded-lg overflow-hidden relative">
                      <KakaoMap
                        address={selectedThemeDetail?.storeInfo?.address || party.location}
                        storeName={selectedThemeDetail?.storeInfo?.name || party.location}
                        height="256px"
                        width="100%"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`mx-1 p-2 rounded ${currentPage === 1
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    &lt; 이전
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`mx-1 px-3 py-1 rounded ${currentPage === index + 1
                        ? "bg-[#FFB230] text-white"
                        : "text-gray-400 hover:bg-gray-700"
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`mx-1 p-2 rounded ${currentPage === totalPages
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    다음 &gt;
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* 모달 컴포넌트 추가 */}
      <PartyReviewModal
        partyId={selectedPartyId || 0}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </main>
  );
}
