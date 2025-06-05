export const UserRole = {
  OWNER: "OWNER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type UserRole =
  (typeof UserRole)[keyof typeof UserRole];
