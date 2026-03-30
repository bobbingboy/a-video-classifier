import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Typography,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import { type ActorWithCount, type TagWithCount, actorsApi, tagsApi } from "../api/videos";

interface Props {
  selectedActor: string;
  selectedTags: string[];
  selectedStatus: string;
  noCover: boolean;
  onActorChange: (name: string) => void;
  onTagAdd: (name: string) => void;
  onTagRemove: (name: string) => void;
  onStatusChange: (status: string) => void;
  onNoCoverChange: (val: boolean) => void;
}

export default function FilterSidebar({ selectedActor, selectedTags, selectedStatus, noCover, onActorChange, onTagAdd, onTagRemove, onStatusChange, onNoCoverChange }: Props) {
  const [actors, setActors] = useState<ActorWithCount[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [actorQ, setActorQ] = useState("");
  const [tagQ, setTagQ] = useState("");
  const [refetchingId, setRefetchingId] = useState<number | null>(null);

  useEffect(() => {
    actorsApi.list().then((r) => setActors(r.data));
    tagsApi.list().then((r) => setTags(r.data));
  }, []);

  const filteredActors = actorQ
    ? actors.filter((a) => a.name.toLowerCase().includes(actorQ.toLowerCase()))
    : actors.slice(0, 50);

  const filteredTags = tagQ
    ? tags.filter((t) => t.name.toLowerCase().includes(tagQ.toLowerCase()))
    : tags.slice(0, 80);

  return (
    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>

      {/* 狀態篩選 */}
      <Box>
        <Typography variant="overline" color="text.disabled" sx={{ fontSize: 10, letterSpacing: 1.2 }}>
          狀態
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
          <Chip
            label="未辨識"
            size="small"
            onClick={() => onStatusChange(selectedStatus === "unmatched" ? "" : "unmatched")}
            variant={selectedStatus === "unmatched" ? "filled" : "outlined"}
            color={selectedStatus === "unmatched" ? "warning" : "default"}
            sx={{ justifyContent: "flex-start", fontSize: 12 }}
          />
          <Chip
            label="無封面"
            size="small"
            onClick={() => onNoCoverChange(!noCover)}
            variant={noCover ? "filled" : "outlined"}
            color={noCover ? "warning" : "default"}
            sx={{ justifyContent: "flex-start", fontSize: 12 }}
          />
        </Stack>
      </Box>

      <Divider />

      {/* 演員 */}
      <Box>
        <Typography variant="overline" color="text.disabled" sx={{ fontSize: 10, letterSpacing: 1.2 }}>
          演員
        </Typography>

        <TextField
          size="small"
          fullWidth
          placeholder="搜尋演員..."
          value={actorQ}
          onChange={(e) => setActorQ(e.target.value)}
          sx={{ mt: 0.75, mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 14, color: "text.disabled" }} />
              </InputAdornment>
            ),
            sx: { fontSize: 13 },
          }}
        />

        {selectedActor && (
          <Chip
            label={selectedActor}
            size="small"
            onDelete={() => onActorChange("")}
            color="primary"
            sx={{ mb: 1, maxWidth: "100%", fontSize: 12 }}
          />
        )}

        <Stack spacing={0.25}>
          {filteredActors
            .filter((a) => a.name !== selectedActor)
            .map((a) => (
              <Box
                key={a.id}
                onClick={() => onActorChange(a.name)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 1,
                  py: 0.4,
                  borderRadius: 1,
                  cursor: "pointer",
                  gap: 1,
                  "&:hover": { bgcolor: "action.hover" },
                  "&:hover .actor-rescan-btn": { opacity: 1 },
                  "& .actor-rescan-btn": { opacity: 0, transition: "opacity 0.15s" },
                }}
              >
                <Avatar
                  src={a.photo_local_path ? `http://localhost:8000/${a.photo_local_path}` : undefined}
                  alt={a.name}
                  sx={{ width: 24, height: 24, fontSize: 11, flexShrink: 0 }}
                >
                  {a.name.charAt(0)}
                </Avatar>
                <Typography variant="body2" noWrap sx={{ fontSize: 13, flex: 1 }}>
                  {a.name}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                  {a.video_count}
                </Typography>
                <Tooltip title="重新掃描此演員所有影片" placement="right">
                  <IconButton
                    className="actor-rescan-btn"
                    size="small"
                    disabled={refetchingId === a.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setRefetchingId(a.id);
                      try {
                        await actorsApi.refetchVideos(a.id);
                      } finally {
                        setRefetchingId(null);
                      }
                    }}
                    sx={{ p: 0.25, color: "text.disabled", flexShrink: 0 }}
                  >
                    <SyncIcon sx={{ fontSize: 14, animation: refetchingId === a.id ? "spin 1s linear infinite" : "none" }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
        </Stack>
      </Box>

      <Divider />

      {/* 分類 */}
      <Box>
        <Typography variant="overline" color="text.disabled" sx={{ fontSize: 10, letterSpacing: 1.2 }}>
          分類
        </Typography>

        <TextField
          size="small"
          fullWidth
          placeholder="搜尋分類..."
          value={tagQ}
          onChange={(e) => setTagQ(e.target.value)}
          sx={{ mt: 0.75, mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 14, color: "text.disabled" }} />
              </InputAdornment>
            ),
            sx: { fontSize: 13 },
          }}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {filteredTags.map((t) => {
            const isSelected = selectedTags.includes(t.name);
            return (
              <Chip
                key={t.id}
                label={t.name}
                size="small"
                color={isSelected ? "primary" : "default"}
                variant={isSelected ? "filled" : "outlined"}
                onClick={() => isSelected ? onTagRemove(t.name) : onTagAdd(t.name)}
                sx={{
                  fontSize: 11,
                  height: 22,
                  cursor: "pointer",
                  ...(!isSelected && {
                    bgcolor: "action.selected",
                    "&:hover": { bgcolor: "action.hover" },
                  }),
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
