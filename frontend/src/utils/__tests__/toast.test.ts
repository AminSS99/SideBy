import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { showSuccess, showError, showLoading, dismissToast } from '../toast';

// Mock the sonner toast module
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  },
}));

describe('toast utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('showSuccess calls toast.success with correct message', () => {
    const message = 'Success message';
    showSuccess(message);
    expect(toast.success).toHaveBeenCalledWith(message);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('showError calls toast.error with correct message', () => {
    const message = 'Error message';
    showError(message);
    expect(toast.error).toHaveBeenCalledWith(message);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('showLoading calls toast.loading with correct message and returns id', () => {
    const message = 'Loading message';
    const result = showLoading(message);
    expect(toast.loading).toHaveBeenCalledWith(message);
    expect(toast.loading).toHaveBeenCalledTimes(1);
    expect(result).toBe('mock-toast-id');
  });

  it('dismissToast calls toast.dismiss with correct id', () => {
    const toastId = 'mock-toast-id';
    dismissToast(toastId);
    expect(toast.dismiss).toHaveBeenCalledWith(toastId);
    expect(toast.dismiss).toHaveBeenCalledTimes(1);
  });
});
