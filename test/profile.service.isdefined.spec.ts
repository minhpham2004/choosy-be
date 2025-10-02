import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProfileService } from '../src/profile/profile.service';

describe('ProfileService (very simple)', () => {
  it('is defined', async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getModelToken('Profile'), useValue: {} },
      ],
    }).compile();

    const svc = module.get(ProfileService);
    expect(svc).toBeDefined();
  });
});
