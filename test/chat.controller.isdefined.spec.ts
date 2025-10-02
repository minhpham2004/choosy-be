import { ChatController } from '../src/chat/chat.controller';

describe('ChatController (very simple)', () => {
  it('is defined', () => {
    const controller = new ChatController({} as any, {} as any);
    expect(controller).toBeDefined();
  });
});
