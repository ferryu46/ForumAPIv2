/* eslint-disable no-undef */
/* eslint-disable no-template-curly-in-string */
const ThreadRepository = require('../ThreadRepository');

describe('ThreadRepository abstract', () => {
  it('should throw error when invoke abstract behavior', async () => {
    /**
     * @TODO 1
     * Lengkapi pengujian untuk `ThreadRepository` abstract
     * Pastikan semua fungsi yang ada di `ThreadRepository`
     * membangkitkan `Error` THREAD_REPOSITORY.METHOD_NOT_IMPLEMENTED
     *
     */
    const threadRepository = new ThreadRepository();
    const methodsToTest = [
      'getAllThreads',
      'getThreadById',
      'addThread',
      'updateThread',
      'deleteThread',
    ];

    methodsToTest.forEach(async (method) => {
      try {
        await threadRepository[method]();
        throw new Error('Method ${method} did not throw an error as expected.');
      } catch (error) {
        if (error.message !== THREAD_REPOSITORY.METHOD_NOT_IMPLEMENTED) {
          throw new Error('Unexpected error message: ${error.message}');
        }
      }
    });
  });
});
