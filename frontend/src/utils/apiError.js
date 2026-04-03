/**
 * Human-readable message for failed API calls (axios).
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;

  const status = err.response?.status;
  if (status === 502 || err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
    return 'Cannot reach the API server. Open a terminal, run: cd backend && npm run dev — then try again.';
  }

  return err.response?.data?.message || err.message || fallback;
}
