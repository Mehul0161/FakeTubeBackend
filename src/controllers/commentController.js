const Video = require('../models/Video');

// Add comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.comments.push({
      user: req.user._id,
      text
    });

    await video.save();
    await video.populate('comments.user', 'displayName avatar');

    res.status(201).json(video.comments[video.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Add reply to comment
const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = video.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({
      user: req.user._id,
      text
    });

    await video.save();
    await video.populate('comments.replies.user', 'displayName avatar');

    res.status(201).json(comment.replies[comment.replies.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = video.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment owner or video owner
    if (comment.user.toString() !== req.user._id.toString() &&
        video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await video.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Like/Unlike comment
const toggleCommentLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = video.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      comment.likes.push(req.user._id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await video.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling comment like', error: error.message });
  }
};

// Like/Unlike reply
const toggleReplyLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = video.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const likeIndex = reply.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      reply.likes.push(req.user._id);
    } else {
      reply.likes.splice(likeIndex, 1);
    }

    await video.save();
    res.json(reply);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling reply like', error: error.message });
  }
};

module.exports = {
  addComment,
  addReply,
  deleteComment,
  toggleCommentLike,
  toggleReplyLike
}; 