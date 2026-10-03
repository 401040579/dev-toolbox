import type { ToolDefinition } from '@/tools/types';

export interface GitCommand {
  id: string;
  category: string;
  command: string;
  description: string;
  example?: string;
}

export const GIT_COMMANDS: GitCommand[] = [
  // Setup
  { id: 'init', category: 'Setup', command: 'git init', description: 'Initialize a new repository' },
  { id: 'clone', category: 'Setup', command: 'git clone <url>', description: 'Clone a repository', example: 'git clone https://github.com/user/repo.git' },
  { id: 'configName', category: 'Setup', command: 'git config --global user.name "<name>"', description: 'Set global username' },
  { id: 'configEmail', category: 'Setup', command: 'git config --global user.email "<email>"', description: 'Set global email' },
  // Basic
  { id: 'status', category: 'Basic', command: 'git status', description: 'Show working tree status' },
  { id: 'add', category: 'Basic', command: 'git add <file>', description: 'Stage file(s)', example: 'git add . (stage all)' },
  { id: 'commit', category: 'Basic', command: 'git commit -m "<msg>"', description: 'Commit staged changes' },
  { id: 'log', category: 'Basic', command: 'git log --oneline', description: 'View commit history (compact)' },
  { id: 'diff', category: 'Basic', command: 'git diff', description: 'Show unstaged changes' },
  { id: 'diffStaged', category: 'Basic', command: 'git diff --staged', description: 'Show staged changes' },
  // Branching
  { id: 'branchList', category: 'Branch', command: 'git branch', description: 'List branches' },
  { id: 'branchCreate', category: 'Branch', command: 'git branch <name>', description: 'Create a new branch' },
  { id: 'checkout', category: 'Branch', command: 'git checkout <branch>', description: 'Switch to branch' },
  { id: 'checkoutNew', category: 'Branch', command: 'git checkout -b <branch>', description: 'Create and switch to branch' },
  { id: 'merge', category: 'Branch', command: 'git merge <branch>', description: 'Merge branch into current' },
  { id: 'branchDelete', category: 'Branch', command: 'git branch -d <branch>', description: 'Delete branch' },
  // Remote
  { id: 'remote', category: 'Remote', command: 'git remote -v', description: 'List remote repositories' },
  { id: 'fetch', category: 'Remote', command: 'git fetch', description: 'Download remote changes' },
  { id: 'pull', category: 'Remote', command: 'git pull', description: 'Fetch and merge remote changes' },
  { id: 'push', category: 'Remote', command: 'git push', description: 'Push commits to remote' },
  { id: 'pushUpstream', category: 'Remote', command: 'git push -u origin <branch>', description: 'Push and set upstream' },
  // Undo
  { id: 'unstage', category: 'Undo', command: 'git reset HEAD <file>', description: 'Unstage a file' },
  { id: 'discard', category: 'Undo', command: 'git checkout -- <file>', description: 'Discard changes in file' },
  { id: 'revert', category: 'Undo', command: 'git revert <commit>', description: 'Revert a commit' },
  { id: 'resetSoft', category: 'Undo', command: 'git reset --soft HEAD~1', description: 'Undo last commit (keep changes)' },
  { id: 'resetHard', category: 'Undo', command: 'git reset --hard HEAD~1', description: 'Undo last commit (discard changes)' },
  // Stash
  { id: 'stash', category: 'Stash', command: 'git stash', description: 'Stash working changes' },
  { id: 'stashPop', category: 'Stash', command: 'git stash pop', description: 'Apply and remove last stash' },
  { id: 'stashList', category: 'Stash', command: 'git stash list', description: 'List all stashes' },
  // Tags
  { id: 'tag', category: 'Tags', command: 'git tag <name>', description: 'Create a lightweight tag' },
  { id: 'tagAnnotated', category: 'Tags', command: 'git tag -a <name> -m "<msg>"', description: 'Create an annotated tag' },
  { id: 'pushTags', category: 'Tags', command: 'git push --tags', description: 'Push all tags to remote' },
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
