"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";
import Image from "next/image";
import { PageLoading } from "@/components/PageLoading";
import client from "@/lib/backend/client";

// API 응답 타입과 일치하는 인터페이스
interface ThemeDetailResponse {
  name?: string;
  description?: string;
  runtime?: number;
  officialDifficulty?: number;
  price?: number;
  recommendedParticipants?: string;
  thumbnailUrl?: string;
  reservationUrl?: string;
  tags?: string[];
  storeInfo?: {
    name?: string;
    phoneNumber?: string;
    address?: string;
  };
  diaryBasedThemeStat?: {
    difficulty?: number;
    fear?: number;
    activity?: number;
    satisfaction?: number;
    production?: number;
    story?: number;
    question?: number;
    interior?: number;
    deviceRatio?: number;
    noHintEscapeRate?: number;
    escapeResult?: number;
    escapeTimeAvg?: number;
  };
}

export default function ThemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const themeId = params.id;

  const [themeDetail, setThemeDetail] = useState<ThemeDetailResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  // 인증서 오류 도메인 확인
  const CERTIFICATE_ERROR_DOMAINS = [
    "xn--vh3bn2thtas7l8te.com",
    "www.xn--vh3bn2thtas7l8te.com",
  ];

  // 이미지 URL 처리 함수
  const getProxyImageUrl = (url: string | undefined): string => {
    if (!url) return "/images/mystery-room.jpg";

    // 인증서 오류 도메인인지 확인
    const hasErrorDomain = CERTIFICATE_ERROR_DOMAINS.some((domain) =>
      url.includes(domain)
    );

    if (hasErrorDomain) {
      try {
        // 원본 URL에서 경로만 추출
        const urlObj = new URL(url);
        return `/img-proxy${urlObj.pathname}`;
      } catch (e) {
        console.error("URL 파싱 오류:", e);
        return url;
      }
    }

    return url;
  };

  // OpenStreetMap 정적 지도 URL 생성 함수
  const getMapImageUrl = (address?: string) => {
    if (!address) return "";

    // 서울 중심 좌표로 기본 설정 (실제로는 위치에 따라 달라져야 함)
    let lat = 37.5665;
    let lon = 126.978;

    // 위치에 따라 좌표 조정 (샘플용)
    if (address.includes("홍대")) {
      lat = 37.557;
      lon = 126.923;
    } else if (address.includes("강남")) {
      lat = 37.498;
      lon = 127.027;
    } else if (address.includes("건대")) {
      lat = 37.54;
      lon = 127.069;
    } else if (address.includes("신촌")) {
      lat = 37.555;
      lon = 126.936;
    } else if (address.includes("종로")) {
      lat = 37.57;
      lon = 126.981;
    }

    // OpenStreetMap 기반 정적 이미지 URL
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=600x400&maptype=mapnik&markers=${lat},${lon},lightblue`;
  };

  useEffect(() => {
    const fetchThemeDetail = async () => {
      setLoading(true);
      try {
        const response = await client.GET(`/api/v1/themes/${themeId}`);

        if (response?.data?.data) {
          setThemeDetail(response.data.data);
        } else {
          throw new Error("응답 데이터가 올바르지 않습니다.");
        }
      } catch (err) {
        console.error("테마 상세 정보 가져오기 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (themeId) {
      fetchThemeDetail();
    }
  }, [themeId]);

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <PageLoading isLoading={loading} />
      </main>
    );
  }

  if (error || !themeDetail) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold mb-4">오류 발생</h1>
            <p className="text-gray-600 mb-6">
              {error || "테마 정보를 불러올 수 없습니다."}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 레이더 차트 데이터
  const radarData = themeDetail.diaryBasedThemeStat
    ? [
        {
          label: "난이도",
          value: themeDetail.diaryBasedThemeStat.difficulty || 0,
        },
        {
          label: "공포도",
          value: themeDetail.diaryBasedThemeStat.fear || 0,
        },
        {
          label: "활동성",
          value: themeDetail.diaryBasedThemeStat.activity || 0,
        },
        {
          label: "만족도",
          value: themeDetail.diaryBasedThemeStat.satisfaction || 0,
        },
        {
          label: "연출",
          value: themeDetail.diaryBasedThemeStat.production || 0,
        },
      ]
    : [];

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* 섹션 1: 테마 정보 */}
        <div className="mb-8">
          <div className="mb-2">
            <h1 className="text-2xl font-bold mb-1">{themeDetail.name}</h1>
            <span className="text-gray-500">{themeDetail.storeInfo?.name}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{themeDetail.runtime || 0}분</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{themeDetail.recommendedParticipants || "2-4인"}</span>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            {(themeDetail.tags || []).map((tag, index) => {
              // 태그별 색상 매핑
              const getTagStyle = (type: string) => {
                switch (type.toLowerCase()) {
                  case "미스터리":
                    return "bg-purple-100 text-purple-800";
                  case "추리":
                    return "bg-blue-100 text-blue-800";
                  case "공포":
                    return "bg-red-100 text-red-800";
                  case "액션":
                    return "bg-orange-100 text-orange-800";
                  case "sf":
                    return "bg-cyan-100 text-cyan-800";
                  case "판타지":
                    return "bg-indigo-100 text-indigo-800";
                  case "어드벤처":
                    return "bg-green-100 text-green-800";
                  case "퍼즐":
                    return "bg-yellow-100 text-yellow-800";
                  default:
                    return "bg-gray-100 text-gray-800";
                }
              };

              return (
                <span
                  key={index}
                  className={`inline-block px-3 py-1 text-sm rounded-full ${getTagStyle(
                    tag
                  )}`}
                >
                  #{tag}
                </span>
              );
            })}
          </div>
          <div className="relative w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden mb-4">
            {themeDetail.thumbnailUrl ? (
              <img
                src={getProxyImageUrl(themeDetail.thumbnailUrl)}
                alt={themeDetail.name || "테마 이미지"}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/mystery-room.jpg";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/images/mystery-room.jpg"
                  alt="기본 이미지"
                  className="w-full h-full object-cover rounded-2xl"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              {themeDetail.diaryBasedThemeStat && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">유저 탈출률</span>
                    <span className="font-bold text-xl">
                      {themeDetail.diaryBasedThemeStat.escapeResult || 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">노힌트 탈출률</span>
                    <span className="font-bold text-xl">
                      {themeDetail.diaryBasedThemeStat.noHintEscapeRate || 0}%
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">난이도</span>
                <StarRating
                  rating={themeDetail.officialDifficulty || 0}
                  maxRating={5}
                />
              </div>
              {themeDetail.price && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">가격</span>
                  <span className="font-medium">
                    {themeDetail.price.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 섹션 2: 설명 및 위치 */}
        <section className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 border-r border-gray-100 pr-8">
              <h2 className="text-2xl font-bold mb-4">테마 설명</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {themeDetail.description || "테마 설명이 없습니다."}
              </p>
            </div>
            {themeDetail.storeInfo && (
              <div className="w-full md:w-1/2">
                <h2 className="text-2xl font-bold mb-4">매장 위치</h2>
                <div className="h-64 bg-gray-200 rounded-lg mb-4 relative">
                  {/* 고정 이미지 사용 */}
                  <Image
                    src="https://i.postimg.cc/L5Q5s78R/image.png"
                    alt={`${themeDetail.storeInfo.name} 지도`}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                  <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded shadow text-xs">
                    {themeDetail.storeInfo.name || ""}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    {themeDetail.storeInfo.address}
                  </p>
                  <p className="text-gray-600">
                    {themeDetail.storeInfo.phoneNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 섹션 3: 평가 및 통계 */}
        {themeDetail.diaryBasedThemeStat && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 유저 평가 */}
              <div>
                <h2 className="text-2xl font-bold mb-6">유저 평가</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">만족도</span>
                    <StarRating
                      rating={themeDetail.diaryBasedThemeStat.satisfaction || 0}
                      maxRating={5}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">연출</span>
                    <StarRating
                      rating={themeDetail.diaryBasedThemeStat.production || 0}
                      maxRating={5}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">스토리</span>
                    <StarRating
                      rating={themeDetail.diaryBasedThemeStat.story || 0}
                      maxRating={5}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">문제</span>
                    <StarRating
                      rating={themeDetail.diaryBasedThemeStat.question || 0}
                      maxRating={5}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">인테리어</span>
                    <StarRating
                      rating={themeDetail.diaryBasedThemeStat.interior || 0}
                      maxRating={5}
                    />
                  </div>
                </div>
              </div>

              {/* 플레이 특성 */}
              <div>
                <h2 className="text-2xl font-bold mb-6">플레이 특성</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">난이도</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{
                          width: `${
                            (themeDetail.diaryBasedThemeStat.difficulty || 0) *
                            20
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">공포도</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${
                            (themeDetail.diaryBasedThemeStat.fear || 0) * 20
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">활동성</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            (themeDetail.diaryBasedThemeStat.activity || 0) * 20
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">기믹/장치</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${
                            (themeDetail.diaryBasedThemeStat.deviceRatio || 0) *
                            20
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 빈 공간으로 균형 맞추기 */}
              <div></div>
            </div>

            {/* 통계 */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold mb-6">통계</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                  <div className="text-4xl font-bold mb-2">
                    {themeDetail.diaryBasedThemeStat.escapeResult || 0}%
                  </div>
                  <div className="text-gray-500">유저 탈출률</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                  <div className="text-4xl font-bold mb-2">
                    {themeDetail.diaryBasedThemeStat.noHintEscapeRate || 0}%
                  </div>
                  <div className="text-gray-500">노힌트 탈출률</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                  <div className="text-4xl font-bold mb-2">
                    {themeDetail.diaryBasedThemeStat.escapeTimeAvg || 0}개
                  </div>
                  <div className="text-gray-500">평균 힌트</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-col gap-8">
          <div className="flex flex-wrap gap-4 w-full px-4">
            <Link
              href="/themes"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#FFB130] text-[#FFB130] rounded-lg hover:bg-[#FFB130] hover:text-white transition-colors whitespace-nowrap"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              테마 목록으로 돌아가기
            </Link>
            <Link
              href={themeDetail.reservationUrl || "#"}
              className="flex-1 px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#FFA000] transition-colors text-center shadow-sm whitespace-nowrap"
            >
              예약하러 가기
            </Link>
            <Link
              href="/my/"
              className="flex-1 px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#FFA000] transition-colors text-center shadow-sm whitespace-nowrap"
            >
              희망 테마 설정
            </Link>
            <Link
              href={`/parties/create?themeId=${themeId}&themeName=${encodeURIComponent(themeDetail.name || '')}`}
              className="flex-1 px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#FFA000] transition-colors text-center shadow-sm whitespace-nowrap"
            >
              모임 만들기
            </Link>
            <Link
              href={`/parties?themeId=${themeId}&themeName=${encodeURIComponent(themeDetail.name || '')}`}
              className="flex-1 px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#FFA000] transition-colors text-center shadow-sm whitespace-nowrap"
            >
              모임찾기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
