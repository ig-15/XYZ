
// Helper function to handle pagination for list endpoints
const paginate = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validate and cap the limit to prevent performance issues
  const validatedLimit = Math.min(limit, 100);
  
  const offset = (page - 1) * validatedLimit;

  return {
    limit: validatedLimit,
    offset,
    page,
  };
};

// Function to format paginated responses
const paginatedResponse = (data, count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  return {
    data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

module.exports = {
  paginate,
  paginatedResponse,
};