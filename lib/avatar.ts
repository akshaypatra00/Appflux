
import { User } from '@supabase/supabase-js';

/**
 * Gets the user's avatar URL, prioritizing the oldest identity (original sign-up method).
 * This ensures consistency across the app, even if new providers are linked later.
 */
export function getUserAvatar(user: User | null | undefined): string | null {
    if (!user) return null;

    // 1. Try to get avatar from the signup identity (oldest one)
    if (user.identities && user.identities.length > 0) {
        // Sort identities by creation date to find the first one
        const sortedIdentities = [...user.identities].sort((a, b) =>
            new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
        );
        const signupIdentity = sortedIdentities[0];

        if (signupIdentity.identity_data) {
            // Check common avatar fields in identity data
            const identityAvatar = signupIdentity.identity_data.avatar_url ||
                signupIdentity.identity_data.picture ||
                signupIdentity.identity_data.avatar;

            if (identityAvatar) {
                return identityAvatar;
            }
        }
    }

    // 2. Fallback to user_metadata (default behavior)
    // Prioritize 'picture' (Google) over 'avatar_url' (GitHub) just in case
    return user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
}
