const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    /**
     * @TODO 7
     * Tuliskan kode alur logika dalam menambahkan komentar baru yang diambil dari `useCasePayload`
     * ke dalam database.
     *
     * Catatan:
     * - Manfaatkanlah entities `NewComment` untuk memastikan nilai `useCasePayload` valid.
     * - Gunakan `this._threadRepository` dan method abstract di dalamnya
     *   untuk berinteraksi dengan database.
     * - Jika thread tidak ditemukan (dilihat dari `threadId`),
     *   bangkitkan error dengan pesan 'ADD_COMMENT_USE_CASE.THREAD_NOT_FOUND'
     * - Kembalikan method `execute` dengan nilai yang dihasilkan dari pemanggilan
     *   fungsi `this._commentRepository.addComment(newComment);`
     */
    const { threadId, content, owner } = useCasePayload;

    // Validasi payload menggunakan entities NewComment
    const newComment = new NewComment({ threadId, content, owner });

    // Pastikan thread dengan threadId ada
    const thread = await this._threadRepository.isThreadExist(threadId);
    if (!thread) {
      throw new Error('ADD_COMMENT_USE_CASE.THREAD_NOT_FOUND');
    }

    // Tambahkan komentar ke dalam database
    const addedCommentId = await this._commentRepository.addComment(newComment);

    return addedCommentId;
  }
}

module.exports = AddCommentUseCase;
