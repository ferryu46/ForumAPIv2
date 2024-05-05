const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');

const CommentLikeRepositoryPostgres = require('../CommentLikeRepositoryPostgres');
const pool = require('../../database/postgres/pool');

describe('CommentLikeRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({});
    await ThreadsTableTestHelper.addThread({});
    await CommentsTableTestHelper.addComment({});
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('likeComment function', () => {
    it('should added the like correctly', async () => {
      const payload = {
        userId: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      };

      const fakeIdGenerator = () => '123';
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      await commentLikeRepositoryPostgres.likeComment(payload);

      const likes = await CommentLikesTableTestHelper
        .findCommentLikeById('like-123');

      expect(likes).toHaveLength(1);
      expect(likes[0].user_id).toBe(payload.userId);
      expect(likes[0].comment_id).toBe(payload.commentId);
    });
  });

  describe('unlikeComment function', () => {
    it('should delete the like correctly', async () => {
      await CommentLikesTableTestHelper.addCommentLike({});

      const payload = {
        userId: 'user-123',
        commentId: 'comment-123',
      };

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      await commentLikeRepositoryPostgres.unlikeComment(payload);

      const likes = await CommentLikesTableTestHelper
        .findCommentLikeById('like-123');

      expect(likes).toHaveLength(0);
    });
  });

  describe('checkIsCommentLiked function', () => {
    it('should return true when the like is found', async () => {
      await CommentLikesTableTestHelper.addCommentLike({});

      const payload = {
        userId: 'user-123',
        commentId: 'comment-123',
      };

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      await expect(commentLikeRepositoryPostgres.checkIsCommentLiked(payload.userId, payload.commentId))
        .resolves.toEqual(true);
    });

    it('should return false when the like is not found', async () => {
      const payload = {
        userId: 'user-123',
        commentId: 'comment-123',
      };

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      await expect(commentLikeRepositoryPostgres.checkIsCommentLiked(payload.userId, payload.commentId))
        .resolves.toEqual(false);
    });
  });

  describe('getCommentLikesByCommentId function', () => {
    it('should return the number of likes correctly', async () => {
      await CommentLikesTableTestHelper.addCommentLike({});

      const commentId = 'comment-123';

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      await expect(commentLikeRepositoryPostgres.getCommentLikesByCommentId(commentId))
        .resolves.toEqual(1);
    });
  });

  describe('getCommentLikesForEachComment function', () => {
    it('should return the number of likes for each comment correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'uka' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456' });
      // id: 'commentlike-123', commentId: 'comment-123', userId: 'user-123'
      await CommentLikesTableTestHelper.addCommentLike({});

      // id: 'commentlike-456', commentId: 'comment-123', userId: 'user-456'
      await CommentLikesTableTestHelper.addCommentLike({ id: 'commentlike-456', userId: 'user-456' });

      const comments = [
        {
          id: 'comment-123',
        },
        {
          id: 'comment-456',
        },
      ];

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      const results = await commentLikeRepositoryPostgres.getCommentLikesForEachComment(comments);

      expect(results[0].likeCount).toEqual(2);
      expect(results[1].likeCount).toEqual(0);
    });
  });
});
