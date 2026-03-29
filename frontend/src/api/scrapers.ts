import client from "./client";

export interface SourceStats {
  attempts: number;
  successes: number;
  success_rate: number | null;
  in_cooldown: boolean;
  cooldown_until: string | null;
}

export interface ScraperSource {
  id: number;
  name: string;
  enabled: boolean;
  parse_mode: "builtin" | "selectors";
  builtin_key: string | null;
  base_urls: string[];
  access_mode: "direct" | "search";
  search_url_pattern: string | null;
  result_link_selector: string | null;
  result_code_selector: string | null;
  selectors: Record<string, unknown> | null;
  created_at: string;
  stats: SourceStats | null;
}

export interface SourcePayload {
  name: string;
  enabled: boolean;
  parse_mode: "builtin" | "selectors";
  builtin_key: string | null;
  base_urls: string[];
  access_mode: "direct" | "search";
  search_url_pattern: string | null;
  result_link_selector: string | null;
  result_code_selector: string | null;
  selectors: Record<string, unknown> | null;
}

export interface PresetInfo {
  name: string;
  display_name: string;
  source_count: number;
  already_imported: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

export interface TestRequest {
  code: string;
  name?: string;
  parse_mode: "builtin" | "selectors";
  builtin_key: string | null;
  base_urls: string[];
  access_mode: "direct" | "search";
  search_url_pattern: string | null;
  result_link_selector: string | null;
  result_code_selector: string | null;
  selectors: Record<string, unknown> | null;
}

export interface TestResult {
  found: boolean;
  attempted_urls?: string[];
  title?: string | null;
  cover_url?: string | null;
  studio?: string | null;
  release_date?: string | null;
  actors?: string[];
  tags?: string[];
  source?: string | null;
  error?: string | null;
}

export const scrapersApi = {
  getSources: () => client.get<ScraperSource[]>("/api/scrapers/sources"),
  createSource: (data: SourcePayload) =>
    client.post<ScraperSource>("/api/scrapers/sources", data),
  updateSource: (id: number, data: SourcePayload) =>
    client.put<ScraperSource>(`/api/scrapers/sources/${id}`, data),
  deleteSource: (id: number) =>
    client.delete(`/api/scrapers/sources/${id}`),
  getPresets: () => client.get<PresetInfo[]>("/api/scrapers/presets"),
  importPreset: (name: string) =>
    client.post<ImportResult>(`/api/scrapers/presets/${name}/import`),
  testSource: (data: TestRequest) =>
    client.post<TestResult>("/api/scrapers/sources/test", data),
};
