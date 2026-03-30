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
  tags: Tag[];
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

export interface TagFacet {
  name: string;
  count: number;
}

export interface VideoListResponse {
  total: number;
  page: number;
  page_size: number;
  items: VideoSummary[];
  tag_facets?: TagFacet[];
}

export interface ActorWithCount extends Actor {
  video_count: number;
  photo_local_path: string | null;
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
    tag?: string[];
    status?: string;
    no_cover?: boolean;
    exclude_unmatched?: boolean;
    include_facets?: boolean;
  }) => client.get<VideoListResponse>("/api/videos", {
    params,
    paramsSerializer: (p) => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          v.forEach((item) => sp.append(k, String(item)));
        } else {
          sp.append(k, String(v));
        }
      }
      return sp.toString();
    },
  }),

  get: (id: number) => client.get<VideoDetail>(`/api/videos/${id}`),

  update: (id: number, data: VideoUpdate) =>
    client.put<VideoDetail>(`/api/videos/${id}`, data),

  refetch: (id: number, code?: string) =>
    client.post<{ status: string; code: string; cover_local_path: string | null }>(
      `/api/videos/${id}/fetch`,
      null,
      { params: code ? { code } : undefined },
    ),

  setTitle: (id: number, title: string) =>
    client.post<{ status: string }>(`/api/videos/${id}/set-title`, { title }),

  search: (q: string, pageSize = 5) =>
    client.get<VideoListResponse>("/api/videos", {
      params: { q, page_size: pageSize, exclude_unmatched: true },
    }),
};

export interface CodePreview {
  found: boolean;
  title?: string;
  cover_url?: string;
  studio?: string;
  actors?: string[];
  tags?: string[];
  release_date?: string;
  source?: string;
}

export const scanApi = {
  // folder_paths 為空陣列時後端會改讀 VIDEOS_FOLDERS env
  start: (folder_paths: string[], force = false) =>
    client.post("/api/scan", { folder_paths: folder_paths.length ? folder_paths : null, force }),

  status: () => client.get<ScanStatus>("/api/scan/status"),

  localCovers: (force = false) =>
    client.post<{ matched: number; skipped: number }>(`/api/scan/local-covers?force=${force}`),

  preview: (code: string) =>
    client.get<CodePreview>("/api/scan/preview", { params: { code } }),
};

export const actorsApi = {
  list: () => client.get<ActorWithCount[]>("/api/actors"),
  getPhoto: (id: number) => client.get<{ photo_url: string | null }>(`/api/actors/${id}/photo`),
  refetchVideos: (id: number) =>
    client.post<{ status: string; count: number; actor: string }>(`/api/actors/${id}/refetch`),
  getTags: (actorName: string) =>
    client.get<TagWithCount[]>(`/api/actors/${encodeURIComponent(actorName)}/tags`),
};

export const tagsApi = {
  list: () => client.get<TagWithCount[]>("/api/tags"),
};
