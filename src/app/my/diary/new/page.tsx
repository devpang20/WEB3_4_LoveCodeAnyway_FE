"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api/client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ThemeSearchModal } from "@/components/ThemeSearchModalForDiary";
import { NewThemesModal } from "@/components/NewThemesModal";

// API 기본 URL
const API_BASE_URL = "http://localhost:8080";

// 테마 타입 정의
type Theme = {
  id: string;
  name: string;
  storeName: string;
};

// 평가 항목 타입 정의
type RatingCategory =
  | "interior"
  | "composition"
  | "story"
  | "production"
  | "satisfaction"
  | "difficulty"
  | "horror"
  | "activity";

// DiaryRequestDto 인터페이스 정의
interface DiaryRequestDto {
  themeId: number;
  escapeDate: string;
  participants: string;
  difficulty: number;
  fear: number;
  activity: number;
  satisfaction: number;
  production: number;
  story: number;
  question: number;
  interior: number;
  deviceRatio: number;
  hintCount: number | null;
  escapeResult: boolean | null;
  timeType: "ELAPSED" | "REMAINING";
  elapsedTime: string;
  review: string;
}

// 메인 컴포넌트
export default function NewDiaryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== 상태 관리 ====================

  // 테마 관련 상태
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isNewThemeModalOpen, setIsNewThemeModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

  // 새 테마 등록 관련 상태
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeStoreName, setNewThemeStoreName] = useState("");
  const [newThemeThumbnailUrl, setNewThemeThumbnailUrl] = useState("");
  const [newThemeTagIds, setNewThemeTagIds] = useState<number[]>([]);
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);

  // 기본 정보 관련 상태
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState("");

  // 이미지 관련 상태
  const [escapeImages, setEscapeImages] = useState<string[]>([]);
  const [newEscapeImage, setNewEscapeImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // 평가 관련 상태
  const [ratings, setRatings] = useState({
    interior: 0,
    composition: 0,
    story: 0,
    production: 0,
    satisfaction: 0,
    difficulty: 0,
    horror: 0,
    activity: 0,
  });

  // 장치 관련 상태
  const [deviceRatio, setDeviceRatio] = useState(50);
  const [noDevice, setNoDevice] = useState(false);

  // 탈출 정보 관련 상태
  const [hintCount, setHintCount] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [timeType, setTimeType] = useState<"진행 시간" | "잔여 시간">(
    "진행 시간"
  );
  const [time, setTime] = useState("");

  // 소감 관련 상태
  const [comment, setComment] = useState("");

  // ==================== API 호출 함수 ====================

  // 테마 검색 API 호출
  const searchThemes = async (keyword: string) => {
    if (!keyword.trim()) return;

    try {
      setIsLoadingThemes(true);
      const response = await client.get(
        `/api/v1/themes/search?keyword=${encodeURIComponent(
          keyword
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      setThemes(
        response.data.data.map((theme: any) => ({
          id: theme.id.toString(),
          name: theme.name,
          storeName: theme.storeName,
        }))
      );
    } catch (error) {
      console.error("Error searching themes:", error);
      alert("테마 검색에 실패했습니다.");
    } finally {
      setIsLoadingThemes(false);
    }
  };

  // 새 테마 등록 API 호출
  const createNewTheme = async () => {
    if (!newThemeName.trim()) {
      alert("테마 이름을 입력해주세요.");
      return;
    }

    if (!newThemeStoreName.trim()) {
      alert("매장 이름을 입력해주세요.");
      return;
    }

    try {
      setIsCreatingTheme(true);
      const response = await client.post(
        `/api/v1/diaries/theme`,
        {
          themeName: newThemeName,
          storeName: newThemeStoreName,
          thumbnailUrl: newThemeThumbnailUrl,
          tagIds: newThemeTagIds,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const newTheme = response.data.data;
        setSelectedTheme({
          id: newTheme.id.toString(),
          name: newTheme.name,
          storeName: newTheme.storeName,
        });
        setIsNewThemeModalOpen(false);

        // 입력 필드 초기화
        setNewThemeName("");
        setNewThemeStoreName("");
        setNewThemeThumbnailUrl("");
        setNewThemeTagIds([]);

        alert("테마가 성공적으로 등록되었습니다.");
      }
    } catch (error) {
      console.error("Error creating theme:", error);
      alert("테마 등록에 실패했습니다.");
    } finally {
      setIsCreatingTheme(false);
    }
  };

  // 이미지 업로드 API 호출
  const uploadImages = async () => {
    if (uploadedFiles.length === 0) return [];

    try {
      setIsUploadingImage(true);
      const formData = new FormData();

      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await client.post(
        `/api/v1/images/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        return response.data.data; // 업로드된 이미지 URL 배열 반환
      }
      return [];
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("이미지 업로드에 실패했습니다.");
      return [];
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 탈출일지 등록 API 호출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 입력값 검증
    if (!selectedTheme) {
      alert("테마를 선택해주세요.");
      return;
    }

    if (!date) {
      alert("진행 날짜를 입력해주세요.");
      return;
    }

    if (!time) {
      alert("시간을 입력해주세요.");
      return;
    }

    // 시간 형식 검증
    if (!/^\d{1,3}:\d{1,2}$/.test(time)) {
      alert("시간을 '분:초' 형식으로 입력해주세요 (예: 30:00)");
      return;
    }

    try {
      // 1. 먼저 일지 등록
      const diaryRequest: DiaryRequestDto = {
        themeId: parseInt(selectedTheme.id),
        escapeDate: date,
        participants: participants,
        difficulty: ratings.difficulty,
        fear: ratings.horror,
        activity: ratings.activity,
        satisfaction: ratings.satisfaction,
        production: ratings.production,
        story: ratings.story,
        question: ratings.composition,
        interior: ratings.interior,
        deviceRatio: noDevice ? 0 : deviceRatio,
        hintCount: hintCount,
        escapeResult: isSuccess,
        timeType: timeType === "진행 시간" ? "ELAPSED" : "REMAINING",
        elapsedTime: time,
        review: comment,
      };

      const diaryResponse = await client.post("/api/v1/diaries", diaryRequest, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!diaryResponse.data?.data?.id) {
        throw new Error("일지 등록에 실패했습니다.");
      }

      const diaryId = diaryResponse.data.data.id;

      // 2. 이미지가 있는 경우 업로드
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("target", "DIARY");

          await client.post(`/api/v1/upload/image/${diaryId}`, formData, {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
              Accept: "application/json",
            },
          });
        }
      }

      // 3. 수동으로 입력된 이미지 URL이 있는 경우 처리
      if (escapeImages.length > 0) {
        // TODO: 수동 입력된 이미지 URL 처리 로직 추가
      }

      alert("탈출일지가 성공적으로 등록되었습니다.");
      router.push("/my/diary");
    } catch (error) {
      console.error("Form submission error:", error);
      alert("탈출일지 등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // ==================== 이벤트 핸들러 ====================

  // 테마 모달 관련 핸들러
  const openThemeModal = () => {
    setIsThemeModalOpen(true);
    setSearchKeyword("");
    setThemes([]);
  };

  const openNewThemeModal = () => {
    setIsNewThemeModalOpen(true);
    setIsThemeModalOpen(false);
  };

  const handleThemeSelect = (themeName: string, themeId: number) => {
    setSelectedTheme({
      id: themeId.toString(),
      name: themeName,
      storeName: "", // ThemeSearchModal에서 storeName을 가져오지 않으므로 빈 문자열로 설정
    });
    setIsThemeModalOpen(false);
  };

  // 평가 항목 변경 핸들러
  const handleRatingChange = (category: RatingCategory, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  // 이미지 관련 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const addEscapeImage = () => {
    if (newEscapeImage.trim()) {
      setEscapeImages((prev) => [...prev, newEscapeImage]);
      setNewEscapeImage("");
    }
  };

  const removeEscapeImage = (index: number) => {
    setEscapeImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 새 테마 등록 핸들러
  const handleThemeCreated = (theme: { id: string; name: string; storeName: string }) => {
    setSelectedTheme(theme);
    setIsNewThemeModalOpen(false);
  };

  // ==================== 렌더링 ====================
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-center text-white">탈출일지 작성</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 섹션 1: 테마 선택 */}
          <section className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">테마 선택</h2>

            {selectedTheme ? (
              <div className="flex justify-between items-center p-4 border border-gray-700 rounded-lg bg-gray-700">
                <div>
                  <p className="font-medium text-white">{selectedTheme.name}</p>
                  <p className="text-gray-300 text-sm">
                    {selectedTheme.storeName}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-400"
                  onClick={() => setSelectedTheme(null)}
                >
                  변경
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="테마 또는 매장명으로 검색"
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                  readOnly
                  onClick={() => setIsThemeModalOpen(true)}
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-[#FFB130] text-black rounded-lg"
                  onClick={() => setIsThemeModalOpen(true)}
                >
                  테마 검색
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg"
                  onClick={openNewThemeModal}
                >
                  새 테마 등록
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              * 테마 선택은 필수입니다.
            </p>
          </section>

          {/* 섹션 2: 탈출 사진 및 기본 정보 */}
          <section className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">기본 정보</h2>

            <div className="space-y-4">
              {/* 탈출 사진 */}
              <div>
                <h3 className="text-md font-medium mb-2 text-white">탈출 사진</h3>
                <div
                  className="border-dashed border-2 border-gray-600 p-6 rounded-lg text-center mb-4 cursor-pointer bg-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    탈출 사진을 드래그하거나 클릭하여 업로드하세요
                  </p>
                </div>

                {/* 선택된 파일 목록 표시 */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={`file-${index}`} className="relative">
                        <div className="bg-gray-700 h-24 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newEscapeImage}
                    onChange={(e) => setNewEscapeImage(e.target.value)}
                    placeholder="이미지 URL 입력"
                    className="flex-1 px-3 py-2 border border-gray-700 rounded-lg bg-gray-700 text-white"
                  />
                  <button
                    type="button"
                    onClick={addEscapeImage}
                    className="px-4 py-2 bg-gray-600 rounded-lg text-sm text-white"
                  >
                    추가
                  </button>
                </div>

                {escapeImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {escapeImages.map((url, index) => (
                      <div key={`url-${index}`} className="relative">
                        <div className="bg-gray-700 h-24 rounded-lg flex items-center justify-center overflow-hidden">
                          <span className="text-xs text-gray-300 break-all px-2">
                            {url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEscapeImage(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 진행 날짜 */}
              <div>
                <h3 className="text-md font-medium mb-2 text-white">진행 날짜</h3>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                />
              </div>

              {/* 함께한 사람 */}
              <div>
                <h3 className="text-md font-medium mb-2 text-white">함께한 사람</h3>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="예) 홍길동, 김철수, 이영희"
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                />
              </div>
            </div>
          </section>

          {/* 섹션 3: 테마 평가 */}
          <section className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">테마 평가</h2>

            <div className="grid grid-cols-2 gap-6">
              {/* 평가 항목들 */}
              {[
                { id: "interior", label: "인테리어", color: "yellow" },
                { id: "composition", label: "문제 구성", color: "yellow" },
                { id: "story", label: "스토리", color: "yellow" },
                { id: "production", label: "연출", color: "yellow" },
                { id: "satisfaction", label: "만족도", color: "yellow" },
                { id: "difficulty", label: "난이도", color: "blue" },
                { id: "horror", label: "공포도", color: "purple" },
                { id: "activity", label: "활동성", color: "green" },
              ].map((item) => (
                <div key={item.id}>
                  <h3 className="text-md font-medium mb-2 text-white">{item.label}</h3>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          handleRatingChange(item.id as RatingCategory, star)
                        }
                        className={`w-6 h-6 ${
                          star <= ratings[item.id as RatingCategory]
                            ? `text-${item.color}-${
                                item.color === "yellow" ? "400" : "500"
                              }`
                            : "text-gray-500"
                        }`}
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* 장치 비중 */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-medium text-white">장치 비중</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={noDevice}
                      onChange={(e) => setNoDevice(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-white">장치X</span>
                  </label>
                </div>
                <div className="mb-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={deviceRatio}
                    onChange={(e) => setDeviceRatio(parseInt(e.target.value))}
                    disabled={noDevice}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span>자물쇠</span>
                  <span>{deviceRatio}%</span>
                  <span>전자장치</span>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 4: 탈출 정보 */}
          <section className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">탈출 정보</h2>

            <div className="grid grid-cols-2 gap-6">
              {/* 힌트 사용 횟수 */}
              <div>
                <h3 className="text-md font-medium mb-2 text-white">힌트 사용 횟수</h3>
                <input
                  type="number"
                  min="0"
                  value={hintCount === null ? "" : hintCount}
                  onChange={(e) =>
                    setHintCount(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="횟수 입력"
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                />
              </div>

              {/* 탈출 여부 */}
              <div>
                <h3 className="text-md font-medium mb-2 text-white">탈출 여부</h3>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="escapeSuccess"
                      checked={isSuccess === true}
                      onChange={() => setIsSuccess(true)}
                      className="mr-2"
                    />
                    <span>성공</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="escapeSuccess"
                      checked={isSuccess === false}
                      onChange={() => setIsSuccess(false)}
                      className="mr-2"
                    />
                    <span>실패</span>
                  </label>
                </div>
              </div>

              {/* 시간 */}
              <div className="col-span-2">
                <h3 className="text-md font-medium mb-2 text-white">시간</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex mb-2">
                      <label className="flex items-center mr-4">
                        <input
                          type="radio"
                          name="timeType"
                          checked={timeType === "진행 시간"}
                          onChange={() => setTimeType("진행 시간")}
                          className="mr-2"
                        />
                        <span>진행 시간</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="timeType"
                          checked={timeType === "잔여 시간"}
                          onChange={() => setTimeType("잔여 시간")}
                          className="mr-2"
                        />
                        <span>잔여 시간</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 숫자와 콜론만 허용
                        if (/^\d*:?\d*$/.test(value)) {
                          setTime(value);
                        }
                      }}
                      placeholder="분:초 (예: 30:00)"
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      * 분:초 형식으로 입력해주세요 (예: 30:00)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 5: 소감 */}
          <section className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">소감</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="테마에 대한 소감을 자유롭게 작성해주세요."
              className="w-full h-40 px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
            ></textarea>
          </section>

          {/* 등록 버튼 */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white font-medium rounded-lg"
            >
              일지 등록
            </button>
          </div>
        </form>
      </div>

      <ThemeSearchModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onSelect={handleThemeSelect}
      />

      <NewThemesModal
        isOpen={isNewThemeModalOpen}
        onClose={() => setIsNewThemeModalOpen(false)}
        onThemeCreated={handleThemeCreated}
      />
    </main>
  );
}
