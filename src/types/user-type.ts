export const UserType = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];
