import { JwtAuthGuard } from '../src/auth/jwt/jwt-auth.guard';

describe('JwtAuthGuard (very simple)', () => {
  it('constructs without throwing', () => {
    expect(() => new JwtAuthGuard()).not.toThrow();
  });
});
