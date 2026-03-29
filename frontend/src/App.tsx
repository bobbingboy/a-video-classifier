import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useMatch } from "react-router-dom";
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

function LibraryPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("");
  const [tag, setTag] = useState("");
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [q, actor, tag]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            top: 49,
            height: "calc(100% - 49px)",
            borderRight: "1px solid #222",
            bgcolor: "background.default",
          },
        }}
      >
        <FilterSidebar
          selectedActor={actor}
          selectedTag={tag}
          onActorChange={(a) => { setActor(a); navigate("/"); }}
          onTagChange={setTag}
        />
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3 }}>
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
              onChange={(_, p) => setCurrentPage(p)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        )}
      </Box>
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
            sx={{ fontWeight: 700, color: "primary.main", mr: 2, cursor: "pointer", fontSize: 16 }}
            onClick={() => {}}
          >
            VideoLib
          </Typography>
          <NavButton to="/" label="影片庫" />
          <NavButton to="/scan" label="掃描" />
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/video/:id" element={<VideoDetailPage />} />
      </Routes>
    </Box>
  );
}
