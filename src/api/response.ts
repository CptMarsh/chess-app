export const Status = {
  OK: 200,
  Created: 201,
  Accepted: 202,
  NotFound: 404,
  Conflict: 409,
  UnprocessableContent: 422,
  InternalServerError: 500,
} as const;

export type ApiResponse<Body> = { status: number; body: Body };
