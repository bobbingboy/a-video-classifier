import client from "./client";

export interface Actor {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Studio {
  id: number;
  name: string;
}

export interface VideoSummary {
  id: number;
  code: string;
  title: string | null;
  cover_local_path: string | null;
  status: string;
  metadata_source: string | null;
}

export interface VideoDetail extends VideoSummary {
  file_path: string | null;
  cover_url: string | null;
  release_date: string | null;
  duration: string | null;
  created_at: string | null;
  updated_at: string | null;
  studio: Studio | null;
  actors: Actor[];
  tags: Tag[];
}

export interface VideoListResponse {
  total: number;
  page: number;
  page_size: number;
  items: VideoSummary[];
}

export interface ActorWithCount extends Actor {
  video_count: number;
}

export interface TagWithCount extends Tag {
  video_count: number;
}

export interface VideoUpdate {
  title?: string;
  release_date?: string;
  duration?: string;
  studio_name?: string;
  actor_names?: string[];
  tag_names?: string[];
  cover_url?: string;
}

export interface ScanStatus {
  running: boolean;
  processed: number;
  total: number;
  failed: number;
  errors: string[];
}

export const videosApi = {
  list: (params: {
    page?: number;
    page_size?: number;
    q?: string;
    actor?: string;
    tag?: string;
  }) => client.get<VideoListResponse>("/api/videos", { params }),

  get: (id: number) => client.get<VideoDetail>(`/api/videos/${id}`),

  update: (id: number, data: VideoUpdate) =>
    client.put<VideoDetail>(`/api/videos/${id}`, data),

  refetch: (id: number) => client.post(`/api/videos/${id}/fetch`),
};

export const scanApi = {
  // folder_paths 為空陣列時後端會改讀 VIDEOS_FOLDERS env
  start: (folder_paths: string[]) =>
    client.post("/api/scan", { folder_paths: folder_paths.length ? folder_paths : null }),

  status: () => client.get<ScanStatus>("/api/scan/status"),
};

export const actorsApi = {
  list: () => client.get<ActorWithCount[]>("/api/actors"),
};

export const tagsApi = {
  list: () => client.get<TagWithCount[]>("/api/tags"),
};
