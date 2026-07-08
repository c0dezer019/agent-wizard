"use strict";

const { clearScreen, bold, dim } = require("./theme");
const { waitForKey, setRaw } = require("./keys");

// ---------------------------------------------------------------------------
// "Writing a good agent" help screen
// ---------------------------------------------------------------------------

const HELP_TEXT = `Writing a good agent
====================

An agent file has two jobs: get *picked*, and *behave well* once picked.
Most agents fail at the first job, not the second — Claude only ever reads
the description before deciding whether to delegate to an agent, so if that
one line doesn't read as a clear trigger, nothing else in the file matters.

Name
  Lowercase letters, digits, and hyphens, starting with a letter (e.g.
  code-reviewer). Must be unique in its scope and can't shadow a built-in
  (general-purpose, Explore, Plan, claude, statusline-setup,
  claude-code-guide).

Description — the delegation trigger
  Write it as a condition for use, not a summary of what the agent does.

    vague:   "Helps with code review"
    trigger: "Use PROACTIVELY after any multi-file change to check for
             security issues, missing error handling, and test coverage
             gaps before it's committed."

  The second version tells Claude exactly *when* to reach for this agent,
  not just what it's broadly about. "Use PROACTIVELY when..." is a good
  default frame if it fits the role.

Tools
  Omit the tools: field to inherit everything — that's the safe default.
  Only restrict it when the role clearly implies a narrow set: a read-only
  reviewer gets Read, Grep, Glob; a docs writer gets Read, Write, Edit,
  Grep, Glob. Guessing too narrow a list can silently block the agent
  partway through a task.

Model
  Omit to inherit the session's model. Only set it when there's a clear
  signal: haiku for lightweight or high-volume work, opus for complex,
  high-stakes, or judgment-heavy work.

Seniority — how it shapes agent behavior
  Seniority isn't a label, it's an instruction to yourself about how to write
  the system prompt: how prescriptive vs. open-ended it is, how much the
  agent is trusted to make a judgment call instead of following steps, and
  when it's expected to escalate back to you versus just deciding. The same
  task ("review this PR", "plan this migration") reads completely differently
  written for a junior agent than a principal one — the tools might be
  identical, but the instructions shouldn't be.

  junior
    Follows explicit, ordered steps and does not improvise. Flags anything
    the steps don't cover instead of guessing at intent. Best for narrow,
    repetitive, low-risk work where consistency matters more than judgment.
      "Follow these steps in order. If a step doesn't apply, skip it and say
      why. If you're unsure how to proceed, stop and ask rather than
      guessing."

  mid-level
    Handles the common variations of a task without hand-holding, but still
    escalates anything genuinely novel, ambiguous, or higher-risk than usual.
    Give it a checklist plus a few explicit judgment-call carve-outs, not a
    rigid script and not a blank check either.
      "Handle routine cases yourself using the checklist below. Use your own
      judgment for low-risk variations, but flag anything touching
      production data or security-sensitive code before proceeding."

  senior
    Owns a whole class of problem end to end: picks the approach, weighs
    tradeoffs, and only checks in when a decision has consequences beyond
    its immediate task. Write goals and constraints, not a step-by-step
    procedure — it should not need one.
      "You own <area>. Decide the right approach given the constraints
      below rather than waiting for step-by-step instructions. Push back if
      a request conflicts with those constraints instead of complying
      anyway."

  principal
    Operates with the most autonomy: expected to reason about second-order
    and systemic tradeoffs, not just the immediate task, and to actively
    say so if the request itself is the wrong call — not merely execute it
    well.
      "You're the final judgment call on <area>. Weigh tradeoffs beyond the
      immediate task, and tell me directly if what's being asked is a
      mistake, even if that means disagreeing with the request."

  More examples, same role at different levels:
    code-reviewer
      junior:    checks a fixed list of lint/style rules; anything outside
                 that list gets flagged for a human, not decided on.
      senior:    reviews for correctness, security, and architectural fit;
                 decides which issues actually block the merge.
    database-migration-specialist
      mid-level: runs a known migration checklist; escalates anything
                 involving downtime or data-loss risk instead of proceeding.
      principal: designs the migration strategy itself, rollback plan
                 included, and is expected to refuse an unsafe approach.
    incident-responder
      junior:    follows the runbook step by step; pages a human the moment
                 the runbook doesn't cover the situation.
      principal: makes real-time triage and mitigation calls with no
                 runbook, and owns the postmortem's root-cause judgment.

System prompt body
  Write it in second person ("You are...", "You will...") and make it
  genuinely specific to the role — generic boilerplate is about as useful
  as no system prompt at all. This is where the seniority guidance above
  actually gets applied: bake the prescriptiveness/autonomy level straight
  into the wording, don't just mention the seniority as a label and leave
  the rest generic.

Common role examples
  Starting points for the roles that come up most — pick one and adjust the
  tasks/seniority to fit rather than starting from a blank page.

  code-reviewer
    description: "Use PROACTIVELY after any non-trivial code change to
                 review for correctness, security issues, and style
                 violations before it's merged."
    tools:       Read, Grep, Glob (read-only — it reviews, it doesn't fix)
    model:       omit, unless review volume is high (haiku) or the codebase
                 is unusually complex/high-stakes (opus)

  test-writer
    description: "Use when new functionality needs test coverage, or
                 existing tests need updating after a behavior change."
    tools:       Read, Write, Edit, Grep, Glob
    model:       omit

  docs-writer
    description: "Use after a feature or API change to update README,
                 docs, or inline comments to match the new behavior."
    tools:       Read, Write, Edit, Grep, Glob
    model:       omit

  research-agent (investigate, don't modify)
    description: "Use for open-ended investigation — where something is
                 defined, how a system behaves, or gathering background
                 before a decision — not for making changes."
    tools:       Read, Grep, Glob, WebSearch, WebFetch (no Write/Edit)
    model:       omit

  migration-specialist / large refactor
    description: "Use PROACTIVELY when a large-scale rename, dependency
                 upgrade, or structural refactor spans many files."
    tools:       omit (broad access genuinely needed across the codebase)
    model:       opus if the migration is high-risk or judgment-heavy

  incident-responder
    description: "Use when production behavior is unexpected or an alert
                 fires, to triage, gather diagnostics, and propose
                 mitigation."
    tools:       Read, Bash, Grep, Glob
    model:       omit, unless the org wants faster/cheaper first-response
                 triage (haiku) with escalation to a human for the fix

Fastest path
  Use "+ New agent" and answer the role/seniority/tasks questions — claude
  drafts the description for you, then (your choice) either drafts the
  whole file too, walks through it with you interactively, or leaves you a
  manual template. $EDITOR opens afterward either way, so nothing here is
  final until you close it.
`;

async function showHelp() {
  const lines = HELP_TEXT.split("\n");
  let scroll = 0;
  for (;;) {
    const rows = process.stdout.rows || 24;
    const viewHeight = Math.max(3, rows - 5);

    let out = clearScreen();
    out += bold("Writing a good agent — help") + "\n\n";
    out += lines.slice(scroll, scroll + viewHeight).join("\n") + "\n";
    const last = Math.min(scroll + viewHeight, lines.length);
    out +=
      "\n" +
      dim(
        `↑/↓ scroll (${lines.length ? scroll + 1 : 0}-${last}/${lines.length})   Esc/q back`,
      ) +
      "\n";
    process.stdout.write(out);
    setRaw(true);
    const key = await waitForKey();
    if (key.name === "up") scroll = Math.max(0, scroll - 1);
    else if (key.name === "down")
      scroll = Math.min(Math.max(0, lines.length - viewHeight), scroll + 1);
    else if (key.name === "escape" || key.name === "q" || key.name === "return")
      return;
    else if (key.ctrl && key.name === "c") process.exit(0);
  }
}

module.exports = { HELP_TEXT, showHelp };
