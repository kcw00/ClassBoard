/**
 * Pagination utility functions and types
 */

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  };
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

/**
 * Parse and validate pagination parameters from query
 */
export function parsePaginationQuery(
  query: any,
  options: PaginationOptions = {}
): {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultSortBy,
    defaultSortOrder = 'desc'
  } = options;

  // Parse and validate page
  let page = parseInt(query.page) || 1;
  page = Math.max(1, page);

  // Parse and validate limit
  let limit = parseInt(query.limit) || defaultLimit;
  limit = Math.min(Math.max(1, limit), maxLimit);

  // Calculate skip
  const skip = (page - 1) * limit;

  // Parse sort parameters
  const sortBy = query.sortBy || defaultSortBy;
  const sortOrder = (query.sortOrder === 'asc' || query.sortOrder === 'desc') 
    ? query.sortOrder 
    : defaultSortOrder;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder
  };
}

/**
 * Create pagination result object
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex: total > 0 ? startIndex : 0,
      endIndex: total > 0 ? endIndex : 0,
    }
  };
}

/**
 * Generate Prisma orderBy clause from sort parameters
 */
export function generateOrderBy(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedSortFields: string[] = []
): any {
  if (!sortBy || (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy))) {
    return { createdAt: sortOrder };
  }

  // Handle nested field sorting (e.g., "student.name")
  if (sortBy.includes('.')) {
    const [relation, field] = sortBy.split('.');
    return {
      [relation]: {
        [field]: sortOrder
      }
    };
  }

  return { [sortBy]: sortOrder };
}

/**
 * Cursor-based pagination for better performance on large datasets
 */
export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

/**
 * Parse cursor pagination parameters
 */
export function parseCursorPaginationQuery(
  query: any,
  options: PaginationOptions = {}
): {
  cursor?: string;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultSortBy,
    defaultSortOrder = 'desc'
  } = options;

  const cursor = query.cursor || undefined;
  let limit = parseInt(query.limit) || defaultLimit;
  limit = Math.min(Math.max(1, limit), maxLimit);

  const sortBy = query.sortBy || defaultSortBy;
  const sortOrder = (query.sortOrder === 'asc' || query.sortOrder === 'desc') 
    ? query.sortOrder 
    : defaultSortOrder;

  return {
    cursor,
    limit,
    sortBy,
    sortOrder
  };
}

/**
 * Create cursor pagination result
 */
export function createCursorPaginationResult<T extends { id: string }>(
  data: T[],
  limit: number,
  requestedLimit: number
): CursorPaginationResult<T> {
  const hasNextPage = data.length > requestedLimit;
  const hasPreviousPage = false; // This would need to be determined by the calling code

  // Remove the extra item if we fetched limit + 1 to check for next page
  const resultData = hasNextPage ? data.slice(0, -1) : data;

  const nextCursor = hasNextPage && resultData.length > 0 
    ? resultData[resultData.length - 1].id 
    : undefined;

  const previousCursor = resultData.length > 0 
    ? resultData[0].id 
    : undefined;

  return {
    data: resultData,
    pagination: {
      limit: requestedLimit,
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      previousCursor
    }
  };
}

/**
 * Validate pagination parameters middleware
 */
export function validatePaginationMiddleware(options: PaginationOptions = {}) {
  return (req: any, res: any, next: any) => {
    const { maxLimit = 100 } = options;

    // Validate page parameter
    if (req.query.page && (isNaN(req.query.page) || parseInt(req.query.page) < 1)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Page must be a positive integer'
        }
      });
    }

    // Validate limit parameter
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > maxLimit) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PAGINATION',
            message: `Limit must be between 1 and ${maxLimit}`
          }
        });
      }
    }

    // Validate sort order
    if (req.query.sortOrder && !['asc', 'desc'].includes(req.query.sortOrder)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SORT_ORDER',
          message: 'Sort order must be either "asc" or "desc"'
        }
      });
    }

    next();
  };
}

/**
 * Generate cache key for paginated results
 */
export function generatePaginationCacheKey(
  baseKey: string,
  page: number,
  limit: number,
  sortBy?: string,
  sortOrder?: string,
  filters?: Record<string, any>
): string {
  const sortStr = sortBy && sortOrder ? `${sortBy}:${sortOrder}` : '';
  const filterStr = filters ? JSON.stringify(filters) : '';
  return `${baseKey}:p${page}:l${limit}:s${sortStr}:f${filterStr}`;
}