/**
 * Gets the user's avatar URL from Supabase or Firebase user objects.
 */
export function getUserAvatar(user: any): string | null {
    if (!user) return null;

    // 1. Firebase support
    if (user.photoURL) return user.photoURL;

    // 2. Supabase support
    if (user.identities && user.identities.length > 0) {
        const sortedIdentities = [...user.identities].sort((a, b) =>
            new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
        );
        const signupIdentity = sortedIdentities[0];

        if (signupIdentity.identity_data) {
            const identityAvatar = signupIdentity.identity_data.avatar_url ||
                signupIdentity.identity_data.picture ||
                signupIdentity.identity_data.avatar;

            if (identityAvatar) return identityAvatar;
        }
    }

    // 3. Metadata fallback (Supabase)
    return user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
}
