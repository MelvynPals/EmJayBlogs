// Reusable SVG icon components for reactions.
// Replace the path shapes with your custom SVGs once you place them.
// Folder suggestion for raw assets (if you prefer file imports instead of inline SVG components):
//   src/assets/reactions/
//       like.svg
//       like-active.svg
//       dislike.svg
//       dislike-active.svg
//       love.svg
//       love-active.svg
//       favorite.svg
//       favorite-active.svg
//       comment.svg (single state)
// If you swap to file-based approach, convert these components to <img src={...}/> wrappers.

import React from 'react';
// Use file-based SVG assets for sharper control over active/inactive states & gradients.
// We rely on Vite's svg loader which in CRA-like setups inlines them as URL assets.

import like from './reactions/like.svg';
import likeActive from './reactions/like-active.svg';
import dislike from './reactions/dislike.svg';
import dislikeActive from './reactions/dislike-active.svg';
import love from './reactions/love.svg';
import loveActive from './reactions/love-active.svg';
import favorite from './reactions/favorite.svg';
import favoriteActive from './reactions/favorite-active.svg';
import comment from './reactions/comment.svg';

const base = 'w-5 h-5 inline-block select-none';
const wrap = (src, extra = '') => <img src={src} alt="" draggable={false} className={`${base} ${extra}`} />;

export const LikeIcon = ({ active, preview }) => wrap(active ? likeActive : like, `${preview && !active ? 'opacity-90' : ''}`);
export const DislikeIcon = ({ active, preview }) => wrap(active ? dislikeActive : dislike, `${preview && !active ? 'opacity-90' : ''}`);
export const LoveIcon = ({ active, preview }) => wrap(active ? loveActive : love, `${preview && !active ? 'opacity-90' : ''}`);
export const FavoriteIcon = ({ active, preview }) => wrap(active ? favoriteActive : favorite, `${preview && !active ? 'opacity-90' : ''}`);
export const CommentIcon = () => wrap(comment);

