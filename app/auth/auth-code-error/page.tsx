import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage({
    searchParams,
}: {
    searchParams: { error?: string; error_description?: string }
}) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4">
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-red-500">Authentication Error</h1>
                <div className="space-y-2">
                    <p className="text-lg text-neutral-300 font-medium">
                        {searchParams.error_description || "An unexpected error occurred during authentication."}
                    </p>
                    {searchParams.error && (
                        <p className="text-sm text-neutral-500 font-mono bg-neutral-900 px-2 py-1 rounded inline-block">
                            Error Code: {searchParams.error}
                        </p>
                    )}
                </div>

                <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                    This can happen if the verification link has expired, has already been used, or if there's a configuration mismatch in the authentication settings.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                    <Link href="/sign-in">
                        <Button variant="outline">Back to Sign In</Button>
                    </Link>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
