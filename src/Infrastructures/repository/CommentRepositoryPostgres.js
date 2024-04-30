/* eslint-disable max-len */
const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');
const Comment = require('../../Domains/comments/entities/Comment');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, owner, threadId } = newComment;
    const id = `comment-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comments (id, content, owner, thread_id, is_delete, date, parent_comment_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner',
      values: [id, content, owner, threadId, false, new Date().toISOString(), newComment.parentCommentId || null],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async isCommentExist(commentId) {
    const query = {
      text: 'SELECT COUNT(*) FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows[0].count > 0;
  }

  async isCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows[0].owner === owner;
  }

  async likeComment(commentId, userId) {
    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2)',
      values: [commentId, userId],
    };

    await this._pool.query(query);
  }

  async unlikeComment(commentId, userId) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    await this._pool.query(query);
  }

  async isCommentLikedByUser(commentId, userId) {
    const query = {
      text: 'SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);

    return result.rows[0].count > 0;
  }

  async deleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = true WHERE id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT 
                comments.id,
                comments.content,
                comments.date,
                comments.is_delete,
                users.username,
                c.*,
              COUNT(cl.user_id) AS like_count
              FROM comments 
              INNER JOIN users ON comments.owner = users.id 
              LEFT JOIN comment_likes cl ON c.id = cl.comment_id
              WHERE c.thread_id = $1
              GROUP BY c.id
              ORDER BY comments.date`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => new Comment({
      ...row,
      likeCount: parseInt(row.like_count, 10),
      isDelete: row.is_delete,
    }));
  }
}

module.exports = CommentRepositoryPostgres;
