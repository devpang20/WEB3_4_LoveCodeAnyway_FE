"use client";

import { createContext, use, useState } from "react";

import { useRouter } from "next/navigation";

import client from "@/lib/backend/client";

import { components } from "@/lib/backend/apiV1/schema";

type Member = components["schemas"]["BasicProfileResponse"] & {
  id: number;
};

export const LoginMemberContext = createContext<{
  loginMember: Member;
  setLoginMember: (member: Member) => void;
  isLoginMemberPending: boolean;
  isLogin: boolean;
  logout: (callback: () => void) => void;
  logoutAndHome: () => void;
}>({
  loginMember: {
    id: 0,
    nickname: "",
    gender: "BLIND",
    introduction: "",
    profilePictureUrl: undefined,
    mannerScore: undefined,
  },
  setLoginMember: () => {},
  isLoginMemberPending: true,
  isLogin: false,
  logout: (callback: () => void) => {},
  logoutAndHome: () => {},
});

function createEmptyMember(): Member {
  return {
    id: 0,
    nickname: "",
    gender: "BLIND",
    introduction: "",
    profilePictureUrl: undefined,
    mannerScore: undefined,
  };
}

export function useLoginMember() {
  const router = useRouter();

  const [isLoginMemberPending, setLoginMemberPending] = useState(true);
  const [loginMember, _setLoginMember] = useState<Member>(createEmptyMember());

  const removeLoginMember = () => {
    _setLoginMember(createEmptyMember());
    setLoginMemberPending(false);
  };

  const setLoginMember = (member: Member) => {
    _setLoginMember(member);
    setLoginMemberPending(false);
  };

  const setNoLoginMember = () => {
    setLoginMemberPending(false);
  };

  const isLogin = loginMember && loginMember.id !== 0;

  const logout = (callback: () => void) => {
    client.DELETE("/api/v1/members/logout", {}).then(() => {
      removeLoginMember();
      callback();
    });
  };

  const logoutAndHome = () => {
    logout(() => router.replace("/"));
  };

  return {
    loginMember,
    setLoginMember,
    isLoginMemberPending,
    setNoLoginMember,
    isLogin,
    logout,
    logoutAndHome,
  };
}

export function useGlobalLoginMember() {
  return use(LoginMemberContext);
}
