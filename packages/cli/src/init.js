import { basename, resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { color, logStep } from "./terminal.js";
import { ensureEmptyDirectory, writeText } from "./utils.js";

const SPEC = `# Orbit

Build a calm command center for a small product team. Help the team understand what is moving, what is blocked, and what deserves attention next. The interface can be reinterpreted on every refresh, but it should never feel random.

## Must
- Make creating a new project obvious
- Keep project search available
- Preserve the meaning and wording of important actions
- Show active work and ownership at a glance

## Prefer
- Use progressive disclosure instead of showing every control
- Let returning users scan quickly
- Make the interface feel alive without becoming distracting

## Avoid
- Moving the primary action to an unfamiliar place
- Modal-heavy workflows
- Decorative variation that hurts accessibility

## Adapt
- New users should see more guidance and larger targets
- Power users should get denser information and shorter copy
- Mobile users should get a focused vertical flow

## Audience
- Small product teams
- Product operators

## Tone
- Calm
- precise
- human
- slightly futuristic

## Data
- Projects with a name, status, owner, progress, due date, description, and tags

## Actions
- Create a new project
- Search projects
- Filter by status
- Invite a teammate
- Review analytics
- Inspect recent activity
`;

const CONFIG = `export default {
  novelty: 0.78,
  devtools: true,
  inspectorOpen: true,
  context: {
    experience: "returning",
    device: "auto",
    motion: "auto",
    contrast: "auto"
  }
};
`;

export async function initProject(targetDirectory, options = {}) {
  const target = resolve(targetDirectory || "my-subjective-app");
  await ensureEmptyDirectory(target, options.force === true);
  const packageName = basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "subjective-app";
  await writeText(resolve(target, "app.subjective"), SPEC);
  await writeText(resolve(target, "subjective.config.js"), CONFIG);
  await writeFile(resolve(target, "package.json"), `${JSON.stringify({
    name: packageName,
    version: "0.3.0-alpha.1",
    private: true,
    type: "module",
    scripts: {
      dev: "subjective dev",
      build: "subjective build",
      inspect: "subjective inspect app.subjective"
    },
    devDependencies: {
      "subjective-c": "^0.3.0-alpha.1"
    }
  }, null, 2)}\n`, "utf8");
  await writeText(resolve(target, ".gitignore"), "node_modules/\ndist/\n.DS_Store\n");
  await writeText(resolve(target, "README.md"), `# ${basename(target)}\n\nBuilt with [Subjective C](https://github.com/subjective-c/subjective-c).\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);

  logStep(color.green("✓"), color.bold("Created Subjective C app"), target);
  console.log(`\n  cd ${basename(target)}\n  npm install\n  npm run dev\n`);
  return target;
}
