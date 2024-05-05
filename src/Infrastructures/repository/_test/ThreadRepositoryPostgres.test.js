const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');

const pool = require('../../database/postgres/pool');

const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const DetailThread = require('../../../Domains/threads/entities/DetailThread');

describe('ThreadRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding', password: 'secret' });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread', async () => {
      // Arrange
      const newThread = new AddThread({
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadById('thread-123');
      expect(threads).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      // Arrange
      const newThread = new AddThread({
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: newThread.title,
        owner: 'user-123',
      }));
    });
  });

  describe('checkThreadAvailability function', () => {
    it('should throw NotFoundError when thread is not available', async () => {
      // Arrange
      const threadId = 'xxxx';

      // Action
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(threadRepositoryPostgres.checkThreadAvailability(threadId)).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread is available', async () => {
      await ThreadsTableTestHelper.addThread({});

      // Arrange
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(threadRepositoryPostgres.checkThreadAvailability('thread-123')).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread is not available', async () => {
      await ThreadsTableTestHelper.addThread({});
      // Arrange
      const threadId = 'xxxx';

      // Action
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById(threadId))
        .rejects.toThrowError(NotFoundError);
    });

    it('should return detail thread correctly when thread is available', async () => {
      await ThreadsTableTestHelper.addThread({});
      // Arrange
      const threadId = 'thread-123';

      // Action
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      const thread = await threadRepositoryPostgres.getThreadById(threadId);

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById(threadId))
        .resolves.not.toThrowError(NotFoundError);
      expect(thread).toStrictEqual(new DetailThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:22:33.555Z',
        username: 'dicoding',
      }));
    });
  });
});
