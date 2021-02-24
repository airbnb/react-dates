export const describeIfWindow = typeof document === 'undefined' ? describe.skip : describe;
