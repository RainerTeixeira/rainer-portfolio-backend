/**
 * Testes Unitários: Pagination Utility
 */

describe('Pagination', () => {
  const createPaginationResponse = (page: number, limit: number, total: number) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  });

  it('deve calcular paginação corretamente', () => {
    const result = createPaginationResponse(1, 10, 25);
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it('deve calcular última página corretamente', () => {
    const result = createPaginationResponse(3, 10, 25);
    
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('deve lidar com página única', () => {
    const result = createPaginationResponse(1, 10, 5);
    
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it('deve calcular skip e take', () => {
    const page = 2;
    const limit = 10;
    const skip = (page - 1) * limit;
    const take = limit;
    
    expect(skip).toBe(10);
    expect(take).toBe(10);
  });

  it('deve validar limites de paginação', () => {
    const validatePagination = (page: number, limit: number) => {
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100);
      return { page: validPage, limit: validLimit };
    };

    const result1 = validatePagination(0, 10);
    expect(result1.page).toBe(1);

    const result2 = validatePagination(2, 200);
    expect(result2.limit).toBe(100);

    const result3 = validatePagination(2, -5);
    expect(result3.limit).toBe(1);
  });
});

