import {
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Box,
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

export default function VideoGrid({ videos, onSelect }: Props) {
  return (
    <Grid container spacing={1.5}>
      {videos.map((v) => (
        <Grid key={v.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
          <Card sx={{ height: "100%" }}>
            <CardActionArea onClick={() => onSelect(v.id)} sx={{ height: "100%" }}>
              {v.cover_local_path ? (
                <CardMedia
                  component="img"
                  image={coverSrc(v.cover_local_path)}
                  alt={v.title || v.code}
                  sx={{ aspectRatio: "2/3", objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    aspectRatio: "2/3",
                    bgcolor: "#2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="caption" color="text.disabled">
                    No Cover
                  </Typography>
                </Box>
              )}
              <CardContent sx={{ p: "6px 8px !important" }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">
                  {v.code}
                </Typography>
                {v.title && (
                  <Typography
                    variant="caption"
                    display="block"
                    noWrap
                    sx={{ mt: 0.25 }}
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
