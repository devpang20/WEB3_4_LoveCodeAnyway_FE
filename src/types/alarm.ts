export enum AlarmType {
  SYSTEM = "SYSTEM",            // 시스템 알림 - 관리자 알림 전부
  MESSAGE = "MESSAGE",          // 쪽지 왔을때 알림
  SUBSCRIBE = "SUBSCRIBE",      // 키워드 테마/모임 구독후 알림
  PARTY_APPLY = "PARTY_APPLY",  // 모임 신청 알림
  PARTY_STATUS = "PARTY_STATUS", // 모임 신청 상태 변경 알림
  ANSWER_COMMENT = "ANSWER_COMMENT", // 문의글에 답변이 달렸을때 알림
  POST_REPLY = "POST_REPLY",    // 문의 답변 알림
  OTHER = "OTHER"               // 기타 알림
}

export interface AlarmResponse {
  id: number;
  receiverId: number;
  title: string;
  content: string;
  readStatus: boolean;
  alarmType: AlarmType;
  relId: number;
  createdAt: string;
  modifiedAt: string;
}

export interface AlarmCountResponse {
  totalCount: number;
  unreadCount: number;
} 