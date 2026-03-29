import { useState, useEffect } from "react";
import FilterSidebar from "./components/FilterSidebar";
import SearchBar from "./components/SearchBar";
import VideoGrid from "./components/VideoGrid";
import VideoDetailPage from "./pages/VideoDetail";
import ScanPage from "./pages/ScanPage";
import { type VideoSummary, videosApi } from "./api/videos";

type Page = "library" | "scan" | "detail";

export default function App() {
  const [page, setPage] = useState<Page>("library");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("");
  const [tag, setTag] = useState("");
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 24;

  useEffect(() => {
    videosApi
      .list({ page: currentPage, page_size: PAGE_SIZE, q: q || undefined, actor: actor || undefined, tag: tag || undefined })
      .then((r) => {
        setVideos(r.data.items);
        setTotal(r.data.total);
      });
  }, [q, actor, tag, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [q, actor, tag]);

  const openDetail = (id: number) => {
    setSelectedId(id);
    setPage("detail");
  };

  const backToLibrary = () => {
    setPage("library");
    setSelectedId(null);
  };

  const handleActorClick = (name: string) => {
    setActor(name);
    setPage("library");
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ borderBottom: "1px solid #222", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontWeight: 700, fontSize: "16px", color: "#a5b4fc", cursor: "pointer" }} onClick={backToLibrary}>
          VideoLib
        </span>
        <button onClick={backToLibrary} style={navBtn(page === "library")}>影片庫</button>
        <button onClick={() => setPage("scan")} style={navBtn(page === "scan")}>掃描</button>
      </nav>

      {page === "scan" && <ScanPage />}

      {page === "detail" && selectedId !== null && (
        <VideoDetailPage videoId={selectedId} onBack={backToLibrary} onActorClick={handleActorClick} />
      )}

      {page === "library" && (
        <div style={{ display: "flex" }}>
          <div style={{ padding: "20px 16px", borderRight: "1px solid #222", minHeight: "calc(100vh - 49px)" }}>
            <FilterSidebar
              selectedActor={actor}
              selectedTag={tag}
              onActorChange={setActor}
              onTagChange={setTag}
            />
          </div>

          <div style={{ flex: 1, padding: "20px 24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <SearchBar value={q} onChange={setQ} />
            </div>
            <div style={{ marginBottom: "12px", fontSize: "13px", color: "#666" }}>
              共 {total} 部影片
            </div>
            <VideoGrid videos={videos} onSelect={openDetail} />

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn}>
                  ‹ 上一頁
                </button>
                <span style={{ lineHeight: "32px", color: "#888", fontSize: "13px" }}>
                  {currentPage} / {totalPages}
                </span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn}>
                  下一頁 ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn = (active: boolean): React.CSSProperties => ({
  background: "transparent",
  border: "none",
  color: active ? "#a5b4fc" : "#888",
  cursor: "pointer",
  fontSize: "14px",
  padding: "4px 8px",
  borderBottom: active ? "2px solid #a5b4fc" : "2px solid transparent",
});

const pageBtn: React.CSSProperties = {
  padding: "6px 14px",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#ccc",
  cursor: "pointer",
  fontSize: "13px",
};
