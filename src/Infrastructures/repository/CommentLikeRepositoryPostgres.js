const CommentLikeRepository = require('../../Domains/likes/CommentLikeRepository');

const ThreadRepositoryPostgres = require('./ThreadRepositoryPostgres');
const CommentRepositoryPostgres = require('./CommentRepositoryPostgres');

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async likeComment({ userId, commentId, threadId }) {
    const id = `like-${this._idGenerator()}`;
    const query = {
      text: 'INSERT INTO commentlikes VALUES($1, $2, $3) RETURNING id',
      values: [id, commentId, userId],
    };

    const threadRepositoryPostgres = new ThreadRepositoryPostgres(this._pool, this._idGenerator);
    await threadRepositoryPostgres.checkThreadAvailability(threadId);

    const commentRepositoryPostgres = new CommentRepositoryPostgres(this._pool, this._idGenerator);
    await commentRepositoryPostgres.checkCommentAvailabilityInThread(commentId, threadId);

    await this._pool.query(query);
  }

  async unlikeComment(userId, commentId) {
    const query = {
      text: 'DELETE FROM commentlikes WHERE user_id = $1 AND comment_id = $2',
      values: [userId, commentId],
    };

    await this._pool.query(query);
  }

  async checkIsCommentLiked(userId, commentId) {
    const query = {
      text: 'SELECT * FROM commentlikes WHERE user_id = $1 AND comment_id = $2',
      values: [userId, commentId],
    };

    const {rowCount} = await this._pool.query(query);
    if (rowCount) {
      return true;
    }

    return false;
  }

  async getCommentLikesByCommentId(commentId) {
    const query = {
      text: 'SELECT * FROM commentlikes WHERE comment_id = $1',
      values: [commentId],
    };

    const {rowCount} = await this._pool.query(query);

    return rowCount;
  }

  async getCommentLikesForEachComment(comments) {
    for (const comment of comments) {
      comment.likeCount = await this.getCommentLikesByCommentId(comment.id);
    }

    return comments;
  }
}

module.exports = CommentLikeRepositoryPostgres;
