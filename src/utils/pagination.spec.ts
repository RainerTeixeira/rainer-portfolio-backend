import { calculateSkip, createPaginationInfo, validatePaginationParams } from './pagination';

describe('Pagination Utils', () => {
  it('should be defined', () => {
    expect(calculateSkip).toBeDefined();
    expect(createPaginationInfo).toBeDefined();
    expect(validatePaginationParams).toBeDefined();
  });
});
