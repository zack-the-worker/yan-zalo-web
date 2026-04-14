export interface StickerDetail {
  id: number;
  cateId: number;
  type: number;
  stickerUrl: string;
  stickerWebpUrl: string | null;
  text: string;
}

export type Tab = "direct" | "group";

export type PickerTab = "emoji" | "sticker" | "poll";

export type QuickMessage = {
  id: number;
  keyword: string;
  type: number;
  createdTime: number;
  lastModified: number;
  message: {
    title: string;
    params: string | null;
  };
  media: {
    items: {
      type: number;
      photoId: number;
      title: string;
      width: number;
      height: number;
      previewThumb: string;
      rawUrl: string;
      thumbUrl: string;
      normalUrl: string;
      hdUrl: string;
    }[];
  } | null;
};

export interface PollOption {
  id: string;
  name: string;
  votes: number;
}

export interface PollDetail {
  pollId: number;
  question: string;
  options: PollOption[];
  creator: string;
  expiredTime: number;
  isLocked: boolean;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  groupId: string;
  expiredTime?: number;
  allowMultiChoices?: boolean;
  isAnonymous?: boolean;
}
