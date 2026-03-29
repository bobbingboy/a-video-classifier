import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useMatch, useSearchParams } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  Pagination,
  Stack,
} from "@mui/material";
import FilterSidebar from "./components/FilterSidebar";
import SearchBar from "./components/SearchBar";
import VideoGrid from "./components/VideoGrid";
import VideoDetailPage from "./pages/VideoDetail";
import ScanPage from "./pages/ScanPage";
import { type VideoSummary, videosApi } from "./api/videos";

const DRAWER_WIDTH = 220;
const PAGE_SIZE = 24;
const APPBAR_HEIGHT = 49;

function NavButton({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  const match = useMatch(to);
  return (
    <Button
      onClick={() => navigate(to)}
      sx={{
        color: match ? "primary.main" : "text.secondary",
        borderBottom: match ? "2px solid" : "2px solid transparent",
        borderRadius: 0,
        fontSize: 14,
      }}
    >
      {label}
    </Button>
  );
}

// 持久 Layout：sidebar 固定，右側內容區隨路由切換
function LibraryLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const actor = searchParams.get("actor") ?? "";
  const tag = searchParams.get("tag") ?? "";

  const setActor = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set("actor", val); else next.delete("actor");
      next.delete("page");
      return next;
    });
  };

  const setTag = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set("tag", val); else next.delete("tag");
      next.delete("page");
      return next;
    });
  };

  return (
    <Box sx={{ display: "flex", height: `calc(100vh - ${APPBAR_HEIGHT}px)` }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            top: APPBAR_HEIGHT,
            height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
            borderRight: "1px solid #222",
            bgcolor: "background.default",
            overflowY: "auto",
          },
        }}
      >
        <FilterSidebar
          selectedActor={actor}
          selectedTag={tag}
          onActorChange={(a) => { setActor(a); navigate({ pathname: "/", search: `?actor=${encodeURIComponent(a)}` }); }}
          onTagChange={setTag}
        />
      </Drawer>

      <Box component="main" sx={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<LibraryPage actor={actor} tag={tag} />} />
          <Route path="/video/:id" element={<VideoDetailPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function LibraryPage({ actor, tag }: { actor: string; tag: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [total, setTotal] = useState(0);
  const currentPage = Number(searchParams.get("page") ?? "1");

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p === 1) next.delete("page"); else next.set("page", String(p));
      return next;
    });
  };

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (q) next.set("q", q); else next.delete("q");
      next.delete("page");
      return next;
    });
  }, [q]);

  useEffect(() => {
    videosApi
      .list({
        page: currentPage,
        page_size: PAGE_SIZE,
        q: q || undefined,
        actor: actor || undefined,
        tag: tag || undefined,
      })
      .then((r) => {
        setVideos(r.data.items);
        setTotal(r.data.total);
      });
  }, [q, actor, tag, currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <SearchBar value={q} onChange={setQ} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        共 {total} 部影片
      </Typography>
      <VideoGrid videos={videos} onSelect={(id) => navigate(`/video/${id}`)} />
      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}

export default function App() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky">
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "primary.main", mr: 2, fontSize: 16 }}
          >
            VideoLib
          </Typography>
          <NavButton to="/" label="影片庫" />
          <NavButton to="/scan" label="掃描" />
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/*" element={<LibraryLayout />} />
      </Routes>
    </Box>
  );
}
