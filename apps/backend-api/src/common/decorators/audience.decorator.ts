import { SetMetadata } from '@nestjs/common';

export const AUDIENCE_KEY = 'required_audience';
export const RequireAudience = (audience: 'employee-portal' | 'management-portal') =>
  SetMetadata(AUDIENCE_KEY, audience);

