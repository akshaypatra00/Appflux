import { Octokit } from "octokit";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export const GITHUB_OWNER = process.env.GITHUB_OWNER || "";
export const GITHUB_REPO = process.env.GITHUB_REPO || "";

if (!process.env.GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN is not defined in environment variables");
}
