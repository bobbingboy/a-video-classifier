import {
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { type VideoSummary } from "../api/videos";

interface Props {
  videos: VideoSummary[];
  onSelect: (id: number) => void;
}

function coverSrc(path: string | null): string {
  if (!path) return "";
  return `http://localhost:8000/${path}`;
}

const STATUS_COLOR: Record<string, string> = {
  ok: "#22c55e",
  unmatched: "#f59e0b",
  needs_manual_review: "#ef4444",
};

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
                {v.cover_local_path ? (
                  <CardMedia
                    component="img"
                    image={coverSrc(v.cover_local_path)}
                    alt={v.title || v.code}
                    sx={{ aspectRatio: "16/9", objectFit: "cover" }}
                  />
                ) : (
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
                )}
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
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
