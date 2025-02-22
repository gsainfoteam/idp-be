export const CodeChallengeMethodList = ['plain', 'S256'] as const;
export type CodeChallengeMethod = (typeof CodeChallengeMethodList)[number];
