'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderUp, Github, Loader2, Search, GitBranch, ChevronDown, Terminal, Globe, Layout, Database, AlertCircle, Share2, Store, CheckCircle, Package, UploadCloud, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import JSZip from 'jszip';

// Types for form state
interface DeployState {
    step: 'select' | 'checking' | 'configure' | 'building' | 'review' | 'publishing' | 'success';
    source: 'github' | 'upload' | null;
    githubConnected: boolean;
    repositories: any[];     // Smartly filtered list
    allRepositories?: any[]; // Complete list for "Show All" toggle
    isLoadingRepos: boolean;
    isZipping: boolean;
    isLinking: boolean;
    selectedRepo: any | null;
    file: File | null;
    config: {
        projectName: string;
        framework: string;
        rootDirectory: string;
        buildCommand: string;
        outputDirectory: string;
        description: string;
        category: string;
    };
    appDetails?: {
        name: string;
        version: string;
        apkUrl: string;
        description: string;
        source: 'release' | 'codebase' | 'built';
    };
    files: {
        icon: File | null;
        screenshots: File[];
    };
    error: string | null;
    publishedApp?: any;
    patToken: string;
    showPatInput: boolean;
}

function DeployPageContent() {
    const [state, setState] = useState<DeployState>({
        step: 'select',
        source: null,
        githubConnected: false,
        repositories: [],
        allRepositories: [],
        isLoadingRepos: false,
        isZipping: false,
        isLinking: false,
        selectedRepo: null,
        file: null,
        config: {
            projectName: '',
            framework: 'Next.js',
            rootDirectory: './',
            buildCommand: 'npm run build',
            outputDirectory: '.next',
            description: '',
            category: 'android',
        },
        files: {
            icon: null,
            screenshots: []
        },
        error: null,
        patToken: '',
        showPatInput: false
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [showAllRepos, setShowAllRepos] = useState(false); // Toggle state

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for existing GitHub session
    useEffect(() => {
        const checkGithubConnection = async () => {
            const errorCode = searchParams.get('error_code');
            const errorDescription = searchParams.get('error_description');

            // Handle Error Params First
            if (errorCode === 'identity_already_exists' || errorDescription?.includes('Identity is already linked')) {
                setState(prev => ({
                    ...prev,
                    showPatInput: true,
                    isLinking: false,
                    error: "Account Conflict: This GitHub account is linked to another user. Please use a Personal Access Token instead."
                }));
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            }

            const { data: { session } } = await supabase.auth.getSession();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const isLinked = user.identities?.some((id: any) => id.provider === 'github');

            // Check for saved PAT
            const savedPat = localStorage.getItem(`github_pat_${user.id}`);

            if (isLinked) {
                // If linked, ignore redundant connection errors (override error if meaningful connection exists)
                setState(prev => ({ ...prev, githubConnected: true, isLoadingRepos: true, error: null, showPatInput: false }));
                if (session?.provider_token) {
                    fetchGithubRepos(session.provider_token);
                } else if (session?.user?.app_metadata?.provider === 'github' && session?.access_token) {
                    fetchGithubRepos(session.access_token);
                } else {
                    setState(prev => ({ ...prev, isLoadingRepos: false, repositories: [] }));
                }
            } else if (savedPat) {
                // Use saved PAT if available and not linked
                setState(prev => ({ ...prev, githubConnected: true, isLoadingRepos: true, patToken: savedPat, error: null, showPatInput: false }));
                fetchGithubRepos(savedPat);
            }
            // Else: Leave state as set by error handling block above
        };
        checkGithubConnection();
    }, [searchParams]);

    const fetchGithubRepos = async (token: string) => {
        try {
            // Fetch more repos to increase chance of finding mobile apps after filtering
            const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            });

            if (res.ok) {
                const allRepos = await res.json();

                // Filter for Mobile App Languages: Dart, Java, Kotlin, Swift, Objective-C
                const mobileLanguages = ['Dart', 'Java', 'Kotlin', 'Swift', 'Objective-C'];

                // Enhanced filtering: Check language OR keywords in name/description/topics
                const filteredRepos = allRepos.filter((repo: any) => {
                    const lang = repo.language;
                    const isMobileLang = mobileLanguages.includes(lang);

                    const name = repo.name.toLowerCase();
                    const desc = repo.description?.toLowerCase() || '';
                    const topics = repo.topics || [];

                    // Broad keyword search for "mobile" projects identified as other languages (e.g. HTML, Shell)
                    // This catches Flutter projects identified as HTML
                    const hasMobileKeywords = [
                        'flutter', 'react-native', 'android', 'ios', 'apk', 'mobile app'
                    ].some(keyword =>
                        name.includes(keyword) ||
                        desc.includes(keyword) ||
                        topics.includes(keyword)
                    );

                    // React Native heuristic
                    const isJsTs = lang === 'JavaScript' || lang === 'TypeScript';
                    const isReactNative = isJsTs && hasMobileKeywords;

                    return isMobileLang || isReactNative || hasMobileKeywords;
                });

                setState(prev => ({
                    ...prev,
                    repositories: filteredRepos, // Default view
                    allRepositories: allRepos,   // Backup view
                    isLoadingRepos: false,
                    githubConnected: true
                }));
            } else {
                throw new Error(`GitHub API responded with ${res.status}`);
            }
        } catch (error: any) {
            console.error('Fetch Repos Error:', error);
            setState(prev => ({
                ...prev,
                isLoadingRepos: false,
                error: `Failed to sync with GitHub: ${error.message}`,
                githubConnected: false
            }));
        }
    };

    const handleConnectGithub = async () => {
        setState(prev => ({ ...prev, isLinking: true, error: null }));
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/deploy`,
                    scopes: 'repo',
                },
            });
            if (error) throw error;
            if (data?.url) window.location.href = data.url;
        } catch (error: any) {
            setState(prev => ({ ...prev, isLinking: false, error: error.message }));
        }
    };

    const handlePatConnect = async () => {
        if (!state.patToken) return;
        setState(prev => ({ ...prev, isLoadingRepos: true, error: null }));

        try {
            // Verify token by fetching user
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${state.patToken}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            });

            if (!res.ok) throw new Error('Invalid Token');

            // Save to localStorage for persistence
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                localStorage.setItem(`github_pat_${user.id}`, state.patToken);
            }

            fetchGithubRepos(state.patToken);

        } catch (err: any) {
            setState(prev => ({ ...prev, isLoadingRepos: false, error: 'Invalid Personal Access Token. Please check and try again.' }));
        }
    };

    const handleSelectRepo = async (repo: any) => {
        // 1. Set basic state
        setState(prev => ({
            ...prev,
            source: 'github',
            selectedRepo: repo,
            step: 'checking',
            config: {
                ...prev.config,
                projectName: repo.name,
                description: repo.description || ''
            },
            error: null
        }));

        // 2. Check backend for existing APK source
        try {
            const res = await fetch('/api/deploy/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoName: repo.name,
                    owner: repo.owner.login
                })
            });

            const data = await res.json();

            if (data.found && data.apkUrl) {
                // APK Found -> Go to Review directly
                setState(prev => ({
                    ...prev,
                    step: 'review',
                    appDetails: {
                        name: data.name,
                        version: data.version,
                        apkUrl: data.apkUrl,
                        description: data.description || '',
                        source: data.source
                    }
                }));
            } else {
                // Not Found -> Configure
                setState(prev => ({ ...prev, step: 'configure' }));
            }

        } catch (err: any) {
            console.error("Check APK failed", err);
            // Fallback to configure on error
            setState(prev => ({ ...prev, step: 'configure', error: 'Failed to verify repo artifacts. Proceeding to manual configuration.' }));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setState(prev => ({ ...prev, isZipping: true, error: null, source: 'upload' }));

            try {
                const zip = new JSZip();
                let projectName = 'project';

                // Handle single zip/tar file
                if (files.length === 1 && (files[0].name.endsWith('.zip') || files[0].name.endsWith('.tar.gz'))) {
                    const file = files[0];
                    setState(prev => ({
                        ...prev,
                        source: 'upload',
                        file: file,
                        isZipping: false,
                        step: 'configure',
                        config: { ...prev.config, projectName: file.name.split('.')[0] }
                    }));
                    return;
                }

                // Handle folder upload
                files.forEach(file => {
                    const path = file.webkitRelativePath || file.name;
                    zip.file(path, file);

                    // Try to extract project name from the root folder
                    if (projectName === 'project' && file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
                        projectName = file.webkitRelativePath.split('/')[0];
                    }
                });

                const content = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                });

                const zipFile = new File([content], `${projectName}.zip`, { type: 'application/zip' });

                setState(prev => ({
                    ...prev,
                    source: 'upload',
                    file: zipFile,
                    isZipping: false,
                    step: 'configure',
                    config: { ...prev.config, projectName }
                }));

            } catch (err: any) {
                console.error("Zipping failed:", err);
                setState(prev => ({
                    ...prev,
                    error: `Failed to process folder: ${err.message || 'Unknown error'}`,
                    isZipping: false,
                    source: 'upload'
                }));
            } finally {
                // Reset input value to allow re-uploading the same folder
                e.target.value = '';
            }
        }
    };

    const handleBuild = async () => {
        setState(prev => ({ ...prev, step: 'building', error: null }));

        try {
            // Trigger Build
            const res = await fetch('/api/deploy/build', {
                method: 'POST',
                body: JSON.stringify({
                    projectName: state.config.projectName,
                    source: state.source,
                    repoUrl: state.selectedRepo ? state.selectedRepo.html_url : null
                })
            });

            if (!res.ok) throw new Error('Build request failed');

            const data = await res.json();

            // Simulate build time progress if needed, but for now we trust the "mock" response
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    step: 'review',
                    appDetails: {
                        name: prev.config.projectName,
                        version: '1.0.0', // Generated version
                        apkUrl: data.apkUrl,
                        description: prev.config.description || 'Newly built application',
                        source: 'built'
                    }
                }));
            }, 2000); // Fake delay for UX

        } catch (err: any) {
            setState(prev => ({ ...prev, step: 'configure', error: err.message }));
        }
    };

    const handlePublish = async () => {
        if (!state.appDetails) return;

        setState(prev => ({ ...prev, step: 'publishing', error: null }));

        try {
            const formData = new FormData();
            formData.append('name', state.config.projectName);
            formData.append('version', state.appDetails.version);
            formData.append('description', state.config.description);
            formData.append('apkUrl', state.appDetails.apkUrl);
            formData.append('category', state.config.category);

            if (state.files.icon) {
                formData.append('iconFile', state.files.icon);
            }
            state.files.screenshots.forEach((file) => {
                formData.append('screenshotFiles', file);
            });

            const res = await fetch('/api/deploy/publish', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Publish failed');
            }

            const data = await res.json();

            setState(prev => ({
                ...prev,
                step: 'success',
                publishedApp: data.app
            }));

        } catch (err: any) {
            setState(prev => ({ ...prev, step: 'review', error: err.message }));
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-6 md:p-12 font-sans flex flex-col items-center transition-colors">
            <div className="max-w-5xl w-full">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold mb-2">Deploy & Publish</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Import a repository, build it, and publish directly to the AppFlux Store.
                    </p>
                </header>

                <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
                    {/* LEFT COLUMN: SOURCE SELECTION */}
                    <div className="space-y-6">
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden">
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Github className="w-5 h-5" /> Import Git Repository
                                </h3>
                                {state.githubConnected && (
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                className="bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-md py-1 pl-9 pr-3 text-sm focus:border-black/20 dark:focus:border-white/20 focus:outline-none w-32 md:w-48 transition-colors"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                {!state.githubConnected ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                        <Github className="w-8 h-8 text-black dark:text-white" />
                                        <p className="font-medium">Connect to GitHub</p>

                                        {!state.showPatInput ? (
                                            <>
                                                <button
                                                    onClick={handleConnectGithub}
                                                    disabled={state.isLinking}
                                                    className="px-6 py-2 bg-[#24292F] hover:bg-[#24292F]/90 text-white rounded-md font-medium text-sm flex items-center gap-2"
                                                >
                                                    {state.isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect GitHub'}
                                                </button>
                                                <button
                                                    onClick={() => setState(prev => ({ ...prev, showPatInput: true, error: null }))}
                                                    className="text-xs text-zinc-500 hover:text-black dark:hover:text-white hover:underline transition-colors"
                                                >
                                                    Or use Personal Access Token
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left">
                                                <div className="text-center">
                                                    <h4 className="font-semibold text-sm">Connect via Token</h4>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        Since this GitHub account is used elsewhere, please use a Personal Access Token (Classic).
                                                    </p>
                                                </div>

                                                <a
                                                    href="https://github.com/settings/tokens/new?scopes=repo&description=AppFlux+Deploy"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                                                >
                                                    Generate Token (Select 'repo' scope) <ExternalLink className="w-3 h-3" />
                                                </a>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                                                    </div>
                                                    <div className="relative flex justify-center text-[10px] uppercase">
                                                        <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-400">Or Paste Existing</span>
                                                    </div>
                                                </div>

                                                <input
                                                    type="password"
                                                    placeholder="ghp_..."
                                                    className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20 font-mono"
                                                    value={state.patToken}
                                                    onChange={(e) => setState(prev => ({ ...prev, patToken: e.target.value }))}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setState(prev => ({ ...prev, showPatInput: false, error: null }))}
                                                        className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handlePatConnect}
                                                        disabled={!state.patToken || state.isLoadingRepos}
                                                        className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:bg-black/80 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {state.isLoadingRepos ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Token'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {state.error && <p className="text-red-500 dark:text-red-400 text-xs px-4 max-w-md">{state.error}</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {state.isLoadingRepos ? (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Filter Toggle & Count */}
                                                <div className="flex justify-between items-center mb-3 px-1">
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        Showing {(showAllRepos ? (state.allRepositories || []) : state.repositories).length} repositories
                                                    </span>
                                                    <button
                                                        onClick={() => setShowAllRepos(!showAllRepos)}
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                                                    >
                                                        {showAllRepos ? 'Show Mobile Only' : 'Show All Repositories'}
                                                    </button>
                                                </div>

                                                {(showAllRepos ? (state.allRepositories || []) : state.repositories)
                                                    .filter((r: any) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map((repo: any) => (
                                                        <div key={repo.id} className="flex items-center justify-between p-3 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${repo.private ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-black/5 dark:bg-white/10'}`}>
                                                                    {repo.private ? <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> : <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">{repo.name}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                                            {repo.language || 'Unknown'}
                                                                        </span>
                                                                        <p className="text-xs text-zinc-500">
                                                                            {new Date(repo.updated_at).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSelectRepo(repo)}
                                                                className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 dark:hover:bg-zinc-200"
                                                            >
                                                                Select
                                                            </button>
                                                        </div>
                                                    ))}

                                                {/* Empty State Helper */}
                                                {!showAllRepos && state.repositories.length === 0 && (state.allRepositories?.length || 0) > 0 && (
                                                    <div className="text-center py-8 text-zinc-500 text-sm">
                                                        <p>No mobile apps detected automatically.</p>
                                                        <button
                                                            onClick={() => setShowAllRepos(true)}
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline mt-2"
                                                        >
                                                            Show all repositories
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ACTION PANELS */}
                    <div className="space-y-6">

                        {/* 1. UPLOAD (Only show if selecting) */}
                        {state.step === 'select' && (
                            <div className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors relative group h-full min-h-[200px] lg:max-h-64 ${state.isZipping
                                ? 'bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700'
                                : 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                                }`}>
                                {state.isZipping ? (
                                    <div className="space-y-3 animate-pulse">
                                        <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white mx-auto" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Processing Folder...</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Compressing files for upload</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            multiple
                                            disabled={state.isZipping}
                                            // @ts-expect-error - webkitdirectory is a non-standard attribute
                                            webkitdirectory=""

                                            directory=""
                                            onChange={handleFileUpload}
                                        />
                                        <FolderUp className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mb-2 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                        <h4 className="font-semibold text-sm">Upload Folder</h4>
                                        <p className="text-xs text-zinc-500 mt-1 px-4">Drag & drop source code or click to select folder</p>
                                        {state.error && state.source === 'upload' && (
                                            <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 max-w-[90%]">
                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                <p className="text-[10px] font-medium truncate">{state.error}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* 2. CHECKING STATE */}
                        {state.step === 'checking' && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
                                <div>
                                    <h3 className="font-semibold text-lg">Analyzing Repository...</h3>
                                    <p className="text-zinc-500 text-sm">Checking for existing builds and releases.</p>
                                </div>
                            </div>
                        )}

                        {/* 3. CONFIGURE / BUILD */}
                        {state.step === 'configure' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80">
                                    <h3 className="font-semibold">Configure Build</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Project Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                                            value={state.config.projectName}
                                            onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, projectName: e.target.value } }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Framework</label>
                                        <select
                                            className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                                            value={state.config.framework}
                                            onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, framework: e.target.value } }))}
                                        >
                                            <option>Flutter</option>
                                            <option>React Native</option>
                                            <option>Android (Java/Kotlin)</option>
                                            <option>iOS (Swift)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Category</label>
                                        <select
                                            className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                                            value={state.config.category}
                                            onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, category: e.target.value } }))}
                                        >
                                            <option value="android">Android</option>
                                            <option value="ios">iOS</option>
                                            <option value="windows">Windows</option>
                                            <option value="macos">macOS</option>
                                            <option value="linux">Linux</option>
                                            <option value="game">Game</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Description</label>
                                        <textarea
                                            className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm focus:border-black/20 dark:focus:border-white/20 focus:outline-none"
                                            rows={2}
                                            value={state.config.description}
                                            onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, description: e.target.value } }))}
                                            placeholder="Optional description"
                                        />
                                    </div>

                                    {state.error && <p className="text-red-500 dark:text-red-400 text-sm">{state.error}</p>}
                                    <button
                                        onClick={handleBuild}
                                        className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-md hover:bg-black/90 dark:hover:bg-zinc-200 mt-2 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Terminal className="w-4 h-4" />
                                        Build & Deploy
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. BUILDING STATE */}
                        {state.step === 'building' && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
                                <h3 className="font-semibold text-lg">Building Project...</h3>
                                <div className="space-y-2 max-w-xs mx-auto">
                                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-black dark:bg-white animate-[progress_2s_ease-in-out_infinite]" />
                                    </div>
                                    <p className="text-zinc-500 text-xs">This might take a few minutes. We're installing dependencies and compiling your app.</p>
                                </div>
                            </div>
                        )}

                        {/* 5. REVIEW & PUBLISH */}
                        {state.step === 'review' && state.appDetails && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 flex justify-between items-center">
                                    <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                                        <Package className="w-4 h-4" /> Review Release
                                    </h3>
                                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                                        {state.appDetails.source === 'release' ? 'APK Found' : 'Build Success'}
                                    </span>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="flex items-start gap-4">
                                        {state.files.icon ? (
                                            <img
                                                src={URL.createObjectURL(state.files.icon)}
                                                alt="Icon"
                                                className="w-16 h-16 rounded-2xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-dashed border-zinc-300 dark:border-zinc-600">
                                                <UploadCloud className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                                            </div>
                                        )}
                                        <div className="space-y-1 flex-1">
                                            {/* Allow editing name */}
                                            <input
                                                type="text"
                                                className="text-xl font-bold bg-transparent border-b border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 focus:border-black dark:focus:border-white focus:outline-none w-full transition-colors pb-1"
                                                value={state.config.projectName}
                                                onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, projectName: e.target.value } }))}
                                                placeholder="App Name"
                                            />
                                            <div className="flex items-center gap-2 mt-1">
                                                <label className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                                                    Change Icon
                                                    <input
                                                        type="file" accept="image/*" className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setState(prev => ({ ...prev, files: { ...prev.files, icon: e.target.files![0] } }));
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Description</label>
                                            <textarea
                                                className="w-full bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm mt-1 focus:border-black/30 dark:focus:border-white/30 outline-none"
                                                rows={3}
                                                value={state.config.description} // Bind to config description for editing
                                                placeholder="Enter app description..."
                                                onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, description: e.target.value } }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Category</label>
                                            <select
                                                className="w-full bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-sm mt-1"
                                                value={state.config.category}
                                                onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, category: e.target.value } }))}
                                            >
                                                <option value="android">Android</option>
                                                <option value="ios">iOS</option>
                                                <option value="windows">Windows</option>
                                                <option value="macos">macOS</option>
                                                <option value="linux">Linux</option>
                                                <option value="game">Game</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider mb-2 block">Screenshots</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {state.files.screenshots.map((file, i) => (
                                                    <div key={i} className="relative aspect-[9/16] bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden group">
                                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => setState(prev => ({ ...prev, files: { ...prev.files, screenshots: prev.files.screenshots.filter((_, idx) => idx !== i) } }))}
                                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="aspect-[9/16] border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <ImageIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mb-1" />
                                                    <span className="text-[10px] text-zinc-500">Add</span>
                                                    <input
                                                        type="file" accept="image/*" multiple className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files) {
                                                                setState(prev => ({ ...prev, files: { ...prev.files, screenshots: [...prev.files.screenshots, ...Array.from(e.target.files!)] } }));
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {state.error && <p className="text-red-500 dark:text-red-400 text-sm">{state.error}</p>}

                                    <div className="pt-2 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setState(prev => ({ ...prev, step: 'select', selectedRepo: null }))}
                                            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePublish}
                                            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:bg-black/80 dark:hover:bg-zinc-200 transition-colors"
                                        >
                                            Publish to Store
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 6. PUBLISHED SUCCESS */}
                        {state.step === 'success' && state.publishedApp && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="border border-green-500/20 rounded-xl bg-green-50/50 dark:bg-green-500/5 p-8 text-center space-y-6"
                            >
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    <CheckCircle className="w-8 h-8 text-white dark:text-black" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Live on Store!</h2>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Your app has been successfully published.</p>
                                </div>

                                <div className="bg-zinc-100 dark:bg-black/40 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <code className="text-xs text-green-700 dark:text-green-100 flex-1 text-left truncate">
                                        {window.location.origin}/store/{state.publishedApp.id}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/${state.publishedApp.id}`)}
                                        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <Share2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </button>
                                </div>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => router.push(`/store/${state.publishedApp.id}`)}
                                        className="px-5 py-2 bg-green-500 text-white dark:text-black font-bold rounded-full text-sm hover:bg-green-600 dark:hover:bg-green-400 transition-colors flex items-center gap-2"
                                    >
                                        <Store className="w-4 h-4" /> Go to App Page
                                    </button>
                                    <button
                                        onClick={() => setState(prev => ({ ...prev, step: 'select', selectedRepo: null, appDetails: undefined }))}
                                        className="px-5 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium rounded-full text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Deploy Another
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* PUBLISHING LOADER */}
                        {state.step === 'publishing' && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 p-12 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
                                <h3 className="font-semibold">Publishing to Store...</h3>
                                <p className="text-zinc-500 text-xs">Uploading assets and creating listing...</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DeployPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <DeployPageContent />
        </Suspense>
    );
}
