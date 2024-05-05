/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'sebuah reply',
    date = '2021-08-08T07:59:57.000Z',
    commentId = 'comment-123',
    userId = 'user-123',
    isDeleted = false,
  }) {
    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, date, commentId, userId, isDeleted],
    };

    await pool.query(query);
  },

  async findReplyById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);

    return result.rows;
  },

  async getAllRepliesByThreadId(id) {
    const query = {
      text: `SELECT replies.id, replies.content, replies.date, users.username, replies.is_deleted
      FROM replies
      INNER JOIN comments ON replies.comment_id = comments.id
      INNER JOIN users ON replies.user_id = users.id
      WHERE comments.thread_id = $1
      ORDER BY comments.date, replies.date`,
      values: [id],
    };

    const result = await pool.query(query);

    return result.rows;
  },

  async deleteReplyById(id) {
    const query = {
      text: 'UPDATE replies SET is_deleted = TRUE WHERE id = $1',
      values: [id],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

module.exports = RepliesTableTestHelper;
