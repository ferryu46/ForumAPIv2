/* eslint-disable padded-blocks */
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const AddReply = require('../../../Domains/replies/entities/AddReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');

const pool = require('../../database/postgres/pool');

const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');

const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({});
    await ThreadsTableTestHelper.addThread({});
    await CommentsTableTestHelper.addComment({});
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply', async () => {
      // Arrange
      const newReply = new AddReply({
        content: 'sebuah reply',
        commentId: 'comment-123',
        userId: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepositoryPostgres.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
    });

    it('should return added reply correctly', async () => {
      // Arrange
      const newReply = new AddReply({
        content: 'sebuah reply',
        commentId: 'comment-123',
        userId: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: newReply.content,
        owner: 'user-123',
      }));
    });
  });

  describe('getAllRepliesByThreadId function', () => {
    it('should return an empty array when comments has no replies', async () => {

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
      const result = await replyRepositoryPostgres
        .getAllRepliesByThreadId('thread-123');

      expect(result).toStrictEqual([]);
    });

    it('should return an array of replies when comment has replies', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'reply pertama',
        date: '2021-08-08T07:22:33.555Z',
        is_deleted: false,
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-124',
        content: 'reply kedua',
        date: '2021-08-09T07:22:33.555Z',
        is_deleted: false,
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-125',
        content: 'reply ketiga',
        date: '2021-08-10T07:22:33.555Z',
        is_deleted: false,
      });

      const result = await replyRepositoryPostgres
        .getAllRepliesByThreadId('thread-123');

      expect(result).toStrictEqual([
        {
          id: 'reply-123',
          content: 'reply pertama',
          date: '2021-08-08T07:22:33.555Z',
          username: 'dicoding',
          is_deleted: false,
          comment_id: 'comment-123',
        },
        {
          id: 'reply-124',
          content: 'reply kedua',
          date: '2021-08-09T07:22:33.555Z',
          username: 'dicoding',
          is_deleted: false,
          comment_id: 'comment-123',
        },
        {
          id: 'reply-125',
          content: 'reply ketiga',
          date: '2021-08-10T07:22:33.555Z',
          username: 'dicoding',
          is_deleted: false,
          comment_id: 'comment-123',
        },
      ]);
    });
  });

  describe('deleteReplyById function', () => {
    it('should throw error when reply is not available', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.deleteReplyById('abcde'))
        .rejects.toThrow(NotFoundError);
    });

    it('should delete reply correctly', async () => {
      await RepliesTableTestHelper.addReply({});

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.deleteReplyById('reply-123'))
        .resolves.not.toThrowError(NotFoundError);

      const deletedReply = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(deletedReply).toHaveLength(1);
      expect(deletedReply[0].is_deleted).toEqual(true);
    });
  });

  describe('checkReplyOwner function', () => {
    it('should throw AuthorizationError when user is not the owner of reply', async () => {
      await RepliesTableTestHelper.addReply({});

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyOwner('reply-123', 'user-456'))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when user is the owner of reply', async () => {
      await RepliesTableTestHelper.addReply({});

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyOwner('reply-123', 'user-123'))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('checkReplyAvailabilityInComment function', () => {
    it('should throw NotFoundError when thread is not available', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyAvailabilityInComment('reply-123', 'comment-123', 'thread-456'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when comment is not available in an available thread', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyAvailabilityInComment('reply-123', 'comment-456', 'thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when reply is not available in an available comment and thread', async () => {
      await RepliesTableTestHelper.addReply({});

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyAvailabilityInComment('reply-456', 'comment-123', 'thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when reply is deleted', async () => {
      await RepliesTableTestHelper.addReply({ isDeleted: true });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyAvailabilityInComment('reply-123', 'comment-123', 'thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply, thread, and comment are available', async () => {
      await RepliesTableTestHelper.addReply({});
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.checkReplyAvailabilityInComment('reply-123', 'comment-123', 'thread-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });
});
