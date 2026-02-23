import JSZip from 'jszip';

export type ProjectType = 'android' | 'web' | 'pwa' | 'desktop' | 'unknown';

export async function detectProjectType(file: File): Promise<ProjectType> {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        // Check for Android
        if (content.file(/build\.gradle/i).length > 0 || content.file(/AndroidManifest\.xml/i).length > 0) {
            return 'android';
        }

        // Check for Desktop (Electron/Tauri)
        const packageJsonFile = content.file('package.json');
        if (packageJsonFile) {
            const packageJsonText = await packageJsonFile.async('string');
            const packageJson = JSON.parse(packageJsonText);

            if (packageJson.dependencies?.electron || packageJson.devDependencies?.electron) {
                return 'desktop';
            }
            if (packageJson.dependencies?.['@tauri-apps/api']) {
                return 'desktop';
            }

            // Check for PWA
            if (content.file(/manifest\.json/i).length > 0 || packageJson.dependencies?.['next-pwa']) {
                return 'pwa';
            }

            // Default to Web if package.json exists
            return 'web';
        }

        // Check for HTML (static web)
        if (content.file(/index\.html/i).length > 0) {
            return 'web';
        }

        return 'unknown';
    } catch (error) {
        console.error('Error detecting project type:', error);
        return 'unknown';
    }
}
