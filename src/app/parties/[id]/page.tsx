"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { LoginMemberContext } from "@/stores/auth/loginMember";
import Script from "next/script";

// 기본 이미지 경로
const DEFAULT_PROFILE_IMAGE = "/profile_default.jpg";
const DEFAULT_THEME_IMAGE = "/theme_default.jpg";

// URL이 유효한지 확인하는 함수
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  
  try {
    new URL(url); // URL 객체 생성을 시도하여 유효성 검사
    return true;
  } catch (error) {
    // 유효한 URL 형식이 아니면 상대 경로인지 확인
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
};

// 안전한 이미지 URL을 반환하는 함수
const getSafeImageUrl = (url: string | undefined | null, defaultImage: string): string => {
  return isValidImageUrl(url) ? url! : defaultImage;
};

// API 응답 데이터 타입 정의
interface PartyMemberSummaries {
  id?: number;
  profilePictureUrl?: string;
  nickname?: string;
}

interface ThemeTagMapping {
  themeId?: number;
  themeTagId?: number;
  tagName?: string; // 태그 이름 추가
}

interface PartyDetailResponse {
  id?: number;
  title?: string;
  scheduledAt?: string;
  content?: string;
  hostId?: number;
  hostNickname?: string;
  hostProfilePictureUrl?: string;
  recruitableCount?: number;
  totalParticipants?: number;
  acceptedPartyMembers?: PartyMemberSummaries[];
  AppliedPartyMembers?: PartyMemberSummaries[];
  rookieAvailable?: boolean;
  themeId?: number;
  themeName?: string;
  themeThumbnailUrl?: string;
  themeTagMappings?: ThemeTagMapping[];
  noHintEscapeRate?: number;
  escapeResult?: number;
  escapeTimeAvg?: number;
  storeName?: string;
  storeAddress?: string;
  themeGenre?: string; // 테마 장르 추가
  runtime?: number; // 플레이 시간
}

interface SuccessResponsePartyDetailResponse {
  message?: string;
  data?: PartyDetailResponse;
}

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLogin, loginMember } = useContext(LoginMemberContext);
  
  // 디버깅: loginMember 객체 확인
  useEffect(() => {
    console.log("LoginMemberContext:", { isLogin, loginMember });
  }, [isLogin, loginMember]);

  const [partyData, setPartyData] = useState<PartyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [userRole, setUserRole] = useState<"none" | "member" | "host">("none");
  const [kakaoMapLoaded, setKakaoMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);

  // 로그인 확인 및 리다이렉트
  useEffect(() => {
    if (!isLogin) {
      console.log("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      router.push("/login");
    }
  }, [isLogin, router]);

  // 기본 베이스 URL 설정
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://api.ddobang.site";

  // 모임 ID 가져오기
  const partyId = params?.id;

  // 모임 상세 정보 가져오기
  useEffect(() => {
    // 로그인되지 않은 경우 API 호출하지 않음
    if (!isLogin) return;
    
    const fetchPartyDetail = async () => {
      if (!partyId) return;

      setLoading(true);
      try {
        console.log("로그인된 사용자 ID:", loginMember.id);
        const response = await axios.get<SuccessResponsePartyDetailResponse>(
          `${baseUrl}/api/v1/parties/${partyId}`,
          {
            withCredentials: true,
          }
        );

        if (response.data.data) {
          console.log("모임 데이터:", response.data.data);
          console.log("모임장 ID:", response.data.data.hostId);
          setPartyData(response.data.data);

          // 사용자 역할 설정
          if (response.data.data.hostId === loginMember.id) {
            console.log("사용자 역할: 모임장");
            setUserRole("host");
          } else if (
            response.data.data.acceptedPartyMembers?.some(
              member => member.id === loginMember.id
            )
          ) {
            console.log("사용자 역할: 모임원");
            setUserRole("member");
          } else {
            console.log("사용자 역할: 일반 사용자");
            setUserRole("none");
          }
        } else {
          setError("모임 정보를 찾을 수 없습니다.");
          alert("모임 정보를 찾을 수 없습니다.");
          router.push("/parties");
        }
      } catch (err) {
        console.error("모임 상세 정보 로드 중 오류:", err);
        setError("모임 정보를 가져오는 중 오류가 발생했습니다.");
        alert("모임 정보를 가져오는 중 오류가 발생했습니다.");
        router.push("/parties");
      } finally {
        setLoading(false);
      }
    };

    fetchPartyDetail();
  }, [partyId, baseUrl, isLogin, router, loginMember]);

  // 참가 신청 처리
  const handleJoinRequest = async () => {
    if (!partyId) return;

    try {
      await axios.post(
        `${baseUrl}/api/v1/parties/${partyId}/apply`,
        {},
        {
          withCredentials: true,
        }
      );
      alert("참가 신청이 완료되었습니다.");
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error("참가 신청 중 오류:", error);
      alert("참가 신청 중 오류가 발생했습니다.");
    }
  };

  // 참가 취소 처리
  const handleCancelJoin = async () => {
    if (!partyId) return;

    try {
      await axios.delete(
        `${baseUrl}/api/v1/parties/${partyId}/join`,
        {
          withCredentials: true,
        }
      );
      alert("참가가 취소되었습니다.");
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error("참가 취소 중 오류:", error);
      alert("참가 취소 중 오류가 발생했습니다.");
    }
  };

  // 참가 요청 승인 처리
  const handleApproveRequest = async (memberId: number | undefined) => {
    if (!partyId || !memberId) return;

    try {
      await axios.post(
        `${baseUrl}/api/v1/parties/${partyId}/approve/${memberId}`,
        {},
        {
          withCredentials: true,
        }
      );
      alert("참가 요청이 승인되었습니다.");
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error("참가 요청 승인 중 오류:", error);
      alert("참가 요청 승인 중 오류가 발생했습니다.");
    }
  };

  // 모임 취소 처리
  const handleCancelParty = async () => {
    if (!partyId) return;

    if (!confirm("정말로 모임을 취소하시겠습니까?")) return;

    try {
      await axios.delete(
        `${baseUrl}/api/v1/parties/${partyId}`,
        {
          withCredentials: true,
        }
      );
      alert("모임이 취소되었습니다.");
      router.push("/parties");
    } catch (error) {
      console.error("모임 취소 중 오류:", error);
      alert("모임 취소 중 오류가 발생했습니다.");
    }
  };

  // OpenStreetMap 정적 지도 URL 생성 함수
  const getMapImageUrl = (address?: string) => {
    if (!address) return "";
    
    // 서울 중심 좌표로 기본 설정 (실제로는 위치에 따라 달라져야 함)
    let lat = 37.5665;
    let lon = 126.9780;
    
    // 위치에 따라 좌표 조정 (샘플용)
    if (address.includes('홍대')) {
      lat = 37.557;
      lon = 126.923;
    } else if (address.includes('강남')) {
      lat = 37.498;
      lon = 127.027;
    } else if (address.includes('건대')) {
      lat = 37.540;
      lon = 127.069;
    } else if (address.includes('신촌')) {
      lat = 37.555;
      lon = 126.936;
    } else if (address.includes('종로')) {
      lat = 37.570;
      lon = 126.981;
    }
    
    // OpenStreetMap 기반 정적 이미지 URL
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=600x400&maptype=mapnik&markers=${lat},${lon},lightblue`;
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <Navigation activePage="parties" />
        <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </main>
    );
  }

  // 오류 발생 시 모임 목록으로 자동 리다이렉트하므로 오류 표시 UI 제거
  if (error || !partyData) {
    // 렌더링 전에 이미 리다이렉트 처리되었지만, 
    // 혹시 렌더링되는 경우를 대비해 최소한의 로딩 화면 표시
    return (
      <main className="bg-gray-50 min-h-screen">
        <Navigation activePage="parties" />
        <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </main>
    );
  }

  // scheduledAt을 날짜와 시간으로 분리
  const formattedDate = partyData.scheduledAt
    ? new Date(partyData.scheduledAt)
        .toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\. /g, "-")
        .replace(/\.$/, "")
    : "";

  const formattedTime = partyData.scheduledAt
    ? new Date(partyData.scheduledAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  // 참가자 목록에 모임장 포함 여부 확인
  const acceptedMembersCount = partyData.acceptedPartyMembers?.length || 0;
  const totalRemainingCount = (partyData.totalParticipants || 0) - acceptedMembersCount;

  return (
    <main className="bg-gray-50 min-h-screen">
      <Navigation activePage="parties" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* [1단] 모임 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{partyData.title}</h1>
              <p className="text-gray-600">
                {formattedDate} {formattedTime}
              </p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <div className="w-10 h-10 rounded-full overflow-hidden relative mr-3 bg-gray-200">
                {partyData.hostProfilePictureUrl && isValidImageUrl(partyData.hostProfilePictureUrl) ? (
                  <Image
                    src={getSafeImageUrl(partyData.hostProfilePictureUrl, DEFAULT_PROFILE_IMAGE)}
                    alt={partyData.hostNickname || "모임장"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">🧑</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-gray-900 font-medium">
                    {partyData.hostNickname || "모임장"}
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#FFB130] text-white rounded-full">모임장</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">
                초심자
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  partyData.rookieAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {partyData.rookieAvailable ? "가능" : "불가능"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">
                모집 현황
              </span>
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-2 group relative">
                  {partyData.acceptedPartyMembers?.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full overflow-hidden relative border-2 border-white bg-gray-200 hover:z-10 transition"
                    >
                      {member.profilePictureUrl && isValidImageUrl(member.profilePictureUrl) ? (
                        <Image
                          src={getSafeImageUrl(member.profilePictureUrl, DEFAULT_PROFILE_IMAGE)}
                          alt={member.nickname || "참가자"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400 text-xs">🧑</span>
                        </div>
                      )}
                      <div className="hidden group-hover:block absolute top-10 left-0 bg-white shadow-md rounded-md p-2 z-20 w-40">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden mr-2 bg-gray-200 relative">
                            {member.profilePictureUrl && isValidImageUrl(member.profilePictureUrl) ? (
                              <Image
                                src={getSafeImageUrl(member.profilePictureUrl, DEFAULT_PROFILE_IMAGE)}
                                alt={member.nickname || ""}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-gray-400 text-xs">🧑</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{member.nickname}</span>
                            {member.id === partyData.hostId && (
                              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#FFB130] text-white rounded-full">모임장</span>
                            )}
                          </div>
                        </div>
                        <Link 
                          href={`/profile/${member.id}`} 
                          className="text-xs text-blue-600 hover:underline"
                        >
                          프로필 보기
                        </Link>
                      </div>
                    </div>
                  ))}
                  {acceptedMembersCount > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-700 hover:bg-gray-300 transition">
                      +{acceptedMembersCount - 3}
                    </div>
                  )}
                  {totalRemainingCount > 0 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                      {totalRemainingCount}명
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {acceptedMembersCount}/{partyData.totalParticipants || 0}명
                </span>
              </div>
            </div>
          </div>

          {/* 모임 내용 */}
          {partyData.content && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-semibold mb-2">모임 소개</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {partyData.content}
              </p>
            </div>
          )}
        </div>

        {/* [2단] 참가 신청 목록 (모임장 권한) */}
        {userRole === "host" && partyData.AppliedPartyMembers && partyData.AppliedPartyMembers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
            <button
              onClick={() => setIsRequestsOpen(!isRequestsOpen)}
              className="w-full flex justify-between items-center text-left"
            >
              <h2 className="text-xl font-bold">
                참가 신청 목록{" "}
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                  {partyData.AppliedPartyMembers.length}
                </span>
              </h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${
                  isRequestsOpen ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isRequestsOpen && (
              <div className="mt-4 space-y-4">
                {partyData.AppliedPartyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative mr-3 bg-gray-200">
                        {member.profilePictureUrl && isValidImageUrl(member.profilePictureUrl) ? (
                          <Image
                            src={getSafeImageUrl(member.profilePictureUrl, DEFAULT_PROFILE_IMAGE)}
                            alt={member.nickname || "신청자"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400">🧑</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-medium">{member.nickname}</span>
                          {member.id === partyData.hostId && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#FFB130] text-white rounded-full">모임장</span>
                          )}
                        </div>
                        <Link 
                          href={`/profile/${member.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          프로필 보기
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveRequest(member.id)}
                      className="bg-[#FFB130] hover:bg-[#F0A420] text-white px-4 py-2 rounded-lg transition"
                    >
                      승인
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* [3단] 테마 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold mb-6">테마 정보</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 h-64 relative rounded-lg overflow-hidden bg-gray-200">
              {partyData.themeThumbnailUrl && isValidImageUrl(partyData.themeThumbnailUrl) ? (
                <Image
                  src={getSafeImageUrl(partyData.themeThumbnailUrl, DEFAULT_THEME_IMAGE)}
                  alt={partyData.themeName || "테마 이미지"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">🖼️ 이미지 없음</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{partyData.themeName}</h3>
              
              {/* 장르 및 태그 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {partyData.themeTagMappings?.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                  >
                    #{tag.tagName || "태그"}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">노힌트 탈출률:</span>
                  <span className="font-medium">{(partyData.noHintEscapeRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">유저 탈출률:</span>
                  <span className="font-medium">{(partyData.escapeResult || 0).toFixed(1)}%</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">평균 탈출 시간:</span>
                  <span className="font-medium">{partyData.escapeTimeAvg || 0}분</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">플레이 시간:</span>
                  <span className="font-medium">{partyData.runtime || 60}분</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* [4단] 매장 위치 및 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold mb-6">매장 위치 및 정보</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">{partyData.storeName}</h3>
              <p className="text-gray-600 mb-4">{partyData.storeAddress}</p>
              
              {/* 고정 지도 이미지 사용 */}
              <div className="w-full h-80 bg-gray-200 rounded-lg relative">
                <Image
                  src="https://i.postimg.cc/L5Q5s78R/image.png"
                  alt={`${partyData.storeName} 지도`}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
                <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded shadow text-xs">
                  {partyData.storeName || ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* [5단] 버튼 섹션 */}
        <div className="flex flex-wrap justify-center gap-4 my-8">
          {/* 모임장(글쓴이)인 경우 */}
          {userRole === "host" && (
            <>
              <Link
                href={`/parties/edit/${partyId}`}
                className="px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#F0A420] transition"
              >
                모임 정보 수정
              </Link>
              <button
                onClick={handleCancelParty}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                모임 취소
              </button>
            </>
          )}

          {/* 모임원(글쓴이가 아닌 경우)인 경우 */}
          {userRole === "member" && (
            <button
              onClick={handleCancelJoin}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              참가 취소
            </button>
          )}

          {/* 일반 사용자(글쓴이가 아닌 경우)인 경우 */}
          {userRole === "none" && (
            <button
              onClick={handleJoinRequest}
              className="px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#F0A420] transition"
              disabled={(partyData.acceptedPartyMembers?.length || 0) >= (partyData.totalParticipants || 0)}
            >
              {(partyData.acceptedPartyMembers?.length || 0) >= (partyData.totalParticipants || 0)
                ? "모집 완료"
                : "참가 신청"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
