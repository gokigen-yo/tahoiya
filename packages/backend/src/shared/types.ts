export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

export const ok = <T, E>(value: T): Result<T, E> => ({ success: true, value });
export const err = <T, E>(error: E): Result<T, E> => ({ success: false, error });
