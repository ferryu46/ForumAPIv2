class ToggleLikeCommentUseCase {
  constructor({ commentRepository }) {
    this._commentRepository = commentRepository;
  }

  async execute({ commentId, userId }) {
    const isLiked = await this._commentRepository.isCommentLikedByUser(commentId, userId);
    if (isLiked) {
      await this._commentRepository.unlikeComment(commentId, userId);
    } else {
      await this._commentRepository.likeComment(commentId, userId);
    }
  }
}
