import { useState } from "react";
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  Skeleton,
} from "@mui/material";
import { type VideoSummary } from "../api/videos";

interface Props {
  videos: VideoSummary[];
  onSelect: (id: number) => void;
}

function coverSrc(video: VideoSummary): string {
  return `http://localhost:8000/api/videos/${video.id}/cover`;
}

const STATUS_COLOR: Record<string, string> = {
  ok: "#22c55e",
  unmatched: "#f59e0b",
  needs_manual_review: "#ef4444",
};

function CoverImage({ video }: { video: VideoSummary }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!video.cover_local_path || error) {
    return (
      <Box
        sx={{
          aspectRatio: "16/9",
          bgcolor: "#1e1e1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" color="text.disabled">No Cover</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      )}
      <Box
        component="img"
        src={coverSrc(video)}
        alt={video.title || video.code}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease-in",
        }}
      />
    </Box>
  );
}

export default function VideoGrid({ videos, onSelect }: Props) {
  return (
    <Grid container spacing={1.5}>
      {videos.map((v) => (
        <Grid key={v.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              transition: "transform 0.15s, box-shadow 0.15s",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              },
            }}
          >
            <CardActionArea onClick={() => onSelect(v.id)} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              <Box sx={{ position: "relative" }}>
                <CoverImage video={v} />
                {v.status !== "ok" && (
                  <Box sx={{ position: "absolute", top: 6, right: 6 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: STATUS_COLOR[v.status] ?? "#888",
                        boxShadow: `0 0 6px ${STATUS_COLOR[v.status] ?? "#888"}`,
                      }}
                    />
                  </Box>
                )}
              </Box>
              <CardContent sx={{ p: "8px !important", flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="primary.light"
                  display="block"
                  sx={{ letterSpacing: 0.5 }}
                >
                  {v.code}
                </Typography>
                {v.title && (
                  <Typography
                    variant="caption"
                    display="block"
                    noWrap
                    color="text.secondary"
                    sx={{ mt: 0.25, fontSize: 11 }}
                  >
                    {v.title}
                  </Typography>
                )}
                {v?.tags?.length > 0 && (
                  <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {v.tags.slice(0, 4).map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{ height: 16, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }}
                      />
                    ))}
                    {v.tags.length > 4 && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, alignSelf: "center" }}>
                        +{v.tags.length - 4}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
