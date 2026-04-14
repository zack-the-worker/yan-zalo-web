export interface Member {
  id: string;
  dName: string;
  zaloName: string;
  avatar: string;
  accountStatus: number;
  type: number;
}

export interface GroupData {
  groupId: string;
  name: string;
  desc: string;
  avt: string;
  totalMember: number;
  hasMoreMember: number;
  currentMems: Member[];
}
