export interface UserInfo {
  uid: string;
  display_name: string;
  zalo_name: string;
  avatar: string;
  gender: number;
  status: string;
}

export interface LastOnlineResult {
  settings: { show_online_status: boolean };
  lastOnline: number;
}

export interface FriendRecInfo {
  userId: string;
  zaloName: string;
  displayName: string;
  avatar: string;
  phoneNumber: string;
  status: string;
  recommType: number;
  recommInfo: {
    suggestWay: number;
    source: number;
    message: string;
    customText: string | null;
  };
  isSeenFriendReq: boolean;
}

export interface FriendRecsResponse {
  recommItems: { recommItemType: number; dataInfo: FriendRecInfo }[];
  expiredDuration: number;
}
