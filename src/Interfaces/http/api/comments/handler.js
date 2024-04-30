const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');
const ToggleLikeCommentUseCase = require('../../../../Applications/use_case/ToggleLikeCommentUseCase');

class CommentsHandler {
  constructor(container) {
    this._container = container;
  }

  async postCommentHandler(request, h) {
    const { id: owner } = request.auth.credentials;
    const { content } = request.payload;
    const { id: threadId } = request.params;

    const useCase = this._container.getInstance(AddCommentUseCase.name);

    const addedComment = await useCase.execute({
      threadId,
      content,
      owner,
    });

    const response = h.response({
      status: 'success',
      message: 'Komentar berhasil ditambahkan',
      data: {
        addedComment,
      },
    });

    response.code(201);
    return response;
  }

  async postReplyHandler(request, h) {
    const { id: owner } = request.auth.credentials;
    const { content } = request.payload;
    const { threadId, commentId: parentCommentId } = request.params;

    const useCase = this._container.getInstance(AddCommentUseCase.name);
    const addedComment = await useCase.execute({
      threadId,
      content,
      owner,
      parentCommentId,
    });

    const response = h.response({
      status: 'success',
      message: 'Balasan komentar berhasil ditambahkan',
      data: {
        addedComment,
      },
    });

    response.code(201);
    return response;
  }

  async toggleLikeCommentHandler(request) {
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;

    const useCase = this._container.getInstance(ToggleLikeCommentUseCase.name);
    await useCase.execute({ threadId, commentId, userId });

    return {
      status: 'success',
      message: 'Like komentar berhasil diubah',
    };
  }

  async deleteCommentHandler(request) {
    const { id: owner } = request.auth.credentials;
    const { threadId, commentId: id } = request.params;

    const useCase = this._container.getInstance(DeleteCommentUseCase.name);
    await useCase.execute({ threadId, id, owner });

    return {
      status: 'success',
      message: 'Komentar berhasil dihapus',
    };
  }
}

module.exports = CommentsHandler;
