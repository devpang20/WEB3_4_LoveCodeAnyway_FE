"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useGlobalLoginMember } from "@/stores/auth/loginMember";
import { useRouter } from "next/navigation";

// 알림 데이터 타입 직접 정의
interface Alarm {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  readStatus: boolean;
  alarmType: "SYSTEM" | "MESSAGE" | "SUBSCRIBE" | string;
}

export function Navigation({ activePage }: { activePage?: string }) {
  const router = useRouter();
  const { isLogin, loginMember, logoutAndHome } =
    useGlobalLoginMember();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Alarm[]>([]);
  const [mounted, setMounted] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // 드롭다운 요소에 대한 참조 추가
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isLogin) {
      fetchNotifications();
      // SSE 연동 코드 임시 주석 처리
      // subscribeToNotifications();
    }
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isLogin]);

  // 외부 클릭 감지를 위한 이벤트 리스너 추가
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 프로필 메뉴가 열려있고, 클릭이 프로필 메뉴 외부에서 발생했을 때
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      // 알림 메뉴가 열려있고, 클릭이 알림 메뉴 외부에서 발생했을 때
      if (
        isNotificationOpen &&
        notificationMenuRef.current &&
        notificationButtonRef.current &&
        !notificationMenuRef.current.contains(event.target as Node) &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    // 문서에 클릭 이벤트 리스너 추가
    document.addEventListener("mousedown", handleClickOutside);

    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen, isNotificationOpen]);

  const fetchNotifications = async () => {
    try {
      // 임의의 알림 데이터 사용
      const mockNotifications: Alarm[] = [
        {
          id: 1,
          title: "새로운 모임이 생성되었습니다",
          content: "관심 테마의 새로운 모임이 생성되었습니다. 확인해보세요!",
          createdAt: new Date().toISOString(),
          readStatus: false,
          alarmType: "SYSTEM",
        },
        {
          id: 2,
          title: "새 메시지가 도착했습니다",
          content: "모임장으로부터 새 메시지가 도착했습니다.",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          readStatus: true,
          alarmType: "MESSAGE",
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("알림 목록 조회 실패:", error);
      // 오류 발생 시 기본 데이터 유지
    }
  };

  const subscribeToNotifications = () => {
    // SSE 관련 코드 임시 주석 처리
    /*
    const sse = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/alarms/subscribe`,
      {
        withCredentials: true,
      }
    );

    sse.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
    };

    sse.onerror = () => {
      sse.close();
    };

    setEventSource(sse);
    */
  };

  const markAsRead = async (id: number) => {
    try {
      // API 호출 없이 상태만 업데이트
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, readStatus: true }
            : notification
        )
      );
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // API 호출 없이 상태만 업데이트
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, readStatus: true }))
      );
    } catch (error) {
      console.error("전체 알림 읽음 처리 실패:", error);
    }
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    if (isNotificationOpen) setIsNotificationOpen(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-black z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="도망"
                width={78}
                height={33}
                priority
              />
            </Link>
            <div className="flex space-x-6">
              <Link
                href="/themes"
                className={`${
                  activePage === "themes"
                    ? "text-[#FFD896]"
                    : "text-gray-300 hover:text-[#FFD896]"
                } text-base font-bold`}
              >
                방탈출 테마
              </Link>
              <Link
                href="/parties"
                className={`${
                  activePage === "parties"
                    ? "text-[#FFD896]"
                    : "text-gray-300 hover:text-[#FFD896]"
                } text-base font-bold`}
              >
                모임 탐색
              </Link>
              {isLogin && (
                <Link
                  href="/my/diary"
                  className={`${
                    activePage === "my-diary"
                      ? "text-[#FFD896]"
                      : "text-gray-300 hover:text-[#FFD896]"
                  } text-base font-bold`}
                >
                  나의 탈출일지
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isLogin ? (
              <>
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={toggleNotification}
                    className="text-gray-300 hover:text-[#FFD896]"
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {notifications.some((n) => !n.readStatus) && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div
                      ref={notificationMenuRef}
                      className="absolute right-0 -mt-1 w-80 bg-[#FFF8EC] rounded-lg shadow-lg py-2 z-50"
                    >
                      <div className="flex items-center px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[#FFB230] text-xl font-bold">
                            알림
                          </span>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            알림이 없습니다.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 border-b border-gray-100 ${
                                !notification.readStatus ? "bg-[#FFFCF7]" : ""
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        notification.alarmType === "SYSTEM"
                                          ? "bg-orange-100 text-orange-600"
                                          : notification.alarmType === "MESSAGE"
                                          ? "bg-blue-100 text-blue-600"
                                          : "bg-green-100 text-green-600"
                                      }`}
                                    >
                                      {notification.alarmType === "SYSTEM"
                                        ? "시스템"
                                        : notification.alarmType === "MESSAGE"
                                        ? "메시지"
                                        : notification.alarmType === "SUBSCRIBE"
                                        ? "구독"
                                        : "기타"}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400">
                                      {new Date(
                                        notification.createdAt
                                      ).toLocaleDateString("ko-KR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <h4 className="font-medium mt-1">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {notification.content}
                                  </p>

                                  {!notification.readStatus && (
                                    <div className="flex justify-end mt-1">
                                      <button
                                        onClick={() =>
                                          markAsRead(notification.id)
                                        }
                                        className="text-[#FFB230] text-xs flex items-center"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        읽음
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2 border-t border-gray-100">
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center text-[#FFB230] text-sm font-medium"
                        >
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          전체 읽음
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    ref={profileButtonRef}
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-2 hover:opacity-80"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-700 flex items-center justify-center">
                      {loginMember && (
                        <Image
                          src={
                            loginMember.profilePictureUrl ||
                            "/default-profile.svg"
                          }
                          alt={loginMember.nickname || "프로필 이미지"}
                          className="w-full h-full object-cover"
                          width={32}
                          height={32}
                        />
                      )}
                    </div>
                    <span className="text-gray-300 text-sm font-medium">
                      {loginMember?.nickname || "사용자"}
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      ref={profileMenuRef}
                      className="absolute right-0 -mt-1 w-48 bg-[#FFF8EC] rounded-lg shadow-lg py-1 z-50"
                    >
                      <Link
                        href="/my"
                        className="block px-4 py-3 text-base font-medium text-gray-500 hover:bg-[#FFFCF7]"
                      >
                        마이페이지
                      </Link>
                      <Link
                        href="/my/history"
                        className="block px-4 py-3 text-base font-medium text-gray-500 hover:bg-[#FFFCF7]"
                      >
                        모임 히스토리
                      </Link>
                      <Link
                        href="/my/stat"
                        className="block px-4 py-3 text-base font-medium text-gray-500 hover:bg-[#FFFCF7]"
                      >
                        통계
                      </Link>
                      <Link
                        href="/my/inquiry"
                        className="block px-4 py-3 text-base font-medium text-gray-500 hover:bg-[#FFFCF7]"
                      >
                        1:1 문의
                      </Link>
                      <div className="border-t border-gray-100">
                        <button
                          onClick={logoutAndHome}
                          className="block w-full text-left px-4 py-3 text-base font-medium text-gray-500 hover:bg-[#FFFCF7]"
                        >
                          로그아웃
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-[#FFB130] hover:text-[#FFA000] transition-colors mr-4"
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
