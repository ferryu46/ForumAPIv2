const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');

const pool = require('../../database/postgres/pool');

const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({});
    await ThreadsTableTestHelper.addThread({});
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment', async () => {
      // Arrange
      const newComment = new AddComment({
        content: 'sebuah comment',
        threadId: 'thread-123',
        userId: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepositoryPostgres.addComment(newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const newComment = new AddComment({
        content: 'sebuah comment',
        threadId: 'thread-123',
        userId: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: newComment.content,
        owner: 'user-123',
      }));
    });
  });

  describe('getAllCommentsByThreadId function', () => {
    it('should return an empty array when thread has no comments', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const result = await commentRepositoryPostgres
        .getAllCommentsByThreadId('thread-123');

      expect(result).toStrictEqual([]);
    });

    it('should return an array of comments when thread has comments', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        date: '2021-08-08T07:22:33.555Z',
        content: 'komentar pertama',
        is_deleted: false,
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-124',
        date: '2021-08-09T07:22:33.555Z',
        content: 'komentar kedua',
        is_deleted: false,
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-125',
        date: '2021-08-10T07:22:33.555Z',
        content: 'komentar ketiga',
        is_deleted: false,
      });

      const result = await commentRepositoryPostgres
        .getAllCommentsByThreadId('thread-123');

      expect(result).toStrictEqual([
        {
          id: 'comment-123',
          date: '2021-08-08T07:22:33.555Z',
          content: 'komentar pertama',
          username: 'dicoding',
          is_deleted: false,
        },
        {
          id: 'comment-124',
          date: '2021-08-09T07:22:33.555Z',
          content: 'komentar kedua',
          username: 'dicoding',
          is_deleted: false,
        },
        {
          id: 'comment-125',
          date: '2021-08-10T07:22:33.555Z',
          content: 'komentar ketiga',
          username: 'dicoding',
          is_deleted: false,
        },
      ]);
    });
  });

  describe('deleteCommentById function', () => {
    it('should throw NotFoundError when comment is not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.deleteCommentById('abcde'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should delete comment correctly', async () => {
      await CommentsTableTestHelper.addComment({});

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.deleteCommentById('comment-123'))
        .resolves.not.toThrowError(NotFoundError);

      const deletedComment = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(deletedComment).toHaveLength(1);
      expect(deletedComment[0].is_deleted).toEqual(true);
    });
  });

  describe('checkCommentOwner function', () => {
    it('should throw AuthorizationError when user is not the owner of comment', async () => {
      await CommentsTableTestHelper.addComment({});

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.checkCommentOwner('comment-123', 'user-456'))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when user is the owner of comment', async () => {
      await CommentsTableTestHelper.addComment({});

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.checkCommentOwner('comment-123', 'user-123'))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('checkCommentAvailabilityInThread function', () => {
    it('should throw NotFoundError when thread is not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.checkCommentAvailabilityInThread('comment-123', 'thread-789'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when comment is not available in an available thread', async () => {
      await CommentsTableTestHelper.addComment({});
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.checkCommentAvailabilityInThread('comment-345', 'thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when comment is deleted', async () => {
      await CommentsTableTestHelper.addComment({ isDeleted: true });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.checkCommentAvailabilityInThread('comment-123', 'thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread and comment are available and is not deleted yet', async () => {
      await CommentsTableTestHelper.addComment({});
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.checkCommentAvailabilityInThread('comment-123', 'thread-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });
});
