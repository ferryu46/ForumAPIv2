const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    /**
     * @TODO 3
     * Lengkapi pengujian `AddThreadUseCase` agar dapat memastikan
     * flow/logika yang dituliskan pada `AddThreadUseCase` benar!
     *
     * Tentunya, di sini Anda harus melakukan Test Double
     * untuk memalsukan implmentasi fungsi `threadRepository`.
     */
    // Arrange
    const mockThreadRepository = {
      addThread: jest.fn(() => Promise.resolve('thread-123')),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const useCasePayload = {
      title: 'Thread Title',
      body: 'Thread Body',
      owner: 'user-456',
    };
    // Action
    const addedThreadid = await addThreadUseCase.execute(useCasePayload);

    // Assert
    expect(addedThreadid).toEqual('thread-123');
    expect(mockThreadRepository.addThread).toHaveBeenCalledWith(useCasePayload);
  });
});
