import { useState } from "react";

interface ThemeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export function ThemeFilterModal({
  isOpen,
  onClose,
  onApply,
}: ThemeFilterModalProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [activeRegion, setActiveRegion] = useState("서울");

  const regions = [
    {
      id: "서울",
      name: "서울",
      subRegions: [
        { id: "서울 전체", name: "서울 전체" },
        { id: "홍대", name: "홍대" },
        { id: "강남", name: "강남" },
        { id: "건대", name: "건대" },
        { id: "대학로", name: "대학로" },
        { id: "신촌", name: "신촌" },
        { id: "잠실", name: "잠실" },
        { id: "신림", name: "신림" },
        { id: "노원", name: "노원" },
        { id: "신사", name: "신사" },
      ],
    },
    {
      id: "경기/인천",
      name: "경기/인천",
      subRegions: [
        { id: "경기 전체", name: "경기 전체" },
        { id: "인천", name: "인천" },
        { id: "수원", name: "수원" },
        { id: "분당", name: "분당" },
        { id: "일산", name: "일산" },
        { id: "안양", name: "안양" },
      ],
    },
    {
      id: "충청",
      name: "충청",
      subRegions: [
        { id: "충청 전체", name: "충청 전체" },
        { id: "대전", name: "대전" },
        { id: "천안", name: "천안" },
      ],
    },
    {
      id: "경상",
      name: "경상",
      subRegions: [
        { id: "경상 전체", name: "경상 전체" },
        { id: "부산", name: "부산" },
        { id: "대구", name: "대구" },
        { id: "울산", name: "울산" },
      ],
    },
    {
      id: "전라",
      name: "전라",
      subRegions: [
        { id: "전라 전체", name: "전라 전체" },
        { id: "광주", name: "광주" },
        { id: "전주", name: "전주" },
      ],
    },
    {
      id: "강원",
      name: "강원",
      subRegions: [
        { id: "강원 전체", name: "강원 전체" },
        { id: "강릉", name: "강릉" },
        { id: "속초", name: "속초" },
      ],
    },
    {
      id: "제주",
      name: "제주",
      subRegions: [
        { id: "제주 전체", name: "제주 전체" },
        { id: "서귀포", name: "서귀포" },
      ],
    },
  ];

  const genres = [
    { id: "스릴러", name: "스릴러" },
    { id: "판타지", name: "판타지" },
    { id: "추리", name: "추리" },
    { id: "호러/공포", name: "호러/공포" },
    { id: "감동", name: "감동" },
    { id: "코미디", name: "코미디" },
    { id: "모험/힐링", name: "모험/힐링" },
    { id: "미스터리", name: "미스터리" },
    { id: "SF", name: "SF" },
    { id: "액션", name: "액션" },
    { id: "역사", name: "역사" },
    { id: "타임어택", name: "타임어택" },
    { id: "19금", name: "19금" },
    { id: "아웃도어", name: "아웃도어" },
    { id: "로맨스", name: "로맨스" },
  ];

  const participants = [
    { id: "1명", name: "1명" },
    { id: "2명", name: "2명" },
    { id: "3명", name: "3명" },
    { id: "4명", name: "4명" },
    { id: "5명", name: "5명" },
    { id: "6명", name: "6명" },
    { id: "7명", name: "7명" },
    { id: "8명 이상", name: "8명 이상" },
  ];

  const handleRegionToggle = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleParticipantToggle = (participant: string) => {
    setSelectedParticipant(
      selectedParticipant === participant ? "" : participant
    );
  };

  const handleRegionClick = (regionId: string) => {
    setActiveRegion(regionId);
  };

  const handleReset = () => {
    setSelectedRegions([]);
    setSelectedGenres([]);
    setSelectedParticipant("");
    setActiveRegion("서울");
  };

  const handleApply = () => {
    onApply({
      regions: selectedRegions,
      genres: selectedGenres,
      participant: selectedParticipant,
    });
    onClose();
  };

  const getSelectedFiltersText = () => {
    const regionText =
      selectedRegions.length > 0 ? `지역: ${selectedRegions.join(", ")}` : "";
    const genreText =
      selectedGenres.length > 0 ? `장르: ${selectedGenres.join(", ")}` : "";
    const participantText = selectedParticipant
      ? `인원: ${selectedParticipant}`
      : "";

    const texts = [regionText, genreText, participantText].filter(Boolean);
    return texts.join(" | ");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[3px]"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-2xl w-[1105px] p-8 mx-4 shadow-lg relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">검색 필터 - 테마</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
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

        <div className="flex items-center mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="직접 전 선택한 필터 표시"
              value={getSelectedFiltersText()}
              className="w-full px-4 py-2.5 pl-9 rounded-lg bg-[#F9F9FC] border border-[#E1E2E7] focus:outline-none focus:border-[#E1E2E7] placeholder:text-[#9BA3AF]"
              disabled
            />
            <div className="absolute left-3.5 top-[32%]">
              <img
                src="/placeholder_search.svg"
                alt="검색"
                width={16}
                height={16}
              />
            </div>
          </div>
          <button
            onClick={handleReset}
            className="ml-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            선택 초기화
          </button>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 border border-[#E1E2E7] h-[480px]">
              <h3 className="text-lg font-medium mb-4 text-center">지역별</h3>
              <div className="flex h-[calc(100%-40px)]">
                <div className="w-[140px] bg-gray-50 rounded-xl p-4 border border-[#E1E2E7]">
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => handleRegionClick(region.id)}
                      className={`w-full text-left mb-3 text-sm whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                        activeRegion === region.id
                          ? "bg-[#FFB230] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
                <div className="flex-1 pl-4">
                  <div className="grid grid-cols-1 gap-2">
                    {regions
                      .find((r) => r.id === activeRegion)
                      ?.subRegions.map((region) => (
                        <div
                          key={region.id}
                          className="flex items-center group"
                        >
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              id={region.id}
                              checked={selectedRegions.includes(region.id)}
                              onChange={() => handleRegionToggle(region.id)}
                              className="peer w-4 h-4 rounded border border-[#858D9D] text-[#FFB230] focus:ring-[#FFB230] focus:ring-2 focus:ring-offset-2 cursor-pointer appearance-none checked:bg-[#FFB230] checked:border-[#FFB230] transition-colors"
                            />
                            <svg
                              className="absolute w-4 h-4 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"
                                fill="currentColor"
                              />
                            </svg>
                            <label
                              htmlFor={region.id}
                              className={`ml-2 text-sm cursor-pointer select-none ${
                                selectedRegions.includes(region.id)
                                  ? "text-[#FFB230] font-medium"
                                  : "text-gray-700 group-hover:text-gray-900"
                              }`}
                            >
                              {region.name}
                            </label>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 border border-[#E1E2E7] h-[480px]">
              <h3 className="text-lg font-medium mb-4 text-center">장르</h3>
              <div className="grid grid-cols-3 gap-3 h-[calc(100%-40px)] content-start">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreToggle(genre.id)}
                    className={`h-11 rounded-xl bg-gray-50 flex items-center justify-center ${
                      selectedGenres.includes(genre.id)
                        ? "border-2 border-[#FFB230] text-[#FFB230]"
                        : "border border-[#E1E2E7] text-gray-900 hover:border-gray-200"
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 border border-[#E1E2E7] h-[480px]">
              <h3 className="text-lg font-medium mb-4 text-center">인원</h3>
              <div className="grid grid-cols-2 gap-2 h-[calc(100%-40px)]">
                {participants.map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => handleParticipantToggle(participant.id)}
                    className={`px-4 py-2 rounded-xl bg-gray-50 ${
                      selectedParticipant === participant.id
                        ? "border-2 border-[#FFB230] text-[#FFB230]"
                        : "border border-[#E1E2E7] text-gray-900 hover:border-gray-200"
                    }`}
                  >
                    {participant.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleApply}
            className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            필터 적용
          </button>
        </div>
      </div>
    </div>
  );
}
