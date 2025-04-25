"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import client from "@/lib/backend/client";

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : process.env.NODE_ENV === "development"
  ? "http://localhost:8080"
  : "https://api.ddobang.site";

interface InquiryDetail {
  id: number;
  type: "QNA" | "REPORT" | "THEME";
  title: string;
  content: string;
  createdAt: string;
  attachments: {
    id: number;
    fileName: string;
  }[];
  replies: {
    content: string;
    createdAt: string;
    nickname: string;
  }[];
}

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inquiryId = Number(params.id);

  useEffect(() => {
    const fetchInquiryDetail = async () => {
      try {
        setIsLoading(true);
        const response = await client.GET("/api/v1/boards/{id}", {
          params: {
            path: {
              id: inquiryId,
            },
          },
        });

        if (response.data?.data) {
          setInquiry(response.data.data as InquiryDetail);
        } else {
          setError("해당 문의를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("문의 상세 조회 에러:", error);
        setError("문의 내용을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiryDetail();
  }, [inquiryId]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await client.DELETE("/api/v1/boards/{id}", {
        params: {
          path: {
            id: inquiryId,
          },
        },
      });
      alert("문의가 삭제되었습니다.");
      router.push("/my/inquiry");
    } catch (error) {
      console.error("문의 삭제 에러:", error);
      alert("문의 삭제에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">문의를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 문의 내용 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-sm text-gray-600 mb-2 block">
                  {inquiry.type === "QNA" && "사이트 이용 문의"}
                  {inquiry.type === "REPORT" && "신고"}
                  {inquiry.type === "THEME" && "테마 관련"}
                </span>
                <h1 className="text-2xl font-bold">{inquiry.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    inquiry.replies?.length > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {inquiry.replies?.length > 0 ? "답변 완료" : "답변 대기"}
                </span>
                {!inquiry.replies?.length && (
                  <div className="flex gap-2">
                    <Link
                      href={`/my/inquiry/edit/${inquiryId}`}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      수정
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">작성시간</span>
                  <span className="ml-2">{inquiry.createdAt}</span>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium mb-2">내용</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {inquiry.content}
                </p>
              </div>

              {inquiry.attachments.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium mb-2">첨부 파일</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {inquiry.attachments.map((file, index) => (
                      <a
                        key={file.id}
                        href={`/api/v1/posts/attachment/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="aspect-square relative rounded-lg overflow-hidden border">
                          <Image
                            src={`/api/v1/posts/attachment/${file.id}`}
                            alt={file.fileName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 답변 내용 */}
        {inquiry.replies?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-8">
              <h2 className="text-xl font-bold mb-6">답변 내용</h2>
              <div className="space-y-6">
                {inquiry.replies.map((reply, index) => (
                  <div key={index} className="space-y-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <div>
                        <span className="font-medium">닉네임</span>
                        <span className="ml-2">{reply.nickname}</span>
                      </div>
                      <div>
                        <span className="font-medium">작성시간</span>
                        <span className="ml-2">{reply.createdAt}</span>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-sm font-medium mb-2">내용</h2>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 목록으로 버튼 */}
        <Link
          href="/my/inquiry"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
