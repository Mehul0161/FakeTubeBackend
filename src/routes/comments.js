const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  addComment,
  addReply,
  deleteComment,
  toggleCommentLike,
  toggleReplyLike
} = require('../controllers/commentController');

// Comment routes
router.post('/videos/:videoId/comments', auth, addComment);
router.post('/videos/:videoId/comments/:commentId/replies', auth, addReply);
router.delete('/videos/:videoId/comments/:commentId', auth, deleteComment);
router.post('/videos/:videoId/comments/:commentId/like', auth, toggleCommentLike);
router.post('/videos/:videoId/comments/:commentId/replies/:replyId/like', auth, toggleReplyLike);

module.exports = router; 