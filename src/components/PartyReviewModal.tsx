import { useState, useEffect } from "react";
import Image from "next/image";
import client from "@/lib/backend/client";
import { useGlobalLoginMember } from "@/stores/auth/loginMember";

// 모임 멤버 타입 정의
type PartyMember = {
  id: number;
  nickname: string;
  profilePictureUrl: string;
};

// 모임 정보 타입 정의
type PartyInfo = {
  id: number;
  title: string;
  hostId: number;
  hostNickname: string;
  hostProfilePictureUrl: string;
  acceptedPartyMembers: PartyMember[];
  themeThumbnailUrl: string;
  storeName: string;
  scheduledAt: string;
};

// 리뷰 태그 타입 정의
type ReviewTag = {
  id: string;
  text: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NOSHOW';
};

// 멤버별 리뷰 상태 타입 정의
type MemberReview = {
  targetId: number;
  reviewKeywords: string[];
  noShow: boolean;
};

// API 응답 타입 정의
type ReviewKeywordsResponse = {
  'application/json': {
    POSITIVE?: string[];
    NEGATIVE?: string[];
    NOSHOW?: string[];
  };
};

interface PartyHistoryModalProps {
  partyId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PartyHistoryModal({
  partyId,
  isOpen,
  onClose,
}: PartyHistoryModalProps) {
  const { loginMember } = useGlobalLoginMember();
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberReviews, setMemberReviews] = useState<Record<number, MemberReview>>({});
  const [reviewTags, setReviewTags] = useState<ReviewTag[]>([]);

  // 리뷰 태그 가져오기
  useEffect(() => {
    const fetchReviewKeywords = async () => {
      try {
        const response = await client.GET("/api/v1/parties/review-keywords");
        const data = response.data as unknown as ReviewKeywordsResponse;
        if (data && 'application/json' in data) {
          const keywordMap = data['application/json'];
          const tags: ReviewTag[] = [];
          
          // Map POSITIVE keywords
          keywordMap.POSITIVE?.forEach((keyword: string) => {
            tags.push({
              id: keyword,
              text: getKeywordText(keyword),
              type: 'POSITIVE'
            });
          });
          
          // Map NEGATIVE keywords
          keywordMap.NEGATIVE?.forEach((keyword: string) => {
            tags.push({
              id: keyword,
              text: getKeywordText(keyword),
              type: 'NEGATIVE'
            });
          });

          setReviewTags(tags);
        }
      } catch (err) {
        console.error("리뷰 키워드 로드 중 오류:", err);
        setError("리뷰 키워드를 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchReviewKeywords();
  }, []);

  // 키워드에 따른 텍스트 매핑 함수
  const getKeywordText = (keyword: string): string => {
    const textMap: Record<string, string> = {
      'ATTENDANCE': '시간 약속을 잘 지켜요',
      'COMMUNICATION': '소통이 원활해요',
      'COOPERATION': '협조적이에요',
      'INTUITION': '눈치가 빨라요',
      'LEADERSHIP': '리더십이 좋아요',
      'LATE': '늦게 도착했어요',
      'PASSIVE': '소극적이에요',
      'SELF_CENTERED': '자기중심적이에요',
      'OFF_TOPIC': '자주 딴소리를 해요',
      'RUDE': '무례해요'
    };
    return textMap[keyword] || keyword;
  };

  // 멤버별 리뷰 상태 초기화
  useEffect(() => {
    if (partyInfo?.acceptedPartyMembers) {
      const initialReviews: Record<number, MemberReview> = {};
      partyInfo.acceptedPartyMembers.forEach((member) => {
        initialReviews[member.id] = {
          targetId: member.id,
          reviewKeywords: [],
          noShow: false,
        };
      });
      setMemberReviews(initialReviews);
    }
  }, [partyInfo?.acceptedPartyMembers]);

  // 태그 선택/해제 핸들러
  const handleTagToggle = (memberId: number, tagId: string) => {
    setMemberReviews((prev) => {
      const memberReview = prev[memberId];
      const updatedKeywords = memberReview.reviewKeywords.includes(tagId)
        ? memberReview.reviewKeywords.filter((id) => id !== tagId)
        : [...memberReview.reviewKeywords, tagId];
      
      return {
        ...prev,
        [memberId]: {
          ...memberReview,
          reviewKeywords: updatedKeywords,
        },
      };
    });
  };

  // 노쇼 토글 핸들러
  const handleNoShowToggle = (memberId: number) => {
    setMemberReviews((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        noShow: !prev[memberId].noShow,
      },
    }));
  };

  // 모임 정보 가져오기
  useEffect(() => {
    if (!isOpen || !partyId) return;

    const fetchPartyInfo = async () => {
      try {
        setLoading(true);
        const response = await client.GET("/api/v1/parties/{partyId}", {
          params: {
            path: {
              partyId: partyId,
            },
          },
        });

        console.log("data:", response);
        if (response.data?.data) {
          const data = response.data.data;
          setPartyInfo({
            id: data.id || 0,
            title: data.title || "",
            hostId: data.hostId || 0,
            hostNickname: data.hostNickname || "",
            hostProfilePictureUrl: data.hostProfilePictureUrl || "",
            acceptedPartyMembers: data.acceptedPartyMembers || [],
            themeThumbnailUrl: data.themeThumbnailUrl || "",
            storeName: data.storeName || "",
            scheduledAt: data.scheduledAt || "",
          });
        } else {
          setError("모임 정보를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error("모임 정보 로드 중 오류:", err);
        setError("모임 정보를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPartyInfo();
  }, [isOpen, partyId]);

  // 리뷰 대상 멤버 필터링 (현재 로그인한 유저 제외)
  const reviewTargets = partyInfo ? [
    // 모임장이 현재 유저가 아닌 경우에만 추가
    ...(partyInfo.hostId !== loginMember?.id ? [{
      id: partyInfo.hostId,
      nickname: partyInfo.hostNickname,
      profilePictureUrl: partyInfo.hostProfilePictureUrl,
      isHost: true,
    }] : []),
    // 참가자 중 현재 유저가 아닌 경우만 필터링
    ...partyInfo.acceptedPartyMembers
      .filter(member => member.id !== loginMember?.id)
      .map(member => ({
        ...member,
        isHost: false,
      }))
  ] : [];

  // 리뷰 제출 함수
  const handleSubmitReviews = async () => {
    try {
      // 모든 멤버의 리뷰를 배열로 변환하되, noShow 상태에 따라 키워드 처리
      const reviews = Object.values(memberReviews).map(review => {
        // noShow가 true인 경우, 다른 키워드는 무시하고 NO_SHOW만 전송
        if (review.noShow) {
          return {
            targetId: review.targetId,
            reviewKeywords: ["NO_SHOW"],  // NO_SHOW 키워드 추가
            noShow: true
          };
        } else {
          // noShow가 아닌 경우 원래 선택된 키워드 유지
          return {
            targetId: review.targetId,
            reviewKeywords: review.reviewKeywords,
            noShow: false
          };
        }
      });

      // API 호출
      await client.POST('/api/v1/parties/{id}/reviews', {
        params: {
          path: {
            id: partyId
          }
        },
        body: reviews
      });

      // 성공 시 모달 닫기
      onClose();
    } catch (err) {
      console.error("리뷰 제출 중 오류:", err);
      setError("리뷰 제출 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">리뷰 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB130]"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : partyInfo ? (
          <div className="space-y-6">
            {/* 모임 기본 정보 */}
            <div className="flex gap-4">
              {/* 썸네일 이미지 */}
              <div className="w-32 h-32 relative rounded-lg overflow-hidden bg-gray-700">
                {partyInfo.themeThumbnailUrl ? (
                  <Image
                    src={partyInfo.themeThumbnailUrl}
                    alt={partyInfo.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">🖼️</span>
                  </div>
                )}
              </div>
              
              {/* 모임 정보 */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {partyInfo.title}
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-gray-400"
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
                    {partyInfo.storeName}
                  </p>
                  <p className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {new Date(partyInfo.scheduledAt).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* 참가자 목록 */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                리뷰 대상 ({reviewTargets.length}명)
              </h4>
              <div className="space-y-4">
                {reviewTargets.map((member) => (
                  <div key={member.id} className="bg-gray-600 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden relative mr-2">
                          {member.profilePictureUrl ? (
                            <Image
                              src={member.profilePictureUrl}
                              alt={member.nickname}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">🧑</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm">{member.nickname}</p>
                          {member.isHost && (
                            <span className="text-xs text-[#FFB130] bg-[#FFB130]/10 px-2 py-0.5 rounded-full">
                              모임장
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={memberReviews[member.id]?.noShow || false}
                          onChange={() => handleNoShowToggle(member.id)}
                          className="form-checkbox h-4 w-4 text-[#FFB130] rounded border-gray-600"
                        />
                        <span className="text-sm text-gray-300">노쇼</span>
                      </label>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {reviewTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(member.id, tag.id)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            memberReviews[member.id]?.reviewKeywords.includes(tag.id)
                              ? "bg-[#FFB130] text-white"
                              : "bg-gray-500 text-gray-300 hover:bg-gray-400"
                          }`}
                        >
                          {tag.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmitReviews}
            className="px-4 py-2 bg-[#FFB130] text-white rounded hover:bg-[#FFA000] transition-colors"
          >
            리뷰 작성 완료
          </button>
        </div>
      </div>
    </div>
  );
}
