import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Typography,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { type ActorWithCount, type TagWithCount, actorsApi, tagsApi } from "../api/videos";

interface Props {
  selectedActor: string;
  selectedTag: string;
  onActorChange: (name: string) => void;
  onTagChange: (name: string) => void;
}

export default function FilterSidebar({ selectedActor, selectedTag, onActorChange, onTagChange }: Props) {
  const [actors, setActors] = useState<ActorWithCount[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [actorQ, setActorQ] = useState("");
  const [tagQ, setTagQ] = useState("");

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

        {selectedTag && (
          <Chip
            label={selectedTag}
            size="small"
            onDelete={() => onTagChange("")}
            color="primary"
            sx={{ mb: 1, maxWidth: "100%", fontSize: 12 }}
          />
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {filteredTags
            .filter((t) => t.name !== selectedTag)
            .map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                size="small"
                onClick={() => onTagChange(t.name)}
                sx={{
                  fontSize: 11,
                  height: 22,
                  bgcolor: "action.selected",
                  "&:hover": { bgcolor: "action.hover" },
                  cursor: "pointer",
                }}
              />
            ))}
        </Box>
      </Box>
    </Box>
  );
}
