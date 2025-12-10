export const appConfig = {
    invitation: {
        // Default to 24 hours (1440 minutes), but allow override via env var
        expiresInMinutes: Number(process.env.INVITATION_TIMEOUT_MINUTES) || 1440,
    },
} as const
