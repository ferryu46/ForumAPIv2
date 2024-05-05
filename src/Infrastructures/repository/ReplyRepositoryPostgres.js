const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');

const ThreadRepositoryPostgres = require('./ThreadRepositoryPostgres');
const CommentRepositoryPostgres = require('./CommentRepositoryPostgres');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(newReply) {
    const { content, commentId: comment_id, userId: user_id, threadId: thread_id } = newReply;

    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const threadRepositoryPostgres = new ThreadRepositoryPostgres(this._pool, this._idGenerator);
    await threadRepositoryPostgres.checkThreadAvailability(thread_id);

    const commentRepositoryPostgres = new CommentRepositoryPostgres(this._pool, this._idGenerator);
    await commentRepositoryPostgres.checkCommentAvailabilityInThread(comment_id, thread_id);

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5) RETURNING id, content, user_id',
      values: [id, content, date, comment_id, user_id],
    };

    const result = await this._pool.query(query);

    return new AddedReply({
      id: result.rows[0].id,
      content: result.rows[0].content,
      owner: result.rows[0].user_id,
    });
  }

  async getAllRepliesByThreadId(id) {
    const query = {
      text: `SELECT replies.id, replies.content, replies.date, users.username, replies.is_deleted, replies.comment_id
      FROM replies
      INNER JOIN comments ON replies.comment_id = comments.id
      INNER JOIN users ON replies.user_id = users.id
      WHERE comments.thread_id = $1
      ORDER BY comments.date, replies.date`,
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deleteReplyById(id) {
    const query = {
      text: 'UPDATE replies SET is_deleted = TRUE WHERE id = $1',
      values: [id],
    };

    const {rowCount} = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('REPLY_REPOSITORY_POSTGRES.REPLY_NOT_FOUND');
    }
  }

  async checkReplyAvailabilityInComment(replyId, commentId, threadId) {
    const query = {
      text: `SELECT *
      FROM threads
      WHERE id = $1
      `,
      values: [threadId],
    }

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('REPLY_REPOSITORY_POSTGRES.REPLY_NOT_FOUND');
    }

    const query2 = {
      text: `SELECT *
      FROM replies
      WHERE id = $1 AND comment_id = $2 AND is_deleted = FALSE
      `,
      values: [replyId, commentId],
    };

    const result2 = await this._pool.query(query2);

    if (!result2.rowCount) {
      throw new NotFoundError('REPLY_REPOSITORY_POSTGRES.REPLY_NOT_FOUND');
    }
  }

  async checkReplyOwner(id, userId) {
    const query = {
      text: 'SELECT user_id FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    const { user_id: owner } = result.rows[0];

    if( owner !== userId) {
      throw new AuthorizationError('REPLY_REPOSITORY_POSTGRES.NOT_THE_REPLY_OWNER');
    }
  }
}

module.exports = ReplyRepositoryPostgres;
