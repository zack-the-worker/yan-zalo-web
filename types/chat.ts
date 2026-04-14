export interface StickerDetail {
  id: number;
  cateId: number;
  type: number;
  stickerUrl: string;
  stickerWebpUrl: string | null;
  text: string;
}

export type Tab = "direct" | "group";

export type PickerTab = "emoji" | "sticker";

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
