"use client";

import { useState, useEffect, useContext } from "react";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { ThemeSearchModal } from "@/components/ThemeSearchModal";
import { TimePickerModal } from "@/components/TimePickerModal";
import axios from "axios";
import { useRouter } from "next/navigation";
import { LoginMemberContext } from "@/stores/auth/loginMember";

interface PartyFormData {
  title: string;
  themeName: string;
  themeId: number;
  date: string;
  time: string;
  participantsNeeded: string;
  totalParticipants: string;
  rookieAvailable: boolean;
  content: string;
}

interface PartyRequest {
  themeId: number;
  title: string;
  content: string;
  scheduledAt: string; // ISO 8601 형식 (yyyy-MM-ddTHH:mm:ss)
  participantsNeeded: number;
  totalParticipants: number;
  rookieAvailable: boolean;
}

interface SuccessResponsePartyDto {
  message?: string;
  data?: {
    id?: number;
    title?: string;
    // 나머지 필드들...
  };
}

interface ThemeInfo {
  themeName: string;
  themeId: number;
}

export default function CreatePartyPage() {
  const router = useRouter();
  const { isLogin } = useContext(LoginMemberContext);
  const [formData, setFormData] = useState<PartyFormData>({
    title: "",
    themeName: "",
    themeId: 0,
    date: (() => {
      // 내일 날짜 계산
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    })(),
    time: (() => {
      // 현재 시간 포맷팅 (HH:MM)
      const now = new Date();
      return `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    })(),
    participantsNeeded: "",
    totalParticipants: "",
    rookieAvailable: false,
    content: "",
  });

  // 로그인 확인 및 리다이렉트
  useEffect(() => {
    if (!isLogin) {
      alert("로그인이 필요한 페이지입니다.");
      router.push("/login");
    }
  }, [isLogin, router]);

  const [isThemeSearchModalOpen, setIsThemeSearchModalOpen] = useState(false);
  const [isTimePickerModalOpen, setIsTimePickerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기본 베이스 URL 설정
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://api.ddobang.site";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      // 폼 데이터 유효성 검사
      if (!formData.themeId || formData.themeId <= 0) {
        throw new Error("테마를 선택해주세요.");
      }

      // 필요한 인원과 총 인원 검사
      const participantsNeeded = parseInt(formData.participantsNeeded, 10);
      const totalParticipants = parseInt(formData.totalParticipants, 10);

      if (participantsNeeded > totalParticipants) {
        throw new Error("필요한 인원은 총 인원보다 작거나 같아야 합니다.");
      }

      // scheduledAt을 ISO 형식으로 변환
      const scheduledDateTime = new Date(`${formData.date}T${formData.time}`);

      if (isNaN(scheduledDateTime.getTime())) {
        throw new Error("날짜와 시간을 올바르게 입력해주세요.");
      }

      // 현재 시간보다 미래인지 확인
      const now = new Date();
      if (scheduledDateTime <= now) {
        throw new Error(
          "모임 날짜와 시간은 현재 또는 미래의 시간이어야 합니다."
        );
      }

      // themeId를 확실하게 숫자로 변환
      const numericThemeId = Number(formData.themeId);

      // 요청 데이터 생성
      const requestData: PartyRequest = {
        themeId: numericThemeId,
        title: formData.title,
        content: formData.content,
        scheduledAt: scheduledDateTime.toISOString(),
        participantsNeeded: participantsNeeded,
        totalParticipants: totalParticipants,
        rookieAvailable: formData.rookieAvailable,
      };

      // API 호출
      const response = await axios.post<SuccessResponsePartyDto>(
        `${baseUrl}/api/v1/parties`,
        requestData,
        {
          withCredentials: true,
        }
      )
   

      // 성공시 모임 상세 페이지로 이동
      if (response.data.data?.id) {
        router.push(`/parties/${response.data.data.id}`);
      } else {
        router.push("/parties");
      }
    } catch (err) {
      console.error("모임 등록 중 오류:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "모임 등록에 실패했습니다.");
      } else {
        setError(
          err instanceof Error ? err.message : "모임 등록에 실패했습니다."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // themeId 필드일 경우 숫자로 변환
    if (name === "themeId") {
      const numericValue = Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : numericValue,
      }));
      return;
    }

    // 다른 필드 처리
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleThemeSelect = (
    themeName: string,
    themeIdFromParam: number | undefined
  ) => {
    // ID가 제공되지 않은 경우
    if (themeIdFromParam === undefined) {
      setError(
        "테마 ID가 없는 테마입니다. 다른 테마를 선택하거나 ID를 직접 입력해주세요."
      );
      return;
    }

    // 명시적으로 숫자로 변환하고 유효성 검사
    const numericThemeId = Number(themeIdFromParam);

    if (isNaN(numericThemeId) || numericThemeId <= 0) {
      setError("유효하지 않은 테마입니다. 다시 선택해주세요.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      themeName,
      themeId: numericThemeId,
    }));

    setIsThemeSearchModalOpen(false);
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      time,
    }));
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <Navigation activePage="parties" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">모임 등록</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 모임 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                모임 제목
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="모임 제목을 입력해주세요"
                required
              />
            </div>

            {/* 모임 테마 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모임 테마
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.themeName}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="테마를 선택해주세요"
                />
                <button
                  type="button"
                  onClick={() => setIsThemeSearchModalOpen(true)}
                  className="px-4 py-2 bg-[#FFB130] text-white rounded-lg hover:bg-[#FFB130]/90"
                >
                  테마 검색
                </button>
              </div>
            </div>

            {/* 모임 날짜 */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                모임 날짜
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker()
                }
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black cursor-pointer"
                required
              />
            </div>

            {/* 모임 시간 */}
            <div>
              <label
                htmlFor="time"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                모임 시간
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="time"
                  name="time"
                  value={formData.time}
                  onClick={() => setIsTimePickerModalOpen(true)}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black cursor-pointer"
                  placeholder="시간을 선택해주세요"
                  required
                />
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                  onClick={() => setIsTimePickerModalOpen(true)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 필요한 인원 */}
            <div>
              <label
                htmlFor="participantsNeeded"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                필요한 인원
              </label>
              <input
                type="number"
                id="participantsNeeded"
                name="participantsNeeded"
                value={formData.participantsNeeded}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                required
              />
            </div>

            {/* 모임 총 인원 */}
            <div>
              <label
                htmlFor="totalParticipants"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                모임 총 인원 (모임장 포함)
              </label>
              <input
                type="number"
                id="totalParticipants"
                name="totalParticipants"
                value={formData.totalParticipants}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                required
              />
            </div>

            {/* 초심자 가능 여부 */}
            <div className="flex items-center">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="rookieAvailable"
                  name="rookieAvailable"
                  checked={formData.rookieAvailable}
                  onChange={handleInputChange}
                  className="absolute w-0 h-0 opacity-0"
                />
                <div
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      rookieAvailable: !prev.rookieAvailable,
                    }));
                  }}
                  className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer ${
                    formData.rookieAvailable
                      ? "bg-[#FFB130] border-[#FFB130]"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {formData.rookieAvailable && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <label
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    rookieAvailable: !prev.rookieAvailable,
                  }));
                }}
                htmlFor="rookieAvailable"
                className="ml-2 block text-sm text-gray-700 cursor-pointer"
              >
                초심자 가능 여부
              </label>
            </div>

            {/* 모임 소개글 */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                모임 소개글
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="모임에 대한 소개글을 작성해주세요"
                required
              />
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-3 mt-8">
              <Link
                href="/parties"
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 bg-[#FFB130] text-white rounded-lg hover:bg-[#FFB130]/90 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ThemeSearchModal
        isOpen={isThemeSearchModalOpen}
        onClose={() => setIsThemeSearchModalOpen(false)}
        onSelect={handleThemeSelect}
      />

      <TimePickerModal
        isOpen={isTimePickerModalOpen}
        onClose={() => setIsTimePickerModalOpen(false)}
        onSelect={handleTimeSelect}
        initialTime={formData.time}
      />
    </main>
  );
}
