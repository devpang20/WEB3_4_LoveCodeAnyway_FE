"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LoginMemberContext, useLoginMember } from "@/stores/auth/loginMember";
import client from "@/lib/backend/client";
import { PageLoading } from "@/components/PageLoading";
import { Navigation } from "@/components/layout/Navigation";

export function ClientLayout({
  children,
}: React.ComponentProps<typeof NextThemesProvider>) {
  const {
    loginMember,
    setLoginMember,
    isLoginMemberPending,
    setNoLoginMember,
    isLogin,
    logout,
    logoutAndHome,
  } = useLoginMember();

  const loginMemberContextValue = {
    loginMember,
    setLoginMember,
    isLoginMemberPending,
    setNoLoginMember,
    isLogin,
    logout,
    logoutAndHome,
  };

  const fetchMember = () => {
    client
      .GET("/api/v1/members/me", {})
      .then((res) => {
        if (res.error) {
          // 로그인되지 않은 상태로 처리
          setNoLoginMember();
          return;
        }
        // API 응답에서 data 필드의 멤버 정보를 추출
        if (res.data && res.data.data) {
          setLoginMember(res.data.data);
        } else {
          setNoLoginMember();
        }
      })
      .catch((error) => {
        // 에러 발생 시 (302 포함) 로그인되지 않은 상태로 처리
        setNoLoginMember();
      });
  };

  useEffect(() => {
    fetchMember();
  }, []);

  if (isLoginMemberPending) {
    return <PageLoading isLoading={true} />;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LoginMemberContext value={loginMemberContextValue}>
        <Navigation />
        <main>{children}</main>
      </LoginMemberContext>
    </NextThemesProvider>
  );
}
