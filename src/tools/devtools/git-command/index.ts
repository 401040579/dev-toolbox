import type { ToolDefinition } from '@/tools/types';

export interface GitCommand {
  category: string;
  command: string;
  description: string;
  example?: string;
}

export const GIT_COMMANDS: GitCommand[] = [
  // Setup
  { category: 'Setup', command: 'git init', description: 'Initialize a new repository' },
  { category: 'Setup', command: 'git clone <url>', description: 'Clone a repository', example: 'git clone https://github.com/user/repo.git' },
  { category: 'Setup', command: 'git config --global user.name "<name>"', description: 'Set global username' },
  { category: 'Setup', command: 'git config --global user.email "<email>"', description: 'Set global email' },
  // Basic
  { category: 'Basic', command: 'git status', description: 'Show working tree status' },
  { category: 'Basic', command: 'git add <file>', description: 'Stage file(s)', example: 'git add . (stage all)' },
  { category: 'Basic', command: 'git commit -m "<msg>"', description: 'Commit staged changes' },
  { category: 'Basic', command: 'git log --oneline', description: 'View commit history (compact)' },
  { category: 'Basic', command: 'git diff', description: 'Show unstaged changes' },
  { category: 'Basic', command: 'git diff --staged', description: 'Show staged changes' },
  // Branching
  { category: 'Branch', command: 'git branch', description: 'List branches' },
  { category: 'Branch', command: 'git branch <name>', description: 'Create a new branch' },
  { category: 'Branch', command: 'git checkout <branch>', description: 'Switch to branch' },
  { category: 'Branch', command: 'git checkout -b <branch>', description: 'Create and switch to branch' },
  { category: 'Branch', command: 'git merge <branch>', description: 'Merge branch into current' },
  { category: 'Branch', command: 'git branch -d <branch>', description: 'Delete branch' },
  // Remote
  { category: 'Remote', command: 'git remote -v', description: 'List remote repositories' },
  { category: 'Remote', command: 'git fetch', description: 'Download remote changes' },
  { category: 'Remote', command: 'git pull', description: 'Fetch and merge remote changes' },
  { category: 'Remote', command: 'git push', description: 'Push commits to remote' },
  { category: 'Remote', command: 'git push -u origin <branch>', description: 'Push and set upstream' },
  // Undo
  { category: 'Undo', command: 'git reset HEAD <file>', description: 'Unstage a file' },
  { category: 'Undo', command: 'git checkout -- <file>', description: 'Discard changes in file' },
  { category: 'Undo', command: 'git revert <commit>', description: 'Revert a commit' },
  { category: 'Undo', command: 'git reset --soft HEAD~1', description: 'Undo last commit (keep changes)' },
  { category: 'Undo', command: 'git reset --hard HEAD~1', description: 'Undo last commit (discard changes)' },
  // Stash
  { category: 'Stash', command: 'git stash', description: 'Stash working changes' },
  { category: 'Stash', command: 'git stash pop', description: 'Apply and remove last stash' },
  { category: 'Stash', command: 'git stash list', description: 'List all stashes' },
  // Tags
  { category: 'Tags', command: 'git tag <name>', description: 'Create a lightweight tag' },
  { category: 'Tags', command: 'git tag -a <name> -m "<msg>"', description: 'Create an annotated tag' },
  { category: 'Tags', command: 'git push --tags', description: 'Push all tags to remote' },
];

export function searchCommands(query: string): GitCommand[] {
  if (!query.trim()) return GIT_COMMANDS;
  const q = query.toLowerCase();
  return GIT_COMMANDS.filter(
    (c) =>
      c.command.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
  );
}

const tool: ToolDefinition = {
  id: 'git-command',
  name: 'Git Command Reference',
  description: 'Quick reference for common git commands',
  category: 'devtools',
  keywords: ['git', 'command', 'reference', 'cheatsheet', 'version', 'control'],
  icon: 'GitBranch',
  component: () => import('./GitCommand'),
};

export default tool;
