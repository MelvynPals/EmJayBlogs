// Constants describing reaction types for mapping in UI components.
// Wrapper icon components now source file-based SVG assets (see ReactionIcons.jsx)
import { LikeIcon, DislikeIcon, LoveIcon, FavoriteIcon } from './ReactionIcons';

export const REACTION_TYPES = [
  { key: 'like', Icon: LikeIcon, label: 'Like' },
  { key: 'dislike', Icon: DislikeIcon, label: 'Dislike' },
  { key: 'love', Icon: LoveIcon, label: 'Love' }
];

export const FAVORITE_TYPE = { key: 'favorite', Icon: FavoriteIcon, label: 'Favorite' };
