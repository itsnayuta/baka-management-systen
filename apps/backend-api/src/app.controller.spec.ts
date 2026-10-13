import { describe, it, expect } from 'vitest';
import { AppController } from './app.controller';

describe('AppController (Health Check)', () => {
  it('nên trả về trạng thái ok và uptime hợp lệ cho health check', () => {
    const controller = new AppController();
    const result = controller.health();

    expect(result.status).toBe('ok');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeDefined();
  });
});
