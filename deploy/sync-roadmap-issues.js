// sync-roadmap-issues.js
// Node.js script to sync roadmap.md tasks with GitHub issues and update roadmap.md with issue links
// Usage: node deploy/sync-roadmap-issues.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROADMAP_PATH = path.join(__dirname, '../roadmap.md');
const REPO = 'OfirYaron/dune2-web'; // <-- Change to your GitHub repo
const PHASE_HEADER = '## Phase 1: Code Quality, Testing, and Foundation';

// Helper to create GitHub issue via CLI and return issue URL
function createIssue(title, body) {
  const cmd = `gh issue create --repo ${REPO} --title "${title}" --body "${body}"`;
  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    // Extract the issue URL from the output (usually last line)
    const lines = output.trim().split('\n');
    const url = lines[lines.length - 1];
    return url.startsWith('https://github.com/') ? url : null;
  } catch (err) {
    console.error('Error creating issue:', err.message);
    return null;
  }
}

// Read roadmap.md
let roadmap = fs.readFileSync(ROADMAP_PATH, 'utf8');

// Extract Phase 1 tasks (numbered list)
const phase1Section = roadmap.split(PHASE_HEADER)[1].split('---')[0];
const taskRegex = /([0-9]+\. \*\*(.*?)\*\*)([^\[]*)/g;

// Improved: Robustly extract bullet points for each Phase 1 task
function getBulletsForTask(phaseSection, taskIdx, nextTaskIdx) {
  // Get the section between this task and the next
  const section = phaseSection.slice(taskIdx, nextTaskIdx);
  // Match all bullet points (including indented ones)
  const bulletRegex = /^\s*- .+/gm;
  const bullets = section.match(bulletRegex) || [];
  return bullets.map(b => b.trim()).join('\n');
}

let match;
let updated = false;
let newRoadmap = roadmap;
let taskMatches = [];

// Find all tasks and their positions
while ((match = taskRegex.exec(phase1Section)) !== null) {
  taskMatches.push({
    fullLine: match[1],
    taskTitle: match[2].trim(),
    matchIdx: match.index,
    matchLen: match[0].length,
    matchText: match[0],
    match3: match[3]
  });
}

for (let i = 0; i < taskMatches.length; i++) {
  const { fullLine, taskTitle, matchIdx, matchLen, matchText, match3 } = taskMatches[i];
  const nextTaskIdx = (i + 1 < taskMatches.length) ? taskMatches[i + 1].matchIdx : phase1Section.length;
  const bullets = getBulletsForTask(phase1Section, matchIdx + matchLen, nextTaskIdx);
  const issueBody = bullets ? `**Subtasks:**\n${bullets}` : `No subtasks listed.`;

  // Check if issue link already exists
  const issueLinkRegex = /\[Issue\]\(https:\/\/github.com\/.+\/issues\/[0-9]+\)/;
  if (!issueLinkRegex.test(matchText)) {
    // Create issue
    const issueUrl = createIssue(taskTitle, issueBody);
    if (issueUrl) {
      // Insert issue link after the task title
      const replacement = `${fullLine} [Issue](${issueUrl})${match3}`;
      newRoadmap = newRoadmap.replace(fullLine + match3, replacement);
      updated = true;
      console.log(`Created issue for: ${taskTitle}`);
    }
  } else {
    console.log(`Issue already exists for: ${taskTitle}`);
  }
}

// Write updated roadmap.md if changed
if (updated) {
  fs.writeFileSync(ROADMAP_PATH, newRoadmap, 'utf8');
  console.log('roadmap.md updated with issue links.');
} else {
  console.log('No new issues created. roadmap.md is up to date.');
}

// Note: Requires GitHub CLI (gh) installed and authenticated.
//       Change REPO to your actual GitHub repo.
//       You can expand this script for other phases or advanced parsing as needed.
