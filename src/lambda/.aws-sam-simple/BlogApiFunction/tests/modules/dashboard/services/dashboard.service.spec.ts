import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../../../src/modules/dashboard/services/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return dashboard statistics with default values', async () => {
      const result = await service.getStats();
      
      expect(result).toEqual({
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        postsChange: 0,
        viewsChange: 0,
        likesChange: 0,
        commentsChange: 0,
      });
    });

    it('should return a Promise that resolves to DashboardStats', async () => {
      const result = service.getStats();
      
      expect(result).toBeInstanceOf(Promise);
      
      const resolved = await result;
      expect(typeof resolved.totalPosts).toBe('number');
      expect(typeof resolved.totalViews).toBe('number');
      expect(typeof resolved.totalLikes).toBe('number');
      expect(typeof resolved.totalComments).toBe('number');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data with empty arrays', async () => {
      const result = await service.getAnalytics();
      
      expect(result).toEqual({
        views: [],
        engagement: [],
      });
    });

    it('should return a Promise that resolves to analytics structure', async () => {
      const result = service.getAnalytics();
      
      expect(result).toBeInstanceOf(Promise);
      
      const resolved = await result;
      expect(Array.isArray(resolved.views)).toBe(true);
      expect(Array.isArray(resolved.engagement)).toBe(true);
    });
  });
});
