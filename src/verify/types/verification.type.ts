export const VerificationList = ['email', 'phoneNumber', 'studentId'] as const;
export type VerificationType = (typeof VerificationList)[number];

export const VerificationCodeList = ['email', 'phoneNumber'] as const;
export type VerificationCodeType = (typeof VerificationCodeList)[number];
