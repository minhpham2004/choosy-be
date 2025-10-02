import { GetUserInfo as UserDecorator } from '../src/auth/user.decorator';
import { ExecutionContext } from '@nestjs/common';

const ctx = (user: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any);

describe('User decorator (tiny)', () => {
  it('returns the whole user when no key provided', () => {
    const result = (UserDecorator as any)(undefined, ctx({ id: 1, email: 'a@b.c' }));
    expect(result).toEqual(expect.objectContaining({ id: 1 }));
  });

  it('returns a specific property when key is provided', () => {
    const result = (UserDecorator as any)('email', ctx({ id: 1, email: 'a@b.c' }));
    expect(result).toBe('a@b.c');
  });
});
