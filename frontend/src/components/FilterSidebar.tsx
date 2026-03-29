import { useEffect, useState } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
} from "@mui/material";
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

  useEffect(() => {
    actorsApi.list().then((r) => setActors(r.data.slice(0, 50)));
    tagsApi.list().then((r) => setTags(r.data.slice(0, 50)));
  }, []);

  return (
    <Box sx={{ p: 1.5 }}>
      <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        演員
      </Typography>
      <List dense disablePadding>
        {selectedActor && (
          <ListItemButton selected onClick={() => onActorChange("")} sx={{ borderRadius: 1 }}>
            <ListItemText primary={`${selectedActor} ✕`} primaryTypographyProps={{ fontSize: 13 }} />
          </ListItemButton>
        )}
        {actors
          .filter((a) => a.name !== selectedActor)
          .map((a) => (
            <ListItemButton key={a.id} onClick={() => onActorChange(a.name)} sx={{ borderRadius: 1 }}>
              <ListItemText primary={a.name} primaryTypographyProps={{ fontSize: 13, noWrap: true }} />
              <ListItemSecondaryAction>
                <Typography variant="caption" color="text.disabled">{a.video_count}</Typography>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))}
      </List>

      <Typography variant="overline" color="text.secondary" display="block" sx={{ mt: 2, mb: 0.5 }}>
        分類
      </Typography>
      <List dense disablePadding>
        {selectedTag && (
          <ListItemButton selected onClick={() => onTagChange("")} sx={{ borderRadius: 1 }}>
            <ListItemText primary={`${selectedTag} ✕`} primaryTypographyProps={{ fontSize: 13 }} />
          </ListItemButton>
        )}
        {tags
          .filter((t) => t.name !== selectedTag)
          .map((t) => (
            <ListItemButton key={t.id} onClick={() => onTagChange(t.name)} sx={{ borderRadius: 1 }}>
              <ListItemText primary={t.name} primaryTypographyProps={{ fontSize: 13, noWrap: true }} />
              <ListItemSecondaryAction>
                <Typography variant="caption" color="text.disabled">{t.video_count}</Typography>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))}
      </List>
    </Box>
  );
}
