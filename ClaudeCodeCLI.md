> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Claude Code overview

> Claude Code is an agentic coding tool that reads your codebase, edits files, runs commands, and integrates with your development tools. Available in your terminal, IDE, desktop app, and browser.

Claude Code is an AI-powered coding assistant that helps you build features, fix bugs, and automate development tasks. It understands your entire codebase and can work across multiple files and tools to get things done.

## Get started

Choose your environment to get started. Most surfaces require a [Claude subscription](https://claude.com/pricing) or [Anthropic Console](https://console.anthropic.com/) account. The Terminal CLI and VS Code also support [third-party providers](/en/third-party-integrations).

<Tabs>
  <Tab title="Terminal">
    The full-featured CLI for working with Claude Code directly in your terminal. Edit files, run commands, and manage your entire project from the command line.

    To install Claude Code, use one of the following methods:

    <Tabs>
      <Tab title="Native Install (Recommended)">
        **macOS, Linux, WSL:**

        ```bash  theme={null}
        curl -fsSL https://claude.ai/install.sh | bash
        ```

        **Windows PowerShell:**

        ```powershell  theme={null}
        irm https://claude.ai/install.ps1 | iex
        ```

        **Windows CMD:**

        ```batch  theme={null}
        curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
        ```

        **Windows requires [Git for Windows](https://git-scm.com/downloads/win).** Install it first if you don't have it.

        <Info>
          Native installations automatically update in the background to keep you on the latest version.
        </Info>
      </Tab>

      <Tab title="Homebrew">
        ```bash  theme={null}
        brew install --cask claude-code
        ```

        <Info>
          Homebrew installations do not auto-update. Run `brew upgrade claude-code` periodically to get the latest features and security fixes.
        </Info>
      </Tab>

      <Tab title="WinGet">
        ```powershell  theme={null}
        winget install Anthropic.ClaudeCode
        ```

        <Info>
          WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.
        </Info>
      </Tab>
    </Tabs>

    Then start Claude Code in any project:

    ```bash  theme={null}
    cd your-project
    claude
    ```

    You'll be prompted to log in on first use. That's it! [Continue with the Quickstart →](/en/quickstart)

    <Tip>
      See [advanced setup](/en/setup) for installation options, manual updates, or uninstallation instructions. Visit [troubleshooting](/en/troubleshooting) if you hit issues.
    </Tip>
  </Tab>

  <Tab title="VS Code">
    The VS Code extension provides inline diffs, @-mentions, plan review, and conversation history directly in your editor.

    * [Install for VS Code](vscode:extension/anthropic.claude-code)
    * [Install for Cursor](cursor:extension/anthropic.claude-code)

    Or search for "Claude Code" in the Extensions view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux). After installing, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`), type "Claude Code", and select **Open in New Tab**.

    [Get started with VS Code →](/en/vs-code#get-started)
  </Tab>

  <Tab title="Desktop app">
    A standalone app for running Claude Code outside your IDE or terminal. Review diffs visually, run multiple sessions side by side, and kick off cloud sessions.

    Download and install:

    * [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code\&utm_medium=docs) (Intel and Apple Silicon)
    * [Windows](https://claude.ai/api/desktop/win32/x64/exe/latest/redirect?utm_source=claude_code\&utm_medium=docs) (x64)
    * [Windows ARM64](https://claude.ai/api/desktop/win32/arm64/exe/latest/redirect?utm_source=claude_code\&utm_medium=docs) (remote sessions only)

    After installing, launch Claude, sign in, and click the **Code** tab to start coding. A [paid subscription](https://claude.com/pricing) is required.

    [Learn more about the desktop app →](/en/desktop-quickstart)
  </Tab>

  <Tab title="Web">
    Run Claude Code in your browser with no local setup. Kick off long-running tasks and check back when they're done, work on repos you don't have locally, or run multiple tasks in parallel. Available on desktop browsers and the Claude iOS app.

    Start coding at [claude.ai/code](https://claude.ai/code).

    [Get started on the web →](/en/claude-code-on-the-web#getting-started)
  </Tab>

  <Tab title="JetBrains">
    A plugin for IntelliJ IDEA, PyCharm, WebStorm, and other JetBrains IDEs with interactive diff viewing and selection context sharing.

    Install the [Claude Code plugin](https://plugins.jetbrains.com/plugin/27310-claude-code-beta-) from the JetBrains Marketplace and restart your IDE.

    [Get started with JetBrains →](/en/jetbrains)
  </Tab>
</Tabs>

## What you can do

Here are some of the ways you can use Claude Code:

<AccordionGroup>
  <Accordion title="Automate the work you keep putting off" icon="wand-magic-sparkles">
    Claude Code handles the tedious tasks that eat up your day: writing tests for untested code, fixing lint errors across a project, resolving merge conflicts, updating dependencies, and writing release notes.

    ```bash  theme={null}
    claude "write tests for the auth module, run them, and fix any failures"
    ```
  </Accordion>

  <Accordion title="Build features and fix bugs" icon="hammer">
    Describe what you want in plain language. Claude Code plans the approach, writes the code across multiple files, and verifies it works.

    For bugs, paste an error message or describe the symptom. Claude Code traces the issue through your codebase, identifies the root cause, and implements a fix. See [common workflows](/en/common-workflows) for more examples.
  </Accordion>

  <Accordion title="Create commits and pull requests" icon="code-branch">
    Claude Code works directly with git. It stages changes, writes commit messages, creates branches, and opens pull requests.

    ```bash  theme={null}
    claude "commit my changes with a descriptive message"
    ```

    In CI, you can automate code review and issue triage with [GitHub Actions](/en/github-actions) or [GitLab CI/CD](/en/gitlab-ci-cd).
  </Accordion>

  <Accordion title="Connect your tools with MCP" icon="plug">
    The [Model Context Protocol (MCP)](/en/mcp) is an open standard for connecting AI tools to external data sources. With MCP, Claude Code can read your design docs in Google Drive, update tickets in Jira, pull data from Slack, or use your own custom tooling.
  </Accordion>

  <Accordion title="Customize with instructions, skills, and hooks" icon="sliders">
    [`CLAUDE.md`](/en/memory) is a markdown file you add to your project root that Claude Code reads at the start of every session. Use it to set coding standards, architecture decisions, preferred libraries, and review checklists. Claude also builds [auto memory](/en/memory#auto-memory) as it works, saving learnings like build commands and debugging insights across sessions without you writing anything.

    Create [custom commands](/en/skills) to package repeatable workflows your team can share, like `/review-pr` or `/deploy-staging`.

    [Hooks](/en/hooks) let you run shell commands before or after Claude Code actions, like auto-formatting after every file edit or running lint before a commit.
  </Accordion>

  <Accordion title="Run agent teams and build custom agents" icon="users">
    Spawn [multiple Claude Code agents](/en/sub-agents) that work on different parts of a task simultaneously. A lead agent coordinates the work, assigns subtasks, and merges results.

    For fully custom workflows, the [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) lets you build your own agents powered by Claude Code's tools and capabilities, with full control over orchestration, tool access, and permissions.
  </Accordion>

  <Accordion title="Pipe, script, and automate with the CLI" icon="terminal">
    Claude Code is composable and follows the Unix philosophy. Pipe logs into it, run it in CI, or chain it with other tools:

    ```bash  theme={null}
    # Monitor logs and get alerted
    tail -f app.log | claude -p "Slack me if you see any anomalies"

    # Automate translations in CI
    claude -p "translate new strings into French and raise a PR for review"

    # Bulk operations across files
    git diff main --name-only | claude -p "review these changed files for security issues"
    ```

    See the [CLI reference](/en/cli-reference) for the full set of commands and flags.
  </Accordion>

  <Accordion title="Work from anywhere" icon="globe">
    Sessions aren't tied to a single surface. Move work between environments as your context changes:

    * Step away from your desk and keep working from your phone or any browser with [Remote Control](/en/remote-control)
    * Kick off a long-running task on the [web](/en/claude-code-on-the-web) or [iOS app](https://apps.apple.com/app/claude-by-anthropic/id6473753684), then pull it into your terminal with `/teleport`
    * Hand off a terminal session to the [Desktop app](/en/desktop) with `/desktop` for visual diff review
    * Route tasks from team chat: mention `@Claude` in [Slack](/en/slack) with a bug report and get a pull request back
  </Accordion>
</AccordionGroup>

## Use Claude Code everywhere

Each surface connects to the same underlying Claude Code engine, so your CLAUDE.md files, settings, and MCP servers work across all of them.

Beyond the [Terminal](/en/quickstart), [VS Code](/en/vs-code), [JetBrains](/en/jetbrains), [Desktop](/en/desktop), and [Web](/en/claude-code-on-the-web) environments above, Claude Code integrates with CI/CD, chat, and browser workflows:

| I want to...                                             | Best option                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Continue a local session from my phone or another device | [Remote Control](/en/remote-control)                                                                               |
| Start a task locally, continue on mobile                 | [Web](/en/claude-code-on-the-web) or [Claude iOS app](https://apps.apple.com/app/claude-by-anthropic/id6473753684) |
| Automate PR reviews and issue triage                     | [GitHub Actions](/en/github-actions) or [GitLab CI/CD](/en/gitlab-ci-cd)                                           |
| Route bug reports from Slack to pull requests            | [Slack](/en/slack)                                                                                                 |
| Debug live web applications                              | [Chrome](/en/chrome)                                                                                               |
| Build custom agents for your own workflows               | [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)                                                |

## Next steps

Once you've installed Claude Code, these guides help you go deeper.

* [Quickstart](/en/quickstart): walk through your first real task, from exploring a codebase to committing a fix
* [Store instructions and memories](/en/memory): give Claude persistent instructions with CLAUDE.md files and auto memory
* [Common workflows](/en/common-workflows) and [best practices](/en/best-practices): patterns for getting the most out of Claude Code
* [Settings](/en/settings): customize Claude Code for your workflow
* [Troubleshooting](/en/troubleshooting): solutions for common issues
* [code.claude.com](https://code.claude.com/): demos, pricing, and product details
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Welcome to Claude Code!

This quickstart guide will have you using AI-powered coding assistance in a few minutes. By the end, you'll understand how to use Claude Code for common development tasks.

## Before you begin

Make sure you have:

* A terminal or command prompt open
  * If you've never used the terminal before, check out the [terminal guide](/en/terminal-guide)
* A code project to work with
* A [Claude subscription](https://claude.com/pricing) (Pro, Max, Teams, or Enterprise), [Claude Console](https://console.anthropic.com/) account, or access through a [supported cloud provider](/en/third-party-integrations)

<Note>
  This guide covers the terminal CLI. Claude Code is also available on the [web](https://claude.ai/code), as a [desktop app](/en/desktop), in [VS Code](/en/vs-code) and [JetBrains IDEs](/en/jetbrains), in [Slack](/en/slack), and in CI/CD with [GitHub Actions](/en/github-actions) and [GitLab](/en/gitlab-ci-cd). See [all interfaces](/en/overview#use-claude-code-everywhere).
</Note>

## Step 1: Install Claude Code

To install Claude Code, use one of the following methods:

<Tabs>
  <Tab title="Native Install (Recommended)">
    **macOS, Linux, WSL:**

    ```bash  theme={null}
    curl -fsSL https://claude.ai/install.sh | bash
    ```

    **Windows PowerShell:**

    ```powershell  theme={null}
    irm https://claude.ai/install.ps1 | iex
    ```

    **Windows CMD:**

    ```batch  theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
    ```

    **Windows requires [Git for Windows](https://git-scm.com/downloads/win).** Install it first if you don't have it.

    <Info>
      Native installations automatically update in the background to keep you on the latest version.
    </Info>
  </Tab>

  <Tab title="Homebrew">
    ```bash  theme={null}
    brew install --cask claude-code
    ```

    <Info>
      Homebrew installations do not auto-update. Run `brew upgrade claude-code` periodically to get the latest features and security fixes.
    </Info>
  </Tab>

  <Tab title="WinGet">
    ```powershell  theme={null}
    winget install Anthropic.ClaudeCode
    ```

    <Info>
      WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.
    </Info>
  </Tab>
</Tabs>

## Step 2: Log in to your account

Claude Code requires an account to use. When you start an interactive session with the `claude` command, you'll need to log in:

```bash  theme={null}
claude
# You'll be prompted to log in on first use
```

```bash  theme={null}
/login
# Follow the prompts to log in with your account
```

You can log in using any of these account types:

* [Claude Pro, Max, Teams, or Enterprise](https://claude.com/pricing) (recommended)
* [Claude Console](https://console.anthropic.com/) (API access with pre-paid credits). On first login, a "Claude Code" workspace is automatically created in the Console for centralized cost tracking.
* [Amazon Bedrock, Google Vertex AI, or Microsoft Foundry](/en/third-party-integrations) (enterprise cloud providers)

Once logged in, your credentials are stored and you won't need to log in again. To switch accounts later, use the `/login` command.

## Step 3: Start your first session

Open your terminal in any project directory and start Claude Code:

```bash  theme={null}
cd /path/to/your/project
claude
```

You'll see the Claude Code welcome screen with your session information, recent conversations, and latest updates. Type `/help` for available commands or `/resume` to continue a previous conversation.

<Tip>
  After logging in (Step 2), your credentials are stored on your system. Learn more in [Credential Management](/en/authentication#credential-management).
</Tip>

## Step 4: Ask your first question

Let's start with understanding your codebase. Try one of these commands:

```text  theme={null}
what does this project do?
```

Claude will analyze your files and provide a summary. You can also ask more specific questions:

```text  theme={null}
what technologies does this project use?
```

```text  theme={null}
where is the main entry point?
```

```text  theme={null}
explain the folder structure
```

You can also ask Claude about its own capabilities:

```text  theme={null}
what can Claude Code do?
```

```text  theme={null}
how do I create custom skills in Claude Code?
```

```text  theme={null}
can Claude Code work with Docker?
```

<Note>
  Claude Code reads your project files as needed. You don't have to manually add context.
</Note>

## Step 5: Make your first code change

Now let's make Claude Code do some actual coding. Try a simple task:

```text  theme={null}
add a hello world function to the main file
```

Claude Code will:

1. Find the appropriate file
2. Show you the proposed changes
3. Ask for your approval
4. Make the edit

<Note>
  Claude Code always asks for permission before modifying files. You can approve individual changes or enable "Accept all" mode for a session.
</Note>

## Step 6: Use Git with Claude Code

Claude Code makes Git operations conversational:

```text  theme={null}
what files have I changed?
```

```text  theme={null}
commit my changes with a descriptive message
```

You can also prompt for more complex Git operations:

```text  theme={null}
create a new branch called feature/quickstart
```

```text  theme={null}
show me the last 5 commits
```

```text  theme={null}
help me resolve merge conflicts
```

## Step 7: Fix a bug or add a feature

Claude is proficient at debugging and feature implementation.

Describe what you want in natural language:

```text  theme={null}
add input validation to the user registration form
```

Or fix existing issues:

```text  theme={null}
there's a bug where users can submit empty forms - fix it
```

Claude Code will:

* Locate the relevant code
* Understand the context
* Implement a solution
* Run tests if available

## Step 8: Test out other common workflows

There are a number of ways to work with Claude:

**Refactor code**

```text  theme={null}
refactor the authentication module to use async/await instead of callbacks
```

**Write tests**

```text  theme={null}
write unit tests for the calculator functions
```

**Update documentation**

```text  theme={null}
update the README with installation instructions
```

**Code review**

```text  theme={null}
review my changes and suggest improvements
```

<Tip>
  Talk to Claude like you would a helpful colleague. Describe what you want to achieve, and it will help you get there.
</Tip>

## Essential commands

Here are the most important commands for daily use:

| Command             | What it does                                           | Example                             |
| ------------------- | ------------------------------------------------------ | ----------------------------------- |
| `claude`            | Start interactive mode                                 | `claude`                            |
| `claude "task"`     | Run a one-time task                                    | `claude "fix the build error"`      |
| `claude -p "query"` | Run one-off query, then exit                           | `claude -p "explain this function"` |
| `claude -c`         | Continue most recent conversation in current directory | `claude -c`                         |
| `claude -r`         | Resume a previous conversation                         | `claude -r`                         |
| `claude commit`     | Create a Git commit                                    | `claude commit`                     |
| `/clear`            | Clear conversation history                             | `/clear`                            |
| `/help`             | Show available commands                                | `/help`                             |
| `exit` or Ctrl+C    | Exit Claude Code                                       | `exit`                              |

See the [CLI reference](/en/cli-reference) for a complete list of commands.

## Pro tips for beginners

For more, see [best practices](/en/best-practices) and [common workflows](/en/common-workflows).

<AccordionGroup>
  <Accordion title="Be specific with your requests">
    Instead of: "fix the bug"

    Try: "fix the login bug where users see a blank screen after entering wrong credentials"
  </Accordion>

  <Accordion title="Use step-by-step instructions">
    Break complex tasks into steps:

    ```text  theme={null}
    1. create a new database table for user profiles
    2. create an API endpoint to get and update user profiles
    3. build a webpage that allows users to see and edit their information
    ```
  </Accordion>

  <Accordion title="Let Claude explore first">
    Before making changes, let Claude understand your code:

    ```text  theme={null}
    analyze the database schema
    ```

    ```text  theme={null}
    build a dashboard showing products that are most frequently returned by our UK customers
    ```
  </Accordion>

  <Accordion title="Save time with shortcuts">
    * Press `?` to see all available keyboard shortcuts
    * Use Tab for command completion
    * Press ↑ for command history
    * Type `/` to see all commands and skills
  </Accordion>
</AccordionGroup>

## What's next?

Now that you've learned the basics, explore more advanced features:

<CardGroup cols={2}>
  <Card title="How Claude Code works" icon="microchip" href="/en/how-claude-code-works">
    Understand the agentic loop, built-in tools, and how Claude Code interacts with your project
  </Card>

  <Card title="Best practices" icon="star" href="/en/best-practices">
    Get better results with effective prompting and project setup
  </Card>

  <Card title="Common workflows" icon="graduation-cap" href="/en/common-workflows">
    Step-by-step guides for common tasks
  </Card>

  <Card title="Extend Claude Code" icon="puzzle-piece" href="/en/features-overview">
    Customize with CLAUDE.md, skills, hooks, MCP, and more
  </Card>
</CardGroup>

## Getting help

* **In Claude Code**: Type `/help` or ask "how do I..."
* **Documentation**: You're here! Browse other guides
* **Community**: Join our [Discord](https://www.anthropic.com/discord) for tips and support
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How Claude Code works

> Understand the agentic loop, built-in tools, and how Claude Code interacts with your project.

Claude Code is an agentic assistant that runs in your terminal. While it excels at coding, it can help with anything you can do from the command line: writing docs, running builds, searching files, researching topics, and more.

This guide covers the core architecture, built-in capabilities, and [tips for working effectively](#work-effectively-with-claude-code). For step-by-step walkthroughs, see [Common workflows](/en/common-workflows). For extensibility features like skills, MCP, and hooks, see [Extend Claude Code](/en/features-overview).

## The agentic loop

When you give Claude a task, it works through three phases: **gather context**, **take action**, and **verify results**. These phases blend together. Claude uses tools throughout, whether searching files to understand your code, editing to make changes, or running tests to check its work.

<img src="https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=9d9cdb2102f397a0f57450ca5ca2a969" alt="The agentic loop: Your prompt leads to Claude gathering context, taking action, verifying results, and repeating until task complete. You can interrupt at any point." data-og-width="720" width="720" data-og-height="280" height="280" data-path="images/agentic-loop.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?w=280&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=9c6a590754c1c1b281d40fc9f10fed0d 280w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?w=560&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=9fb2f2fc174e285797cad25a9ca2a326 560w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?w=840&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=3a1b68dd7b861e8ff25391773d8ab60c 840w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?w=1100&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=e64edf9f5cbc62464617945cf08ef134 1100w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?w=1650&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=3bf3319e76669f11513c6bcc5bf86feb 1650w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/agentic-loop.svg?w=2500&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=9413880a191409ff3c81bafc8f7ab977 2500w" />

The loop adapts to what you ask. A question about your codebase might only need context gathering. A bug fix cycles through all three phases repeatedly. A refactor might involve extensive verification. Claude decides what each step requires based on what it learned from the previous step, chaining dozens of actions together and course-correcting along the way.

You're part of this loop too. You can interrupt at any point to steer Claude in a different direction, provide additional context, or ask it to try a different approach. Claude works autonomously but stays responsive to your input.

The agentic loop is powered by two components: [models](#models) that reason and [tools](#tools) that act. Claude Code serves as the **agentic harness** around Claude: it provides the tools, context management, and execution environment that turn a language model into a capable coding agent.

### Models

Claude Code uses Claude models to understand your code and reason about tasks. Claude can read code in any language, understand how components connect, and figure out what needs to change to accomplish your goal. For complex tasks, it breaks work into steps, executes them, and adjusts based on what it learns.

[Multiple models](/en/model-config) are available with different tradeoffs. Sonnet handles most coding tasks well. Opus provides stronger reasoning for complex architectural decisions. Switch with `/model` during a session or start with `claude --model <name>`.

When this guide says "Claude chooses" or "Claude decides," it's the model doing the reasoning.

### Tools

Tools are what make Claude Code agentic. Without tools, Claude can only respond with text. With tools, Claude can act: read your code, edit files, run commands, search the web, and interact with external services. Each tool use returns information that feeds back into the loop, informing Claude's next decision.

The built-in tools generally fall into five categories, each representing a different kind of agency.

| Category              | What Claude can do                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File operations**   | Read files, edit code, create new files, rename and reorganize                                                                                                |
| **Search**            | Find files by pattern, search content with regex, explore codebases                                                                                           |
| **Execution**         | Run shell commands, start servers, run tests, use git                                                                                                         |
| **Web**               | Search the web, fetch documentation, look up error messages                                                                                                   |
| **Code intelligence** | See type errors and warnings after edits, jump to definitions, find references (requires [code intelligence plugins](/en/discover-plugins#code-intelligence)) |

These are the primary capabilities. Claude also has tools for spawning subagents, asking you questions, and other orchestration tasks. See [Tools available to Claude](/en/settings#tools-available-to-claude) for the complete list.

Claude chooses which tools to use based on your prompt and what it learns along the way. When you say "fix the failing tests," Claude might:

1. Run the test suite to see what's failing
2. Read the error output
3. Search for the relevant source files
4. Read those files to understand the code
5. Edit the files to fix the issue
6. Run the tests again to verify

Each tool use gives Claude new information that informs the next step. This is the agentic loop in action.

**Extending the base capabilities:** The built-in tools are the foundation. You can extend what Claude knows with [skills](/en/skills), connect to external services with [MCP](/en/mcp), automate workflows with [hooks](/en/hooks), and offload tasks to [subagents](/en/sub-agents). These extensions form a layer on top of the core agentic loop. See [Extend Claude Code](/en/features-overview) for guidance on choosing the right extension for your needs.

## What Claude can access

This guide focuses on the terminal. Claude Code also runs in [VS Code](/en/vs-code), [JetBrains IDEs](/en/jetbrains), and other environments.

When you run `claude` in a directory, Claude Code gains access to:

* **Your project.** Files in your directory and subdirectories, plus files elsewhere with your permission.
* **Your terminal.** Any command you could run: build tools, git, package managers, system utilities, scripts. If you can do it from the command line, Claude can too.
* **Your git state.** Current branch, uncommitted changes, and recent commit history.
* **Your [CLAUDE.md](/en/memory).** A markdown file where you store project-specific instructions, conventions, and context that Claude should know every session.
* **[Auto memory](/en/memory#auto-memory).** Learnings Claude saves automatically as you work, like project patterns and your preferences. The first 200 lines of MEMORY.md are loaded at the start of each session.
* **Extensions you configure.** [MCP servers](/en/mcp) for external services, [skills](/en/skills) for workflows, [subagents](/en/sub-agents) for delegated work, and [Claude in Chrome](/en/chrome) for browser interaction.

Because Claude sees your whole project, it can work across it. When you ask Claude to "fix the authentication bug," it searches for relevant files, reads multiple files to understand context, makes coordinated edits across them, runs tests to verify the fix, and commits the changes if you ask. This is different from inline code assistants that only see the current file.

## Environments and interfaces

The agentic loop, tools, and capabilities described above are the same everywhere you use Claude Code. What changes is where the code executes and how you interact with it.

### Execution environments

Claude Code runs in three environments, each with different tradeoffs for where your code executes.

| Environment        | Where code runs                         | Use case                                                   |
| ------------------ | --------------------------------------- | ---------------------------------------------------------- |
| **Local**          | Your machine                            | Default. Full access to your files, tools, and environment |
| **Cloud**          | Anthropic-managed VMs                   | Offload tasks, work on repos you don't have locally        |
| **Remote Control** | Your machine, controlled from a browser | Use the web UI while keeping everything local              |

### Interfaces

You can access Claude Code through the terminal, the [desktop app](/en/desktop), [IDE extensions](/en/ide-integrations), [claude.ai/code](https://claude.ai/code), [Remote Control](/en/remote-control), [Slack](/en/slack), and [CI/CD pipelines](/en/github-actions). The interface determines how you see and interact with Claude, but the underlying agentic loop is identical. See [Use Claude Code everywhere](/en/overview#use-claude-code-everywhere) for the full list.

## Work with sessions

Claude Code saves your conversation locally as you work. Each message, tool use, and result is stored, which enables [rewinding](#undo-changes-with-checkpoints), [resuming, and forking](#resume-or-fork-sessions) sessions. Before Claude makes code changes, it also snapshots the affected files so you can revert if needed.

**Sessions are independent.** Each new session starts with a fresh context window, without the conversation history from previous sessions. Claude can persist learnings across sessions using [auto memory](/en/memory#auto-memory), and you can add your own persistent instructions in [CLAUDE.md](/en/memory).

### Work across branches

Each Claude Code conversation is a session tied to your current directory. When you resume, you only see sessions from that directory.

Claude sees your current branch's files. When you switch branches, Claude sees the new branch's files, but your conversation history stays the same. Claude remembers what you discussed even after switching.

Since sessions are tied to directories, you can run parallel Claude sessions by using [git worktrees](/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees), which create separate directories for individual branches.

### Resume or fork sessions

When you resume a session with `claude --continue` or `claude --resume`, you pick up where you left off using the same session ID. New messages append to the existing conversation. Your full conversation history is restored, but session-scoped permissions are not. You'll need to re-approve those.

<img src="https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=808da1b213c731bf98874c75981d688b" alt="Session continuity: resume continues the same session, fork creates a new branch with a new ID." data-og-width="560" width="560" data-og-height="280" height="280" data-path="images/session-continuity.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?w=280&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=ba75f64bc571f3ef84a3237ef795bf22 280w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?w=560&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=343ad422a171a2b909c87ed01c768745 560w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?w=840&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=afce54d5e3b08cdb54d506332462b74c 840w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?w=1100&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=28648c0a04cf7aef2de02d1c98491965 1100w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?w=1650&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=a5287882beedaea54af606f682e4818d 1650w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/session-continuity.svg?w=2500&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=f392dbe67b63eead4a2aae67adfbfdbe 2500w" />

To branch off and try a different approach without affecting the original session, use the `--fork-session` flag:

```bash  theme={null}
claude --continue --fork-session
```

This creates a new session ID while preserving the conversation history up to that point. The original session remains unchanged. Like resume, forked sessions don't inherit session-scoped permissions.

**Same session in multiple terminals**: If you resume the same session in multiple terminals, both terminals write to the same session file. Messages from both get interleaved, like two people writing in the same notebook. Nothing corrupts, but the conversation becomes jumbled. Each terminal only sees its own messages during the session, but if you resume that session later, you'll see everything interleaved. For parallel work from the same starting point, use `--fork-session` to give each terminal its own clean session.

### The context window

Claude's context window holds your conversation history, file contents, command outputs, [CLAUDE.md](/en/memory), loaded skills, and system instructions. As you work, context fills up. Claude compacts automatically, but instructions from early in the conversation can get lost. Put persistent rules in CLAUDE.md, and run `/context` to see what's using space.

#### When context fills up

Claude Code manages context automatically as you approach the limit. It clears older tool outputs first, then summarizes the conversation if needed. Your requests and key code snippets are preserved; detailed instructions from early in the conversation may be lost. Put persistent rules in CLAUDE.md rather than relying on conversation history.

To control what's preserved during compaction, add a "Compact Instructions" section to CLAUDE.md or run `/compact` with a focus (like `/compact focus on the API changes`).

Run `/context` to see what's using space. MCP servers add tool definitions to every request, so a few servers can consume significant context before you start working. Run `/mcp` to check per-server costs.

#### Manage context with skills and subagents

Beyond compaction, you can use other features to control what loads into context.

[Skills](/en/skills) load on demand. Claude sees skill descriptions at session start, but the full content only loads when a skill is used. For skills you invoke manually, set `disable-model-invocation: true` to keep descriptions out of context until you need them.

[Subagents](/en/sub-agents) get their own fresh context, completely separate from your main conversation. Their work doesn't bloat your context. When done, they return a summary. This isolation is why subagents help with long sessions.

See [context costs](/en/features-overview#understand-context-costs) for what each feature costs, and [reduce token usage](/en/costs#reduce-token-usage) for tips on managing context.

## Stay safe with checkpoints and permissions

Claude has two safety mechanisms: checkpoints let you undo file changes, and permissions control what Claude can do without asking.

### Undo changes with checkpoints

**Every file edit is reversible.** Before Claude edits any file, it snapshots the current contents. If something goes wrong, press `Esc` twice to rewind to a previous state, or ask Claude to undo.

Checkpoints are local to your session, separate from git. They only cover file changes. Actions that affect remote systems (databases, APIs, deployments) can't be checkpointed, which is why Claude asks before running commands with external side effects.

### Control what Claude can do

Press `Shift+Tab` to cycle through permission modes:

* **Default**: Claude asks before file edits and shell commands
* **Auto-accept edits**: Claude edits files without asking, still asks for commands
* **Plan mode**: Claude uses read-only tools only, creating a plan you can approve before execution

You can also allow specific commands in `.claude/settings.json` so Claude doesn't ask each time. This is useful for trusted commands like `npm test` or `git status`. Settings can be scoped from organization-wide policies down to personal preferences. See [Permissions](/en/permissions) for details.

***

## Work effectively with Claude Code

These tips help you get better results from Claude Code.

### Ask Claude Code for help

Claude Code can teach you how to use it. Ask questions like "how do I set up hooks?" or "what's the best way to structure my CLAUDE.md?" and Claude will explain.

Built-in commands also guide you through setup:

* `/init` walks you through creating a CLAUDE.md for your project
* `/agents` helps you configure custom subagents
* `/doctor` diagnoses common issues with your installation

### It's a conversation

Claude Code is conversational. You don't need perfect prompts. Start with what you want, then refine:

```
> Fix the login bug

[Claude investigates, tries something]

> That's not quite right. The issue is in the session handling.

[Claude adjusts approach]
```

When the first attempt isn't right, you don't start over. You iterate.

#### Interrupt and steer

You can interrupt Claude at any point. If it's going down the wrong path, just type your correction and press Enter. Claude will stop what it's doing and adjust its approach based on your input. You don't have to wait for it to finish or start over.

### Be specific upfront

The more precise your initial prompt, the fewer corrections you'll need. Reference specific files, mention constraints, and point to example patterns.

```
> The checkout flow is broken for users with expired cards.
> Check src/payments/ for the issue, especially token refresh.
> Write a failing test first, then fix it.
```

Vague prompts like "fix the login bug" work, but you'll spend more time steering. Specific prompts like the above often succeed on the first attempt.

### Give Claude something to verify against

Claude performs better when it can check its own work. Include test cases, paste screenshots of expected UI, or define the output you want.

```
> Implement validateEmail. Test cases: 'user@example.com' → true,
> 'invalid' → false, 'user@.com' → false. Run the tests after.
```

For visual work, paste a screenshot of the design and ask Claude to compare its implementation against it.

### Explore before implementing

For complex problems, separate research from coding. Use plan mode (`Shift+Tab` twice) to analyze the codebase first:

```
> Read src/auth/ and understand how we handle sessions.
> Then create a plan for adding OAuth support.
```

Review the plan, refine it through conversation, then let Claude implement. This two-phase approach produces better results than jumping straight to code.

### Delegate, don't dictate

Think of delegating to a capable colleague. Give context and direction, then trust Claude to figure out the details:

```
> The checkout flow is broken for users with expired cards.
> The relevant code is in src/payments/. Can you investigate and fix it?
```

You don't need to specify which files to read or what commands to run. Claude figures that out.

## What's next

<CardGroup cols={2}>
  <Card title="Extend with features" icon="puzzle-piece" href="/en/features-overview">
    Add Skills, MCP connections, and custom commands
  </Card>

  <Card title="Common workflows" icon="graduation-cap" href="/en/common-workflows">
    Step-by-step guides for typical tasks
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Extend Claude Code

> Understand when to use CLAUDE.md, Skills, subagents, hooks, MCP, and plugins.

Claude Code combines a model that reasons about your code with [built-in tools](/en/how-claude-code-works#tools) for file operations, search, execution, and web access. The built-in tools cover most coding tasks. This guide covers the extension layer: features you add to customize what Claude knows, connect it to external services, and automate workflows.

<Note>
  For how the core agentic loop works, see [How Claude Code works](/en/how-claude-code-works).
</Note>

**New to Claude Code?** Start with [CLAUDE.md](/en/memory) for project conventions. Add other extensions as you need them.

## Overview

Extensions plug into different parts of the agentic loop:

* **[CLAUDE.md](/en/memory)** adds persistent context Claude sees every session
* **[Skills](/en/skills)** add reusable knowledge and invocable workflows
* **[MCP](/en/mcp)** connects Claude to external services and tools
* **[Subagents](/en/sub-agents)** run their own loops in isolated context, returning summaries
* **[Agent teams](/en/agent-teams)** coordinate multiple independent sessions with shared tasks and peer-to-peer messaging
* **[Hooks](/en/hooks)** run outside the loop entirely as deterministic scripts
* **[Plugins](/en/plugins)** and **[marketplaces](/en/plugin-marketplaces)** package and distribute these features

[Skills](/en/skills) are the most flexible extension. A skill is a markdown file containing knowledge, workflows, or instructions. You can invoke skills with a command like `/deploy`, or Claude can load them automatically when relevant. Skills can run in your current conversation or in an isolated context via subagents.

## Match features to your goal

Features range from always-on context that Claude sees every session, to on-demand capabilities you or Claude can invoke, to background automation that runs on specific events. The table below shows what's available and when each one makes sense.

| Feature                            | What it does                                               | When to use it                                                                  | Example                                                                          |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **CLAUDE.md**                      | Persistent context loaded every conversation               | Project conventions, "always do X" rules                                        | "Use pnpm, not npm. Run tests before committing."                                |
| **Skill**                          | Instructions, knowledge, and workflows Claude can use      | Reusable content, reference docs, repeatable tasks                              | `/review` runs your code review checklist; API docs skill with endpoint patterns |
| **Subagent**                       | Isolated execution context that returns summarized results | Context isolation, parallel tasks, specialized workers                          | Research task that reads many files but returns only key findings                |
| **[Agent teams](/en/agent-teams)** | Coordinate multiple independent Claude Code sessions       | Parallel research, new feature development, debugging with competing hypotheses | Spawn reviewers to check security, performance, and tests simultaneously         |
| **MCP**                            | Connect to external services                               | External data or actions                                                        | Query your database, post to Slack, control a browser                            |
| **Hook**                           | Deterministic script that runs on events                   | Predictable automation, no LLM involved                                         | Run ESLint after every file edit                                                 |

**[Plugins](/en/plugins)** are the packaging layer. A plugin bundles skills, hooks, subagents, and MCP servers into a single installable unit. Plugin skills are namespaced (like `/my-plugin:review`) so multiple plugins can coexist. Use plugins when you want to reuse the same setup across multiple repositories or distribute to others via a **[marketplace](/en/plugin-marketplaces)**.

### Compare similar features

Some features can seem similar. Here's how to tell them apart.

<Tabs>
  <Tab title="Skill vs Subagent">
    Skills and subagents solve different problems:

    * **Skills** are reusable content you can load into any context
    * **Subagents** are isolated workers that run separately from your main conversation

    | Aspect          | Skill                                          | Subagent                                                         |
    | --------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
    | **What it is**  | Reusable instructions, knowledge, or workflows | Isolated worker with its own context                             |
    | **Key benefit** | Share content across contexts                  | Context isolation. Work happens separately, only summary returns |
    | **Best for**    | Reference material, invocable workflows        | Tasks that read many files, parallel work, specialized workers   |

    **Skills can be reference or action.** Reference skills provide knowledge Claude uses throughout your session (like your API style guide). Action skills tell Claude to do something specific (like `/deploy` that runs your deployment workflow).

    **Use a subagent** when you need context isolation or when your context window is getting full. The subagent might read dozens of files or run extensive searches, but your main conversation only receives a summary. Since subagent work doesn't consume your main context, this is also useful when you don't need the intermediate work to remain visible. Custom subagents can have their own instructions and can preload skills.

    **They can combine.** A subagent can preload specific skills (`skills:` field). A skill can run in isolated context using `context: fork`. See [Skills](/en/skills) for details.
  </Tab>

  <Tab title="CLAUDE.md vs Skill">
    Both store instructions, but they load differently and serve different purposes.

    | Aspect                    | CLAUDE.md                    | Skill                                   |
    | ------------------------- | ---------------------------- | --------------------------------------- |
    | **Loads**                 | Every session, automatically | On demand                               |
    | **Can include files**     | Yes, with `@path` imports    | Yes, with `@path` imports               |
    | **Can trigger workflows** | No                           | Yes, with `/<name>`                     |
    | **Best for**              | "Always do X" rules          | Reference material, invocable workflows |

    **Put it in CLAUDE.md** if Claude should always know it: coding conventions, build commands, project structure, "never do X" rules.

    **Put it in a skill** if it's reference material Claude needs sometimes (API docs, style guides) or a workflow you trigger with `/<name>` (deploy, review, release).

    **Rule of thumb:** Keep CLAUDE.md under 200 lines. If it's growing, move reference content to skills or split into [`.claude/rules/`](/en/memory#organize-rules-with-clauderules) files.
  </Tab>

  <Tab title="CLAUDE.md vs Rules vs Skills">
    All three store instructions, but they load differently:

    | Aspect       | CLAUDE.md                           | `.claude/rules/`                                   | Skill                                    |
    | ------------ | ----------------------------------- | -------------------------------------------------- | ---------------------------------------- |
    | **Loads**    | Every session                       | Every session, or when matching files are opened   | On demand, when invoked or relevant      |
    | **Scope**    | Whole project                       | Can be scoped to file paths                        | Task-specific                            |
    | **Best for** | Core conventions and build commands | Language-specific or directory-specific guidelines | Reference material, repeatable workflows |

    **Use CLAUDE.md** for instructions every session needs: build commands, test conventions, project architecture.

    **Use rules** to keep CLAUDE.md focused. Rules with [`paths` frontmatter](/en/memory#path-specific-rules) only load when Claude works with matching files, saving context.

    **Use skills** for content Claude only needs sometimes, like API documentation or a deployment checklist you trigger with `/<name>`.
  </Tab>

  <Tab title="Subagent vs Agent team">
    Both parallelize work, but they're architecturally different:

    * **Subagents** run inside your session and report results back to your main context
    * **Agent teams** are independent Claude Code sessions that communicate with each other

    | Aspect            | Subagent                                         | Agent team                                          |
    | ----------------- | ------------------------------------------------ | --------------------------------------------------- |
    | **Context**       | Own context window; results return to the caller | Own context window; fully independent               |
    | **Communication** | Reports results back to the main agent only      | Teammates message each other directly               |
    | **Coordination**  | Main agent manages all work                      | Shared task list with self-coordination             |
    | **Best for**      | Focused tasks where only the result matters      | Complex work requiring discussion and collaboration |
    | **Token cost**    | Lower: results summarized back to main context   | Higher: each teammate is a separate Claude instance |

    **Use a subagent** when you need a quick, focused worker: research a question, verify a claim, review a file. The subagent does the work and returns a summary. Your main conversation stays clean.

    **Use an agent team** when teammates need to share findings, challenge each other, and coordinate independently. Agent teams are best for research with competing hypotheses, parallel code review, and new feature development where each teammate owns a separate piece.

    **Transition point:** If you're running parallel subagents but hitting context limits, or if your subagents need to communicate with each other, agent teams are the natural next step.

    <Note>
      Agent teams are experimental and disabled by default. See [agent teams](/en/agent-teams) for setup and current limitations.
    </Note>
  </Tab>

  <Tab title="MCP vs Skill">
    MCP connects Claude to external services. Skills extend what Claude knows, including how to use those services effectively.

    | Aspect         | MCP                                                  | Skill                                                   |
    | -------------- | ---------------------------------------------------- | ------------------------------------------------------- |
    | **What it is** | Protocol for connecting to external services         | Knowledge, workflows, and reference material            |
    | **Provides**   | Tools and data access                                | Knowledge, workflows, reference material                |
    | **Examples**   | Slack integration, database queries, browser control | Code review checklist, deploy workflow, API style guide |

    These solve different problems and work well together:

    **MCP** gives Claude the ability to interact with external systems. Without MCP, Claude can't query your database or post to Slack.

    **Skills** give Claude knowledge about how to use those tools effectively, plus workflows you can trigger with `/<name>`. A skill might include your team's database schema and query patterns, or a `/post-to-slack` workflow with your team's message formatting rules.

    Example: An MCP server connects Claude to your database. A skill teaches Claude your data model, common query patterns, and which tables to use for different tasks.
  </Tab>
</Tabs>

### Understand how features layer

Features can be defined at multiple levels: user-wide, per-project, via plugins, or through managed policies. You can also nest CLAUDE.md files in subdirectories or place skills in specific packages of a monorepo. When the same feature exists at multiple levels, here's how they layer:

* **CLAUDE.md files** are additive: all levels contribute content to Claude's context simultaneously. Files from your working directory and above load at launch; subdirectories load as you work in them. When instructions conflict, Claude uses judgment to reconcile them, with more specific instructions typically taking precedence. See [how CLAUDE.md files load](/en/memory#how-claudemd-files-load).
* **Skills and subagents** override by name: when the same name exists at multiple levels, one definition wins based on priority (managed > user > project for skills; managed > CLI flag > project > user > plugin for subagents). Plugin skills are [namespaced](/en/plugins#add-skills-to-your-plugin) to avoid conflicts. See [skill discovery](/en/skills#where-skills-live) and [subagent scope](/en/sub-agents#choose-the-subagent-scope).
* **MCP servers** override by name: local > project > user. See [MCP scope](/en/mcp#scope-hierarchy-and-precedence).
* **Hooks** merge: all registered hooks fire for their matching events regardless of source. See [hooks](/en/hooks).

### Combine features

Each extension solves a different problem: CLAUDE.md handles always-on context, skills handle on-demand knowledge and workflows, MCP handles external connections, subagents handle isolation, and hooks handle automation. Real setups combine them based on your workflow.

For example, you might use CLAUDE.md for project conventions, a skill for your deployment workflow, MCP to connect to your database, and a hook to run linting after every edit. Each feature handles what it's best at.

| Pattern                | How it works                                                                     | Example                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Skill + MCP**        | MCP provides the connection; a skill teaches Claude how to use it well           | MCP connects to your database, a skill documents your schema and query patterns                    |
| **Skill + Subagent**   | A skill spawns subagents for parallel work                                       | `/review` skill kicks off security, performance, and style subagents that work in isolated context |
| **CLAUDE.md + Skills** | CLAUDE.md holds always-on rules; skills hold reference material loaded on demand | CLAUDE.md says "follow our API conventions," a skill contains the full API style guide             |
| **Hook + MCP**         | A hook triggers external actions through MCP                                     | Post-edit hook sends a Slack notification when Claude modifies critical files                      |

## Understand context costs

Every feature you add consumes some of Claude's context. Too much can fill up your context window, but it can also add noise that makes Claude less effective; skills may not trigger correctly, or Claude may lose track of your conventions. Understanding these trade-offs helps you build an effective setup.

### Context cost by feature

Each feature has a different loading strategy and context cost:

| Feature         | When it loads             | What loads                                    | Context cost                                 |
| --------------- | ------------------------- | --------------------------------------------- | -------------------------------------------- |
| **CLAUDE.md**   | Session start             | Full content                                  | Every request                                |
| **Skills**      | Session start + when used | Descriptions at start, full content when used | Low (descriptions every request)\*           |
| **MCP servers** | Session start             | All tool definitions and schemas              | Every request                                |
| **Subagents**   | When spawned              | Fresh context with specified skills           | Isolated from main session                   |
| **Hooks**       | On trigger                | Nothing (runs externally)                     | Zero, unless hook returns additional context |

\*By default, skill descriptions load at session start so Claude can decide when to use them. Set `disable-model-invocation: true` in a skill's frontmatter to hide it from Claude entirely until you invoke it manually. This reduces context cost to zero for skills you only trigger yourself.

### Understand how features load

Each feature loads at different points in your session. The tabs below explain when each one loads and what goes into context.

<img src="https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=43114d93ae62bdc1ab6aa64660e2ba3b" alt="Context loading: CLAUDE.md and MCP load at session start and stay in every request. Skills load descriptions at start, full content on invocation. Subagents get isolated context. Hooks run externally." data-og-width="720" width="720" data-og-height="410" height="410" data-path="images/context-loading.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?w=280&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=cc37ac2b6b486c75dea4cf64add648ec 280w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?w=560&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=22394bf8452988091802c6bc471a3153 560w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?w=840&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=aaf0301abbd63349b3f5ecf27f3bc4c5 840w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?w=1100&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=f262d974340400cfd964c555b523808a 1100w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?w=1650&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=430b76391f55ba65a0a3da569a52a450 1650w, https://mintcdn.com/claude-code/TBPmHzr19mDCuhZi/images/context-loading.svg?w=2500&fit=max&auto=format&n=TBPmHzr19mDCuhZi&q=85&s=46522043165b15cfef464d5f63c70f7c 2500w" />

<Tabs>
  <Tab title="CLAUDE.md">
    **When:** Session start

    **What loads:** Full content of all CLAUDE.md files (managed, user, and project levels).

    **Inheritance:** Claude reads CLAUDE.md files from your working directory up to the root, and discovers nested ones in subdirectories as it accesses those files. See [How CLAUDE.md files load](/en/memory#how-claudemd-files-load) for details.

    <Tip>Keep CLAUDE.md under \~500 lines. Move reference material to skills, which load on-demand.</Tip>
  </Tab>

  <Tab title="Skills">
    Skills are extra capabilities in Claude's toolkit. They can be reference material (like an API style guide) or invocable workflows you trigger with `/<name>` (like `/deploy`). Claude Code ships with [bundled skills](/en/skills#bundled-skills) like `/simplify`, `/batch`, and `/debug` that work out of the box. You can also create your own. Claude uses skills when appropriate, or you can invoke one directly.

    **When:** Depends on the skill's configuration. By default, descriptions load at session start and full content loads when used. For user-only skills (`disable-model-invocation: true`), nothing loads until you invoke them.

    **What loads:** For model-invocable skills, Claude sees names and descriptions in every request. When you invoke a skill with `/<name>` or Claude loads it automatically, the full content loads into your conversation.

    **How Claude chooses skills:** Claude matches your task against skill descriptions to decide which are relevant. If descriptions are vague or overlap, Claude may load the wrong skill or miss one that would help. To tell Claude to use a specific skill, invoke it with `/<name>`. Skills with `disable-model-invocation: true` are invisible to Claude until you invoke them.

    **Context cost:** Low until used. User-only skills have zero cost until invoked.

    **In subagents:** Skills work differently in subagents. Instead of on-demand loading, skills passed to a subagent are fully preloaded into its context at launch. Subagents don't inherit skills from the main session; you must specify them explicitly.

    <Tip>Use `disable-model-invocation: true` for skills with side effects. This saves context and ensures only you trigger them.</Tip>
  </Tab>

  <Tab title="MCP servers">
    **When:** Session start.

    **What loads:** All tool definitions and JSON schemas from connected servers.

    **Context cost:** [Tool search](/en/mcp#scale-with-mcp-tool-search) (enabled by default) loads MCP tools up to 10% of context and defers the rest until needed.

    **Reliability note:** MCP connections can fail silently mid-session. If a server disconnects, its tools disappear without warning. Claude may try to use a tool that no longer exists. If you notice Claude failing to use an MCP tool it previously could access, check the connection with `/mcp`.

    <Tip>Run `/mcp` to see token costs per server. Disconnect servers you're not actively using.</Tip>
  </Tab>

  <Tab title="Subagents">
    **When:** On demand, when you or Claude spawns one for a task.

    **What loads:** Fresh, isolated context containing:

    * The system prompt (shared with parent for cache efficiency)
    * Full content of skills listed in the agent's `skills:` field
    * CLAUDE.md and git status (inherited from parent)
    * Whatever context the lead agent passes in the prompt

    **Context cost:** Isolated from main session. Subagents don't inherit your conversation history or invoked skills.

    <Tip>Use subagents for work that doesn't need your full conversation context. Their isolation prevents bloating your main session.</Tip>
  </Tab>

  <Tab title="Hooks">
    **When:** On trigger. Hooks fire at specific lifecycle events like tool execution, session boundaries, prompt submission, permission requests, and compaction. See [Hooks](/en/hooks) for the full list.

    **What loads:** Nothing by default. Hooks run as external scripts.

    **Context cost:** Zero, unless the hook returns output that gets added as messages to your conversation.

    <Tip>Hooks are ideal for side effects (linting, logging) that don't need to affect Claude's context.</Tip>
  </Tab>
</Tabs>

## Learn more

Each feature has its own guide with setup instructions, examples, and configuration options.

<CardGroup cols={2}>
  <Card title="CLAUDE.md" icon="file-lines" href="/en/memory">
    Store project context, conventions, and instructions
  </Card>

  <Card title="Skills" icon="brain" href="/en/skills">
    Give Claude domain expertise and reusable workflows
  </Card>

  <Card title="Subagents" icon="users" href="/en/sub-agents">
    Offload work to isolated context
  </Card>

  <Card title="Agent teams" icon="network" href="/en/agent-teams">
    Coordinate multiple sessions working in parallel
  </Card>

  <Card title="MCP" icon="plug" href="/en/mcp">
    Connect Claude to external services
  </Card>

  <Card title="Hooks" icon="bolt" href="/en/hooks-guide">
    Automate workflows with hooks
  </Card>

  <Card title="Plugins" icon="puzzle-piece" href="/en/plugins">
    Bundle and share feature sets
  </Card>

  <Card title="Marketplaces" icon="store" href="/en/plugin-marketplaces">
    Host and distribute plugin collections
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How Claude remembers your project

> Give Claude persistent instructions with CLAUDE.md files, and let Claude accumulate learnings automatically with auto memory.

Each Claude Code session begins with a fresh context window. Two mechanisms carry knowledge across sessions:

* **CLAUDE.md files**: instructions you write to give Claude persistent context
* **Auto memory**: notes Claude writes itself based on your corrections and preferences

This page covers how to:

* [Write and organize CLAUDE.md files](#claudemd-files)
* [Scope rules to specific file types](#organize-rules-with-clauderules) with `.claude/rules/`
* [Configure auto memory](#auto-memory) so Claude takes notes automatically
* [Troubleshoot](#troubleshoot-memory-issues) when instructions aren't being followed

## CLAUDE.md vs auto memory

Claude Code has two complementary memory systems. Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration. The more specific and concise your instructions, the more consistently Claude follows them.

|                      | CLAUDE.md files                                   | Auto memory                                                      |
| :------------------- | :------------------------------------------------ | :--------------------------------------------------------------- |
| **Who writes it**    | You                                               | Claude                                                           |
| **What it contains** | Instructions and rules                            | Learnings and patterns                                           |
| **Scope**            | Project, user, or org                             | Per working tree                                                 |
| **Loaded into**      | Every session                                     | Every session (first 200 lines)                                  |
| **Use for**          | Coding standards, workflows, project architecture | Build commands, debugging insights, preferences Claude discovers |

Use CLAUDE.md files when you want to guide Claude's behavior. Auto memory lets Claude learn from your corrections without manual effort.

Subagents can also maintain their own auto memory. See [subagent configuration](/en/sub-agents#enable-persistent-memory) for details.

## CLAUDE.md files

CLAUDE.md files are markdown files that give Claude persistent instructions for a project, your personal workflow, or your entire organization. You write these files in plain text; Claude reads them at the start of every session.

### Choose where to put CLAUDE.md files

CLAUDE.md files can live in several locations, each with a different scope. More specific locations take precedence over broader ones.

| Scope                    | Location                                                                                                                                                                | Purpose                                                     | Use case examples                                                    | Shared with                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| **Managed policy**       | • macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br />• Linux and WSL: `/etc/claude-code/CLAUDE.md`<br />• Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Organization-wide instructions managed by IT/DevOps         | Company coding standards, security policies, compliance requirements | All users in organization       |
| **Project instructions** | `./CLAUDE.md` or `./.claude/CLAUDE.md`                                                                                                                                  | Team-shared instructions for the project                    | Project architecture, coding standards, common workflows             | Team members via source control |
| **User instructions**    | `~/.claude/CLAUDE.md`                                                                                                                                                   | Personal preferences for all projects                       | Code styling preferences, personal tooling shortcuts                 | Just you (all projects)         |
| **Local instructions**   | `./CLAUDE.local.md`                                                                                                                                                     | Personal project-specific preferences, not checked into git | Your sandbox URLs, preferred test data                               | Just you (current project)      |

CLAUDE.md files in the directory hierarchy above the working directory are loaded in full at launch. CLAUDE.md files in subdirectories load on demand when Claude reads files in those directories. See [How CLAUDE.md files load](#how-claudemd-files-load) for the full resolution order.

For large projects, you can break instructions into topic-specific files using [project rules](#organize-rules-with-clauderules). Rules let you scope instructions to specific file types or subdirectories.

### Set up a project CLAUDE.md

A project CLAUDE.md can be stored in either `./CLAUDE.md` or `./.claude/CLAUDE.md`. Create this file and add instructions that apply to anyone working on the project: build and test commands, coding standards, architectural decisions, naming conventions, and common workflows. These instructions are shared with your team through version control, so focus on project-level standards rather than personal preferences.

<Tip>
  Run `/init` to generate a starting CLAUDE.md automatically. Claude analyzes your codebase and creates a file with build commands, test instructions, and project conventions it discovers. If a CLAUDE.md already exists, `/init` suggests improvements rather than overwriting it. Refine from there with instructions Claude wouldn't discover on its own.
</Tip>

### Write effective instructions

CLAUDE.md files are loaded into the context window at the start of every session, consuming tokens alongside your conversation. Because they're context rather than enforced configuration, how you write instructions affects how reliably Claude follows them. Specific, concise, well-structured instructions work best.

**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence. If your instructions are growing large, split them using [imports](#import-additional-files) or [`.claude/rules/`](#organize-rules-with-clauderules) files.

**Structure**: use markdown headers and bullets to group related instructions. Claude scans structure the same way readers do: organized sections are easier to follow than dense paragraphs.

**Specificity**: write instructions that are concrete enough to verify. For example:

* "Use 2-space indentation" instead of "Format code properly"
* "Run `npm test` before committing" instead of "Test your changes"
* "API handlers live in `src/api/handlers/`" instead of "Keep files organized"

**Consistency**: if two rules contradict each other, Claude may pick one arbitrarily. Review your CLAUDE.md files, nested CLAUDE.md files in subdirectories, and [`.claude/rules/`](#organize-rules-with-clauderules) periodically to remove outdated or conflicting instructions. In monorepos, use [`claudeMdExcludes`](#exclude-specific-claudemd-files) to skip CLAUDE.md files from other teams that aren't relevant to your work.

### Import additional files

CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them.

Both relative and absolute paths are allowed. Relative paths resolve relative to the file containing the import, not the working directory. Imported files can recursively import other files, with a maximum depth of five hops.

To pull in a README, package.json, and a workflow guide, reference them with `@` syntax anywhere in your CLAUDE.md:

```text  theme={null}
See @README for project overview and @package.json for available npm commands for this project.

# Additional Instructions
- git workflow @docs/git-instructions.md
```

For private per-project preferences that shouldn't be checked into version control, use `CLAUDE.local.md`: it is automatically loaded and added to `.gitignore`.

If you work across multiple git worktrees, `CLAUDE.local.md` only exists in one. Use a home-directory import instead so all worktrees share the same personal instructions:

```text  theme={null}
# Individual Preferences
- @~/.claude/my-project-instructions.md
```

<Warning>
  The first time Claude Code encounters external imports in a project, it shows an approval dialog listing the files. If you decline, the imports stay disabled and the dialog does not appear again.
</Warning>

For a more structured approach to organizing instructions, see [`.claude/rules/`](#organize-rules-with-clauderules).

### How CLAUDE.md files load

Claude Code reads CLAUDE.md files by walking up the directory tree from your current working directory, checking each directory along the way for CLAUDE.md and CLAUDE.local.md files. This means if you run Claude Code in `foo/bar/`, it loads instructions from both `foo/bar/CLAUDE.md` and `foo/CLAUDE.md`.

Claude also discovers CLAUDE.md files in subdirectories under your current working directory. Instead of loading them at launch, they are included when Claude reads files in those subdirectories.

If you work in a large monorepo where other teams' CLAUDE.md files get picked up, use [`claudeMdExcludes`](#exclude-specific-claudemd-files) to skip them.

#### Load from additional directories

The `--add-dir` flag gives Claude access to additional directories outside your main working directory. By default, CLAUDE.md files from these directories are not loaded.

To also load CLAUDE.md files from additional directories, including `CLAUDE.md`, `.claude/CLAUDE.md`, and `.claude/rules/*.md`, set the `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` environment variable:

```bash  theme={null}
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

### Organize rules with `.claude/rules/`

For larger projects, you can organize instructions into multiple files using the `.claude/rules/` directory. This keeps instructions modular and easier for teams to maintain. Rules can also be [scoped to specific file paths](#path-specific-rules), so they only load into context when Claude works with matching files, reducing noise and saving context space.

<Note>
  Rules load into context every session or when matching files are opened. For task-specific instructions that don't need to be in context all the time, use [skills](/en/skills) instead, which only load when you invoke them or when Claude determines they're relevant to your prompt.
</Note>

#### Set up rules

Place markdown files in your project's `.claude/rules/` directory. Each file should cover one topic, with a descriptive filename like `testing.md` or `api-design.md`. All `.md` files are discovered recursively, so you can organize rules into subdirectories like `frontend/` or `backend/`:

```text  theme={null}
your-project/
├── .claude/
│   ├── CLAUDE.md           # Main project instructions
│   └── rules/
│       ├── code-style.md   # Code style guidelines
│       ├── testing.md      # Testing conventions
│       └── security.md     # Security requirements
```

Rules without [`paths` frontmatter](#path-specific-rules) are loaded at launch with the same priority as `.claude/CLAUDE.md`.

#### Path-specific rules

Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns.

```markdown  theme={null}
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
- Use the standard error response format
- Include OpenAPI documentation comments
```

Rules without a `paths` field are loaded unconditionally and apply to all files. Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use.

Use glob patterns in the `paths` field to match files by extension, directory, or any combination:

| Pattern                | Matches                                  |
| ---------------------- | ---------------------------------------- |
| `**/*.ts`              | All TypeScript files in any directory    |
| `src/**/*`             | All files under `src/` directory         |
| `*.md`                 | Markdown files in the project root       |
| `src/components/*.tsx` | React components in a specific directory |

You can specify multiple patterns and use brace expansion to match multiple extensions in one pattern:

```markdown  theme={null}
---
paths:
  - "src/**/*.{ts,tsx}"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---
```

#### Share rules across projects with symlinks

The `.claude/rules/` directory supports symlinks, so you can maintain a shared set of rules and link them into multiple projects. Symlinks are resolved and loaded normally, and circular symlinks are detected and handled gracefully.

This example links both a shared directory and an individual file:

```bash  theme={null}
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

#### User-level rules

Personal rules in `~/.claude/rules/` apply to every project on your machine. Use them for preferences that aren't project-specific:

```text  theme={null}
~/.claude/rules/
├── preferences.md    # Your personal coding preferences
└── workflows.md      # Your preferred workflows
```

User-level rules are loaded before project rules, giving project rules higher priority.

### Manage CLAUDE.md for large teams

For organizations deploying Claude Code across teams, you can centralize instructions and control which CLAUDE.md files are loaded.

#### Deploy organization-wide CLAUDE.md

Organizations can deploy a centrally managed CLAUDE.md that applies to all users on a machine. This file cannot be excluded by individual settings.

<Steps>
  <Step title="Create the file at the managed policy location">
    * macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
    * Linux and WSL: `/etc/claude-code/CLAUDE.md`
    * Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`
  </Step>

  <Step title="Deploy with your configuration management system">
    Use MDM, Group Policy, Ansible, or similar tools to distribute the file across developer machines. See [managed settings](/en/permissions#managed-settings) for other organization-wide configuration options.
  </Step>
</Steps>

#### Exclude specific CLAUDE.md files

In large monorepos, ancestor CLAUDE.md files may contain instructions that aren't relevant to your work. The `claudeMdExcludes` setting lets you skip specific files by path or glob pattern.

This example excludes a top-level CLAUDE.md and a rules directory from a parent folder. Add it to `.claude/settings.local.json` so the exclusion stays local to your machine:

```json  theme={null}
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

Patterns are matched against absolute file paths using glob syntax. You can configure `claudeMdExcludes` at any [settings layer](/en/settings#settings-files): user, project, local, or managed policy. Arrays merge across layers.

Managed policy CLAUDE.md files cannot be excluded. This ensures organization-wide instructions always apply regardless of individual settings.

## Auto memory

Auto memory lets Claude accumulate knowledge across sessions without you writing anything. Claude saves notes for itself as it works: build commands, debugging insights, architecture notes, code style preferences, and workflow habits. Claude doesn't save something every session. It decides what's worth remembering based on whether the information would be useful in a future conversation.

### Enable or disable auto memory

Auto memory is on by default. To toggle it, open `/memory` in a session and use the auto memory toggle, or set `autoMemoryEnabled` in your project settings:

```json  theme={null}
{
  "autoMemoryEnabled": false
}
```

To disable auto memory via environment variable, set `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

### Storage location

Each project gets its own memory directory at `~/.claude/projects/<project>/memory/`. The `<project>` path is derived from the git repository, so all worktrees and subdirectories within the same repo share one auto memory directory. Outside a git repo, the project root is used instead.

The directory contains a `MEMORY.md` entrypoint and optional topic files:

```text  theme={null}
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Detailed notes on debugging patterns
├── api-conventions.md # API design decisions
└── ...                # Any other topic files Claude creates
```

`MEMORY.md` acts as an index of the memory directory. Claude reads and writes files in this directory throughout your session, using `MEMORY.md` to keep track of what's stored where.

Auto memory is machine-local. All worktrees and subdirectories within the same git repository share one auto memory directory. Files are not shared across machines or cloud environments.

### How it works

The first 200 lines of `MEMORY.md` are loaded at the start of every conversation. Content beyond line 200 is not loaded at session start. Claude keeps `MEMORY.md` concise by moving detailed notes into separate topic files.

This 200-line limit applies only to `MEMORY.md`. CLAUDE.md files are loaded in full regardless of length, though shorter files produce better adherence.

Topic files like `debugging.md` or `patterns.md` are not loaded at startup. Claude reads them on demand using its standard file tools when it needs the information.

Claude reads and writes memory files during your session. When you see "Writing memory" or "Recalled memory" in the Claude Code interface, Claude is actively updating or reading from `~/.claude/projects/<project>/memory/`.

### Audit and edit your memory

Auto memory files are plain markdown you can edit or delete at any time. Run [`/memory`](#view-and-edit-with-memory) to browse and open memory files from within a session.

## View and edit with `/memory`

The `/memory` command lists all CLAUDE.md and rules files loaded in your current session, lets you toggle auto memory on or off, and provides a link to open the auto memory folder. Select any file to open it in your editor.

When you ask Claude to remember something, like "always use pnpm, not npm" or "remember that the API tests require a local Redis instance," Claude saves it to auto memory. To add instructions to CLAUDE.md instead, ask Claude directly, like "add this to CLAUDE.md," or edit the file yourself via `/memory`.

## Troubleshoot memory issues

These are the most common issues with CLAUDE.md and auto memory, along with steps to debug them.

### Claude isn't following my CLAUDE.md

CLAUDE.md is context, not enforcement. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions.

To debug:

* Run `/memory` to verify your CLAUDE.md files are being loaded. If a file isn't listed, Claude can't see it.
* Check that the relevant CLAUDE.md is in a location that gets loaded for your session (see [Choose where to put CLAUDE.md files](#choose-where-to-put-claudemd-files)).
* Make instructions more specific. "Use 2-space indentation" works better than "format code nicely."
* Look for conflicting instructions across CLAUDE.md files. If two files give different guidance for the same behavior, Claude may pick one arbitrarily.

<Tip>
  Use the [`InstructionsLoaded` hook](/en/hooks#instructionsloaded) to log exactly which instruction files are loaded, when they load, and why. This is useful for debugging path-specific rules or lazy-loaded files in subdirectories.
</Tip>

### I don't know what auto memory saved

Run `/memory` and select the auto memory folder to browse what Claude has saved. Everything is plain markdown you can read, edit, or delete.

### My CLAUDE.md is too large

Files over 200 lines consume more context and may reduce adherence. Move detailed content into separate files referenced with `@path` imports (see [Import additional files](#import-additional-files)), or split your instructions across `.claude/rules/` files.

### Instructions seem lost after `/compact`

CLAUDE.md fully survives compaction. After `/compact`, Claude re-reads your CLAUDE.md from disk and re-injects it fresh into the session. If an instruction disappeared after compaction, it was given only in conversation, not written to CLAUDE.md. Add it to CLAUDE.md to make it persist across sessions.

See [Write effective instructions](#write-effective-instructions) for guidance on size, structure, and specificity.

## Related resources

* [Skills](/en/skills): package repeatable workflows that load on demand
* [Settings](/en/settings): configure Claude Code behavior with settings files
* [Manage sessions](/en/sessions): manage context, resume conversations, and run parallel sessions
* [Subagent memory](/en/sub-agents#enable-persistent-memory): let subagents maintain their own auto memory
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Common workflows

> Step-by-step guides for exploring codebases, fixing bugs, refactoring, testing, and other everyday tasks with Claude Code.

This page covers practical workflows for everyday development: exploring unfamiliar code, debugging, refactoring, writing tests, creating PRs, and managing sessions. Each section includes example prompts you can adapt to your own projects. For higher-level patterns and tips, see [Best practices](/en/best-practices).

## Understand new codebases

### Get a quick codebase overview

Suppose you've just joined a new project and need to understand its structure quickly.

<Steps>
  <Step title="Navigate to the project root directory">
    ```bash  theme={null}
    cd /path/to/project 
    ```
  </Step>

  <Step title="Start Claude Code">
    ```bash  theme={null}
    claude 
    ```
  </Step>

  <Step title="Ask for a high-level overview">
    ```
    > give me an overview of this codebase 
    ```
  </Step>

  <Step title="Dive deeper into specific components">
    ```
    > explain the main architecture patterns used here 
    ```

    ```
    > what are the key data models?
    ```

    ```
    > how is authentication handled?
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Start with broad questions, then narrow down to specific areas
  * Ask about coding conventions and patterns used in the project
  * Request a glossary of project-specific terms
</Tip>

### Find relevant code

Suppose you need to locate code related to a specific feature or functionality.

<Steps>
  <Step title="Ask Claude to find relevant files">
    ```
    > find the files that handle user authentication 
    ```
  </Step>

  <Step title="Get context on how components interact">
    ```
    > how do these authentication files work together? 
    ```
  </Step>

  <Step title="Understand the execution flow">
    ```
    > trace the login process from front-end to database 
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Be specific about what you're looking for
  * Use domain language from the project
  * Install a [code intelligence plugin](/en/discover-plugins#code-intelligence) for your language to give Claude precise "go to definition" and "find references" navigation
</Tip>

***

## Fix bugs efficiently

Suppose you've encountered an error message and need to find and fix its source.

<Steps>
  <Step title="Share the error with Claude">
    ```
    > I'm seeing an error when I run npm test 
    ```
  </Step>

  <Step title="Ask for fix recommendations">
    ```
    > suggest a few ways to fix the @ts-ignore in user.ts 
    ```
  </Step>

  <Step title="Apply the fix">
    ```
    > update user.ts to add the null check you suggested 
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Tell Claude the command to reproduce the issue and get a stack trace
  * Mention any steps to reproduce the error
  * Let Claude know if the error is intermittent or consistent
</Tip>

***

## Refactor code

Suppose you need to update old code to use modern patterns and practices.

<Steps>
  <Step title="Identify legacy code for refactoring">
    ```
    > find deprecated API usage in our codebase 
    ```
  </Step>

  <Step title="Get refactoring recommendations">
    ```
    > suggest how to refactor utils.js to use modern JavaScript features 
    ```
  </Step>

  <Step title="Apply the changes safely">
    ```
    > refactor utils.js to use ES2024 features while maintaining the same behavior 
    ```
  </Step>

  <Step title="Verify the refactoring">
    ```
    > run tests for the refactored code 
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Ask Claude to explain the benefits of the modern approach
  * Request that changes maintain backward compatibility when needed
  * Do refactoring in small, testable increments
</Tip>

***

## Use specialized subagents

Suppose you want to use specialized AI subagents to handle specific tasks more effectively.

<Steps>
  <Step title="View available subagents">
    ```
    > /agents
    ```

    This shows all available subagents and lets you create new ones.
  </Step>

  <Step title="Use subagents automatically">
    Claude Code automatically delegates appropriate tasks to specialized subagents:

    ```
    > review my recent code changes for security issues
    ```

    ```
    > run all tests and fix any failures
    ```
  </Step>

  <Step title="Explicitly request specific subagents">
    ```
    > use the code-reviewer subagent to check the auth module
    ```

    ```
    > have the debugger subagent investigate why users can't log in
    ```
  </Step>

  <Step title="Create custom subagents for your workflow">
    ```
    > /agents
    ```

    Then select "Create New subagent" and follow the prompts to define:

    * A unique identifier that describes the subagent's purpose (for example, `code-reviewer`, `api-designer`).
    * When Claude should use this agent
    * Which tools it can access
    * A system prompt describing the agent's role and behavior
  </Step>
</Steps>

<Tip>
  Tips:

  * Create project-specific subagents in `.claude/agents/` for team sharing
  * Use descriptive `description` fields to enable automatic delegation
  * Limit tool access to what each subagent actually needs
  * Check the [subagents documentation](/en/sub-agents) for detailed examples
</Tip>

***

## Use Plan Mode for safe code analysis

Plan Mode instructs Claude to create a plan by analyzing the codebase with read-only operations, perfect for exploring codebases, planning complex changes, or reviewing code safely. In Plan Mode, Claude uses [`AskUserQuestion`](/en/settings#tools-available-to-claude) to gather requirements and clarify your goals before proposing a plan.

### When to use Plan Mode

* **Multi-step implementation**: When your feature requires making edits to many files
* **Code exploration**: When you want to research the codebase thoroughly before changing anything
* **Interactive development**: When you want to iterate on the direction with Claude

### How to use Plan Mode

**Turn on Plan Mode during a session**

You can switch into Plan Mode during a session using **Shift+Tab** to cycle through permission modes.

If you are in Normal Mode, **Shift+Tab** first switches into Auto-Accept Mode, indicated by `⏵⏵ accept edits on` at the bottom of the terminal. A subsequent **Shift+Tab** will switch into Plan Mode, indicated by `⏸ plan mode on`.

**Start a new session in Plan Mode**

To start a new session in Plan Mode, use the `--permission-mode plan` flag:

```bash  theme={null}
claude --permission-mode plan
```

**Run "headless" queries in Plan Mode**

You can also run a query in Plan Mode directly with `-p` (that is, in ["headless mode"](/en/headless)):

```bash  theme={null}
claude --permission-mode plan -p "Analyze the authentication system and suggest improvements"
```

### Example: Planning a complex refactor

```bash  theme={null}
claude --permission-mode plan
```

```
> I need to refactor our authentication system to use OAuth2. Create a detailed migration plan.
```

Claude analyzes the current implementation and create a comprehensive plan. Refine with follow-ups:

```
> What about backward compatibility?
> How should we handle database migration?
```

<Tip>Press `Ctrl+G` to open the plan in your default text editor, where you can edit it directly before Claude proceeds.</Tip>

### Configure Plan Mode as default

```json  theme={null}
// .claude/settings.json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

See [settings documentation](/en/settings#available-settings) for more configuration options.

***

## Work with tests

Suppose you need to add tests for uncovered code.

<Steps>
  <Step title="Identify untested code">
    ```
    > find functions in NotificationsService.swift that are not covered by tests 
    ```
  </Step>

  <Step title="Generate test scaffolding">
    ```
    > add tests for the notification service 
    ```
  </Step>

  <Step title="Add meaningful test cases">
    ```
    > add test cases for edge conditions in the notification service 
    ```
  </Step>

  <Step title="Run and verify tests">
    ```
    > run the new tests and fix any failures 
    ```
  </Step>
</Steps>

Claude can generate tests that follow your project's existing patterns and conventions. When asking for tests, be specific about what behavior you want to verify. Claude examines your existing test files to match the style, frameworks, and assertion patterns already in use.

For comprehensive coverage, ask Claude to identify edge cases you might have missed. Claude can analyze your code paths and suggest tests for error conditions, boundary values, and unexpected inputs that are easy to overlook.

***

## Create pull requests

You can create pull requests by asking Claude directly ("create a pr for my changes"), or guide Claude through it step-by-step:

<Steps>
  <Step title="Summarize your changes">
    ```
    > summarize the changes I've made to the authentication module
    ```
  </Step>

  <Step title="Generate a pull request">
    ```
    > create a pr
    ```
  </Step>

  <Step title="Review and refine">
    ```
    > enhance the PR description with more context about the security improvements
    ```
  </Step>
</Steps>

When you create a PR using `gh pr create`, the session is automatically linked to that PR. You can resume it later with `claude --from-pr <number>`.

<Tip>
  Review Claude's generated PR before submitting and ask Claude to highlight potential risks or considerations.
</Tip>

## Handle documentation

Suppose you need to add or update documentation for your code.

<Steps>
  <Step title="Identify undocumented code">
    ```
    > find functions without proper JSDoc comments in the auth module 
    ```
  </Step>

  <Step title="Generate documentation">
    ```
    > add JSDoc comments to the undocumented functions in auth.js 
    ```
  </Step>

  <Step title="Review and enhance">
    ```
    > improve the generated documentation with more context and examples 
    ```
  </Step>

  <Step title="Verify documentation">
    ```
    > check if the documentation follows our project standards 
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Specify the documentation style you want (JSDoc, docstrings, etc.)
  * Ask for examples in the documentation
  * Request documentation for public APIs, interfaces, and complex logic
</Tip>

***

## Work with images

Suppose you need to work with images in your codebase, and you want Claude's help analyzing image content.

<Steps>
  <Step title="Add an image to the conversation">
    You can use any of these methods:

    1. Drag and drop an image into the Claude Code window
    2. Copy an image and paste it into the CLI with ctrl+v (Do not use cmd+v)
    3. Provide an image path to Claude. E.g., "Analyze this image: /path/to/your/image.png"
  </Step>

  <Step title="Ask Claude to analyze the image">
    ```
    > What does this image show?
    ```

    ```
    > Describe the UI elements in this screenshot
    ```

    ```
    > Are there any problematic elements in this diagram?
    ```
  </Step>

  <Step title="Use images for context">
    ```
    > Here's a screenshot of the error. What's causing it?
    ```

    ```
    > This is our current database schema. How should we modify it for the new feature?
    ```
  </Step>

  <Step title="Get code suggestions from visual content">
    ```
    > Generate CSS to match this design mockup
    ```

    ```
    > What HTML structure would recreate this component?
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Use images when text descriptions would be unclear or cumbersome
  * Include screenshots of errors, UI designs, or diagrams for better context
  * You can work with multiple images in a conversation
  * Image analysis works with diagrams, screenshots, mockups, and more
  * When Claude references images (for example, `[Image #1]`), `Cmd+Click` (Mac) or `Ctrl+Click` (Windows/Linux) the link to open the image in your default viewer
</Tip>

***

## Reference files and directories

Use @ to quickly include files or directories without waiting for Claude to read them.

<Steps>
  <Step title="Reference a single file">
    ```
    > Explain the logic in @src/utils/auth.js
    ```

    This includes the full content of the file in the conversation.
  </Step>

  <Step title="Reference a directory">
    ```
    > What's the structure of @src/components?
    ```

    This provides a directory listing with file information.
  </Step>

  <Step title="Reference MCP resources">
    ```
    > Show me the data from @github:repos/owner/repo/issues
    ```

    This fetches data from connected MCP servers using the format @server:resource. See [MCP resources](/en/mcp#use-mcp-resources) for details.
  </Step>
</Steps>

<Tip>
  Tips:

  * File paths can be relative or absolute
  * @ file references add `CLAUDE.md` in the file's directory and parent directories to context
  * Directory references show file listings, not contents
  * You can reference multiple files in a single message (for example, "@file1.js and @file2.js")
</Tip>

***

## Use extended thinking (thinking mode)

[Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) is enabled by default, giving Claude space to reason through complex problems step-by-step before responding. This reasoning is visible in verbose mode, which you can toggle on with `Ctrl+O`.

Additionally, Opus 4.6 introduces adaptive reasoning: instead of a fixed thinking token budget, the model dynamically allocates thinking based on your [effort level](/en/model-config#adjust-effort-level) setting. Extended thinking and adaptive reasoning work together to give you control over how deeply Claude reasons before responding.

Extended thinking is particularly valuable for complex architectural decisions, challenging bugs, multi-step implementation planning, and evaluating tradeoffs between different approaches.

<Note>
  Phrases like "think", "think hard", and "think more" are interpreted as regular prompt instructions and don't allocate thinking tokens.
</Note>

### Configure thinking mode

Thinking is enabled by default, but you can adjust or disable it.

| Scope                    | How to configure                                                                           | Details                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Effort level**         | Adjust in `/model` or set [`CLAUDE_CODE_EFFORT_LEVEL`](/en/settings#environment-variables) | Control thinking depth for Opus 4.6 and Sonnet 4.6: low, medium, high. See [Adjust effort level](/en/model-config#adjust-effort-level)                           |
| **`ultrathink` keyword** | Include "ultrathink" anywhere in your prompt                                               | Sets effort to high for that turn on Opus 4.6 and Sonnet 4.6. Useful for one-off tasks requiring deep reasoning without permanently changing your effort setting |
| **Toggle shortcut**      | Press `Option+T` (macOS) or `Alt+T` (Windows/Linux)                                        | Toggle thinking on/off for the current session (all models). May require [terminal configuration](/en/terminal-config) to enable Option key shortcuts            |
| **Global default**       | Use `/config` to toggle thinking mode                                                      | Sets your default across all projects (all models).<br />Saved as `alwaysThinkingEnabled` in `~/.claude/settings.json`                                           |
| **Limit token budget**   | Set [`MAX_THINKING_TOKENS`](/en/settings#environment-variables) environment variable       | Limit the thinking budget to a specific number of tokens (ignored on Opus 4.6 unless set to 0). Example: `export MAX_THINKING_TOKENS=10000`                      |

To view Claude's thinking process, press `Ctrl+O` to toggle verbose mode and see the internal reasoning displayed as gray italic text.

### How extended thinking works

Extended thinking controls how much internal reasoning Claude performs before responding. More thinking provides more space to explore solutions, analyze edge cases, and self-correct mistakes.

**With Opus 4.6**, thinking uses adaptive reasoning: the model dynamically allocates thinking tokens based on the [effort level](/en/model-config#adjust-effort-level) you select (low, medium, high). This is the recommended way to tune the tradeoff between speed and reasoning depth.

**With other models**, thinking uses a fixed budget of up to 31,999 tokens from your output budget. You can limit this with the [`MAX_THINKING_TOKENS`](/en/settings#environment-variables) environment variable, or disable thinking entirely via `/config` or the `Option+T`/`Alt+T` toggle.

`MAX_THINKING_TOKENS` is ignored on Opus 4.6 and Sonnet 4.6, since adaptive reasoning controls thinking depth instead. The one exception: setting `MAX_THINKING_TOKENS=0` still disables thinking entirely on any model. To disable adaptive thinking and revert to the fixed thinking budget, set `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`. See [environment variables](/en/settings#environment-variables).

<Warning>
  You're charged for all thinking tokens used, even though Claude 4 models show summarized thinking
</Warning>

***

## Resume previous conversations

When starting Claude Code, you can resume a previous session:

* `claude --continue` continues the most recent conversation in the current directory
* `claude --resume` opens a conversation picker or resumes by name
* `claude --from-pr 123` resumes sessions linked to a specific pull request

From inside an active session, use `/resume` to switch to a different conversation.

Sessions are stored per project directory. The `/resume` picker shows sessions from the same git repository, including worktrees.

### Name your sessions

Give sessions descriptive names to find them later. This is a best practice when working on multiple tasks or features.

<Steps>
  <Step title="Name the current session">
    Use `/rename` during a session to give it a memorable name:

    ```
    > /rename auth-refactor
    ```

    You can also rename any session from the picker: run `/resume`, navigate to a session, and press `R`.
  </Step>

  <Step title="Resume by name later">
    From the command line:

    ```bash  theme={null}
    claude --resume auth-refactor
    ```

    Or from inside an active session:

    ```
    > /resume auth-refactor
    ```
  </Step>
</Steps>

### Use the session picker

The `/resume` command (or `claude --resume` without arguments) opens an interactive session picker with these features:

**Keyboard shortcuts in the picker:**

| Shortcut  | Action                                            |
| :-------- | :------------------------------------------------ |
| `↑` / `↓` | Navigate between sessions                         |
| `→` / `←` | Expand or collapse grouped sessions               |
| `Enter`   | Select and resume the highlighted session         |
| `P`       | Preview the session content                       |
| `R`       | Rename the highlighted session                    |
| `/`       | Search to filter sessions                         |
| `A`       | Toggle between current directory and all projects |
| `B`       | Filter to sessions from your current git branch   |
| `Esc`     | Exit the picker or search mode                    |

**Session organization:**

The picker displays sessions with helpful metadata:

* Session name or initial prompt
* Time elapsed since last activity
* Message count
* Git branch (if applicable)

Forked sessions (created with `/rewind` or `--fork-session`) are grouped together under their root session, making it easier to find related conversations.

<Tip>
  Tips:

  * **Name sessions early**: Use `/rename` when starting work on a distinct task—it's much easier to find "payment-integration" than "explain this function" later
  * Use `--continue` for quick access to your most recent conversation in the current directory
  * Use `--resume session-name` when you know which session you need
  * Use `--resume` (without a name) when you need to browse and select
  * For scripts, use `claude --continue --print "prompt"` to resume in non-interactive mode
  * Press `P` in the picker to preview a session before resuming it
  * The resumed conversation starts with the same model and configuration as the original

  How it works:

  1. **Conversation Storage**: All conversations are automatically saved locally with their full message history
  2. **Message Deserialization**: When resuming, the entire message history is restored to maintain context
  3. **Tool State**: Tool usage and results from the previous conversation are preserved
  4. **Context Restoration**: The conversation resumes with all previous context intact
</Tip>

***

## Run parallel Claude Code sessions with Git worktrees

When working on multiple tasks at once, you need each Claude session to have its own copy of the codebase so changes don't collide. Git worktrees solve this by creating separate working directories that each have their own files and branch, while sharing the same repository history and remote connections. This means you can have Claude working on a feature in one worktree while fixing a bug in another, without either session interfering with the other.

Use the `--worktree` (`-w`) flag to create an isolated worktree and start Claude in it. The value you pass becomes the worktree directory name and branch name:

```bash  theme={null}
# Start Claude in a worktree named "feature-auth"
# Creates .claude/worktrees/feature-auth/ with a new branch
claude --worktree feature-auth

# Start another session in a separate worktree
claude --worktree bugfix-123
```

If you omit the name, Claude generates a random one automatically:

```bash  theme={null}
# Auto-generates a name like "bright-running-fox"
claude --worktree
```

Worktrees are created at `<repo>/.claude/worktrees/<name>` and branch from the default remote branch. The worktree branch is named `worktree-<name>`.

You can also ask Claude to "work in a worktree" or "start a worktree" during a session, and it will create one automatically.

### Subagent worktrees

Subagents can also use worktree isolation to work in parallel without conflicts. Ask Claude to "use worktrees for your agents" or configure it in a [custom subagent](/en/sub-agents#supported-frontmatter-fields) by adding `isolation: worktree` to the agent's frontmatter. Each subagent gets its own worktree that is automatically cleaned up when the subagent finishes without changes.

### Worktree cleanup

When you exit a worktree session, Claude handles cleanup based on whether you made changes:

* **No changes**: the worktree and its branch are removed automatically
* **Changes or commits exist**: Claude prompts you to keep or remove the worktree. Keeping preserves the directory and branch so you can return later. Removing deletes the worktree directory and its branch, discarding all uncommitted changes and commits

To clean up worktrees outside of a Claude session, use [manual worktree management](#manage-worktrees-manually).

<Tip>
  Add `.claude/worktrees/` to your `.gitignore` to prevent worktree contents from appearing as untracked files in your main repository.
</Tip>

### Manage worktrees manually

For more control over worktree location and branch configuration, create worktrees with Git directly. This is useful when you need to check out a specific existing branch or place the worktree outside the repository.

```bash  theme={null}
# Create a worktree with a new branch
git worktree add ../project-feature-a -b feature-a

# Create a worktree with an existing branch
git worktree add ../project-bugfix bugfix-123

# Start Claude in the worktree
cd ../project-feature-a && claude

# Clean up when done
git worktree list
git worktree remove ../project-feature-a
```

Learn more in the [official Git worktree documentation](https://git-scm.com/docs/git-worktree).

<Tip>
  Remember to initialize your development environment in each new worktree according to your project's setup. Depending on your stack, this might include running dependency installation (`npm install`, `yarn`), setting up virtual environments, or following your project's standard setup process.
</Tip>

### Non-git version control

Worktree isolation works with git by default. For other version control systems like SVN, Perforce, or Mercurial, configure [WorktreeCreate and WorktreeRemove hooks](/en/hooks#worktreecreate) to provide custom worktree creation and cleanup logic. When configured, these hooks replace the default git behavior when you use `--worktree`.

For automated coordination of parallel sessions with shared tasks and messaging, see [agent teams](/en/agent-teams).

***

## Get notified when Claude needs your attention

When you kick off a long-running task and switch to another window, you can set up desktop notifications so you know when Claude finishes or needs your input. This uses the `Notification` [hook event](/en/hooks-guide#get-notified-when-claude-needs-input), which fires whenever Claude is waiting for permission, idle and ready for a new prompt, or completing authentication.

<Steps>
  <Step title="Open the hooks menu">
    Type `/hooks` and select `Notification` from the list of events.
  </Step>

  <Step title="Configure the matcher">
    Select `+ Match all (no filter)` to fire on all notification types. To notify only for specific events, select `+ Add new matcher…` and enter one of these values:

    | Matcher              | Fires when                                      |
    | :------------------- | :---------------------------------------------- |
    | `permission_prompt`  | Claude needs you to approve a tool use          |
    | `idle_prompt`        | Claude is done and waiting for your next prompt |
    | `auth_success`       | Authentication completes                        |
    | `elicitation_dialog` | Claude is asking you a question                 |
  </Step>

  <Step title="Add your notification command">
    Select `+ Add new hook…` and enter the command for your OS:

    <Tabs>
      <Tab title="macOS">
        Uses [`osascript`](https://ss64.com/mac/osascript.html) to trigger a native macOS notification through AppleScript:

        ```
        osascript -e 'display notification "Claude Code needs your attention" with title "Claude Code"'
        ```
      </Tab>

      <Tab title="Linux">
        Uses `notify-send`, which is pre-installed on most Linux desktops with a notification daemon:

        ```
        notify-send 'Claude Code' 'Claude Code needs your attention'
        ```
      </Tab>

      <Tab title="Windows (PowerShell)">
        Uses PowerShell to show a native message box through .NET's Windows Forms:

        ```
        powershell.exe -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code')"
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Save to user settings">
    Select `User settings` to apply the notification across all your projects.
  </Step>
</Steps>

For the full walkthrough with JSON configuration examples, see [Automate workflows with hooks](/en/hooks-guide#get-notified-when-claude-needs-input). For the complete event schema and notification types, see the [Notification reference](/en/hooks#notification).

***

## Use Claude as a unix-style utility

### Add Claude to your verification process

Suppose you want to use Claude Code as a linter or code reviewer.

**Add Claude to your build script:**

```json  theme={null}
// package.json
{
    ...
    "scripts": {
        ...
        "lint:claude": "claude -p 'you are a linter. please look at the changes vs. main and report any issues related to typos. report the filename and line number on one line, and a description of the issue on the second line. do not return any other text.'"
    }
}
```

<Tip>
  Tips:

  * Use Claude for automated code review in your CI/CD pipeline
  * Customize the prompt to check for specific issues relevant to your project
  * Consider creating multiple scripts for different types of verification
</Tip>

### Pipe in, pipe out

Suppose you want to pipe data into Claude, and get back data in a structured format.

**Pipe data through Claude:**

```bash  theme={null}
cat build-error.txt | claude -p 'concisely explain the root cause of this build error' > output.txt
```

<Tip>
  Tips:

  * Use pipes to integrate Claude into existing shell scripts
  * Combine with other Unix tools for powerful workflows
  * Consider using --output-format for structured output
</Tip>

### Control output format

Suppose you need Claude's output in a specific format, especially when integrating Claude Code into scripts or other tools.

<Steps>
  <Step title="Use text format (default)">
    ```bash  theme={null}
    cat data.txt | claude -p 'summarize this data' --output-format text > summary.txt
    ```

    This outputs just Claude's plain text response (default behavior).
  </Step>

  <Step title="Use JSON format">
    ```bash  theme={null}
    cat code.py | claude -p 'analyze this code for bugs' --output-format json > analysis.json
    ```

    This outputs a JSON array of messages with metadata including cost and duration.
  </Step>

  <Step title="Use streaming JSON format">
    ```bash  theme={null}
    cat log.txt | claude -p 'parse this log file for errors' --output-format stream-json
    ```

    This outputs a series of JSON objects in real-time as Claude processes the request. Each message is a valid JSON object, but the entire output is not valid JSON if concatenated.
  </Step>
</Steps>

<Tip>
  Tips:

  * Use `--output-format text` for simple integrations where you just need Claude's response
  * Use `--output-format json` when you need the full conversation log
  * Use `--output-format stream-json` for real-time output of each conversation turn
</Tip>

***

## Ask Claude about its capabilities

Claude has built-in access to its documentation and can answer questions about its own features and limitations.

### Example questions

```
> can Claude Code create pull requests?
```

```
> how does Claude Code handle permissions?
```

```
> what skills are available?
```

```
> how do I use MCP with Claude Code?
```

```
> how do I configure Claude Code for Amazon Bedrock?
```

```
> what are the limitations of Claude Code?
```

<Note>
  Claude provides documentation-based answers to these questions. For executable examples and hands-on demonstrations, refer to the specific workflow sections above.
</Note>

<Tip>
  Tips:

  * Claude always has access to the latest Claude Code documentation, regardless of the version you're using
  * Ask specific questions to get detailed answers
  * Claude can explain complex features like MCP integration, enterprise configurations, and advanced workflows
</Tip>

***

## Next steps

<CardGroup cols={2}>
  <Card title="Best practices" icon="lightbulb" href="/en/best-practices">
    Patterns for getting the most out of Claude Code
  </Card>

  <Card title="How Claude Code works" icon="gear" href="/en/how-claude-code-works">
    Understand the agentic loop and context management
  </Card>

  <Card title="Extend Claude Code" icon="puzzle-piece" href="/en/features-overview">
    Add skills, hooks, MCP, subagents, and plugins
  </Card>

  <Card title="Reference implementation" icon="code" href="https://github.com/anthropics/claude-code/tree/main/.devcontainer">
    Clone our development container reference implementation
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Best Practices for Claude Code

> Tips and patterns for getting the most out of Claude Code, from configuring your environment to scaling across parallel sessions.

Claude Code is an agentic coding environment. Unlike a chatbot that answers questions and waits, Claude Code can read your files, run commands, make changes, and autonomously work through problems while you watch, redirect, or step away entirely.

This changes how you work. Instead of writing code yourself and asking Claude to review it, you describe what you want and Claude figures out how to build it. Claude explores, plans, and implements.

But this autonomy still comes with a learning curve. Claude works within certain constraints you need to understand.

This guide covers patterns that have proven effective across Anthropic's internal teams and for engineers using Claude Code across various codebases, languages, and environments. For how the agentic loop works under the hood, see [How Claude Code works](/en/how-claude-code-works).

***

Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills.

Claude's context window holds your entire conversation, including every message, every file Claude reads, and every command output. However, this can fill up fast. A single debugging session or codebase exploration might generate and consume tens of thousands of tokens.

This matters since LLM performance degrades as context fills. When the context window is getting full, Claude may start "forgetting" earlier instructions or making more mistakes. The context window is the most important resource to manage. Track context usage continuously with a [custom status line](/en/statusline), and see [Reduce token usage](/en/costs#reduce-token-usage) for strategies on reducing token usage.

***

## Give Claude a way to verify its work

<Tip>
  Include tests, screenshots, or expected outputs so Claude can check itself. This is the single highest-leverage thing you can do.
</Tip>

Claude performs dramatically better when it can verify its own work, like run tests, compare screenshots, and validate outputs.

Without clear success criteria, it might produce something that looks right but actually doesn't work. You become the only feedback loop, and every mistake requires your attention.

| Strategy                              | Before                                                  | After                                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provide verification criteria**     | *"implement a function that validates email addresses"* | *"write a validateEmail function. example test cases: [user@example.com](mailto:user@example.com) is true, invalid is false, [user@.com](mailto:user@.com) is false. run the tests after implementing"* |
| **Verify UI changes visually**        | *"make the dashboard look better"*                      | *"\[paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them"*                                                            |
| **Address root causes, not symptoms** | *"the build is failing"*                                | *"the build fails with this error: \[paste error]. fix it and verify the build succeeds. address the root cause, don't suppress the error"*                                                             |

UI changes can be verified using the [Claude in Chrome extension](/en/chrome). It opens new tabs in your browser, tests the UI, and iterates until the code works.

Your verification can also be a test suite, a linter, or a Bash command that checks output. Invest in making your verification rock-solid.

***

## Explore first, then plan, then code

<Tip>
  Separate research and planning from implementation to avoid solving the wrong problem.
</Tip>

Letting Claude jump straight to coding can produce code that solves the wrong problem. Use [Plan Mode](/en/common-workflows#use-plan-mode-for-safe-code-analysis) to separate exploration from execution.

The recommended workflow has four phases:

<Steps>
  <Step title="Explore">
    Enter Plan Mode. Claude reads files and answers questions without making changes.

    ```txt claude (Plan Mode) theme={null}
    read /src/auth and understand how we handle sessions and login.
    also look at how we manage environment variables for secrets.
    ```
  </Step>

  <Step title="Plan">
    Ask Claude to create a detailed implementation plan.

    ```txt claude (Plan Mode) theme={null}
    I want to add Google OAuth. What files need to change?
    What's the session flow? Create a plan.
    ```

    Press `Ctrl+G` to open the plan in your text editor for direct editing before Claude proceeds.
  </Step>

  <Step title="Implement">
    Switch back to Normal Mode and let Claude code, verifying against its plan.

    ```txt claude (Normal Mode) theme={null}
    implement the OAuth flow from your plan. write tests for the
    callback handler, run the test suite and fix any failures.
    ```
  </Step>

  <Step title="Commit">
    Ask Claude to commit with a descriptive message and create a PR.

    ```txt claude (Normal Mode) theme={null}
    commit with a descriptive message and open a PR
    ```
  </Step>
</Steps>

<Callout>
  Plan Mode is useful, but also adds overhead.

  For tasks where the scope is clear and the fix is small (like fixing a typo, adding a log line, or renaming a variable) ask Claude to do it directly.

  Planning is most useful when you're uncertain about the approach, when the change modifies multiple files, or when you're unfamiliar with the code being modified. If you could describe the diff in one sentence, skip the plan.
</Callout>

***

## Provide specific context in your prompts

<Tip>
  The more precise your instructions, the fewer corrections you'll need.
</Tip>

Claude can infer intent, but it can't read your mind. Reference specific files, mention constraints, and point to example patterns.

| Strategy                                                                                         | Before                                               | After                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope the task.** Specify which file, what scenario, and testing preferences.                  | *"add tests for foo.py"*                             | *"write a test for foo.py covering the edge case where the user is logged out. avoid mocks."*                                                                                                                                                                                                                                                                    |
| **Point to sources.** Direct Claude to the source that can answer a question.                    | *"why does ExecutionFactory have such a weird api?"* | *"look through ExecutionFactory's git history and summarize how its api came to be"*                                                                                                                                                                                                                                                                             |
| **Reference existing patterns.** Point Claude to patterns in your codebase.                      | *"add a calendar widget"*                            | *"look at how existing widgets are implemented on the home page to understand the patterns. HotDogWidget.php is a good example. follow the pattern to implement a new calendar widget that lets the user select a month and paginate forwards/backwards to pick a year. build from scratch without libraries other than the ones already used in the codebase."* |
| **Describe the symptom.** Provide the symptom, the likely location, and what "fixed" looks like. | *"fix the login bug"*                                | *"users report that login fails after session timeout. check the auth flow in src/auth/, especially token refresh. write a failing test that reproduces the issue, then fix it"*                                                                                                                                                                                 |

Vague prompts can be useful when you're exploring and can afford to course-correct. A prompt like `"what would you improve in this file?"` can surface things you wouldn't have thought to ask about.

### Provide rich content

<Tip>
  Use `@` to reference files, paste screenshots/images, or pipe data directly.
</Tip>

You can provide rich data to Claude in several ways:

* **Reference files with `@`** instead of describing where code lives. Claude reads the file before responding.
* **Paste images directly**. Copy/paste or drag and drop images into the prompt.
* **Give URLs** for documentation and API references. Use `/permissions` to allowlist frequently-used domains.
* **Pipe in data** by running `cat error.log | claude` to send file contents directly.
* **Let Claude fetch what it needs**. Tell Claude to pull context itself using Bash commands, MCP tools, or by reading files.

***

## Configure your environment

A few setup steps make Claude Code significantly more effective across all your sessions. For a full overview of extension features and when to use each one, see [Extend Claude Code](/en/features-overview).

### Write an effective CLAUDE.md

<Tip>
  Run `/init` to generate a starter CLAUDE.md file based on your current project structure, then refine over time.
</Tip>

CLAUDE.md is a special file that Claude reads at the start of every conversation. Include Bash commands, code style, and workflow rules. This gives Claude persistent context it can't infer from code alone.

The `/init` command analyzes your codebase to detect build systems, test frameworks, and code patterns, giving you a solid foundation to refine.

There's no required format for CLAUDE.md files, but keep it short and human-readable. For example:

```markdown CLAUDE.md theme={null}
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
```

CLAUDE.md is loaded every session, so only include things that apply broadly. For domain knowledge or workflows that are only relevant sometimes, use [skills](/en/skills) instead. Claude loads them on demand without bloating every conversation.

Keep it concise. For each line, ask: *"Would removing this cause Claude to make mistakes?"* If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!

| ✅ Include                                            | ❌ Exclude                                          |
| ---------------------------------------------------- | -------------------------------------------------- |
| Bash commands Claude can't guess                     | Anything Claude can figure out by reading code     |
| Code style rules that differ from defaults           | Standard language conventions Claude already knows |
| Testing instructions and preferred test runners      | Detailed API documentation (link to docs instead)  |
| Repository etiquette (branch naming, PR conventions) | Information that changes frequently                |
| Architectural decisions specific to your project     | Long explanations or tutorials                     |
| Developer environment quirks (required env vars)     | File-by-file descriptions of the codebase          |
| Common gotchas or non-obvious behaviors              | Self-evident practices like "write clean code"     |

If Claude keeps doing something you don't want despite having a rule against it, the file is probably too long and the rule is getting lost. If Claude asks you questions that are answered in CLAUDE.md, the phrasing might be ambiguous. Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts.

You can tune instructions by adding emphasis (e.g., "IMPORTANT" or "YOU MUST") to improve adherence. Check CLAUDE.md into git so your team can contribute. The file compounds in value over time.

CLAUDE.md files can import additional files using `@path/to/import` syntax:

```markdown CLAUDE.md theme={null}
See @README.md for project overview and @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

You can place CLAUDE.md files in several locations:

* **Home folder (`~/.claude/CLAUDE.md`)**: applies to all Claude sessions
* **Project root (`./CLAUDE.md`)**: check into git to share with your team, or name it `CLAUDE.local.md` and `.gitignore` it
* **Parent directories**: useful for monorepos where both `root/CLAUDE.md` and `root/foo/CLAUDE.md` are pulled in automatically
* **Child directories**: Claude pulls in child CLAUDE.md files on demand when working with files in those directories

### Configure permissions

<Tip>
  Use `/permissions` to allowlist safe commands or `/sandbox` for OS-level isolation. This reduces interruptions while keeping you in control.
</Tip>

By default, Claude Code requests permission for actions that might modify your system: file writes, Bash commands, MCP tools, etc. This is safe but tedious. After the tenth approval you're not really reviewing anymore, you're just clicking through. There are two ways to reduce these interruptions:

* **Permission allowlists**: permit specific tools you know are safe (like `npm run lint` or `git commit`)
* **Sandboxing**: enable OS-level isolation that restricts filesystem and network access, allowing Claude to work more freely within defined boundaries

Alternatively, use `--dangerously-skip-permissions` to bypass all permission checks for contained workflows like fixing lint errors or generating boilerplate.

<Warning>
  Letting Claude run arbitrary commands can result in data loss, system corruption, or data exfiltration via prompt injection. Only use `--dangerously-skip-permissions` in a sandbox without internet access.
</Warning>

Read more about [configuring permissions](/en/permissions) and [enabling sandboxing](/en/sandboxing).

### Use CLI tools

<Tip>
  Tell Claude Code to use CLI tools like `gh`, `aws`, `gcloud`, and `sentry-cli` when interacting with external services.
</Tip>

CLI tools are the most context-efficient way to interact with external services. If you use GitHub, install the `gh` CLI. Claude knows how to use it for creating issues, opening pull requests, and reading comments. Without `gh`, Claude can still use the GitHub API, but unauthenticated requests often hit rate limits.

Claude is also effective at learning CLI tools it doesn't already know. Try prompts like `Use 'foo-cli-tool --help' to learn about foo tool, then use it to solve A, B, C.`

### Connect MCP servers

<Tip>
  Run `claude mcp add` to connect external tools like Notion, Figma, or your database.
</Tip>

With [MCP servers](/en/mcp), you can ask Claude to implement features from issue trackers, query databases, analyze monitoring data, integrate designs from Figma, and automate workflows.

### Set up hooks

<Tip>
  Use hooks for actions that must happen every time with zero exceptions.
</Tip>

[Hooks](/en/hooks-guide) run scripts automatically at specific points in Claude's workflow. Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens.

Claude can write hooks for you. Try prompts like *"Write a hook that runs eslint after every file edit"* or *"Write a hook that blocks writes to the migrations folder."* Run `/hooks` for interactive configuration, or edit `.claude/settings.json` directly.

### Create skills

<Tip>
  Create `SKILL.md` files in `.claude/skills/` to give Claude domain knowledge and reusable workflows.
</Tip>

[Skills](/en/skills) extend Claude's knowledge with information specific to your project, team, or domain. Claude applies them automatically when relevant, or you can invoke them directly with `/skill-name`.

Create a skill by adding a directory with a `SKILL.md` to `.claude/skills/`:

```markdown .claude/skills/api-conventions/SKILL.md theme={null}
---
name: api-conventions
description: REST API design conventions for our services
---
# API Conventions
- Use kebab-case for URL paths
- Use camelCase for JSON properties
- Always include pagination for list endpoints
- Version APIs in the URL path (/v1/, /v2/)
```

Skills can also define repeatable workflows you invoke directly:

```markdown .claude/skills/fix-issue/SKILL.md theme={null}
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Analyze and fix the GitHub issue: $ARGUMENTS.

1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR
```

Run `/fix-issue 1234` to invoke it. Use `disable-model-invocation: true` for workflows with side effects that you want to trigger manually.

### Create custom subagents

<Tip>
  Define specialized assistants in `.claude/agents/` that Claude can delegate to for isolated tasks.
</Tip>

[Subagents](/en/sub-agents) run in their own context with their own set of allowed tools. They're useful for tasks that read many files or need specialized focus without cluttering your main conversation.

```markdown .claude/agents/security-reviewer.md theme={null}
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---
You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling

Provide specific line references and suggested fixes.
```

Tell Claude to use subagents explicitly: *"Use a subagent to review this code for security issues."*

### Install plugins

<Tip>
  Run `/plugin` to browse the marketplace. Plugins add skills, tools, and integrations without configuration.
</Tip>

[Plugins](/en/plugins) bundle skills, hooks, subagents, and MCP servers into a single installable unit from the community and Anthropic. If you work with a typed language, install a [code intelligence plugin](/en/discover-plugins#code-intelligence) to give Claude precise symbol navigation and automatic error detection after edits.

For guidance on choosing between skills, subagents, hooks, and MCP, see [Extend Claude Code](/en/features-overview#match-features-to-your-goal).

***

## Communicate effectively

The way you communicate with Claude Code significantly impacts the quality of results.

### Ask codebase questions

<Tip>
  Ask Claude questions you'd ask a senior engineer.
</Tip>

When onboarding to a new codebase, use Claude Code for learning and exploration. You can ask Claude the same sorts of questions you would ask another engineer:

* How does logging work?
* How do I make a new API endpoint?
* What does `async move { ... }` do on line 134 of `foo.rs`?
* What edge cases does `CustomerOnboardingFlowImpl` handle?
* Why does this code call `foo()` instead of `bar()` on line 333?

Using Claude Code this way is an effective onboarding workflow, improving ramp-up time and reducing load on other engineers. No special prompting required: ask questions directly.

### Let Claude interview you

<Tip>
  For larger features, have Claude interview you first. Start with a minimal prompt and ask Claude to interview you using the `AskUserQuestion` tool.
</Tip>

Claude asks about things you might not have considered yet, including technical implementation, UI/UX, edge cases, and tradeoffs.

```text  theme={null}
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.

Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious questions, dig into the hard parts I might not have considered.

Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```

Once the spec is complete, start a fresh session to execute it. The new session has clean context focused entirely on implementation, and you have a written spec to reference.

***

## Manage your session

Conversations are persistent and reversible. Use this to your advantage!

### Course-correct early and often

<Tip>
  Correct Claude as soon as you notice it going off track.
</Tip>

The best results come from tight feedback loops. Though Claude occasionally solves problems perfectly on the first attempt, correcting it quickly generally produces better solutions faster.

* **`Esc`**: stop Claude mid-action with the `Esc` key. Context is preserved, so you can redirect.
* **`Esc + Esc` or `/rewind`**: press `Esc` twice or run `/rewind` to open the rewind menu and restore previous conversation and code state, or summarize from a selected message.
* **`"Undo that"`**: have Claude revert its changes.
* **`/clear`**: reset context between unrelated tasks. Long sessions with irrelevant context can reduce performance.

If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches. Run `/clear` and start fresh with a more specific prompt that incorporates what you learned. A clean session with a better prompt almost always outperforms a long session with accumulated corrections.

### Manage context aggressively

<Tip>
  Run `/clear` between unrelated tasks to reset context.
</Tip>

Claude Code automatically compacts conversation history when you approach context limits, which preserves important code and decisions while freeing space.

During long sessions, Claude's context window can fill with irrelevant conversation, file contents, and commands. This can reduce performance and sometimes distract Claude.

* Use `/clear` frequently between tasks to reset the context window entirely
* When auto compaction triggers, Claude summarizes what matters most, including code patterns, file states, and key decisions
* For more control, run `/compact <instructions>`, like `/compact Focus on the API changes`
* To compact only part of the conversation, use `Esc + Esc` or `/rewind`, select a message checkpoint, and choose **Summarize from here**. This condenses messages from that point forward while keeping earlier context intact.
* Customize compaction behavior in CLAUDE.md with instructions like `"When compacting, always preserve the full list of modified files and any test commands"` to ensure critical context survives summarization

### Use subagents for investigation

<Tip>
  Delegate research with `"use subagents to investigate X"`. They explore in a separate context, keeping your main conversation clean for implementation.
</Tip>

Since context is your fundamental constraint, subagents are one of the most powerful tools available. When Claude researches a codebase it reads lots of files, all of which consume your context. Subagents run in separate context windows and report back summaries:

```text  theme={null}
Use subagents to investigate how our authentication system handles token
refresh, and whether we have any existing OAuth utilities I should reuse.
```

The subagent explores the codebase, reads relevant files, and reports back with findings, all without cluttering your main conversation.

You can also use subagents for verification after Claude implements something:

```text  theme={null}
use a subagent to review this code for edge cases
```

### Rewind with checkpoints

<Tip>
  Every action Claude makes creates a checkpoint. You can restore conversation, code, or both to any previous checkpoint.
</Tip>

Claude automatically checkpoints before changes. Double-tap `Escape` or run `/rewind` to open the rewind menu. You can restore conversation only, restore code only, restore both, or summarize from a selected message. See [Checkpointing](/en/checkpointing) for details.

Instead of carefully planning every move, you can tell Claude to try something risky. If it doesn't work, rewind and try a different approach. Checkpoints persist across sessions, so you can close your terminal and still rewind later.

<Warning>
  Checkpoints only track changes made *by Claude*, not external processes. This isn't a replacement for git.
</Warning>

### Resume conversations

<Tip>
  Run `claude --continue` to pick up where you left off, or `--resume` to choose from recent sessions.
</Tip>

Claude Code saves conversations locally. When a task spans multiple sessions, you don't have to re-explain the context:

```bash  theme={null}
claude --continue    # Resume the most recent conversation
claude --resume      # Select from recent conversations
```

Use `/rename` to give sessions descriptive names like `"oauth-migration"` or `"debugging-memory-leak"` so you can find them later. Treat sessions like branches: different workstreams can have separate, persistent contexts.

***

## Automate and scale

Once you're effective with one Claude, multiply your output with parallel sessions, non-interactive mode, and fan-out patterns.

Everything so far assumes one human, one Claude, and one conversation. But Claude Code scales horizontally. The techniques in this section show how you can get more done.

### Run non-interactive mode

<Tip>
  Use `claude -p "prompt"` in CI, pre-commit hooks, or scripts. Add `--output-format stream-json` for streaming JSON output.
</Tip>

With `claude -p "your prompt"`, you can run Claude non-interactively, without a session. Non-interactive mode is how you integrate Claude into CI pipelines, pre-commit hooks, or any automated workflow. The output formats let you parse results programmatically: plain text, JSON, or streaming JSON.

```bash  theme={null}
# One-off queries
claude -p "Explain what this project does"

# Structured output for scripts
claude -p "List all API endpoints" --output-format json

# Streaming for real-time processing
claude -p "Analyze this log file" --output-format stream-json
```

### Run multiple Claude sessions

<Tip>
  Run multiple Claude sessions in parallel to speed up development, run isolated experiments, or start complex workflows.
</Tip>

There are three main ways to run parallel sessions:

* [Claude Code desktop app](/en/desktop#work-in-parallel-with-sessions): Manage multiple local sessions visually. Each session gets its own isolated worktree.
* [Claude Code on the web](/en/claude-code-on-the-web): Run on Anthropic's secure cloud infrastructure in isolated VMs.
* [Agent teams](/en/agent-teams): Automated coordination of multiple sessions with shared tasks, messaging, and a team lead.

Beyond parallelizing work, multiple sessions enable quality-focused workflows. A fresh context improves code review since Claude won't be biased toward code it just wrote.

For example, use a Writer/Reviewer pattern:

| Session A (Writer)                                                      | Session B (Reviewer)                                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Implement a rate limiter for our API endpoints`                        |                                                                                                                                                                          |
|                                                                         | `Review the rate limiter implementation in @src/middleware/rateLimiter.ts. Look for edge cases, race conditions, and consistency with our existing middleware patterns.` |
| `Here's the review feedback: [Session B output]. Address these issues.` |                                                                                                                                                                          |

You can do something similar with tests: have one Claude write tests, then another write code to pass them.

### Fan out across files

<Tip>
  Loop through tasks calling `claude -p` for each. Use `--allowedTools` to scope permissions for batch operations.
</Tip>

For large migrations or analyses, you can distribute work across many parallel Claude invocations:

<Steps>
  <Step title="Generate a task list">
    Have Claude list all files that need migrating (e.g., `list all 2,000 Python files that need migrating`)
  </Step>

  <Step title="Write a script to loop through the list">
    ```bash  theme={null}
    for file in $(cat files.txt); do
      claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
        --allowedTools "Edit,Bash(git commit *)"
    done
    ```
  </Step>

  <Step title="Test on a few files, then run at scale">
    Refine your prompt based on what goes wrong with the first 2-3 files, then run on the full set. The `--allowedTools` flag restricts what Claude can do, which matters when you're running unattended.
  </Step>
</Steps>

You can also integrate Claude into existing data/processing pipelines:

```bash  theme={null}
claude -p "<your prompt>" --output-format json | your_command
```

Use `--verbose` for debugging during development, and turn it off in production.

### Safe autonomous mode

Use `claude --dangerously-skip-permissions` to bypass all permission checks and let Claude work uninterrupted. This works well for workflows like fixing lint errors or generating boilerplate code.

<Warning>
  Letting Claude run arbitrary commands is risky and can result in data loss, system corruption, or data exfiltration (e.g., via prompt injection attacks). To minimize these risks, use `--dangerously-skip-permissions` in a container without internet access.

  With sandboxing enabled (`/sandbox`), you get similar autonomy with better security. Sandbox defines upfront boundaries rather than bypassing all checks.
</Warning>

***

## Avoid common failure patterns

These are common mistakes. Recognizing them early saves time:

* **The kitchen sink session.** You start with one task, then ask Claude something unrelated, then go back to the first task. Context is full of irrelevant information.
  > **Fix**: `/clear` between unrelated tasks.
* **Correcting over and over.** Claude does something wrong, you correct it, it's still wrong, you correct again. Context is polluted with failed approaches.
  > **Fix**: After two failed corrections, `/clear` and write a better initial prompt incorporating what you learned.
* **The over-specified CLAUDE.md.** If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise.
  > **Fix**: Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook.
* **The trust-then-verify gap.** Claude produces a plausible-looking implementation that doesn't handle edge cases.
  > **Fix**: Always provide verification (tests, scripts, screenshots). If you can't verify it, don't ship it.
* **The infinite exploration.** You ask Claude to "investigate" something without scoping it. Claude reads hundreds of files, filling the context.
  > **Fix**: Scope investigations narrowly or use subagents so the exploration doesn't consume your main context.

***

## Develop your intuition

The patterns in this guide aren't set in stone. They're starting points that work well in general, but might not be optimal for every situation.

Sometimes you *should* let context accumulate because you're deep in one complex problem and the history is valuable. Sometimes you should skip planning and let Claude figure it out because the task is exploratory. Sometimes a vague prompt is exactly right because you want to see how Claude interprets the problem before constraining it.

Pay attention to what works. When Claude produces great output, notice what you did: the prompt structure, the context you provided, the mode you were in. When Claude struggles, ask why. Was the context too noisy? The prompt too vague? The task too big for one pass?

Over time, you'll develop intuition that no guide can capture. You'll know when to be specific and when to be open-ended, when to plan and when to explore, when to clear context and when to let it accumulate.

## Related resources

* [How Claude Code works](/en/how-claude-code-works): the agentic loop, tools, and context management
* [Extend Claude Code](/en/features-overview): skills, hooks, MCP, subagents, and plugins
* [Common workflows](/en/common-workflows): step-by-step recipes for debugging, testing, PRs, and more
* [CLAUDE.md](/en/memory): store project conventions and persistent context
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Continue local sessions from any device with Remote Control

> Continue a local Claude Code session from your phone, tablet, or any browser using Remote Control. Works with claude.ai/code and the Claude mobile app.

<Note>
  Remote Control is available as a research preview on Max and Pro plans. It is not available on Team or Enterprise plans.
</Note>

Remote Control connects [claude.ai/code](https://claude.ai/code) or the Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) and [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) to a Claude Code session running on your machine. Start a task at your desk, then pick it up from your phone on the couch or a browser on another computer.

When you start a Remote Control session on your machine, Claude keeps running locally the entire time, so nothing moves to the cloud. With Remote Control you can:

* **Use your full local environment remotely**: your filesystem, [MCP servers](/en/mcp), tools, and project configuration all stay available
* **Work from both surfaces at once**: the conversation stays in sync across all connected devices, so you can send messages from your terminal, browser, and phone interchangeably
* **Survive interruptions**: if your laptop sleeps or your network drops, the session reconnects automatically when your machine comes back online

Unlike [Claude Code on the web](/en/claude-code-on-the-web), which runs on cloud infrastructure, Remote Control sessions run directly on your machine and interact with your local filesystem. The web and mobile interfaces are just a window into that local session.

This page covers setup, how to start and connect to sessions, and how Remote Control compares to Claude Code on the web.

## Requirements

Before using Remote Control, confirm that your environment meets these conditions:

* **Subscription**: requires a Max plan. Pro plan support is coming soon. API keys are not supported.
* **Authentication**: run `claude` and use `/login` to sign in through claude.ai if you haven't already.
* **Workspace trust**: run `claude` in your project directory at least once to accept the workspace trust dialog.

## Start a Remote Control session

You can start a new session directly in Remote Control, or connect a session that's already running.

<Tabs>
  <Tab title="New session">
    Navigate to your project directory and run:

    ```bash  theme={null}
    claude remote-control
    ```

    The process stays running in your terminal, waiting for remote connections. It displays a session URL you can use to [connect from another device](#connect-from-another-device), and you can press spacebar to show a QR code for quick access from your phone. While a remote session is active, the terminal shows connection status and tool activity.

    This command supports the following flags:

    * **`--name "My Project"`**: set a custom session title visible in the session list at claude.ai/code. You can also pass the name as a positional argument: `claude remote-control "My Project"`
    * **`--verbose`**: show detailed connection and session logs
    * **`--sandbox`** / **`--no-sandbox`**: enable or disable [sandboxing](/en/sandboxing) for filesystem and network isolation during the session. Sandboxing is off by default.
  </Tab>

  <Tab title="From an existing session">
    If you're already in a Claude Code session and want to continue it remotely, use the `/remote-control` (or `/rc`) command:

    ```
    /remote-control
    ```

    Pass a name as an argument to set a custom session title:

    ```
    /remote-control My Project
    ```

    This starts a Remote Control session that carries over your current conversation history and displays a session URL and QR code you can use to [connect from another device](#connect-from-another-device). The `--verbose`, `--sandbox`, and `--no-sandbox` flags are not available with this command.
  </Tab>
</Tabs>

### Connect from another device

Once a Remote Control session is active, you have a few ways to connect from another device:

* **Open the session URL** in any browser to go directly to the session on [claude.ai/code](https://claude.ai/code). Both `claude remote-control` and `/remote-control` display this URL in the terminal.
* **Scan the QR code** shown alongside the session URL to open it directly in the Claude app. With `claude remote-control`, press spacebar to toggle the QR code display.
* **Open [claude.ai/code](https://claude.ai/code) or the Claude app** and find the session by name in the session list. Remote Control sessions show a computer icon with a green status dot when online.

The remote session takes its name from the `--name` argument (or the name passed to `/remote-control`), your last message, your `/rename` value, or "Remote Control session" if there's no conversation history. If the environment already has an active session, you'll be asked whether to continue it or start a new one.

If you don't have the Claude app yet, use the `/mobile` command inside Claude Code to display a download QR code for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) or [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude).

### Enable Remote Control for all sessions

By default, Remote Control only activates when you explicitly run `claude remote-control` or `/remote-control`. To enable it automatically for every session, run `/config` inside Claude Code and set **Enable Remote Control for all sessions** to `true`. Set it back to `false` to disable.

Each Claude Code instance supports one remote session at a time. If you run multiple instances, each one gets its own environment and session.

## Connection and security

Your local Claude Code session makes outbound HTTPS requests only and never opens inbound ports on your machine. When you start Remote Control, it registers with the Anthropic API and polls for work. When you connect from another device, the server routes messages between the web or mobile client and your local session over a streaming connection.

All traffic travels through the Anthropic API over TLS, the same transport security as any Claude Code session. The connection uses multiple short-lived credentials, each scoped to a single purpose and expiring independently.

## Remote Control vs Claude Code on the web

Remote Control and [Claude Code on the web](/en/claude-code-on-the-web) both use the claude.ai/code interface. The key difference is where the session runs: Remote Control executes on your machine, so your local MCP servers, tools, and project configuration stay available. Claude Code on the web executes in Anthropic-managed cloud infrastructure.

Use Remote Control when you're in the middle of local work and want to keep going from another device. Use Claude Code on the web when you want to kick off a task without any local setup, work on a repo you don't have cloned, or run multiple tasks in parallel.

## Limitations

* **One remote session at a time**: each Claude Code session supports one remote connection.
* **Terminal must stay open**: Remote Control runs as a local process. If you close the terminal or stop the `claude` process, the session ends. Run `claude remote-control` again to start a new one.
* **Extended network outage**: if your machine is awake but unable to reach the network for more than roughly 10 minutes, the session times out and the process exits. Run `claude remote-control` again to start a new session.

## Related resources

* [Claude Code on the web](/en/claude-code-on-the-web): run sessions in Anthropic-managed cloud environments instead of on your machine
* [Authentication](/en/authentication): set up `/login` and manage credentials for claude.ai
* [CLI reference](/en/cli-reference): full list of flags and commands including `claude remote-control`
* [Security](/en/security): how Remote Control sessions fit into the Claude Code security model
* [Data usage](/en/data-usage): what data flows through the Anthropic API during local and remote sessions
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Claude Code on the web

> Run Claude Code tasks asynchronously on secure cloud infrastructure

<Note>
  Claude Code on the web is currently in research preview.
</Note>

## What is Claude Code on the web?

Claude Code on the web lets developers kick off Claude Code from the Claude app. This is perfect for:

* **Answering questions**: Ask about code architecture and how features are implemented
* **Bug fixes and routine tasks**: Well-defined tasks that don't require frequent steering
* **Parallel work**: Tackle multiple bug fixes in parallel
* **Repositories not on your local machine**: Work on code you don't have checked out locally
* **Backend changes**: Where Claude Code can write tests and then write code to pass those tests

Claude Code is also available on the Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) and [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) for kicking off tasks on the go and monitoring work in progress.

You can [kick off new tasks on the web from your terminal](#from-terminal-to-web) with `--remote`, or [teleport web sessions back to your terminal](#from-web-to-terminal) to continue locally. To use the web interface while running Claude Code on your own machine instead of cloud infrastructure, see [Remote Control](/en/remote-control).

## Who can use Claude Code on the web?

Claude Code on the web is available in research preview to:

* **Pro users**
* **Max users**
* **Team users**
* **Enterprise users** with premium seats or Chat + Claude Code seats

## Getting started

1. Visit [claude.ai/code](https://claude.ai/code)
2. Connect your GitHub account
3. Install the Claude GitHub app in your repositories
4. Select your default environment
5. Submit your coding task
6. Review changes in diff view, iterate with comments, then create a pull request

## How it works

When you start a task on Claude Code on the web:

1. **Repository cloning**: Your repository is cloned to an Anthropic-managed virtual machine
2. **Environment setup**: Claude prepares a secure cloud environment with your code
3. **Network configuration**: Internet access is configured based on your settings
4. **Task execution**: Claude analyzes code, makes changes, runs tests, and checks its work
5. **Completion**: You're notified when finished and can create a PR with the changes
6. **Results**: Changes are pushed to a branch, ready for pull request creation

## Review changes with diff view

Diff view lets you see exactly what Claude changed before creating a pull request. Instead of clicking "Create PR" to review changes in GitHub, view the diff directly in the app and iterate with Claude until the changes are ready.

When Claude makes changes to files, a diff stats indicator appears showing the number of lines added and removed (for example, `+12 -1`). Select this indicator to open the diff viewer, which displays a file list on the left and the changes for each file on the right.

From the diff view, you can:

* Review changes file by file
* Comment on specific changes to request modifications
* Continue iterating with Claude based on what you see

This lets you refine changes through multiple rounds of feedback without creating draft PRs or switching to GitHub.

## Moving tasks between web and terminal

You can start new tasks on the web from your terminal, or pull web sessions into your terminal to continue locally. Web sessions persist even if you close your laptop, and you can monitor them from anywhere including the Claude mobile app.

<Note>
  Session handoff is one-way: you can pull web sessions into your terminal, but you can't push an existing terminal session to the web. The `--remote` flag creates a *new* web session for your current repository.
</Note>

### From terminal to web

Start a web session from the command line with the `--remote` flag:

```bash  theme={null}
claude --remote "Fix the authentication bug in src/auth/login.ts"
```

This creates a new web session on claude.ai. The task runs in the cloud while you continue working locally. Use `/tasks` to check progress, or open the session on claude.ai or the Claude mobile app to interact directly. From there you can steer Claude, provide feedback, or answer questions just like any other conversation.

#### Tips for remote tasks

**Plan locally, execute remotely**: For complex tasks, start Claude in plan mode to collaborate on the approach, then send work to the web:

```bash  theme={null}
claude --permission-mode plan
```

In plan mode, Claude can only read files and explore the codebase. Once you're satisfied with the plan, start a remote session for autonomous execution:

```bash  theme={null}
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

This pattern gives you control over the strategy while letting Claude execute autonomously in the cloud.

**Run tasks in parallel**: Each `--remote` command creates its own web session that runs independently. You can kick off multiple tasks and they'll all run simultaneously in separate sessions:

```bash  theme={null}
claude --remote "Fix the flaky test in auth.spec.ts"
claude --remote "Update the API documentation"
claude --remote "Refactor the logger to use structured output"
```

Monitor all sessions with `/tasks`. When a session completes, you can create a PR from the web interface or [teleport](#from-web-to-terminal) the session to your terminal to continue working.

### From web to terminal

There are several ways to pull a web session into your terminal:

* **Using `/teleport`**: From within Claude Code, run `/teleport` (or `/tp`) to see an interactive picker of your web sessions. If you have uncommitted changes, you'll be prompted to stash them first.
* **Using `--teleport`**: From the command line, run `claude --teleport` for an interactive session picker, or `claude --teleport <session-id>` to resume a specific session directly.
* **From `/tasks`**: Run `/tasks` to see your background sessions, then press `t` to teleport into one
* **From the web interface**: Click "Open in CLI" to copy a command you can paste into your terminal

When you teleport a session, Claude verifies you're in the correct repository, fetches and checks out the branch from the remote session, and loads the full conversation history into your terminal.

#### Requirements for teleporting

Teleport checks these requirements before resuming a session. If any requirement isn't met, you'll see an error or be prompted to resolve the issue.

| Requirement        | Details                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Clean git state    | Your working directory must have no uncommitted changes. Teleport prompts you to stash changes if needed.              |
| Correct repository | You must run `--teleport` from a checkout of the same repository, not a fork.                                          |
| Branch available   | The branch from the web session must have been pushed to the remote. Teleport automatically fetches and checks it out. |
| Same account       | You must be authenticated to the same Claude.ai account used in the web session.                                       |

### Sharing sessions

To share a session, toggle its visibility according to the account
types below. After that, share the session link as-is. Recipients who open your
shared session will see the latest state of the session upon load, but the
recipient's page will not update in real time.

#### Sharing from an Enterprise or Teams account

For Enterprise and Teams accounts, the two visibility options are **Private**
and **Team**. Team visibility makes the session visible to other members of your
Claude.ai organization. Repository access verification is enabled by default,
based on the GitHub account connected to the recipient's account. Your account's
display name is visible to all recipients with access. [Claude in Slack](/en/slack)
sessions are automatically shared with Team visibility.

#### Sharing from a Max or Pro account

For Max and Pro accounts, the two visibility options are **Private**
and **Public**. Public visibility makes the session visible to any user logged
into claude.ai.

Check your session for sensitive content before sharing. Sessions may contain
code and credentials from private GitHub repositories. Repository access
verification is not enabled by default.

Enable repository access verification and/or withhold your name from your shared
sessions by going to Settings > Claude Code > Sharing settings.

## Managing sessions

### Archiving sessions

You can archive sessions to keep your session list organized. Archived sessions are hidden from the default session list but can be viewed by filtering for archived sessions.

To archive a session, hover over the session in the sidebar and click the archive icon.

### Deleting sessions

Deleting a session permanently removes the session and its data. This action cannot be undone. You can delete a session in two ways:

* **From the sidebar**: Filter for archived sessions, then hover over the session you want to delete and click the delete icon
* **From the session menu**: Open a session, click the dropdown next to the session title, and select **Delete**

You will be asked to confirm before a session is deleted.

## Cloud environment

### Default image

We build and maintain a universal image with common toolchains and language ecosystems pre-installed. This image includes:

* Popular programming languages and runtimes
* Common build tools and package managers
* Testing frameworks and linters

#### Checking available tools

To see what's pre-installed in your environment, ask Claude Code to run:

```bash  theme={null}
check-tools
```

This command displays:

* Programming languages and their versions
* Available package managers
* Installed development tools

#### Language-specific setups

The universal image includes pre-configured environments for:

* **Python**: Python 3.x with pip, poetry, and common scientific libraries
* **Node.js**: Latest LTS versions with npm, yarn, pnpm, and bun
* **Ruby**: Versions 3.1.6, 3.2.6, 3.3.6 (default: 3.3.6) with gem, bundler, and rbenv for version management
* **PHP**: Version 8.4.14
* **Java**: OpenJDK with Maven and Gradle
* **Go**: Latest stable version with module support
* **Rust**: Rust toolchain with cargo
* **C++**: GCC and Clang compilers

#### Databases

The universal image includes the following databases:

* **PostgreSQL**: Version 16
* **Redis**: Version 7.0

### Environment configuration

When you start a session in Claude Code on the web, here's what happens under the hood:

1. **Environment preparation**: We clone your repository and run any configured Claude hooks for initialization. The repo will be cloned with the default branch on your GitHub repo. If you would like to check out a specific branch, you can specify that in the prompt.

2. **Network configuration**: We configure internet access for the agent. Internet access is limited by default, but you can configure the environment to have no internet or full internet access based on your needs.

3. **Claude Code execution**: Claude Code runs to complete your task, writing code, running tests, and checking its work. You can guide and steer Claude throughout the session via the web interface. Claude respects context you've defined in your `CLAUDE.md`.

4. **Outcome**: When Claude completes its work, it will push the branch to remote. You will be able to create a PR for the branch.

<Note>
  Claude operates entirely through the terminal and CLI tools available in the environment. It uses the pre-installed tools in the universal image and any additional tools you install through hooks or dependency management.
</Note>

**To add a new environment:** Select the current environment to open the environment selector, and then select "Add environment". This will open a dialog where you can specify the environment name, network access level, and any environment variables you want to set.

**To update an existing environment:** Select the current environment, to the right of the environment name, and select the settings button. This will open a dialog where you can update the environment name, network access, and environment variables.

**To select your default environment from the terminal:** If you have multiple environments configured, run `/remote-env` to choose which one to use when starting web sessions from your terminal with `--remote`. With a single environment, this command shows your current configuration.

<Note>
  Environment variables must be specified as key-value pairs, in [`.env` format](https://www.dotenv.org/). For example:

  ```text  theme={null}
  API_KEY=your_api_key
  DEBUG=true
  ```
</Note>

### Dependency management

Custom environment images and snapshots are not yet supported. As a workaround, you can use [SessionStart hooks](/en/hooks#sessionstart) to install packages when a session starts. This approach has [known limitations](#dependency-management-limitations).

To configure automatic dependency installation, add a SessionStart hook to your repository's `.claude/settings.json` file:

```json  theme={null}
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/install_pkgs.sh"
          }
        ]
      }
    ]
  }
}
```

Create the corresponding script at `scripts/install_pkgs.sh`:

```bash  theme={null}
#!/bin/bash

# Only run in remote environments
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

npm install
pip install -r requirements.txt
exit 0
```

Make it executable: `chmod +x scripts/install_pkgs.sh`

#### Persist environment variables

SessionStart hooks can persist environment variables for subsequent Bash commands by writing to the file specified in the `CLAUDE_ENV_FILE` environment variable. For details, see [SessionStart hooks](/en/hooks#sessionstart) in the hooks reference.

#### Dependency management limitations

* **Hooks fire for all sessions**: SessionStart hooks run in both local and remote environments. There is no hook configuration to scope a hook to remote sessions only. To skip local execution, check the `CLAUDE_CODE_REMOTE` environment variable in your script as shown above.
* **Requires network access**: Install commands need network access to reach package registries. If your environment is configured with "No internet" access, these hooks will fail. Use "Limited" (the default) or "Full" network access. The [default allowlist](#default-allowed-domains) includes common registries like npm, PyPI, RubyGems, and crates.io.
* **Proxy compatibility**: All outbound traffic in remote environments passes through a [security proxy](#security-proxy). Some package managers do not work correctly with this proxy. Bun is a known example.
* **Runs on every session start**: Hooks run each time a session starts or resumes, adding startup latency. Keep install scripts fast by checking whether dependencies are already present before reinstalling.

## Network access and security

### Network policy

#### GitHub proxy

For security, all GitHub operations go through a dedicated proxy service that transparently handles all git interactions. Inside the sandbox, the git client authenticates using a custom-built scoped credential. This proxy:

* Manages GitHub authentication securely - the git client uses a scoped credential inside the sandbox, which the proxy verifies and translates to your actual GitHub authentication token
* Restricts git push operations to the current working branch for safety
* Enables seamless cloning, fetching, and PR operations while maintaining security boundaries

#### Security proxy

Environments run behind an HTTP/HTTPS network proxy for security and abuse prevention purposes. All outbound internet traffic passes through this proxy, which provides:

* Protection against malicious requests
* Rate limiting and abuse prevention
* Content filtering for enhanced security

### Access levels

By default, network access is limited to [allowlisted domains](#default-allowed-domains).

You can configure custom network access, including disabling network access.

### Default allowed domains

When using "Limited" network access, the following domains are allowed by default:

#### Anthropic Services

* api.anthropic.com
* statsig.anthropic.com
* platform.claude.com
* code.claude.com
* claude.ai

#### Version Control

* github.com
* [www.github.com](http://www.github.com)
* api.github.com
* npm.pkg.github.com
* raw\.githubusercontent.com
* pkg-npm.githubusercontent.com
* objects.githubusercontent.com
* codeload.github.com
* avatars.githubusercontent.com
* camo.githubusercontent.com
* gist.github.com
* gitlab.com
* [www.gitlab.com](http://www.gitlab.com)
* registry.gitlab.com
* bitbucket.org
* [www.bitbucket.org](http://www.bitbucket.org)
* api.bitbucket.org

#### Container Registries

* registry-1.docker.io
* auth.docker.io
* index.docker.io
* hub.docker.com
* [www.docker.com](http://www.docker.com)
* production.cloudflare.docker.com
* download.docker.com
* gcr.io
* \*.gcr.io
* ghcr.io
* mcr.microsoft.com
* \*.data.mcr.microsoft.com
* public.ecr.aws

#### Cloud Platforms

* cloud.google.com
* accounts.google.com
* gcloud.google.com
* \*.googleapis.com
* storage.googleapis.com
* compute.googleapis.com
* container.googleapis.com
* azure.com
* portal.azure.com
* microsoft.com
* [www.microsoft.com](http://www.microsoft.com)
* \*.microsoftonline.com
* packages.microsoft.com
* dotnet.microsoft.com
* dot.net
* visualstudio.com
* dev.azure.com
* \*.amazonaws.com
* \*.api.aws
* oracle.com
* [www.oracle.com](http://www.oracle.com)
* java.com
* [www.java.com](http://www.java.com)
* java.net
* [www.java.net](http://www.java.net)
* download.oracle.com
* yum.oracle.com

#### Package Managers - JavaScript/Node

* registry.npmjs.org
* [www.npmjs.com](http://www.npmjs.com)
* [www.npmjs.org](http://www.npmjs.org)
* npmjs.com
* npmjs.org
* yarnpkg.com
* registry.yarnpkg.com

#### Package Managers - Python

* pypi.org
* [www.pypi.org](http://www.pypi.org)
* files.pythonhosted.org
* pythonhosted.org
* test.pypi.org
* pypi.python.org
* pypa.io
* [www.pypa.io](http://www.pypa.io)

#### Package Managers - Ruby

* rubygems.org
* [www.rubygems.org](http://www.rubygems.org)
* api.rubygems.org
* index.rubygems.org
* ruby-lang.org
* [www.ruby-lang.org](http://www.ruby-lang.org)
* rubyforge.org
* [www.rubyforge.org](http://www.rubyforge.org)
* rubyonrails.org
* [www.rubyonrails.org](http://www.rubyonrails.org)
* rvm.io
* get.rvm.io

#### Package Managers - Rust

* crates.io
* [www.crates.io](http://www.crates.io)
* index.crates.io
* static.crates.io
* rustup.rs
* static.rust-lang.org
* [www.rust-lang.org](http://www.rust-lang.org)

#### Package Managers - Go

* proxy.golang.org
* sum.golang.org
* index.golang.org
* golang.org
* [www.golang.org](http://www.golang.org)
* goproxy.io
* pkg.go.dev

#### Package Managers - JVM

* maven.org
* repo.maven.org
* central.maven.org
* repo1.maven.org
* jcenter.bintray.com
* gradle.org
* [www.gradle.org](http://www.gradle.org)
* services.gradle.org
* plugins.gradle.org
* kotlin.org
* [www.kotlin.org](http://www.kotlin.org)
* spring.io
* repo.spring.io

#### Package Managers - Other Languages

* packagist.org (PHP Composer)
* [www.packagist.org](http://www.packagist.org)
* repo.packagist.org
* nuget.org (.NET NuGet)
* [www.nuget.org](http://www.nuget.org)
* api.nuget.org
* pub.dev (Dart/Flutter)
* api.pub.dev
* hex.pm (Elixir/Erlang)
* [www.hex.pm](http://www.hex.pm)
* cpan.org (Perl CPAN)
* [www.cpan.org](http://www.cpan.org)
* metacpan.org
* [www.metacpan.org](http://www.metacpan.org)
* api.metacpan.org
* cocoapods.org (iOS/macOS)
* [www.cocoapods.org](http://www.cocoapods.org)
* cdn.cocoapods.org
* haskell.org
* [www.haskell.org](http://www.haskell.org)
* hackage.haskell.org
* swift.org
* [www.swift.org](http://www.swift.org)

#### Linux Distributions

* archive.ubuntu.com
* security.ubuntu.com
* ubuntu.com
* [www.ubuntu.com](http://www.ubuntu.com)
* \*.ubuntu.com
* ppa.launchpad.net
* launchpad.net
* [www.launchpad.net](http://www.launchpad.net)

#### Development Tools & Platforms

* dl.k8s.io (Kubernetes)
* pkgs.k8s.io
* k8s.io
* [www.k8s.io](http://www.k8s.io)
* releases.hashicorp.com (HashiCorp)
* apt.releases.hashicorp.com
* rpm.releases.hashicorp.com
* archive.releases.hashicorp.com
* hashicorp.com
* [www.hashicorp.com](http://www.hashicorp.com)
* repo.anaconda.com (Anaconda/Conda)
* conda.anaconda.org
* anaconda.org
* [www.anaconda.com](http://www.anaconda.com)
* anaconda.com
* continuum.io
* apache.org (Apache)
* [www.apache.org](http://www.apache.org)
* archive.apache.org
* downloads.apache.org
* eclipse.org (Eclipse)
* [www.eclipse.org](http://www.eclipse.org)
* download.eclipse.org
* nodejs.org (Node.js)
* [www.nodejs.org](http://www.nodejs.org)

#### Cloud Services & Monitoring

* statsig.com
* [www.statsig.com](http://www.statsig.com)
* api.statsig.com
* sentry.io
* \*.sentry.io
* http-intake.logs.datadoghq.com
* \*.datadoghq.com
* \*.datadoghq.eu

#### Content Delivery & Mirrors

* sourceforge.net
* \*.sourceforge.net
* packagecloud.io
* \*.packagecloud.io

#### Schema & Configuration

* json-schema.org
* [www.json-schema.org](http://www.json-schema.org)
* json.schemastore.org
* [www.schemastore.org](http://www.schemastore.org)

#### Model Context Protocol

* \*.modelcontextprotocol.io

<Note>
  Domains marked with `*` indicate wildcard subdomain matching. For example, `*.gcr.io` allows access to any subdomain of `gcr.io`.
</Note>

### Security best practices for customized network access

1. **Principle of least privilege**: Only enable the minimum network access required
2. **Audit regularly**: Review allowed domains periodically
3. **Use HTTPS**: Always prefer HTTPS endpoints over HTTP

## Security and isolation

Claude Code on the web provides strong security guarantees:

* **Isolated virtual machines**: Each session runs in an isolated, Anthropic-managed VM
* **Network access controls**: Network access is limited by default, and can be disabled

<Note>
  When running with network access disabled, Claude Code is allowed to communicate with the Anthropic API which may still allow data to exit the isolated Claude Code VM.
</Note>

* **Credential protection**: Sensitive credentials (such as git credentials or signing keys) are never inside the sandbox with Claude Code. Authentication is handled through a secure proxy using scoped credentials
* **Secure analysis**: Code is analyzed and modified within isolated VMs before creating PRs

## Pricing and rate limits

Claude Code on the web shares rate limits with all other Claude and Claude Code usage within your account. Running multiple tasks in parallel will consume more rate limits proportionately.

## Limitations

* **Repository authentication**: You can only move sessions from web to local when you are authenticated to the same account
* **Platform restrictions**: Claude Code on the web only works with code hosted in GitHub. GitLab and other non-GitHub repositories cannot be used with cloud sessions

## Best practices

1. **Use Claude Code hooks**: Configure [SessionStart hooks](/en/hooks#sessionstart) to automate environment setup and dependency installation.
2. **Document requirements**: Clearly specify dependencies and commands in your `CLAUDE.md` file. If you have an `AGENTS.md` file, you can source it in your `CLAUDE.md` using `@AGENTS.md` to maintain a single source of truth.

## Related resources

* [Hooks configuration](/en/hooks)
* [Settings reference](/en/settings)
* [Security](/en/security)
* [Data usage](/en/data-usage)
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get started with the desktop app

> Install Claude Code on desktop and start your first coding session

The desktop app gives you Claude Code with a graphical interface: visual diff review, live app preview, GitHub PR monitoring with auto-merge, parallel sessions with Git worktree isolation, and the ability to run tasks remotely. No terminal required.

This page walks through installing the app and starting your first session. If you're already set up, see [Use Claude Code Desktop](/en/desktop) for the full reference.

<Frame>
  <img src="https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=9a36a7a27b9f4c6f2e1c83bdb34f69ce" className="block dark:hidden" alt="The Claude Code Desktop interface showing the Code tab selected, with a prompt box, permission mode selector set to Ask permissions, model picker, folder selector, and Local environment option" data-og-width="2500" width="2500" data-og-height="1376" height="1376" data-path="images/desktop-code-tab-light.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?w=280&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=b4d1408a312d3ff3ac96dd133e4ef32b 280w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?w=560&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=c2d9f668767d4de33696b3de190c0024 560w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?w=840&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=89a78335d513c0ec2131feb11eeef6dc 840w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?w=1100&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=0ef93540eafcedd2fb0ad718553325f4 1100w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?w=1650&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=e7923c583f632de9f8a7e0e0da4f8c84 1650w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-light.png?w=2500&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=38d64bdceaba941a73446f258be336ea 2500w" />

  <img src="https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=5463defe81c459fb9b1f91f6a958cfb8" className="hidden dark:block" alt="The Claude Code Desktop interface in dark mode showing the Code tab selected, with a prompt box, permission mode selector set to Ask permissions, model picker, folder selector, and Local environment option" data-og-width="2504" width="2504" data-og-height="1374" height="1374" data-path="images/desktop-code-tab-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?w=280&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=f2a6322688262feb9d680b99c24817ab 280w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?w=560&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=ffe9a3d1c4260fb12c66f533fdedc02e 560w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?w=840&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=867b7997a910af3ffac1101559564dd7 840w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?w=1100&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=976c9049c9e4cea2b02d4b6a1ef55142 1100w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?w=1650&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=d8f3792ddadf66f61306dc41680aaa34 1650w, https://mintcdn.com/claude-code/CNLUpFGiXoc9mhvD/images/desktop-code-tab-dark.png?w=2500&fit=max&auto=format&n=CNLUpFGiXoc9mhvD&q=85&s=88d049488f547e483e8c4f59ea8b2fd8 2500w" />
</Frame>

The desktop app has three tabs:

* **Chat**: General conversation with no file access, similar to claude.ai.
* **Cowork**: An autonomous background agent that works on tasks in a cloud VM with its own environment. It can run independently while you do other work.
* **Code**: An interactive coding assistant with direct access to your local files. You review and approve each change in real time.

Chat and Cowork are covered in the [Claude Desktop support articles](https://support.claude.com/en/collections/16163169-claude-desktop). This page focuses on the **Code** tab.

<Note>
  Claude Code requires a [Pro, Max, Teams, or Enterprise subscription](https://claude.com/pricing).
</Note>

## Install

<Steps>
  <Step title="Download the app">
    Download Claude for your platform.

    <CardGroup cols={2}>
      <Card title="macOS" icon="apple" href="https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code&utm_medium=docs">
        Universal build for Intel and Apple Silicon
      </Card>

      <Card title="Windows" icon="windows" href="https://claude.ai/api/desktop/win32/x64/exe/latest/redirect?utm_source=claude_code&utm_medium=docs">
        For x64 processors
      </Card>
    </CardGroup>

    For Windows ARM64, [download here](https://claude.ai/api/desktop/win32/arm64/exe/latest/redirect?utm_source=claude_code\&utm_medium=docs).

    Linux is not currently supported.
  </Step>

  <Step title="Sign in">
    Launch Claude from your Applications folder (macOS) or Start menu (Windows). Sign in with your Anthropic account.
  </Step>

  <Step title="Open the Code tab">
    Click the **Code** tab at the top center. If clicking Code prompts you to upgrade, you need to [subscribe to a paid plan](https://claude.com/pricing) first. If it prompts you to sign in online, complete the sign-in and restart the app. If you see a 403 error, see [authentication troubleshooting](/en/desktop#403-or-authentication-errors-in-the-code-tab).
  </Step>
</Steps>

The desktop app includes Claude Code. You don't need to install Node.js or the CLI separately. To use `claude` from the terminal, install the CLI separately. See [Get started with the CLI](/en/quickstart).

## Start your first session

With the Code tab open, choose a project and give Claude something to do.

<Steps>
  <Step title="Choose an environment and folder">
    Select **Local** to run Claude on your machine using your files directly. Click **Select folder** and choose your project directory.

    <Tip>
      Start with a small project you know well. It's the fastest way to see what Claude Code can do. On Windows, [Git](https://git-scm.com/downloads/win) must be installed for local sessions to work. Most Macs include Git by default.
    </Tip>

    You can also select:

    * **Remote**: Run sessions on Anthropic's cloud infrastructure that continue even if you close the app. Remote sessions use the same infrastructure as [Claude Code on the web](/en/claude-code-on-the-web).
    * **SSH**: Connect to a remote machine over SSH (your own servers, cloud VMs, or dev containers). Claude Code must be installed on the remote machine.
  </Step>

  <Step title="Choose a model">
    Select a model from the dropdown next to the send button. See [models](/en/model-config#available-models) for a comparison of Opus, Sonnet, and Haiku. You cannot change the model after the session starts.
  </Step>

  <Step title="Tell Claude what to do">
    Type what you want Claude to do:

    * `Find a TODO comment and fix it`
    * `Add tests for the main function`
    * `Create a CLAUDE.md with instructions for this codebase`

    A [session](/en/desktop#work-in-parallel-with-sessions) is a conversation with Claude about your code. Each session tracks its own context and changes, so you can work on multiple tasks without them interfering with each other.
  </Step>

  <Step title="Review and accept changes">
    By default, the Code tab starts in [Ask permissions mode](/en/desktop#choose-a-permission-mode), where Claude proposes changes and waits for your approval before applying them. You'll see:

    1. A [diff view](/en/desktop#review-changes-with-diff-view) showing exactly what will change in each file
    2. Accept/Reject buttons to approve or decline each change
    3. Real-time updates as Claude works through your request

    If you reject a change, Claude will ask how you'd like to proceed differently. Your files aren't modified until you accept.
  </Step>
</Steps>

## Now what?

You've made your first edit. For the full reference on everything Desktop can do, see [Use Claude Code Desktop](/en/desktop). Here are some things to try next.

**Interrupt and steer.** You can interrupt Claude at any point. If it's going down the wrong path, click the stop button or type your correction and press **Enter**. Claude stops what it's doing and adjusts based on your input. You don't have to wait for it to finish or start over.

**Give Claude more context.** Type `@filename` in the prompt box to pull a specific file into the conversation, attach images and PDFs using the attachment button, or drag and drop files directly into the prompt. The more context Claude has, the better the results. See [Add files and context](/en/desktop#add-files-and-context-to-prompts).

**Use skills for repeatable tasks.** Type `/` or click **+** → **Slash commands** to browse [built-in commands](/en/interactive-mode#built-in-commands), [custom skills](/en/skills), and plugin skills. Skills are reusable prompts you can invoke whenever you need them, like code review checklists or deployment steps.

**Review changes before committing.** After Claude edits files, a `+12 -1` indicator appears. Click it to open the [diff view](/en/desktop#review-changes-with-diff-view), review modifications file by file, and comment on specific lines. Claude reads your comments and revises. Click **Review code** to have Claude evaluate the diffs itself and leave inline suggestions.

**Adjust how much control you have.** Your [permission mode](/en/desktop#choose-a-permission-mode) controls the balance. Ask permissions (default) requires approval before every edit. Auto accept edits auto-accepts file edits for faster iteration. Plan mode lets Claude map out an approach without touching any files, which is useful before a large refactor.

**Add plugins for more capabilities.** Click the **+** button next to the prompt box and select **Plugins** to browse and install [plugins](/en/desktop#install-plugins) that add skills, agents, MCP servers, and more.

**Preview your app.** Click the **Preview** dropdown to run your dev server directly in the desktop. Claude can view the running app, test endpoints, inspect logs, and iterate on what it sees. See [Preview your app](/en/desktop#preview-your-app).

**Track your pull request.** After opening a PR, Claude Code monitors CI check results and can automatically fix failures or merge the PR once all checks pass. See [Monitor pull request status](/en/desktop#monitor-pull-request-status).

**Scale up when you're ready.** Open [parallel sessions](/en/desktop#work-in-parallel-with-sessions) from the sidebar to work on multiple tasks at once, each in its own Git worktree. Send [long-running work to the cloud](/en/desktop#run-long-running-tasks-remotely) so it continues even if you close the app, or [continue a session on the web or in your IDE](/en/desktop#continue-in-another-surface) if a task takes longer than expected. [Connect external tools](/en/desktop#extend-claude-code) like GitHub, Slack, and Linear to bring your workflow together.

## Coming from the CLI?

Desktop runs the same engine as the CLI with a graphical interface. You can run both simultaneously on the same project, and they share configuration (CLAUDE.md files, MCP servers, hooks, skills, and settings). For a full comparison of features, flag equivalents, and what's not available in Desktop, see [CLI comparison](/en/desktop#coming-from-the-cli).

## What's next

* [Use Claude Code Desktop](/en/desktop): permission modes, parallel sessions, diff view, connectors, and enterprise configuration
* [Troubleshooting](/en/desktop#troubleshooting): solutions to common errors and setup issues
* [Best practices](/en/best-practices): tips for writing effective prompts and getting the most out of Claude Code
* [Common workflows](/en/common-workflows): tutorials for debugging, refactoring, testing, and more
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Use Claude Code with Chrome (beta)

> Connect Claude Code to your Chrome browser to test web apps, debug with console logs, automate form filling, and extract data from web pages.

Claude Code integrates with the Claude in Chrome browser extension to give you browser automation capabilities from the CLI or the [VS Code extension](/en/vs-code#automate-browser-tasks-with-chrome). Build your code, then test and debug in the browser without switching contexts.

Claude opens new tabs for browser tasks and shares your browser's login state, so it can access any site you're already signed into. Browser actions run in a visible Chrome window in real time. When Claude encounters a login page or CAPTCHA, it pauses and asks you to handle it manually.

<Note>
  Chrome integration is in beta and currently works with Google Chrome and Microsoft Edge. It is not yet supported on Brave, Arc, or other Chromium-based browsers. WSL (Windows Subsystem for Linux) is also not supported.
</Note>

## Capabilities

With Chrome connected, you can chain browser actions with coding tasks in a single workflow:

* **Live debugging**: read console errors and DOM state directly, then fix the code that caused them
* **Design verification**: build a UI from a Figma mock, then open it in the browser to verify it matches
* **Web app testing**: test form validation, check for visual regressions, or verify user flows
* **Authenticated web apps**: interact with Google Docs, Gmail, Notion, or any app you're logged into without API connectors
* **Data extraction**: pull structured information from web pages and save it locally
* **Task automation**: automate repetitive browser tasks like data entry, form filling, or multi-site workflows
* **Session recording**: record browser interactions as GIFs to document or share what happened

## Prerequisites

Before using Claude Code with Chrome, you need:

* [Google Chrome](https://www.google.com/chrome/) or [Microsoft Edge](https://www.microsoft.com/edge) browser
* [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) version 1.0.36 or higher, available in the Chrome Web Store for both browsers
* [Claude Code](/en/quickstart#step-1-install-claude-code) version 2.0.73 or higher
* A direct Anthropic plan (Pro, Max, Teams, or Enterprise)

<Note>
  Chrome integration is not available through third-party providers like Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry. If you access Claude exclusively through a third-party provider, you need a separate claude.ai account to use this feature.
</Note>

## Get started in the CLI

<Steps>
  <Step title="Launch Claude Code with Chrome">
    Start Claude Code with the `--chrome` flag:

    ```bash  theme={null}
    claude --chrome
    ```

    You can also enable Chrome from within an existing session by running `/chrome`.
  </Step>

  <Step title="Ask Claude to use the browser">
    This example navigates to a page, interacts with it, and reports what it finds, all from your terminal or editor:

    ```text  theme={null}
    Go to code.claude.com/docs, click on the search box,
    type "hooks", and tell me what results appear
    ```
  </Step>
</Steps>

Run `/chrome` at any time to check the connection status, manage permissions, or reconnect the extension.

For VS Code, see [browser automation in VS Code](/en/vs-code#automate-browser-tasks-with-chrome).

### Enable Chrome by default

To avoid passing `--chrome` each session, run `/chrome` and select "Enabled by default".

In the [VS Code extension](/en/vs-code#automate-browser-tasks-with-chrome), Chrome is available whenever the Chrome extension is installed. No additional flag is needed.

<Note>
  Enabling Chrome by default in the CLI increases context usage since browser tools are always loaded. If you notice increased context consumption, disable this setting and use `--chrome` only when needed.
</Note>

### Manage site permissions

Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on.

## Example workflows

These examples show common ways to combine browser actions with coding tasks. Run `/mcp` and select `claude-in-chrome` to see the full list of available browser tools.

### Test a local web application

When developing a web app, ask Claude to verify your changes work correctly:

```text  theme={null}
I just updated the login form validation. Can you open localhost:3000,
try submitting the form with invalid data, and check if the error
messages appear correctly?
```

Claude navigates to your local server, interacts with the form, and reports what it observes.

### Debug with console logs

Claude can read console output to help diagnose problems. Tell Claude what patterns to look for rather than asking for all console output, since logs can be verbose:

```text  theme={null}
Open the dashboard page and check the console for any errors when
the page loads.
```

Claude reads the console messages and can filter for specific patterns or error types.

### Automate form filling

Speed up repetitive data entry tasks:

```text  theme={null}
I have a spreadsheet of customer contacts in contacts.csv. For each row,
go to the CRM at crm.example.com, click "Add Contact", and fill in the
name, email, and phone fields.
```

Claude reads your local file, navigates the web interface, and enters the data for each record.

### Draft content in Google Docs

Use Claude to write directly in your documents without API setup:

```text  theme={null}
Draft a project update based on the recent commits and add it to my
Google Doc at docs.google.com/document/d/abc123
```

Claude opens the document, clicks into the editor, and types the content. This works with any web app you're logged into: Gmail, Notion, Sheets, and more.

### Extract data from web pages

Pull structured information from websites:

```text  theme={null}
Go to the product listings page and extract the name, price, and
availability for each item. Save the results as a CSV file.
```

Claude navigates to the page, reads the content, and compiles the data into a structured format.

### Run multi-site workflows

Coordinate tasks across multiple websites:

```text  theme={null}
Check my calendar for meetings tomorrow, then for each meeting with
an external attendee, look up their company website and add a note
about what they do.
```

Claude works across tabs to gather information and complete the workflow.

### Record a demo GIF

Create shareable recordings of browser interactions:

```text  theme={null}
Record a GIF showing how to complete the checkout flow, from adding
an item to the cart through to the confirmation page.
```

Claude records the interaction sequence and saves it as a GIF file.

## Troubleshooting

### Extension not detected

If Claude Code shows "Chrome extension not detected":

1. Verify the Chrome extension is installed and enabled in `chrome://extensions`
2. Verify Claude Code is up to date by running `claude --version`
3. Check that Chrome is running
4. Run `/chrome` and select "Reconnect extension" to re-establish the connection
5. If the issue persists, restart both Claude Code and Chrome

The first time you enable Chrome integration, Claude Code installs a native messaging host configuration file. Chrome reads this file on startup, so if the extension isn't detected on your first attempt, restart Chrome to pick up the new configuration.

If the connection still fails, verify the host configuration file exists at:

For Chrome:

* **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Linux**: `~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Windows**: check `HKCU\Software\Google\Chrome\NativeMessagingHosts\` in the Windows Registry

For Edge:

* **macOS**: `~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Linux**: `~/.config/microsoft-edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Windows**: check `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\` in the Windows Registry

### Browser not responding

If Claude's browser commands stop working:

1. Check if a modal dialog (alert, confirm, prompt) is blocking the page. JavaScript dialogs block browser events and prevent Claude from receiving commands. Dismiss the dialog manually, then tell Claude to continue.
2. Ask Claude to create a new tab and try again
3. Restart the Chrome extension by disabling and re-enabling it in `chrome://extensions`

### Connection drops during long sessions

The Chrome extension's service worker can go idle during extended sessions, which breaks the connection. If browser tools stop working after a period of inactivity, run `/chrome` and select "Reconnect extension".

### Windows-specific issues

On Windows, you may encounter:

* **Named pipe conflicts (EADDRINUSE)**: if another process is using the same named pipe, restart Claude Code. Close any other Claude Code sessions that might be using Chrome.
* **Native messaging host errors**: if the native messaging host crashes on startup, try reinstalling Claude Code to regenerate the host configuration.

### Common error messages

These are the most frequently encountered errors and how to resolve them:

| Error                                | Cause                                            | Fix                                                             |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------- |
| "Browser extension is not connected" | Native messaging host cannot reach the extension | Restart Chrome and Claude Code, then run `/chrome` to reconnect |
| "Extension not detected"             | Chrome extension is not installed or is disabled | Install or enable the extension in `chrome://extensions`        |
| "No tab available"                   | Claude tried to act before a tab was ready       | Ask Claude to create a new tab and retry                        |
| "Receiving end does not exist"       | Extension service worker went idle               | Run `/chrome` and select "Reconnect extension"                  |

## See also

* [Use Claude Code in VS Code](/en/vs-code#automate-browser-tasks-with-chrome): browser automation in the VS Code extension
* [CLI reference](/en/cli-reference): command-line flags including `--chrome`
* [Common workflows](/en/common-workflows): more ways to use Claude Code
* [Data and privacy](/en/data-usage): how Claude Code handles your data
* [Getting started with Claude in Chrome](https://support.claude.com/en/articles/12012173-getting-started-with-claude-in-chrome): full documentation for the Chrome extension, including shortcuts, scheduling, and permissions
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create custom subagents

> Create and use specialized AI subagents in Claude Code for task-specific workflows and improved context management.

Subagents are specialized AI assistants that handle specific types of tasks. Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions. When Claude encounters a task that matches a subagent's description, it delegates to that subagent, which works independently and returns results.

<Note>
  If you need multiple agents working in parallel and communicating with each other, see [agent teams](/en/agent-teams) instead. Subagents work within a single session; agent teams coordinate across separate sessions.
</Note>

Subagents help you:

* **Preserve context** by keeping exploration and implementation out of your main conversation
* **Enforce constraints** by limiting which tools a subagent can use
* **Reuse configurations** across projects with user-level subagents
* **Specialize behavior** with focused system prompts for specific domains
* **Control costs** by routing tasks to faster, cheaper models like Haiku

Claude uses each subagent's description to decide when to delegate tasks. When you create a subagent, write a clear description so Claude knows when to use it.

Claude Code includes several built-in subagents like **Explore**, **Plan**, and **general-purpose**. You can also create custom subagents to handle specific tasks. This page covers the [built-in subagents](#built-in-subagents), [how to create your own](#quickstart-create-your-first-subagent), [full configuration options](#configure-subagents), [patterns for working with subagents](#work-with-subagents), and [example subagents](#example-subagents).

## Built-in subagents

Claude Code includes built-in subagents that Claude automatically uses when appropriate. Each inherits the parent conversation's permissions with additional tool restrictions.

<Tabs>
  <Tab title="Explore">
    A fast, read-only agent optimized for searching and analyzing codebases.

    * **Model**: Haiku (fast, low-latency)
    * **Tools**: Read-only tools (denied access to Write and Edit tools)
    * **Purpose**: File discovery, code search, codebase exploration

    Claude delegates to Explore when it needs to search or understand a codebase without making changes. This keeps exploration results out of your main conversation context.

    When invoking Explore, Claude specifies a thoroughness level: **quick** for targeted lookups, **medium** for balanced exploration, or **very thorough** for comprehensive analysis.
  </Tab>

  <Tab title="Plan">
    A research agent used during [plan mode](/en/common-workflows#use-plan-mode-for-safe-code-analysis) to gather context before presenting a plan.

    * **Model**: Inherits from main conversation
    * **Tools**: Read-only tools (denied access to Write and Edit tools)
    * **Purpose**: Codebase research for planning

    When you're in plan mode and Claude needs to understand your codebase, it delegates research to the Plan subagent. This prevents infinite nesting (subagents cannot spawn other subagents) while still gathering necessary context.
  </Tab>

  <Tab title="General-purpose">
    A capable agent for complex, multi-step tasks that require both exploration and action.

    * **Model**: Inherits from main conversation
    * **Tools**: All tools
    * **Purpose**: Complex research, multi-step operations, code modifications

    Claude delegates to general-purpose when the task requires both exploration and modification, complex reasoning to interpret results, or multiple dependent steps.
  </Tab>

  <Tab title="Other">
    Claude Code includes additional helper agents for specific tasks. These are typically invoked automatically, so you don't need to use them directly.

    | Agent             | Model    | When Claude uses it                                      |
    | :---------------- | :------- | :------------------------------------------------------- |
    | Bash              | Inherits | Running terminal commands in a separate context          |
    | statusline-setup  | Sonnet   | When you run `/statusline` to configure your status line |
    | Claude Code Guide | Haiku    | When you ask questions about Claude Code features        |
  </Tab>
</Tabs>

Beyond these built-in subagents, you can create your own with custom prompts, tool restrictions, permission modes, hooks, and skills. The following sections show how to get started and customize subagents.

## Quickstart: create your first subagent

Subagents are defined in Markdown files with YAML frontmatter. You can [create them manually](#write-subagent-files) or use the `/agents` command.

This walkthrough guides you through creating a user-level subagent with the `/agent` command. The subagent reviews code and suggests improvements for the codebase.

<Steps>
  <Step title="Open the subagents interface">
    In Claude Code, run:

    ```text  theme={null}
    /agents
    ```
  </Step>

  <Step title="Create a new user-level agent">
    Select **Create new agent**, then choose **User-level**. This saves the subagent to `~/.claude/agents/` so it's available in all your projects.
  </Step>

  <Step title="Generate with Claude">
    Select **Generate with Claude**. When prompted, describe the subagent:

    ```text  theme={null}
    A code improvement agent that scans files and suggests improvements
    for readability, performance, and best practices. It should explain
    each issue, show the current code, and provide an improved version.
    ```

    Claude generates the system prompt and configuration. Press `e` to open it in your editor if you want to customize it.
  </Step>

  <Step title="Select tools">
    For a read-only reviewer, deselect everything except **Read-only tools**. If you keep all tools selected, the subagent inherits all tools available to the main conversation.
  </Step>

  <Step title="Select model">
    Choose which model the subagent uses. For this example agent, select **Sonnet**, which balances capability and speed for analyzing code patterns.
  </Step>

  <Step title="Choose a color">
    Pick a background color for the subagent. This helps you identify which subagent is running in the UI.
  </Step>

  <Step title="Save and try it out">
    Save the subagent. It's available immediately (no restart needed). Try it:

    ```text  theme={null}
    Use the code-improver agent to suggest improvements in this project
    ```

    Claude delegates to your new subagent, which scans the codebase and returns improvement suggestions.
  </Step>
</Steps>

You now have a subagent you can use in any project on your machine to analyze codebases and suggest improvements.

You can also create subagents manually as Markdown files, define them via CLI flags, or distribute them through plugins. The following sections cover all configuration options.

## Configure subagents

### Use the /agents command

The `/agents` command provides an interactive interface for managing subagents. Run `/agents` to:

* View all available subagents (built-in, user, project, and plugin)
* Create new subagents with guided setup or Claude generation
* Edit existing subagent configuration and tool access
* Delete custom subagents
* See which subagents are active when duplicates exist

This is the recommended way to create and manage subagents. For manual creation or automation, you can also add subagent files directly.

To list all configured subagents from the command line without starting an interactive session, run `claude agents`. This shows agents grouped by source and indicates which are overridden by higher-priority definitions.

### Choose the subagent scope

Subagents are Markdown files with YAML frontmatter. Store them in different locations depending on scope. When multiple subagents share the same name, the higher-priority location wins.

| Location                     | Scope                   | Priority    | How to create                         |
| :--------------------------- | :---------------------- | :---------- | :------------------------------------ |
| `--agents` CLI flag          | Current session         | 1 (highest) | Pass JSON when launching Claude Code  |
| `.claude/agents/`            | Current project         | 2           | Interactive or manual                 |
| `~/.claude/agents/`          | All your projects       | 3           | Interactive or manual                 |
| Plugin's `agents/` directory | Where plugin is enabled | 4 (lowest)  | Installed with [plugins](/en/plugins) |

**Project subagents** (`.claude/agents/`) are ideal for subagents specific to a codebase. Check them into version control so your team can use and improve them collaboratively.

**User subagents** (`~/.claude/agents/`) are personal subagents available in all your projects.

**CLI-defined subagents** are passed as JSON when launching Claude Code. They exist only for that session and aren't saved to disk, making them useful for quick testing or automation scripts:

```bash  theme={null}
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

The `--agents` flag accepts JSON with the same [frontmatter](#supported-frontmatter-fields) fields as file-based subagents: `description`, `prompt`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, and `memory`. Use `prompt` for the system prompt, equivalent to the markdown body in file-based subagents. See the [CLI reference](/en/cli-reference#agents-flag-format) for the full JSON format.

**Plugin subagents** come from [plugins](/en/plugins) you've installed. They appear in `/agents` alongside your custom subagents. See the [plugin components reference](/en/plugins-reference#agents) for details on creating plugin subagents.

### Write subagent files

Subagent files use YAML frontmatter for configuration, followed by the system prompt in Markdown:

<Note>
  Subagents are loaded at session start. If you create a subagent by manually adding a file, restart your session or use `/agents` to load it immediately.
</Note>

```markdown  theme={null}
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

The frontmatter defines the subagent's metadata and configuration. The body becomes the system prompt that guides the subagent's behavior. Subagents receive only this system prompt (plus basic environment details like working directory), not the full Claude Code system prompt.

#### Supported frontmatter fields

The following fields can be used in the YAML frontmatter. Only `name` and `description` are required.

| Field             | Required | Description                                                                                                                                                                                                                                                                 |
| :---------------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | Yes      | Unique identifier using lowercase letters and hyphens                                                                                                                                                                                                                       |
| `description`     | Yes      | When Claude should delegate to this subagent                                                                                                                                                                                                                                |
| `tools`           | No       | [Tools](#available-tools) the subagent can use. Inherits all tools if omitted                                                                                                                                                                                               |
| `disallowedTools` | No       | Tools to deny, removed from inherited or specified list                                                                                                                                                                                                                     |
| `model`           | No       | [Model](#choose-a-model) to use: `sonnet`, `opus`, `haiku`, or `inherit`. Defaults to `inherit`                                                                                                                                                                             |
| `permissionMode`  | No       | [Permission mode](#permission-modes): `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, or `plan`                                                                                                                                                                   |
| `maxTurns`        | No       | Maximum number of agentic turns before the subagent stops                                                                                                                                                                                                                   |
| `skills`          | No       | [Skills](/en/skills) to load into the subagent's context at startup. The full skill content is injected, not just made available for invocation. Subagents don't inherit skills from the parent conversation                                                                |
| `mcpServers`      | No       | [MCP servers](/en/mcp) available to this subagent. Each entry is either a server name referencing an already-configured server (e.g., `"slack"`) or an inline definition with the server name as key and a full [MCP server config](/en/mcp#configure-mcp-servers) as value |
| `hooks`           | No       | [Lifecycle hooks](#define-hooks-for-subagents) scoped to this subagent                                                                                                                                                                                                      |
| `memory`          | No       | [Persistent memory scope](#enable-persistent-memory): `user`, `project`, or `local`. Enables cross-session learning                                                                                                                                                         |
| `background`      | No       | Set to `true` to always run this subagent as a [background task](#run-subagents-in-foreground-or-background). Default: `false`                                                                                                                                              |
| `isolation`       | No       | Set to `worktree` to run the subagent in a temporary [git worktree](/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees), giving it an isolated copy of the repository. The worktree is automatically cleaned up if the subagent makes no changes     |

### Choose a model

The `model` field controls which [AI model](/en/model-config) the subagent uses:

* **Model alias**: Use one of the available aliases: `sonnet`, `opus`, or `haiku`
* **inherit**: Use the same model as the main conversation
* **Omitted**: If not specified, defaults to `inherit` (uses the same model as the main conversation)

### Control subagent capabilities

You can control what subagents can do through tool access, permission modes, and conditional rules.

#### Available tools

Subagents can use any of Claude Code's [internal tools](/en/settings#tools-available-to-claude). By default, subagents inherit all tools from the main conversation, including MCP tools.

To restrict tools, use the `tools` field (allowlist) or `disallowedTools` field (denylist):

```yaml  theme={null}
---
name: safe-researcher
description: Research agent with restricted capabilities
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---
```

#### Restrict which subagents can be spawned

When an agent runs as the main thread with `claude --agent`, it can spawn subagents using the Agent tool. To restrict which subagent types it can spawn, use `Agent(agent_type)` syntax in the `tools` field.

<Note>In version 2.1.63, the Task tool was renamed to Agent. Existing `Task(...)` references in settings and agent definitions still work as aliases.</Note>

```yaml  theme={null}
---
name: coordinator
description: Coordinates work across specialized agents
tools: Agent(worker, researcher), Read, Bash
---
```

This is an allowlist: only the `worker` and `researcher` subagents can be spawned. If the agent tries to spawn any other type, the request fails and the agent sees only the allowed types in its prompt. To block specific agents while allowing all others, use [`permissions.deny`](#disable-specific-subagents) instead.

To allow spawning any subagent without restrictions, use `Agent` without parentheses:

```yaml  theme={null}
tools: Agent, Read, Bash
```

If `Agent` is omitted from the `tools` list entirely, the agent cannot spawn any subagents. This restriction only applies to agents running as the main thread with `claude --agent`. Subagents cannot spawn other subagents, so `Agent(agent_type)` has no effect in subagent definitions.

#### Permission modes

The `permissionMode` field controls how the subagent handles permission prompts. Subagents inherit the permission context from the main conversation but can override the mode.

| Mode                | Behavior                                                           |
| :------------------ | :----------------------------------------------------------------- |
| `default`           | Standard permission checking with prompts                          |
| `acceptEdits`       | Auto-accept file edits                                             |
| `dontAsk`           | Auto-deny permission prompts (explicitly allowed tools still work) |
| `bypassPermissions` | Skip all permission checks                                         |
| `plan`              | Plan mode (read-only exploration)                                  |

<Warning>
  Use `bypassPermissions` with caution. It skips all permission checks, allowing the subagent to execute any operation without approval.
</Warning>

If the parent uses `bypassPermissions`, this takes precedence and cannot be overridden.

#### Preload skills into subagents

Use the `skills` field to inject skill content into a subagent's context at startup. This gives the subagent domain knowledge without requiring it to discover and load skills during execution.

```yaml  theme={null}
---
name: api-developer
description: Implement API endpoints following team conventions
skills:
  - api-conventions
  - error-handling-patterns
---

Implement API endpoints. Follow the conventions and patterns from the preloaded skills.
```

The full content of each skill is injected into the subagent's context, not just made available for invocation. Subagents don't inherit skills from the parent conversation; you must list them explicitly.

<Note>
  This is the inverse of [running a skill in a subagent](/en/skills#run-skills-in-a-subagent). With `skills` in a subagent, the subagent controls the system prompt and loads skill content. With `context: fork` in a skill, the skill content is injected into the agent you specify. Both use the same underlying system.
</Note>

#### Enable persistent memory

The `memory` field gives the subagent a persistent directory that survives across conversations. The subagent uses this directory to build up knowledge over time, such as codebase patterns, debugging insights, and architectural decisions.

```yaml  theme={null}
---
name: code-reviewer
description: Reviews code for quality and best practices
memory: user
---

You are a code reviewer. As you review code, update your agent memory with
patterns, conventions, and recurring issues you discover.
```

Choose a scope based on how broadly the memory should apply:

| Scope     | Location                                      | Use when                                                                                    |
| :-------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------ |
| `user`    | `~/.claude/agent-memory/<name-of-agent>/`     | the subagent should remember learnings across all projects                                  |
| `project` | `.claude/agent-memory/<name-of-agent>/`       | the subagent's knowledge is project-specific and shareable via version control              |
| `local`   | `.claude/agent-memory-local/<name-of-agent>/` | the subagent's knowledge is project-specific but should not be checked into version control |

When memory is enabled:

* The subagent's system prompt includes instructions for reading and writing to the memory directory.
* The subagent's system prompt also includes the first 200 lines of `MEMORY.md` in the memory directory, with instructions to curate `MEMORY.md` if it exceeds 200 lines.
* Read, Write, and Edit tools are automatically enabled so the subagent can manage its memory files.

##### Persistent memory tips

* `user` is the recommended default scope. Use `project` or `local` when the subagent's knowledge is only relevant to a specific codebase.
* Ask the subagent to consult its memory before starting work: "Review this PR, and check your memory for patterns you've seen before."
* Ask the subagent to update its memory after completing a task: "Now that you're done, save what you learned to your memory." Over time, this builds a knowledge base that makes the subagent more effective.
* Include memory instructions directly in the subagent's markdown file so it proactively maintains its own knowledge base:

  ```markdown  theme={null}
  Update your agent memory as you discover codepaths, patterns, library
  locations, and key architectural decisions. This builds up institutional
  knowledge across conversations. Write concise notes about what you found
  and where.
  ```

#### Conditional rules with hooks

For more dynamic control over tool usage, use `PreToolUse` hooks to validate operations before they execute. This is useful when you need to allow some operations of a tool while blocking others.

This example creates a subagent that only allows read-only database queries. The `PreToolUse` hook runs the script specified in `command` before each Bash command executes:

```yaml  theme={null}
---
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---
```

Claude Code [passes hook input as JSON](/en/hooks#pretooluse-input) via stdin to hook commands. The validation script reads this JSON, extracts the Bash command, and [exits with code 2](/en/hooks#exit-code-2-behavior-per-event) to block write operations:

```bash  theme={null}
#!/bin/bash
# ./scripts/validate-readonly-query.sh

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block SQL write operations (case-insensitive)
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b' > /dev/null; then
  echo "Blocked: Only SELECT queries are allowed" >&2
  exit 2
fi

exit 0
```

See [Hook input](/en/hooks#pretooluse-input) for the complete input schema and [exit codes](/en/hooks#exit-code-output) for how exit codes affect behavior.

#### Disable specific subagents

You can prevent Claude from using specific subagents by adding them to the `deny` array in your [settings](/en/settings#permission-settings). Use the format `Agent(subagent-name)` where `subagent-name` matches the subagent's name field.

```json  theme={null}
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

This works for both built-in and custom subagents. You can also use the `--disallowedTools` CLI flag:

```bash  theme={null}
claude --disallowedTools "Agent(Explore)"
```

See [Permissions documentation](/en/permissions#tool-specific-permission-rules) for more details on permission rules.

### Define hooks for subagents

Subagents can define [hooks](/en/hooks) that run during the subagent's lifecycle. There are two ways to configure hooks:

1. **In the subagent's frontmatter**: Define hooks that run only while that subagent is active
2. **In `settings.json`**: Define hooks that run in the main session when subagents start or stop

#### Hooks in subagent frontmatter

Define hooks directly in the subagent's markdown file. These hooks only run while that specific subagent is active and are cleaned up when it finishes.

All [hook events](/en/hooks#hook-events) are supported. The most common events for subagents are:

| Event         | Matcher input | When it fires                                                       |
| :------------ | :------------ | :------------------------------------------------------------------ |
| `PreToolUse`  | Tool name     | Before the subagent uses a tool                                     |
| `PostToolUse` | Tool name     | After the subagent uses a tool                                      |
| `Stop`        | (none)        | When the subagent finishes (converted to `SubagentStop` at runtime) |

This example validates Bash commands with the `PreToolUse` hook and runs a linter after file edits with `PostToolUse`:

```yaml  theme={null}
---
name: code-reviewer
description: Review code changes with automatic linting
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

`Stop` hooks in frontmatter are automatically converted to `SubagentStop` events.

#### Project-level hooks for subagent events

Configure hooks in `settings.json` that respond to subagent lifecycle events in the main session.

| Event           | Matcher input   | When it fires                    |
| :-------------- | :-------------- | :------------------------------- |
| `SubagentStart` | Agent type name | When a subagent begins execution |
| `SubagentStop`  | Agent type name | When a subagent completes        |

Both events support matchers to target specific agent types by name. This example runs a setup script only when the `db-agent` subagent starts, and a cleanup script when any subagent stops:

```json  theme={null}
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

See [Hooks](/en/hooks) for the complete hook configuration format.

## Work with subagents

### Understand automatic delegation

Claude automatically delegates tasks based on the task description in your request, the `description` field in subagent configurations, and current context. To encourage proactive delegation, include phrases like "use proactively" in your subagent's description field.

You can also request a specific subagent explicitly:

```text  theme={null}
Use the test-runner subagent to fix failing tests
Have the code-reviewer subagent look at my recent changes
```

### Run subagents in foreground or background

Subagents can run in the foreground (blocking) or background (concurrent):

* **Foreground subagents** block the main conversation until complete. Permission prompts and clarifying questions (like [`AskUserQuestion`](/en/settings#tools-available-to-claude)) are passed through to you.
* **Background subagents** run concurrently while you continue working. Before launching, Claude Code prompts for any tool permissions the subagent will need, ensuring it has the necessary approvals upfront. Once running, the subagent inherits these permissions and auto-denies anything not pre-approved. If a background subagent needs to ask clarifying questions, that tool call fails but the subagent continues.

If a background subagent fails due to missing permissions, you can [resume it](#resume-subagents) in the foreground to retry with interactive prompts.

Claude decides whether to run subagents in the foreground or background based on the task. You can also:

* Ask Claude to "run this in the background"
* Press **Ctrl+B** to background a running task

To disable all background task functionality, set the `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` environment variable to `1`. See [Environment variables](/en/settings#environment-variables).

### Common patterns

#### Isolate high-volume operations

One of the most effective uses for subagents is isolating operations that produce large amounts of output. Running tests, fetching documentation, or processing log files can consume significant context. By delegating these to a subagent, the verbose output stays in the subagent's context while only the relevant summary returns to your main conversation.

```text  theme={null}
Use a subagent to run the test suite and report only the failing tests with their error messages
```

#### Run parallel research

For independent investigations, spawn multiple subagents to work simultaneously:

```text  theme={null}
Research the authentication, database, and API modules in parallel using separate subagents
```

Each subagent explores its area independently, then Claude synthesizes the findings. This works best when the research paths don't depend on each other.

<Warning>
  When subagents complete, their results return to your main conversation. Running many subagents that each return detailed results can consume significant context.
</Warning>

For tasks that need sustained parallelism or exceed your context window, [agent teams](/en/agent-teams) give each worker its own independent context.

#### Chain subagents

For multi-step workflows, ask Claude to use subagents in sequence. Each subagent completes its task and returns results to Claude, which then passes relevant context to the next subagent.

```text  theme={null}
Use the code-reviewer subagent to find performance issues, then use the optimizer subagent to fix them
```

### Choose between subagents and main conversation

Use the **main conversation** when:

* The task needs frequent back-and-forth or iterative refinement
* Multiple phases share significant context (planning → implementation → testing)
* You're making a quick, targeted change
* Latency matters. Subagents start fresh and may need time to gather context

Use **subagents** when:

* The task produces verbose output you don't need in your main context
* You want to enforce specific tool restrictions or permissions
* The work is self-contained and can return a summary

Consider [Skills](/en/skills) instead when you want reusable prompts or workflows that run in the main conversation context rather than isolated subagent context.

<Note>
  Subagents cannot spawn other subagents. If your workflow requires nested delegation, use [Skills](/en/skills) or [chain subagents](#chain-subagents) from the main conversation.
</Note>

### Manage subagent context

#### Resume subagents

Each subagent invocation creates a new instance with fresh context. To continue an existing subagent's work instead of starting over, ask Claude to resume it.

Resumed subagents retain their full conversation history, including all previous tool calls, results, and reasoning. The subagent picks up exactly where it stopped rather than starting fresh.

When a subagent completes, Claude receives its agent ID. To resume a subagent, ask Claude to continue the previous work:

```text  theme={null}
Use the code-reviewer subagent to review the authentication module
[Agent completes]

Continue that code review and now analyze the authorization logic
[Claude resumes the subagent with full context from previous conversation]
```

You can also ask Claude for the agent ID if you want to reference it explicitly, or find IDs in the transcript files at `~/.claude/projects/{project}/{sessionId}/subagents/`. Each transcript is stored as `agent-{agentId}.jsonl`.

Subagent transcripts persist independently of the main conversation:

* **Main conversation compaction**: When the main conversation compacts, subagent transcripts are unaffected. They're stored in separate files.
* **Session persistence**: Subagent transcripts persist within their session. You can [resume a subagent](#resume-subagents) after restarting Claude Code by resuming the same session.
* **Automatic cleanup**: Transcripts are cleaned up based on the `cleanupPeriodDays` setting (default: 30 days).

#### Auto-compaction

Subagents support automatic compaction using the same logic as the main conversation. By default, auto-compaction triggers at approximately 95% capacity. To trigger compaction earlier, set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` to a lower percentage (for example, `50`). See [environment variables](/en/settings#environment-variables) for details.

Compaction events are logged in subagent transcript files:

```json  theme={null}
{
  "type": "system",
  "subtype": "compact_boundary",
  "compactMetadata": {
    "trigger": "auto",
    "preTokens": 167189
  }
}
```

The `preTokens` value shows how many tokens were used before compaction occurred.

## Example subagents

These examples demonstrate effective patterns for building subagents. Use them as starting points, or generate a customized version with Claude.

<Tip>
  **Best practices:**

  * **Design focused subagents:** each subagent should excel at one specific task
  * **Write detailed descriptions:** Claude uses the description to decide when to delegate
  * **Limit tool access:** grant only necessary permissions for security and focus
  * **Check into version control:** share project subagents with your team
</Tip>

### Code reviewer

A read-only subagent that reviews code without modifying it. This example shows how to design a focused subagent with limited tool access (no Edit or Write) and a detailed prompt that specifies exactly what to look for and how to format output.

```markdown  theme={null}
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include specific examples of how to fix issues.
```

### Debugger

A subagent that can both analyze and fix issues. Unlike the code reviewer, this one includes Edit because fixing bugs requires modifying code. The prompt provides a clear workflow from diagnosis to verification.

```markdown  theme={null}
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger specializing in root cause analysis.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify solution works

Debugging process:
- Analyze error messages and logs
- Check recent code changes
- Form and test hypotheses
- Add strategic debug logging
- Inspect variable states

For each issue, provide:
- Root cause explanation
- Evidence supporting the diagnosis
- Specific code fix
- Testing approach
- Prevention recommendations

Focus on fixing the underlying issue, not the symptoms.
```

### Data scientist

A domain-specific subagent for data analysis work. This example shows how to create subagents for specialized workflows outside of typical coding tasks. It explicitly sets `model: sonnet` for more capable analysis.

```markdown  theme={null}
---
name: data-scientist
description: Data analysis expert for SQL queries, BigQuery operations, and data insights. Use proactively for data analysis tasks and queries.
tools: Bash, Read, Write
model: sonnet
---

You are a data scientist specializing in SQL and BigQuery analysis.

When invoked:
1. Understand the data analysis requirement
2. Write efficient SQL queries
3. Use BigQuery command line tools (bq) when appropriate
4. Analyze and summarize results
5. Present findings clearly

Key practices:
- Write optimized SQL queries with proper filters
- Use appropriate aggregations and joins
- Include comments explaining complex logic
- Format results for readability
- Provide data-driven recommendations

For each analysis:
- Explain the query approach
- Document any assumptions
- Highlight key findings
- Suggest next steps based on data

Always ensure queries are efficient and cost-effective.
```

### Database query validator

A subagent that allows Bash access but validates commands to permit only read-only SQL queries. This example shows how to use `PreToolUse` hooks for conditional validation when you need finer control than the `tools` field provides.

```markdown  theme={null}
---
name: db-reader
description: Execute read-only database queries. Use when analyzing data or generating reports.
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

You are a database analyst with read-only access. Execute SELECT queries to answer questions about the data.

When asked to analyze data:
1. Identify which tables contain the relevant data
2. Write efficient SELECT queries with appropriate filters
3. Present results clearly with context

You cannot modify data. If asked to INSERT, UPDATE, DELETE, or modify schema, explain that you only have read access.
```

Claude Code [passes hook input as JSON](/en/hooks#pretooluse-input) via stdin to hook commands. The validation script reads this JSON, extracts the command being executed, and checks it against a list of SQL write operations. If a write operation is detected, the script [exits with code 2](/en/hooks#exit-code-2-behavior-per-event) to block execution and returns an error message to Claude via stderr.

Create the validation script anywhere in your project. The path must match the `command` field in your hook configuration:

```bash  theme={null}
#!/bin/bash
# Blocks SQL write operations, allows SELECT queries

# Read JSON input from stdin
INPUT=$(cat)

# Extract the command field from tool_input using jq
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block write operations (case-insensitive)
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|MERGE)\b' > /dev/null; then
  echo "Blocked: Write operations not allowed. Use SELECT queries only." >&2
  exit 2
fi

exit 0
```

Make the script executable:

```bash  theme={null}
chmod +x ./scripts/validate-readonly-query.sh
```

The hook receives JSON via stdin with the Bash command in `tool_input.command`. Exit code 2 blocks the operation and feeds the error message back to Claude. See [Hooks](/en/hooks#exit-code-output) for details on exit codes and [Hook input](/en/hooks#pretooluse-input) for the complete input schema.

## Next steps

Now that you understand subagents, explore these related features:

* [Distribute subagents with plugins](/en/plugins) to share subagents across teams or projects
* [Run Claude Code programmatically](/en/headless) with the Agent SDK for CI/CD and automation
* [Use MCP servers](/en/mcp) to give subagents access to external tools and data
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Orchestrate teams of Claude Code sessions

> Coordinate multiple Claude Code instances working together as a team, with shared tasks, inter-agent messaging, and centralized management.

<Warning>
  Agent teams are experimental and disabled by default. Enable them by adding `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to your [settings.json](/en/settings) or environment. Agent teams have [known limitations](#limitations) around session resumption, task coordination, and shutdown behavior.
</Warning>

Agent teams let you coordinate multiple Claude Code instances working together. One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other.

Unlike [subagents](/en/sub-agents), which run within a single session and can only report back to the main agent, you can also interact with individual teammates directly without going through the lead.

This page covers:

* [When to use agent teams](#when-to-use-agent-teams), including best use cases and how they compare with subagents
* [Starting a team](#start-your-first-agent-team)
* [Controlling teammates](#control-your-agent-team), including display modes, task assignment, and delegation
* [Best practices for parallel work](#best-practices)

## When to use agent teams

Agent teams are most effective for tasks where parallel exploration adds real value. See [use case examples](#use-case-examples) for full scenarios. The strongest use cases are:

* **Research and review**: multiple teammates can investigate different aspects of a problem simultaneously, then share and challenge each other's findings
* **New modules or features**: teammates can each own a separate piece without stepping on each other
* **Debugging with competing hypotheses**: teammates test different theories in parallel and converge on the answer faster
* **Cross-layer coordination**: changes that span frontend, backend, and tests, each owned by a different teammate

Agent teams add coordination overhead and use significantly more tokens than a single session. They work best when teammates can operate independently. For sequential tasks, same-file edits, or work with many dependencies, a single session or [subagents](/en/sub-agents) are more effective.

### Compare with subagents

Both agent teams and [subagents](/en/sub-agents) let you parallelize work, but they operate differently. Choose based on whether your workers need to communicate with each other:

<Frame caption="Subagents only report results back to the main agent and never talk to each other. In agent teams, teammates share a task list, claim work, and communicate directly with each other.">
  <img src="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=2f8db9b4f3705dd3ab931fbe2d96e42a" className="dark:hidden" alt="Diagram comparing subagent and agent team architectures. Subagents are spawned by the main agent, do work, and report results back. Agent teams coordinate through a shared task list, with teammates communicating directly with each other." data-og-width="4245" width="4245" data-og-height="1615" height="1615" data-path="images/subagents-vs-agent-teams-light.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=280&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=a2cfe413c2084b477be40ac8723d9d40 280w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=560&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=c642c09a4c211b10b35eee7d7d0d149f 560w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=840&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=40d286f77c8a4075346b4fcaa2b36248 840w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=1100&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=923986caa23c0ef2c27d7e45f4dce6d1 1100w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=1650&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=17a730a070db6d71d029a98b074c68e8 1650w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?w=2500&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=e402533fc9e8b5e8d26a835cc4aa1742 2500w" />

  <img src="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=d573a037540f2ada6a9ae7d8285b46fd" className="hidden dark:block" alt="Diagram comparing subagent and agent team architectures. Subagents are spawned by the main agent, do work, and report results back. Agent teams coordinate through a shared task list, with teammates communicating directly with each other." data-og-width="4245" width="4245" data-og-height="1615" height="1615" data-path="images/subagents-vs-agent-teams-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=280&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=06ca5b18b232855acc488357d8d01fa7 280w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=560&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=3d34daee83994781eb74b74d1ed511c4 560w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=840&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=82ea35ac837de7d674002de69689b9cf 840w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=1100&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=3653085214a9fc65d1f589044894a296 1100w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=1650&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=8e74b42694e428570e876d34f29e6ad6 1650w, https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?w=2500&fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=3be00c56c6a0dcccbe15640020be0128 2500w" />
</Frame>

|                   | Subagents                                        | Agent teams                                         |
| :---------------- | :----------------------------------------------- | :-------------------------------------------------- |
| **Context**       | Own context window; results return to the caller | Own context window; fully independent               |
| **Communication** | Report results back to the main agent only       | Teammates message each other directly               |
| **Coordination**  | Main agent manages all work                      | Shared task list with self-coordination             |
| **Best for**      | Focused tasks where only the result matters      | Complex work requiring discussion and collaboration |
| **Token cost**    | Lower: results summarized back to main context   | Higher: each teammate is a separate Claude instance |

Use subagents when you need quick, focused workers that report back. Use agent teams when teammates need to share findings, challenge each other, and coordinate on their own.

## Enable agent teams

Agent teams are disabled by default. Enable them by setting the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment variable to `1`, either in your shell environment or through [settings.json](/en/settings):

```json settings.json theme={null}
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## Start your first agent team

After enabling agent teams, tell Claude to create an agent team and describe the task and the team structure you want in natural language. Claude creates the team, spawns teammates, and coordinates work based on your prompt.

This example works well because the three roles are independent and can explore the problem without waiting on each other:

```text  theme={null}
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles: one
teammate on UX, one on technical architecture, one playing devil's advocate.
```

From there, Claude creates a team with a [shared task list](/en/interactive-mode#task-list), spawns teammates for each perspective, has them explore the problem, synthesizes findings, and attempts to [clean up the team](#clean-up-the-team) when finished.

The lead's terminal lists all teammates and what they're working on. Use Shift+Down to cycle through teammates and message them directly. After the last teammate, Shift+Down wraps back to the lead.

If you want each teammate in its own split pane, see [Choose a display mode](#choose-a-display-mode).

## Control your agent team

Tell the lead what you want in natural language. It handles team coordination, task assignment, and delegation based on your instructions.

### Choose a display mode

Agent teams support two display modes:

* **In-process**: all teammates run inside your main terminal. Use Shift+Down to cycle through teammates and type to message them directly. Works in any terminal, no extra setup required.
* **Split panes**: each teammate gets its own pane. You can see everyone's output at once and click into a pane to interact directly. Requires tmux, or iTerm2.

<Note>
  `tmux` has known limitations on certain operating systems and traditionally works best on macOS. Using `tmux -CC` in iTerm2 is the suggested entrypoint into `tmux`.
</Note>

The default is `"auto"`, which uses split panes if you're already running inside a tmux session, and in-process otherwise. The `"tmux"` setting enables split-pane mode and auto-detects whether to use tmux or iTerm2 based on your terminal. To override, set `teammateMode` in your [settings.json](/en/settings):

```json  theme={null}
{
  "teammateMode": "in-process"
}
```

To force in-process mode for a single session, pass it as a flag:

```bash  theme={null}
claude --teammate-mode in-process
```

Split-pane mode requires either [tmux](https://github.com/tmux/tmux/wiki) or iTerm2 with the [`it2` CLI](https://github.com/mkusaka/it2). To install manually:

* **tmux**: install through your system's package manager. See the [tmux wiki](https://github.com/tmux/tmux/wiki/Installing) for platform-specific instructions.
* **iTerm2**: install the [`it2` CLI](https://github.com/mkusaka/it2), then enable the Python API in **iTerm2 → Settings → General → Magic → Enable Python API**.

### Specify teammates and models

Claude decides the number of teammates to spawn based on your task, or you can specify exactly what you want:

```text  theme={null}
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### Require plan approval for teammates

For complex or risky tasks, you can require teammates to plan before implementing. The teammate works in read-only plan mode until the lead approves their approach:

```text  theme={null}
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

When a teammate finishes planning, it sends a plan approval request to the lead. The lead reviews the plan and either approves it or rejects it with feedback. If rejected, the teammate stays in plan mode, revises based on the feedback, and resubmits. Once approved, the teammate exits plan mode and begins implementation.

The lead makes approval decisions autonomously. To influence the lead's judgment, give it criteria in your prompt, such as "only approve plans that include test coverage" or "reject plans that modify the database schema."

### Talk to teammates directly

Each teammate is a full, independent Claude Code session. You can message any teammate directly to give additional instructions, ask follow-up questions, or redirect their approach.

* **In-process mode**: use Shift+Down to cycle through teammates, then type to send them a message. Press Enter to view a teammate's session, then Escape to interrupt their current turn. Press Ctrl+T to toggle the task list.
* **Split-pane mode**: click into a teammate's pane to interact with their session directly. Each teammate has a full view of their own terminal.

### Assign and claim tasks

The shared task list coordinates work across the team. The lead creates tasks and teammates work through them. Tasks have three states: pending, in progress, and completed. Tasks can also depend on other tasks: a pending task with unresolved dependencies cannot be claimed until those dependencies are completed.

The lead can assign tasks explicitly, or teammates can self-claim:

* **Lead assigns**: tell the lead which task to give to which teammate
* **Self-claim**: after finishing a task, a teammate picks up the next unassigned, unblocked task on its own

Task claiming uses file locking to prevent race conditions when multiple teammates try to claim the same task simultaneously.

### Shut down teammates

To gracefully end a teammate's session:

```text  theme={null}
Ask the researcher teammate to shut down
```

The lead sends a shutdown request. The teammate can approve, exiting gracefully, or reject with an explanation.

### Clean up the team

When you're done, ask the lead to clean up:

```text  theme={null}
Clean up the team
```

This removes the shared team resources. When the lead runs cleanup, it checks for active teammates and fails if any are still running, so shut them down first.

<Warning>
  Always use the lead to clean up. Teammates should not run cleanup because their team context may not resolve correctly, potentially leaving resources in an inconsistent state.
</Warning>

### Enforce quality gates with hooks

Use [hooks](/en/hooks) to enforce rules when teammates finish work or tasks complete:

* [`TeammateIdle`](/en/hooks#teammateidle): runs when a teammate is about to go idle. Exit with code 2 to send feedback and keep the teammate working.
* [`TaskCompleted`](/en/hooks#taskcompleted): runs when a task is being marked complete. Exit with code 2 to prevent completion and send feedback.

## How agent teams work

This section covers the architecture and mechanics behind agent teams. If you want to start using them, see [Control your agent team](#control-your-agent-team) above.

### How Claude starts agent teams

There are two ways agent teams get started:

* **You request a team**: give Claude a task that benefits from parallel work and explicitly ask for an agent team. Claude creates one based on your instructions.
* **Claude proposes a team**: if Claude determines your task would benefit from parallel work, it may suggest creating a team. You confirm before it proceeds.

In both cases, you stay in control. Claude won't create a team without your approval.

### Architecture

An agent team consists of:

| Component     | Role                                                                                       |
| :------------ | :----------------------------------------------------------------------------------------- |
| **Team lead** | The main Claude Code session that creates the team, spawns teammates, and coordinates work |
| **Teammates** | Separate Claude Code instances that each work on assigned tasks                            |
| **Task list** | Shared list of work items that teammates claim and complete                                |
| **Mailbox**   | Messaging system for communication between agents                                          |

See [Choose a display mode](#choose-a-display-mode) for display configuration options. Teammate messages arrive at the lead automatically.

The system manages task dependencies automatically. When a teammate completes a task that other tasks depend on, blocked tasks unblock without manual intervention.

Teams and tasks are stored locally:

* **Team config**: `~/.claude/teams/{team-name}/config.json`
* **Task list**: `~/.claude/tasks/{team-name}/`

The team config contains a `members` array with each teammate's name, agent ID, and agent type. Teammates can read this file to discover other team members.

### Permissions

Teammates start with the lead's permission settings. If the lead runs with `--dangerously-skip-permissions`, all teammates do too. After spawning, you can change individual teammate modes, but you can't set per-teammate modes at spawn time.

### Context and communication

Each teammate has its own context window. When spawned, a teammate loads the same project context as a regular session: CLAUDE.md, MCP servers, and skills. It also receives the spawn prompt from the lead. The lead's conversation history does not carry over.

**How teammates share information:**

* **Automatic message delivery**: when teammates send messages, they're delivered automatically to recipients. The lead doesn't need to poll for updates.
* **Idle notifications**: when a teammate finishes and stops, they automatically notify the lead.
* **Shared task list**: all agents can see task status and claim available work.

**Teammate messaging:**

* **message**: send a message to one specific teammate
* **broadcast**: send to all teammates simultaneously. Use sparingly, as costs scale with team size.

### Token usage

Agent teams use significantly more tokens than a single session. Each teammate has its own context window, and token usage scales with the number of active teammates. For research, review, and new feature work, the extra tokens are usually worthwhile. For routine tasks, a single session is more cost-effective. See [agent team token costs](/en/costs#agent-team-token-costs) for usage guidance.

## Use case examples

These examples show how agent teams handle tasks where parallel exploration adds value.

### Run a parallel code review

A single reviewer tends to gravitate toward one type of issue at a time. Splitting review criteria into independent domains means security, performance, and test coverage all get thorough attention simultaneously. The prompt assigns each teammate a distinct lens so they don't overlap:

```text  theme={null}
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

Each reviewer works from the same PR but applies a different filter. The lead synthesizes findings across all three after they finish.

### Investigate with competing hypotheses

When the root cause is unclear, a single agent tends to find one plausible explanation and stop looking. The prompt fights this by making teammates explicitly adversarial: each one's job is not only to investigate its own theory but to challenge the others'.

```text  theme={null}
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

The debate structure is the key mechanism here. Sequential investigation suffers from anchoring: once one theory is explored, subsequent investigation is biased toward it.

With multiple independent investigators actively trying to disprove each other, the theory that survives is much more likely to be the actual root cause.

## Best practices

### Give teammates enough context

Teammates load project context automatically, including CLAUDE.md, MCP servers, and skills, but they don't inherit the lead's conversation history. See [Context and communication](#context-and-communication) for details. Include task-specific details in the spawn prompt:

```text  theme={null}
Spawn a security reviewer teammate with the prompt: "Review the authentication module
at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### Choose an appropriate team size

There's no hard limit on the number of teammates, but practical constraints apply:

* **Token costs scale linearly**: each teammate has its own context window and consumes tokens independently. See [agent team token costs](/en/costs#agent-team-token-costs) for details.
* **Coordination overhead increases**: more teammates means more communication, task coordination, and potential for conflicts
* **Diminishing returns**: beyond a certain point, additional teammates don't speed up work proportionally

Start with 3-5 teammates for most workflows. This balances parallel work with manageable coordination. The examples in this guide use 3-5 teammates because that range works well across different task types.

Having 5-6 [tasks](/en/agent-teams#architecture) per teammate keeps everyone productive without excessive context switching. If you have 15 independent tasks, 3 teammates is a good starting point.

Scale up only when the work genuinely benefits from having teammates work simultaneously. Three focused teammates often outperform five scattered ones.

### Size tasks appropriately

* **Too small**: coordination overhead exceeds the benefit
* **Too large**: teammates work too long without check-ins, increasing risk of wasted effort
* **Just right**: self-contained units that produce a clear deliverable, such as a function, a test file, or a review

<Tip>
  The lead breaks work into tasks and assigns them to teammates automatically. If it isn't creating enough tasks, ask it to split the work into smaller pieces. Having 5-6 tasks per teammate keeps everyone productive and lets the lead reassign work if someone gets stuck.
</Tip>

### Wait for teammates to finish

Sometimes the lead starts implementing tasks itself instead of waiting for teammates. If you notice this:

```text  theme={null}
Wait for your teammates to complete their tasks before proceeding
```

### Start with research and review

If you're new to agent teams, start with tasks that have clear boundaries and don't require writing code: reviewing a PR, researching a library, or investigating a bug. These tasks show the value of parallel exploration without the coordination challenges that come with parallel implementation.

### Avoid file conflicts

Two teammates editing the same file leads to overwrites. Break the work so each teammate owns a different set of files.

### Monitor and steer

Check in on teammates' progress, redirect approaches that aren't working, and synthesize findings as they come in. Letting a team run unattended for too long increases the risk of wasted effort.

## Troubleshooting

### Teammates not appearing

If teammates aren't appearing after you ask Claude to create a team:

* In in-process mode, teammates may already be running but not visible. Press Shift+Down to cycle through active teammates.
* Check that the task you gave Claude was complex enough to warrant a team. Claude decides whether to spawn teammates based on the task.
* If you explicitly requested split panes, ensure tmux is installed and available in your PATH:
  ```bash  theme={null}
  which tmux
  ```
* For iTerm2, verify the `it2` CLI is installed and the Python API is enabled in iTerm2 preferences.

### Too many permission prompts

Teammate permission requests bubble up to the lead, which can create friction. Pre-approve common operations in your [permission settings](/en/permissions) before spawning teammates to reduce interruptions.

### Teammates stopping on errors

Teammates may stop after encountering errors instead of recovering. Check their output using Shift+Down in in-process mode or by clicking the pane in split mode, then either:

* Give them additional instructions directly
* Spawn a replacement teammate to continue the work

### Lead shuts down before work is done

The lead may decide the team is finished before all tasks are actually complete. If this happens, tell it to keep going. You can also tell the lead to wait for teammates to finish before proceeding if it starts doing work instead of delegating.

### Orphaned tmux sessions

If a tmux session persists after the team ends, it may not have been fully cleaned up. List sessions and kill the one created by the team:

```bash  theme={null}
tmux ls
tmux kill-session -t <session-name>
```

## Limitations

Agent teams are experimental. Current limitations to be aware of:

* **No session resumption with in-process teammates**: `/resume` and `/rewind` do not restore in-process teammates. After resuming a session, the lead may attempt to message teammates that no longer exist. If this happens, tell the lead to spawn new teammates.
* **Task status can lag**: teammates sometimes fail to mark tasks as completed, which blocks dependent tasks. If a task appears stuck, check whether the work is actually done and update the task status manually or tell the lead to nudge the teammate.
* **Shutdown can be slow**: teammates finish their current request or tool call before shutting down, which can take time.
* **One team per session**: a lead can only manage one team at a time. Clean up the current team before starting a new one.
* **No nested teams**: teammates cannot spawn their own teams or teammates. Only the lead can manage the team.
* **Lead is fixed**: the session that creates the team is the lead for its lifetime. You can't promote a teammate to lead or transfer leadership.
* **Permissions set at spawn**: all teammates start with the lead's permission mode. You can change individual teammate modes after spawning, but you can't set per-teammate modes at spawn time.
* **Split panes require tmux or iTerm2**: the default in-process mode works in any terminal. Split-pane mode isn't supported in VS Code's integrated terminal, Windows Terminal, or Ghostty.

<Tip>
  **`CLAUDE.md` works normally**: teammates read `CLAUDE.md` files from their working directory. Use this to provide project-specific guidance to all teammates.
</Tip>

## Next steps

Explore related approaches for parallel work and delegation:

* **Lightweight delegation**: [subagents](/en/sub-agents) spawn helper agents for research or verification within your session, better for tasks that don't need inter-agent coordination
* **Manual parallel sessions**: [Git worktrees](/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees) let you run multiple Claude Code sessions yourself without automated team coordination
* **Compare approaches**: see the [subagent vs agent team](/en/features-overview#compare-similar-features) comparison for a side-by-side breakdown
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create plugins

> Create custom plugins to extend Claude Code with skills, agents, hooks, and MCP servers.

Plugins let you extend Claude Code with custom functionality that can be shared across projects and teams. This guide covers creating your own plugins with skills, agents, hooks, and MCP servers.

Looking to install existing plugins? See [Discover and install plugins](/en/discover-plugins). For complete technical specifications, see [Plugins reference](/en/plugins-reference).

## When to use plugins vs standalone configuration

Claude Code supports two ways to add custom skills, agents, and hooks:

| Approach                                                    | Skill names          | Best for                                                                                        |
| :---------------------------------------------------------- | :------------------- | :---------------------------------------------------------------------------------------------- |
| **Standalone** (`.claude/` directory)                       | `/hello`             | Personal workflows, project-specific customizations, quick experiments                          |
| **Plugins** (directories with `.claude-plugin/plugin.json`) | `/plugin-name:hello` | Sharing with teammates, distributing to community, versioned releases, reusable across projects |

**Use standalone configuration when**:

* You're customizing Claude Code for a single project
* The configuration is personal and doesn't need to be shared
* You're experimenting with skills or hooks before packaging them
* You want short skill names like `/hello` or `/review`

**Use plugins when**:

* You want to share functionality with your team or community
* You need the same skills/agents across multiple projects
* You want version control and easy updates for your extensions
* You're distributing through a marketplace
* You're okay with namespaced skills like `/my-plugin:hello` (namespacing prevents conflicts between plugins)

<Tip>
  Start with standalone configuration in `.claude/` for quick iteration, then [convert to a plugin](#convert-existing-configurations-to-plugins) when you're ready to share.
</Tip>

## Quickstart

This quickstart walks you through creating a plugin with a custom skill. You'll create a manifest (the configuration file that defines your plugin), add a skill, and test it locally using the `--plugin-dir` flag.

### Prerequisites

* Claude Code [installed and authenticated](/en/quickstart#step-1-install-claude-code)
* Claude Code version 1.0.33 or later (run `claude --version` to check)

<Note>
  If you don't see the `/plugin` command, update Claude Code to the latest version. See [Troubleshooting](/en/troubleshooting) for upgrade instructions.
</Note>

### Create your first plugin

<Steps>
  <Step title="Create the plugin directory">
    Every plugin lives in its own directory containing a manifest and your skills, agents, or hooks. Create one now:

    ```bash  theme={null}
    mkdir my-first-plugin
    ```
  </Step>

  <Step title="Create the plugin manifest">
    The manifest file at `.claude-plugin/plugin.json` defines your plugin's identity: its name, description, and version. Claude Code uses this metadata to display your plugin in the plugin manager.

    Create the `.claude-plugin` directory inside your plugin folder:

    ```bash  theme={null}
    mkdir my-first-plugin/.claude-plugin
    ```

    Then create `my-first-plugin/.claude-plugin/plugin.json` with this content:

    ```json my-first-plugin/.claude-plugin/plugin.json theme={null}
    {
    "name": "my-first-plugin",
    "description": "A greeting plugin to learn the basics",
    "version": "1.0.0",
    "author": {
    "name": "Your Name"
    }
    }
    ```

    | Field         | Purpose                                                                                                |
    | :------------ | :----------------------------------------------------------------------------------------------------- |
    | `name`        | Unique identifier and skill namespace. Skills are prefixed with this (e.g., `/my-first-plugin:hello`). |
    | `description` | Shown in the plugin manager when browsing or installing plugins.                                       |
    | `version`     | Track releases using [semantic versioning](/en/plugins-reference#version-management).                  |
    | `author`      | Optional. Helpful for attribution.                                                                     |

    For additional fields like `homepage`, `repository`, and `license`, see the [full manifest schema](/en/plugins-reference#plugin-manifest-schema).
  </Step>

  <Step title="Add a skill">
    Skills live in the `skills/` directory. Each skill is a folder containing a `SKILL.md` file. The folder name becomes the skill name, prefixed with the plugin's namespace (`hello/` in a plugin named `my-first-plugin` creates `/my-first-plugin:hello`).

    Create a skill directory in your plugin folder:

    ```bash  theme={null}
    mkdir -p my-first-plugin/skills/hello
    ```

    Then create `my-first-plugin/skills/hello/SKILL.md` with this content:

    ```markdown my-first-plugin/skills/hello/SKILL.md theme={null}
    ---
    description: Greet the user with a friendly message
    disable-model-invocation: true
    ---

    Greet the user warmly and ask how you can help them today.
    ```
  </Step>

  <Step title="Test your plugin">
    Run Claude Code with the `--plugin-dir` flag to load your plugin:

    ```bash  theme={null}
    claude --plugin-dir ./my-first-plugin
    ```

    Once Claude Code starts, try your new skill:

    ```shell  theme={null}
    /my-first-plugin:hello
    ```

    You'll see Claude respond with a greeting. Run `/help` to see your skill listed under the plugin namespace.

    <Note>
      **Why namespacing?** Plugin skills are always namespaced (like `/greet:hello`) to prevent conflicts when multiple plugins have skills with the same name.

      To change the namespace prefix, update the `name` field in `plugin.json`.
    </Note>
  </Step>

  <Step title="Add skill arguments">
    Make your skill dynamic by accepting user input. The `$ARGUMENTS` placeholder captures any text the user provides after the skill name.

    Update your `SKILL.md` file:

    ```markdown my-first-plugin/skills/hello/SKILL.md theme={null}
    ---
    description: Greet the user with a personalized message
    ---

    # Hello Skill

    Greet the user named "$ARGUMENTS" warmly and ask how you can help them today. Make the greeting personal and encouraging.
    ```

    Restart Claude Code to pick up the changes, then try the skill with your name:

    ```shell  theme={null}
    /my-first-plugin:hello Alex
    ```

    Claude will greet you by name. For more on passing arguments to skills, see [Skills](/en/skills#pass-arguments-to-skills).
  </Step>
</Steps>

You've successfully created and tested a plugin with these key components:

* **Plugin manifest** (`.claude-plugin/plugin.json`): describes your plugin's metadata
* **Skills directory** (`skills/`): contains your custom skills
* **Skill arguments** (`$ARGUMENTS`): captures user input for dynamic behavior

<Tip>
  The `--plugin-dir` flag is useful for development and testing. When you're ready to share your plugin with others, see [Create and distribute a plugin marketplace](/en/plugin-marketplaces).
</Tip>

## Plugin structure overview

You've created a plugin with a skill, but plugins can include much more: custom agents, hooks, MCP servers, and LSP servers.

<Warning>
  **Common mistake**: Don't put `commands/`, `agents/`, `skills/`, or `hooks/` inside the `.claude-plugin/` directory. Only `plugin.json` goes inside `.claude-plugin/`. All other directories must be at the plugin root level.
</Warning>

| Directory         | Location    | Purpose                                                                        |
| :---------------- | :---------- | :----------------------------------------------------------------------------- |
| `.claude-plugin/` | Plugin root | Contains `plugin.json` manifest (optional if components use default locations) |
| `commands/`       | Plugin root | Skills as Markdown files                                                       |
| `agents/`         | Plugin root | Custom agent definitions                                                       |
| `skills/`         | Plugin root | Agent Skills with `SKILL.md` files                                             |
| `hooks/`          | Plugin root | Event handlers in `hooks.json`                                                 |
| `.mcp.json`       | Plugin root | MCP server configurations                                                      |
| `.lsp.json`       | Plugin root | LSP server configurations for code intelligence                                |
| `settings.json`   | Plugin root | Default [settings](/en/settings) applied when the plugin is enabled            |

<Note>
  **Next steps**: Ready to add more features? Jump to [Develop more complex plugins](#develop-more-complex-plugins) to add agents, hooks, MCP servers, and LSP servers. For complete technical specifications of all plugin components, see [Plugins reference](/en/plugins-reference).
</Note>

## Develop more complex plugins

Once you're comfortable with basic plugins, you can create more sophisticated extensions.

### Add Skills to your plugin

Plugins can include [Agent Skills](/en/skills) to extend Claude's capabilities. Skills are model-invoked: Claude automatically uses them based on the task context.

Add a `skills/` directory at your plugin root with Skill folders containing `SKILL.md` files:

```text  theme={null}
my-plugin/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── code-review/
        └── SKILL.md
```

Each `SKILL.md` needs frontmatter with `name` and `description` fields, followed by instructions:

```yaml  theme={null}
---
name: code-review
description: Reviews code for best practices and potential issues. Use when reviewing code, checking PRs, or analyzing code quality.
---

When reviewing code, check for:
1. Code organization and structure
2. Error handling
3. Security concerns
4. Test coverage
```

After installing the plugin, restart Claude Code to load the Skills. For complete Skill authoring guidance including progressive disclosure and tool restrictions, see [Agent Skills](/en/skills).

### Add LSP servers to your plugin

<Tip>
  For common languages like TypeScript, Python, and Rust, install the pre-built LSP plugins from the official marketplace. Create custom LSP plugins only when you need support for languages not already covered.
</Tip>

LSP (Language Server Protocol) plugins give Claude real-time code intelligence. If you need to support a language that doesn't have an official LSP plugin, you can create your own by adding an `.lsp.json` file to your plugin:

```json .lsp.json theme={null}
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

Users installing your plugin must have the language server binary installed on their machine.

For complete LSP configuration options, see [LSP servers](/en/plugins-reference#lsp-servers).

### Ship default settings with your plugin

Plugins can include a `settings.json` file at the plugin root to apply default configuration when the plugin is enabled. Currently, only the `agent` key is supported.

Setting `agent` activates one of the plugin's [custom agents](/en/sub-agents) as the main thread, applying its system prompt, tool restrictions, and model. This lets a plugin change how Claude Code behaves by default when enabled.

```json settings.json theme={null}
{
  "agent": "security-reviewer"
}
```

This example activates the `security-reviewer` agent defined in the plugin's `agents/` directory. Settings from `settings.json` take priority over `settings` declared in `plugin.json`. Unknown keys are silently ignored.

### Organize complex plugins

For plugins with many components, organize your directory structure by functionality. For complete directory layouts and organization patterns, see [Plugin directory structure](/en/plugins-reference#plugin-directory-structure).

### Test your plugins locally

Use the `--plugin-dir` flag to test plugins during development. This loads your plugin directly without requiring installation.

```bash  theme={null}
claude --plugin-dir ./my-plugin
```

As you make changes to your plugin, restart Claude Code to pick up the updates. Test your plugin components:

* Try your skills with `/plugin-name:skill-name`
* Check that agents appear in `/agents`
* Verify hooks work as expected

<Tip>
  You can load multiple plugins at once by specifying the flag multiple times:

  ```bash  theme={null}
  claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
  ```
</Tip>

### Debug plugin issues

If your plugin isn't working as expected:

1. **Check the structure**: Ensure your directories are at the plugin root, not inside `.claude-plugin/`
2. **Test components individually**: Check each command, agent, and hook separately
3. **Use validation and debugging tools**: See [Debugging and development tools](/en/plugins-reference#debugging-and-development-tools) for CLI commands and troubleshooting techniques

### Share your plugins

When your plugin is ready to share:

1. **Add documentation**: Include a `README.md` with installation and usage instructions
2. **Version your plugin**: Use [semantic versioning](/en/plugins-reference#version-management) in your `plugin.json`
3. **Create or use a marketplace**: Distribute through [plugin marketplaces](/en/plugin-marketplaces) for installation
4. **Test with others**: Have team members test the plugin before wider distribution

Once your plugin is in a marketplace, others can install it using the instructions in [Discover and install plugins](/en/discover-plugins).

### Submit your plugin to the official marketplace

To submit a plugin to the official Anthropic marketplace, use one of the in-app submission forms:

* **Claude.ai**: [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
* **Console**: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

<Note>
  For complete technical specifications, debugging techniques, and distribution strategies, see [Plugins reference](/en/plugins-reference).
</Note>

## Convert existing configurations to plugins

If you already have skills or hooks in your `.claude/` directory, you can convert them into a plugin for easier sharing and distribution.

### Migration steps

<Steps>
  <Step title="Create the plugin structure">
    Create a new plugin directory:

    ```bash  theme={null}
    mkdir -p my-plugin/.claude-plugin
    ```

    Create the manifest file at `my-plugin/.claude-plugin/plugin.json`:

    ```json my-plugin/.claude-plugin/plugin.json theme={null}
    {
      "name": "my-plugin",
      "description": "Migrated from standalone configuration",
      "version": "1.0.0"
    }
    ```
  </Step>

  <Step title="Copy your existing files">
    Copy your existing configurations to the plugin directory:

    ```bash  theme={null}
    # Copy commands
    cp -r .claude/commands my-plugin/

    # Copy agents (if any)
    cp -r .claude/agents my-plugin/

    # Copy skills (if any)
    cp -r .claude/skills my-plugin/
    ```
  </Step>

  <Step title="Migrate hooks">
    If you have hooks in your settings, create a hooks directory:

    ```bash  theme={null}
    mkdir my-plugin/hooks
    ```

    Create `my-plugin/hooks/hooks.json` with your hooks configuration. Copy the `hooks` object from your `.claude/settings.json` or `settings.local.json`, since the format is the same. The command receives hook input as JSON on stdin, so use `jq` to extract the file path:

    ```json my-plugin/hooks/hooks.json theme={null}
    {
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Write|Edit",
            "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix" }]
          }
        ]
      }
    }
    ```
  </Step>

  <Step title="Test your migrated plugin">
    Load your plugin to verify everything works:

    ```bash  theme={null}
    claude --plugin-dir ./my-plugin
    ```

    Test each component: run your commands, check agents appear in `/agents`, and verify hooks trigger correctly.
  </Step>
</Steps>

### What changes when migrating

| Standalone (`.claude/`)       | Plugin                           |
| :---------------------------- | :------------------------------- |
| Only available in one project | Can be shared via marketplaces   |
| Files in `.claude/commands/`  | Files in `plugin-name/commands/` |
| Hooks in `settings.json`      | Hooks in `hooks/hooks.json`      |
| Must manually copy to share   | Install with `/plugin install`   |

<Note>
  After migrating, you can remove the original files from `.claude/` to avoid duplicates. The plugin version will take precedence when loaded.
</Note>

## Next steps

Now that you understand Claude Code's plugin system, here are suggested paths for different goals:

### For plugin users

* [Discover and install plugins](/en/discover-plugins): browse marketplaces and install plugins
* [Configure team marketplaces](/en/discover-plugins#configure-team-marketplaces): set up repository-level plugins for your team

### For plugin developers

* [Create and distribute a marketplace](/en/plugin-marketplaces): package and share your plugins
* [Plugins reference](/en/plugins-reference): complete technical specifications
* Dive deeper into specific plugin components:
  * [Skills](/en/skills): skill development details
  * [Subagents](/en/sub-agents): agent configuration and capabilities
  * [Hooks](/en/hooks): event handling and automation
  * [MCP](/en/mcp): external tool integration
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Discover and install prebuilt plugins through marketplaces

> Find and install plugins from marketplaces to extend Claude Code with new commands, agents, and capabilities.

Plugins extend Claude Code with skills, agents, hooks, and MCP servers. Plugin marketplaces are catalogs that help you discover and install these extensions without building them yourself.

Looking to create and distribute your own marketplace? See [Create and distribute a plugin marketplace](/en/plugin-marketplaces).

## How marketplaces work

A marketplace is a catalog of plugins that someone else has created and shared. Using a marketplace is a two-step process:

<Steps>
  <Step title="Add the marketplace">
    This registers the catalog with Claude Code so you can browse what's available. No plugins are installed yet.
  </Step>

  <Step title="Install individual plugins">
    Browse the catalog and install the plugins you want.
  </Step>
</Steps>

Think of it like adding an app store: adding the store gives you access to browse its collection, but you still choose which apps to download individually.

## Official Anthropic marketplace

The official Anthropic marketplace (`claude-plugins-official`) is automatically available when you start Claude Code. Run `/plugin` and go to the **Discover** tab to browse what's available.

To install a plugin from the official marketplace:

```shell  theme={null}
/plugin install plugin-name@claude-plugins-official
```

<Note>
  The official marketplace is maintained by Anthropic. To submit a plugin to the official marketplace, use one of the in-app submission forms:

  * **Claude.ai**: [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
  * **Console**: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

  To distribute plugins independently, [create your own marketplace](/en/plugin-marketplaces) and share it with users.
</Note>

The official marketplace includes several categories of plugins:

### Code intelligence

Code intelligence plugins enable Claude Code's built-in LSP tool, giving Claude the ability to jump to definitions, find references, and see type errors immediately after edits. These plugins configure [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) connections, the same technology that powers VS Code's code intelligence.

These plugins require the language server binary to be installed on your system. If you already have a language server installed, Claude may prompt you to install the corresponding plugin when you open a project.

| Language   | Plugin              | Binary required              |
| :--------- | :------------------ | :--------------------------- |
| C/C++      | `clangd-lsp`        | `clangd`                     |
| C#         | `csharp-lsp`        | `csharp-ls`                  |
| Go         | `gopls-lsp`         | `gopls`                      |
| Java       | `jdtls-lsp`         | `jdtls`                      |
| Kotlin     | `kotlin-lsp`        | `kotlin-language-server`     |
| Lua        | `lua-lsp`           | `lua-language-server`        |
| PHP        | `php-lsp`           | `intelephense`               |
| Python     | `pyright-lsp`       | `pyright-langserver`         |
| Rust       | `rust-analyzer-lsp` | `rust-analyzer`              |
| Swift      | `swift-lsp`         | `sourcekit-lsp`              |
| TypeScript | `typescript-lsp`    | `typescript-language-server` |

You can also [create your own LSP plugin](/en/plugins-reference#lsp-servers) for other languages.

<Note>
  If you see `Executable not found in $PATH` in the `/plugin` Errors tab after installing a plugin, install the required binary from the table above.
</Note>

#### What Claude gains from code intelligence plugins

Once a code intelligence plugin is installed and its language server binary is available, Claude gains two capabilities:

* **Automatic diagnostics**: after every file edit Claude makes, the language server analyzes the changes and reports errors and warnings back automatically. Claude sees type errors, missing imports, and syntax issues without needing to run a compiler or linter. If Claude introduces an error, it notices and fixes the issue in the same turn. This requires no configuration beyond installing the plugin. You can see diagnostics inline by pressing **Ctrl+O** when the "diagnostics found" indicator appears.
* **Code navigation**: Claude can use the language server to jump to definitions, find references, get type info on hover, list symbols, find implementations, and trace call hierarchies. These operations give Claude more precise navigation than grep-based search, though availability may vary by language and environment.

If you run into issues, see [Code intelligence troubleshooting](#code-intelligence-issues).

### External integrations

These plugins bundle pre-configured [MCP servers](/en/mcp) so you can connect Claude to external services without manual setup:

* **Source control**: `github`, `gitlab`
* **Project management**: `atlassian` (Jira/Confluence), `asana`, `linear`, `notion`
* **Design**: `figma`
* **Infrastructure**: `vercel`, `firebase`, `supabase`
* **Communication**: `slack`
* **Monitoring**: `sentry`

### Development workflows

Plugins that add commands and agents for common development tasks:

* **commit-commands**: Git commit workflows including commit, push, and PR creation
* **pr-review-toolkit**: Specialized agents for reviewing pull requests
* **agent-sdk-dev**: Tools for building with the Claude Agent SDK
* **plugin-dev**: Toolkit for creating your own plugins

### Output styles

Customize how Claude responds:

* **explanatory-output-style**: Educational insights about implementation choices
* **learning-output-style**: Interactive learning mode for skill building

## Try it: add the demo marketplace

Anthropic also maintains a [demo plugins marketplace](https://github.com/anthropics/claude-code/tree/main/plugins) (`claude-code-plugins`) with example plugins that show what's possible with the plugin system. Unlike the official marketplace, you need to add this one manually.

<Steps>
  <Step title="Add the marketplace">
    From within Claude Code, run the `plugin marketplace add` command for the `anthropics/claude-code` marketplace:

    ```shell  theme={null}
    /plugin marketplace add anthropics/claude-code
    ```

    This downloads the marketplace catalog and makes its plugins available to you.
  </Step>

  <Step title="Browse available plugins">
    Run `/plugin` to open the plugin manager. This opens a tabbed interface with four tabs you can cycle through using **Tab** (or **Shift+Tab** to go backward):

    * **Discover**: browse available plugins from all your marketplaces
    * **Installed**: view and manage your installed plugins
    * **Marketplaces**: add, remove, or update your added marketplaces
    * **Errors**: view any plugin loading errors

    Go to the **Discover** tab to see plugins from the marketplace you just added.
  </Step>

  <Step title="Install a plugin">
    Select a plugin to view its details, then choose an installation scope:

    * **User scope**: install for yourself across all projects
    * **Project scope**: install for all collaborators on this repository
    * **Local scope**: install for yourself in this repository only

    For example, select **commit-commands** (a plugin that adds git workflow commands) and install it to your user scope.

    You can also install directly from the command line:

    ```shell  theme={null}
    /plugin install commit-commands@anthropics-claude-code
    ```

    See [Configuration scopes](/en/settings#configuration-scopes) to learn more about scopes.
  </Step>

  <Step title="Use your new plugin">
    After installing, the plugin's commands are immediately available. Plugin commands are namespaced by the plugin name, so **commit-commands** provides commands like `/commit-commands:commit`.

    Try it out by making a change to a file and running:

    ```shell  theme={null}
    /commit-commands:commit
    ```

    This stages your changes, generates a commit message, and creates the commit.

    Each plugin works differently. Check the plugin's description in the **Discover** tab or its homepage to learn what commands and capabilities it provides.
  </Step>
</Steps>

The rest of this guide covers all the ways you can add marketplaces, install plugins, and manage your configuration.

## Add marketplaces

Use the `/plugin marketplace add` command to add marketplaces from different sources.

<Tip>
  **Shortcuts**: You can use `/plugin market` instead of `/plugin marketplace`, and `rm` instead of `remove`.
</Tip>

* **GitHub repositories**: `owner/repo` format (for example, `anthropics/claude-code`)
* **Git URLs**: any git repository URL (GitLab, Bitbucket, self-hosted)
* **Local paths**: directories or direct paths to `marketplace.json` files
* **Remote URLs**: direct URLs to hosted `marketplace.json` files

### Add from GitHub

Add a GitHub repository that contains a `.claude-plugin/marketplace.json` file using the `owner/repo` format—where `owner` is the GitHub username or organization and `repo` is the repository name.

For example, `anthropics/claude-code` refers to the `claude-code` repository owned by `anthropics`:

```shell  theme={null}
/plugin marketplace add anthropics/claude-code
```

### Add from other Git hosts

Add any git repository by providing the full URL. This works with any Git host, including GitLab, Bitbucket, and self-hosted servers:

Using HTTPS:

```shell  theme={null}
/plugin marketplace add https://gitlab.com/company/plugins.git
```

Using SSH:

```shell  theme={null}
/plugin marketplace add git@gitlab.com:company/plugins.git
```

To add a specific branch or tag, append `#` followed by the ref:

```shell  theme={null}
/plugin marketplace add https://gitlab.com/company/plugins.git#v1.0.0
```

### Add from local paths

Add a local directory that contains a `.claude-plugin/marketplace.json` file:

```shell  theme={null}
/plugin marketplace add ./my-marketplace
```

You can also add a direct path to a `marketplace.json` file:

```shell  theme={null}
/plugin marketplace add ./path/to/marketplace.json
```

### Add from remote URLs

Add a remote `marketplace.json` file via URL:

```shell  theme={null}
/plugin marketplace add https://example.com/marketplace.json
```

<Note>
  URL-based marketplaces have some limitations compared to Git-based marketplaces. If you encounter "path not found" errors when installing plugins, see [Troubleshooting](/en/plugin-marketplaces#plugins-with-relative-paths-fail-in-url-based-marketplaces).
</Note>

## Install plugins

Once you've added marketplaces, you can install plugins directly (installs to user scope by default):

```shell  theme={null}
/plugin install plugin-name@marketplace-name
```

To choose a different [installation scope](/en/settings#configuration-scopes), use the interactive UI: run `/plugin`, go to the **Discover** tab, and press **Enter** on a plugin. You'll see options for:

* **User scope** (default): install for yourself across all projects
* **Project scope**: install for all collaborators on this repository (adds to `.claude/settings.json`)
* **Local scope**: install for yourself in this repository only (not shared with collaborators)

You may also see plugins with **managed** scope—these are installed by administrators via [managed settings](/en/settings#settings-files) and cannot be modified.

Run `/plugin` and go to the **Installed** tab to see your plugins grouped by scope.

<Warning>
  Make sure you trust a plugin before installing it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they work as intended. Check each plugin's homepage for more information.
</Warning>

## Manage installed plugins

Run `/plugin` and go to the **Installed** tab to view, enable, disable, or uninstall your plugins. Type to filter the list by plugin name or description.

You can also manage plugins with direct commands.

Disable a plugin without uninstalling:

```shell  theme={null}
/plugin disable plugin-name@marketplace-name
```

Re-enable a disabled plugin:

```shell  theme={null}
/plugin enable plugin-name@marketplace-name
```

Completely remove a plugin:

```shell  theme={null}
/plugin uninstall plugin-name@marketplace-name
```

The `--scope` option lets you target a specific scope with CLI commands:

```shell  theme={null}
claude plugin install formatter@your-org --scope project
claude plugin uninstall formatter@your-org --scope project
```

### Apply plugin changes without restarting

When you install, enable, or disable plugins during a session, some changes (like new commands and hooks) take effect immediately. Others, including LSP server updates, require a restart.

To activate all pending plugin changes without restarting, run:

```shell  theme={null}
/reload-plugins
```

Claude Code reloads all active plugins and reports what was loaded. If any LSP servers were added or updated, it will let you know those require a restart to take effect.

## Manage marketplaces

You can manage marketplaces through the interactive `/plugin` interface or with CLI commands.

### Use the interactive interface

Run `/plugin` and go to the **Marketplaces** tab to:

* View all your added marketplaces with their sources and status
* Add new marketplaces
* Update marketplace listings to fetch the latest plugins
* Remove marketplaces you no longer need

### Use CLI commands

You can also manage marketplaces with direct commands.

List all configured marketplaces:

```shell  theme={null}
/plugin marketplace list
```

Refresh plugin listings from a marketplace:

```shell  theme={null}
/plugin marketplace update marketplace-name
```

Remove a marketplace:

```shell  theme={null}
/plugin marketplace remove marketplace-name
```

<Warning>
  Removing a marketplace will uninstall any plugins you installed from it.
</Warning>

### Configure auto-updates

Claude Code can automatically update marketplaces and their installed plugins at startup. When auto-update is enabled for a marketplace, Claude Code refreshes the marketplace data and updates installed plugins to their latest versions. If any plugins were updated, you'll see a notification suggesting you restart Claude Code.

Toggle auto-update for individual marketplaces through the UI:

1. Run `/plugin` to open the plugin manager
2. Select **Marketplaces**
3. Choose a marketplace from the list
4. Select **Enable auto-update** or **Disable auto-update**

Official Anthropic marketplaces have auto-update enabled by default. Third-party and local development marketplaces have auto-update disabled by default.

To disable all automatic updates entirely for both Claude Code and all plugins, set the `DISABLE_AUTOUPDATER` environment variable. See [Auto updates](/en/setup#auto-updates) for details.

To keep plugin auto-updates enabled while disabling Claude Code auto-updates, set `FORCE_AUTOUPDATE_PLUGINS=true` along with `DISABLE_AUTOUPDATER`:

```shell  theme={null}
export DISABLE_AUTOUPDATER=true
export FORCE_AUTOUPDATE_PLUGINS=true
```

This is useful when you want to manage Claude Code updates manually but still receive automatic plugin updates.

## Configure team marketplaces

Team admins can set up automatic marketplace installation for projects by adding marketplace configuration to `.claude/settings.json`. When team members trust the repository folder, Claude Code prompts them to install these marketplaces and plugins.

Add `extraKnownMarketplaces` to your project's `.claude/settings.json`:

```json  theme={null}
{
  "extraKnownMarketplaces": {
    "my-team-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  }
}
```

For full configuration options including `extraKnownMarketplaces` and `enabledPlugins`, see [Plugin settings](/en/settings#plugin-settings).

## Security

Plugins and marketplaces are highly trusted components that can execute arbitrary code on your machine with your user privileges. Only install plugins and add marketplaces from sources you trust. Organizations can restrict which marketplaces users are allowed to add using [managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions).

## Troubleshooting

### /plugin command not recognized

If you see "unknown command" or the `/plugin` command doesn't appear:

1. **Check your version**: Run `claude --version`. Plugins require version 1.0.33 or later.
2. **Update Claude Code**:
   * **Homebrew**: `brew upgrade claude-code`
   * **npm**: `npm update -g @anthropic-ai/claude-code`
   * **Native installer**: Re-run the install command from [Setup](/en/setup)
3. **Restart Claude Code**: After updating, restart your terminal and run `claude` again.

### Common issues

* **Marketplace not loading**: Verify the URL is accessible and that `.claude-plugin/marketplace.json` exists at the path
* **Plugin installation failures**: Check that plugin source URLs are accessible and repositories are public (or you have access)
* **Files not found after installation**: Plugins are copied to a cache, so paths referencing files outside the plugin directory won't work
* **Plugin skills not appearing**: Clear the cache with `rm -rf ~/.claude/plugins/cache`, restart Claude Code, and reinstall the plugin.

For detailed troubleshooting with solutions, see [Troubleshooting](/en/plugin-marketplaces#troubleshooting) in the marketplace guide. For debugging tools, see [Debugging and development tools](/en/plugins-reference#debugging-and-development-tools).

### Code intelligence issues

* **Language server not starting**: verify the binary is installed and available in your `$PATH`. Check the `/plugin` Errors tab for details.
* **High memory usage**: language servers like `rust-analyzer` and `pyright` can consume significant memory on large projects. If you experience memory issues, disable the plugin with `/plugin disable <plugin-name>` and rely on Claude's built-in search tools instead.
* **False positive diagnostics in monorepos**: language servers may report unresolved import errors for internal packages if the workspace isn't configured correctly. These don't affect Claude's ability to edit code.

## Next steps

* **Build your own plugins**: See [Plugins](/en/plugins) to create skills, agents, and hooks
* **Create a marketplace**: See [Create a plugin marketplace](/en/plugin-marketplaces) to distribute plugins to your team or community
* **Technical reference**: See [Plugins reference](/en/plugins-reference) for complete specifications
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Extend Claude with skills

> Create, manage, and share skills to extend Claude's capabilities in Claude Code. Includes custom commands and bundled skills.

Skills extend what Claude can do. Create a `SKILL.md` file with instructions, and Claude adds it to its toolkit. Claude uses skills when relevant, or you can invoke one directly with `/skill-name`.

<Note>
  For built-in commands like `/help` and `/compact`, see [interactive mode](/en/interactive-mode#built-in-commands).

  **Custom commands have been merged into skills.** A file at `.claude/commands/review.md` and a skill at `.claude/skills/review/SKILL.md` both create `/review` and work the same way. Your existing `.claude/commands/` files keep working. Skills add optional features: a directory for supporting files, frontmatter to [control whether you or Claude invokes them](#control-who-invokes-a-skill), and the ability for Claude to load them automatically when relevant.
</Note>

Claude Code skills follow the [Agent Skills](https://agentskills.io) open standard, which works across multiple AI tools. Claude Code extends the standard with additional features like [invocation control](#control-who-invokes-a-skill), [subagent execution](#run-skills-in-a-subagent), and [dynamic context injection](#inject-dynamic-context).

## Bundled skills

Bundled skills ship with Claude Code and are available in every session. Unlike [built-in commands](/en/interactive-mode#built-in-commands), which execute fixed logic directly, bundled skills are prompt-based: they give Claude a detailed playbook and let it orchestrate the work using its tools. This means bundled skills can spawn parallel agents, read files, and adapt to your codebase.

You invoke bundled skills the same way as any other skill: type `/` followed by the skill name.

* **`/simplify`**: reviews your recently changed files for code reuse, quality, and efficiency issues, then fixes them. Run it after implementing a feature or bug fix to clean up your work. It spawns three review agents in parallel (code reuse, code quality, efficiency), aggregates their findings, and applies fixes. Pass optional text to focus on specific concerns: `/simplify focus on memory efficiency`.

* **`/batch <instruction>`**: orchestrates large-scale changes across a codebase in parallel. Provide a description of the change and `/batch` researches the codebase, decomposes the work into 5 to 30 independent units, and presents a plan for your approval. Once approved, it spawns one background agent per unit, each in an isolated [git worktree](/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees). Each agent implements its unit, runs tests, and opens a pull request. Requires a git repository. Example: `/batch migrate src/ from Solid to React`.

* **`/debug [description]`**: troubleshoots your current Claude Code session by reading the session debug log. Optionally describe the issue to focus the analysis.

* **`/claude-api`**: loads Claude API reference material for your project's language (Python, TypeScript, Java, Go, Ruby, C#, PHP, or cURL) and Agent SDK reference for Python and TypeScript. Covers tool use, streaming, batches, structured outputs, and common pitfalls. Also activates automatically when your code imports `anthropic`, `@anthropic-ai/sdk`, or `claude_agent_sdk`.

## Getting started

### Create your first skill

This example creates a skill that teaches Claude to explain code using visual diagrams and analogies. Since it uses default frontmatter, Claude can load it automatically when you ask how something works, or you can invoke it directly with `/explain-code`.

<Steps>
  <Step title="Create the skill directory">
    Create a directory for the skill in your personal skills folder. Personal skills are available across all your projects.

    ```bash  theme={null}
    mkdir -p ~/.claude/skills/explain-code
    ```
  </Step>

  <Step title="Write SKILL.md">
    Every skill needs a `SKILL.md` file with two parts: YAML frontmatter (between `---` markers) that tells Claude when to use the skill, and markdown content with instructions Claude follows when the skill is invoked. The `name` field becomes the `/slash-command`, and the `description` helps Claude decide when to load it automatically.

    Create `~/.claude/skills/explain-code/SKILL.md`:

    ```yaml  theme={null}
    ---
    name: explain-code
    description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
    ---

    When explaining code, always include:

    1. **Start with an analogy**: Compare the code to something from everyday life
    2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
    3. **Walk through the code**: Explain step-by-step what happens
    4. **Highlight a gotcha**: What's a common mistake or misconception?

    Keep explanations conversational. For complex concepts, use multiple analogies.
    ```
  </Step>

  <Step title="Test the skill">
    You can test it two ways:

    **Let Claude invoke it automatically** by asking something that matches the description:

    ```text  theme={null}
    How does this code work?
    ```

    **Or invoke it directly** with the skill name:

    ```text  theme={null}
    /explain-code src/auth/login.ts
    ```

    Either way, Claude should include an analogy and ASCII diagram in its explanation.
  </Step>
</Steps>

### Where skills live

Where you store a skill determines who can use it:

| Location   | Path                                                | Applies to                     |
| :--------- | :-------------------------------------------------- | :----------------------------- |
| Enterprise | See [managed settings](/en/settings#settings-files) | All users in your organization |
| Personal   | `~/.claude/skills/<skill-name>/SKILL.md`            | All your projects              |
| Project    | `.claude/skills/<skill-name>/SKILL.md`              | This project only              |
| Plugin     | `<plugin>/skills/<skill-name>/SKILL.md`             | Where plugin is enabled        |

When skills share the same name across levels, higher-priority locations win: enterprise > personal > project. Plugin skills use a `plugin-name:skill-name` namespace, so they cannot conflict with other levels. If you have files in `.claude/commands/`, those work the same way, but if a skill and a command share the same name, the skill takes precedence.

#### Automatic discovery from nested directories

When you work with files in subdirectories, Claude Code automatically discovers skills from nested `.claude/skills/` directories. For example, if you're editing a file in `packages/frontend/`, Claude Code also looks for skills in `packages/frontend/.claude/skills/`. This supports monorepo setups where packages have their own skills.

Each skill is a directory with `SKILL.md` as the entrypoint:

```text  theme={null}
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill in
├── examples/
│   └── sample.md      # Example output showing expected format
└── scripts/
    └── validate.sh    # Script Claude can execute
```

The `SKILL.md` contains the main instructions and is required. Other files are optional and let you build more powerful skills: templates for Claude to fill in, example outputs showing the expected format, scripts Claude can execute, or detailed reference documentation. Reference these files from your `SKILL.md` so Claude knows what they contain and when to load them. See [Add supporting files](#add-supporting-files) for more details.

<Note>
  Files in `.claude/commands/` still work and support the same [frontmatter](#frontmatter-reference). Skills are recommended since they support additional features like supporting files.
</Note>

#### Skills from additional directories

Skills defined in `.claude/skills/` within directories added via `--add-dir` are loaded automatically and picked up by live change detection, so you can edit them during a session without restarting.

<Note>
  CLAUDE.md files from `--add-dir` directories are not loaded by default. To load them, set `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`. See [Load from additional directories](/en/memory#load-from-additional-directories).
</Note>

## Configure skills

Skills are configured through YAML frontmatter at the top of `SKILL.md` and the markdown content that follows.

### Types of skill content

Skill files can contain any instructions, but thinking about how you want to invoke them helps guide what to include:

**Reference content** adds knowledge Claude applies to your current work. Conventions, patterns, style guides, domain knowledge. This content runs inline so Claude can use it alongside your conversation context.

```yaml  theme={null}
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

**Task content** gives Claude step-by-step instructions for a specific action, like deployments, commits, or code generation. These are often actions you want to invoke directly with `/skill-name` rather than letting Claude decide when to run them. Add `disable-model-invocation: true` to prevent Claude from triggering it automatically.

```yaml  theme={null}
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

Your `SKILL.md` can contain anything, but thinking through how you want the skill invoked (by you, by Claude, or both) and where you want it to run (inline or in a subagent) helps guide what to include. For complex skills, you can also [add supporting files](#add-supporting-files) to keep the main skill focused.

### Frontmatter reference

Beyond the markdown content, you can configure skill behavior using YAML frontmatter fields between `---` markers at the top of your `SKILL.md` file:

```yaml  theme={null}
---
name: my-skill
description: What this skill does
disable-model-invocation: true
allowed-tools: Read, Grep
---

Your skill instructions here...
```

All fields are optional. Only `description` is recommended so Claude knows when to use the skill.

| Field                      | Required    | Description                                                                                                                                           |
| :------------------------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                     | No          | Display name for the skill. If omitted, uses the directory name. Lowercase letters, numbers, and hyphens only (max 64 characters).                    |
| `description`              | Recommended | What the skill does and when to use it. Claude uses this to decide when to apply the skill. If omitted, uses the first paragraph of markdown content. |
| `argument-hint`            | No          | Hint shown during autocomplete to indicate expected arguments. Example: `[issue-number]` or `[filename] [format]`.                                    |
| `disable-model-invocation` | No          | Set to `true` to prevent Claude from automatically loading this skill. Use for workflows you want to trigger manually with `/name`. Default: `false`. |
| `user-invocable`           | No          | Set to `false` to hide from the `/` menu. Use for background knowledge users shouldn't invoke directly. Default: `true`.                              |
| `allowed-tools`            | No          | Tools Claude can use without asking permission when this skill is active.                                                                             |
| `model`                    | No          | Model to use when this skill is active.                                                                                                               |
| `context`                  | No          | Set to `fork` to run in a forked subagent context.                                                                                                    |
| `agent`                    | No          | Which subagent type to use when `context: fork` is set.                                                                                               |
| `hooks`                    | No          | Hooks scoped to this skill's lifecycle. See [Hooks in skills and agents](/en/hooks#hooks-in-skills-and-agents) for configuration format.              |

#### Available string substitutions

Skills support string substitution for dynamic values in the skill content:

| Variable               | Description                                                                                                                                                                                                                                                                              |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$ARGUMENTS`           | All arguments passed when invoking the skill. If `$ARGUMENTS` is not present in the content, arguments are appended as `ARGUMENTS: <value>`.                                                                                                                                             |
| `$ARGUMENTS[N]`        | Access a specific argument by 0-based index, such as `$ARGUMENTS[0]` for the first argument.                                                                                                                                                                                             |
| `$N`                   | Shorthand for `$ARGUMENTS[N]`, such as `$0` for the first argument or `$1` for the second.                                                                                                                                                                                               |
| `${CLAUDE_SESSION_ID}` | The current session ID. Useful for logging, creating session-specific files, or correlating skill output with sessions.                                                                                                                                                                  |
| `${CLAUDE_SKILL_DIR}`  | The directory containing the skill's `SKILL.md` file. For plugin skills, this is the skill's subdirectory within the plugin, not the plugin root. Use this in bash injection commands to reference scripts or files bundled with the skill, regardless of the current working directory. |

**Example using substitutions:**

```yaml  theme={null}
---
name: session-logger
description: Log activity for this session
---

Log the following to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

### Add supporting files

Skills can include multiple files in their directory. This keeps `SKILL.md` focused on the essentials while letting Claude access detailed reference material only when needed. Large reference docs, API specifications, or example collections don't need to load into context every time the skill runs.

```text  theme={null}
my-skill/
├── SKILL.md (required - overview and navigation)
├── reference.md (detailed API docs - loaded when needed)
├── examples.md (usage examples - loaded when needed)
└── scripts/
    └── helper.py (utility script - executed, not loaded)
```

Reference supporting files from `SKILL.md` so Claude knows what each file contains and when to load it:

```markdown  theme={null}
## Additional resources

- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

<Tip>Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files.</Tip>

### Control who invokes a skill

By default, both you and Claude can invoke any skill. You can type `/skill-name` to invoke it directly, and Claude can load it automatically when relevant to your conversation. Two frontmatter fields let you restrict this:

* **`disable-model-invocation: true`**: Only you can invoke the skill. Use this for workflows with side effects or that you want to control timing, like `/commit`, `/deploy`, or `/send-slack-message`. You don't want Claude deciding to deploy because your code looks ready.

* **`user-invocable: false`**: Only Claude can invoke the skill. Use this for background knowledge that isn't actionable as a command. A `legacy-system-context` skill explains how an old system works. Claude should know this when relevant, but `/legacy-system-context` isn't a meaningful action for users to take.

This example creates a deploy skill that only you can trigger. The `disable-model-invocation: true` field prevents Claude from running it automatically:

```yaml  theme={null}
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:

1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

Here's how the two fields affect invocation and context loading:

| Frontmatter                      | You can invoke | Claude can invoke | When loaded into context                                     |
| :------------------------------- | :------------- | :---------------- | :----------------------------------------------------------- |
| (default)                        | Yes            | Yes               | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | Yes            | No                | Description not in context, full skill loads when you invoke |
| `user-invocable: false`          | No             | Yes               | Description always in context, full skill loads when invoked |

<Note>
  In a regular session, skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked. [Subagents with preloaded skills](/en/sub-agents#preload-skills-into-subagents) work differently: the full skill content is injected at startup.
</Note>

### Restrict tool access

Use the `allowed-tools` field to limit which tools Claude can use when a skill is active. This skill creates a read-only mode where Claude can explore files but not modify them:

```yaml  theme={null}
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---
```

### Pass arguments to skills

Both you and Claude can pass arguments when invoking a skill. Arguments are available via the `$ARGUMENTS` placeholder.

This skill fixes a GitHub issue by number. The `$ARGUMENTS` placeholder gets replaced with whatever follows the skill name:

```yaml  theme={null}
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Understand the requirements
3. Implement the fix
4. Write tests
5. Create a commit
```

When you run `/fix-issue 123`, Claude receives "Fix GitHub issue 123 following our coding standards..."

If you invoke a skill with arguments but the skill doesn't include `$ARGUMENTS`, Claude Code appends `ARGUMENTS: <your input>` to the end of the skill content so Claude still sees what you typed.

To access individual arguments by position, use `$ARGUMENTS[N]` or the shorter `$N`:

```yaml  theme={null}
---
name: migrate-component
description: Migrate a component from one framework to another
---

Migrate the $ARGUMENTS[0] component from $ARGUMENTS[1] to $ARGUMENTS[2].
Preserve all existing behavior and tests.
```

Running `/migrate-component SearchBar React Vue` replaces `$ARGUMENTS[0]` with `SearchBar`, `$ARGUMENTS[1]` with `React`, and `$ARGUMENTS[2]` with `Vue`. The same skill using the `$N` shorthand:

```yaml  theme={null}
---
name: migrate-component
description: Migrate a component from one framework to another
---

Migrate the $0 component from $1 to $2.
Preserve all existing behavior and tests.
```

## Advanced patterns

### Inject dynamic context

The `!`command\`\` syntax runs shell commands before the skill content is sent to Claude. The command output replaces the placeholder, so Claude receives actual data, not the command itself.

This skill summarizes a pull request by fetching live PR data with the GitHub CLI. The `!`gh pr diff\`\` and other commands run first, and their output gets inserted into the prompt:

```yaml  theme={null}
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

When this skill runs:

1. Each `!`command\`\` executes immediately (before Claude sees anything)
2. The output replaces the placeholder in the skill content
3. Claude receives the fully-rendered prompt with actual PR data

This is preprocessing, not something Claude executes. Claude only sees the final result.

<Tip>
  To enable [extended thinking](/en/common-workflows#use-extended-thinking-thinking-mode) in a skill, include the word "ultrathink" anywhere in your skill content.
</Tip>

### Run skills in a subagent

Add `context: fork` to your frontmatter when you want a skill to run in isolation. The skill content becomes the prompt that drives the subagent. It won't have access to your conversation history.

<Warning>
  `context: fork` only makes sense for skills with explicit instructions. If your skill contains guidelines like "use these API conventions" without a task, the subagent receives the guidelines but no actionable prompt, and returns without meaningful output.
</Warning>

Skills and [subagents](/en/sub-agents) work together in two directions:

| Approach                     | System prompt                             | Task                        | Also loads                   |
| :--------------------------- | :---------------------------------------- | :-------------------------- | :--------------------------- |
| Skill with `context: fork`   | From agent type (`Explore`, `Plan`, etc.) | SKILL.md content            | CLAUDE.md                    |
| Subagent with `skills` field | Subagent's markdown body                  | Claude's delegation message | Preloaded skills + CLAUDE.md |

With `context: fork`, you write the task in your skill and pick an agent type to execute it. For the inverse (defining a custom subagent that uses skills as reference material), see [Subagents](/en/sub-agents#preload-skills-into-subagents).

#### Example: Research skill using Explore agent

This skill runs research in a forked Explore agent. The skill content becomes the task, and the agent provides read-only tools optimized for codebase exploration:

```yaml  theme={null}
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

When this skill runs:

1. A new isolated context is created
2. The subagent receives the skill content as its prompt ("Research \$ARGUMENTS thoroughly...")
3. The `agent` field determines the execution environment (model, tools, and permissions)
4. Results are summarized and returned to your main conversation

The `agent` field specifies which subagent configuration to use. Options include built-in agents (`Explore`, `Plan`, `general-purpose`) or any custom subagent from `.claude/agents/`. If omitted, uses `general-purpose`.

### Restrict Claude's skill access

By default, Claude can invoke any skill that doesn't have `disable-model-invocation: true` set. Skills that define `allowed-tools` grant Claude access to those tools without per-use approval when the skill is active. Your [permission settings](/en/permissions) still govern baseline approval behavior for all other tools. Built-in commands like `/compact` and `/init` are not available through the Skill tool.

Three ways to control which skills Claude can invoke:

**Disable all skills** by denying the Skill tool in `/permissions`:

```text  theme={null}
# Add to deny rules:
Skill
```

**Allow or deny specific skills** using [permission rules](/en/permissions):

```text  theme={null}
# Allow only specific skills
Skill(commit)
Skill(review-pr *)

# Deny specific skills
Skill(deploy *)
```

Permission syntax: `Skill(name)` for exact match, `Skill(name *)` for prefix match with any arguments.

**Hide individual skills** by adding `disable-model-invocation: true` to their frontmatter. This removes the skill from Claude's context entirely.

<Note>
  The `user-invocable` field only controls menu visibility, not Skill tool access. Use `disable-model-invocation: true` to block programmatic invocation.
</Note>

## Share skills

Skills can be distributed at different scopes depending on your audience:

* **Project skills**: Commit `.claude/skills/` to version control
* **Plugins**: Create a `skills/` directory in your [plugin](/en/plugins)
* **Managed**: Deploy organization-wide through [managed settings](/en/settings#settings-files)

### Generate visual output

Skills can bundle and run scripts in any language, giving Claude capabilities beyond what's possible in a single prompt. One powerful pattern is generating visual output: interactive HTML files that open in your browser for exploring data, debugging, or creating reports.

This example creates a codebase explorer: an interactive tree view where you can expand and collapse directories, see file sizes at a glance, and identify file types by color.

Create the Skill directory:

```bash  theme={null}
mkdir -p ~/.claude/skills/codebase-visualizer/scripts
```

Create `~/.claude/skills/codebase-visualizer/SKILL.md`. The description tells Claude when to activate this Skill, and the instructions tell Claude to run the bundled script:

````yaml  theme={null}
---
name: codebase-visualizer
description: Generate an interactive collapsible tree visualization of your codebase. Use when exploring a new repo, understanding project structure, or identifying large files.
allowed-tools: Bash(python *)
---

# Codebase Visualizer

Generate an interactive HTML tree view that shows your project's file structure with collapsible directories.

## Usage

Run the visualization script from your project root:

```bash
python ~/.claude/skills/codebase-visualizer/scripts/visualize.py .
```text

This creates `codebase-map.html` in the current directory and opens it in your default browser.

## What the visualization shows

- **Collapsible directories**: Click folders to expand/collapse
- **File sizes**: Displayed next to each file
- **Colors**: Different colors for different file types
- **Directory totals**: Shows aggregate size of each folder
````

Create `~/.claude/skills/codebase-visualizer/scripts/visualize.py`. This script scans a directory tree and generates a self-contained HTML file with:

* A **summary sidebar** showing file count, directory count, total size, and number of file types
* A **bar chart** breaking down the codebase by file type (top 8 by size)
* A **collapsible tree** where you can expand and collapse directories, with color-coded file type indicators

The script requires Python but uses only built-in libraries, so there are no packages to install:

```python expandable theme={null}
#!/usr/bin/env python3
"""Generate an interactive collapsible tree visualization of a codebase."""

import json
import sys
import webbrowser
from pathlib import Path
from collections import Counter

IGNORE = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build'}

def scan(path: Path, stats: dict) -> dict:
    result = {"name": path.name, "children": [], "size": 0}
    try:
        for item in sorted(path.iterdir()):
            if item.name in IGNORE or item.name.startswith('.'):
                continue
            if item.is_file():
                size = item.stat().st_size
                ext = item.suffix.lower() or '(no ext)'
                result["children"].append({"name": item.name, "size": size, "ext": ext})
                result["size"] += size
                stats["files"] += 1
                stats["extensions"][ext] += 1
                stats["ext_sizes"][ext] += size
            elif item.is_dir():
                stats["dirs"] += 1
                child = scan(item, stats)
                if child["children"]:
                    result["children"].append(child)
                    result["size"] += child["size"]
    except PermissionError:
        pass
    return result

def generate_html(data: dict, stats: dict, output: Path) -> None:
    ext_sizes = stats["ext_sizes"]
    total_size = sum(ext_sizes.values()) or 1
    sorted_exts = sorted(ext_sizes.items(), key=lambda x: -x[1])[:8]
    colors = {
        '.js': '#f7df1e', '.ts': '#3178c6', '.py': '#3776ab', '.go': '#00add8',
        '.rs': '#dea584', '.rb': '#cc342d', '.css': '#264de4', '.html': '#e34c26',
        '.json': '#6b7280', '.md': '#083fa1', '.yaml': '#cb171e', '.yml': '#cb171e',
        '.mdx': '#083fa1', '.tsx': '#3178c6', '.jsx': '#61dafb', '.sh': '#4eaa25',
    }
    lang_bars = "".join(
        f'<div class="bar-row"><span class="bar-label">{ext}</span>'
        f'<div class="bar" style="width:{(size/total_size)*100}%;background:{colors.get(ext,"#6b7280")}"></div>'
        f'<span class="bar-pct">{(size/total_size)*100:.1f}%</span></div>'
        for ext, size in sorted_exts
    )
    def fmt(b):
        if b < 1024: return f"{b} B"
        if b < 1048576: return f"{b/1024:.1f} KB"
        return f"{b/1048576:.1f} MB"

    html = f'''<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><title>Codebase Explorer</title>
  <style>
    body {{ font: 14px/1.5 system-ui, sans-serif; margin: 0; background: #1a1a2e; color: #eee; }}
    .container {{ display: flex; height: 100vh; }}
    .sidebar {{ width: 280px; background: #252542; padding: 20px; border-right: 1px solid #3d3d5c; overflow-y: auto; flex-shrink: 0; }}
    .main {{ flex: 1; padding: 20px; overflow-y: auto; }}
    h1 {{ margin: 0 0 10px 0; font-size: 18px; }}
    h2 {{ margin: 20px 0 10px 0; font-size: 14px; color: #888; text-transform: uppercase; }}
    .stat {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3d3d5c; }}
    .stat-value {{ font-weight: bold; }}
    .bar-row {{ display: flex; align-items: center; margin: 6px 0; }}
    .bar-label {{ width: 55px; font-size: 12px; color: #aaa; }}
    .bar {{ height: 18px; border-radius: 3px; }}
    .bar-pct {{ margin-left: 8px; font-size: 12px; color: #666; }}
    .tree {{ list-style: none; padding-left: 20px; }}
    details {{ cursor: pointer; }}
    summary {{ padding: 4px 8px; border-radius: 4px; }}
    summary:hover {{ background: #2d2d44; }}
    .folder {{ color: #ffd700; }}
    .file {{ display: flex; align-items: center; padding: 4px 8px; border-radius: 4px; }}
    .file:hover {{ background: #2d2d44; }}
    .size {{ color: #888; margin-left: auto; font-size: 12px; }}
    .dot {{ width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }}
  </style>
</head><body>
  <div class="container">
    <div class="sidebar">
      <h1>📊 Summary</h1>
      <div class="stat"><span>Files</span><span class="stat-value">{stats["files"]:,}</span></div>
      <div class="stat"><span>Directories</span><span class="stat-value">{stats["dirs"]:,}</span></div>
      <div class="stat"><span>Total size</span><span class="stat-value">{fmt(data["size"])}</span></div>
      <div class="stat"><span>File types</span><span class="stat-value">{len(stats["extensions"])}</span></div>
      <h2>By file type</h2>
      {lang_bars}
    </div>
    <div class="main">
      <h1>📁 {data["name"]}</h1>
      <ul class="tree" id="root"></ul>
    </div>
  </div>
  <script>
    const data = {json.dumps(data)};
    const colors = {json.dumps(colors)};
    function fmt(b) {{ if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(1) + ' MB'; }}
    function render(node, parent) {{
      if (node.children) {{
        const det = document.createElement('details');
        det.open = parent === document.getElementById('root');
        det.innerHTML = `<summary><span class="folder">📁 ${{node.name}}</span><span class="size">${{fmt(node.size)}}</span></summary>`;
        const ul = document.createElement('ul'); ul.className = 'tree';
        node.children.sort((a,b) => (b.children?1:0)-(a.children?1:0) || a.name.localeCompare(b.name));
        node.children.forEach(c => render(c, ul));
        det.appendChild(ul);
        const li = document.createElement('li'); li.appendChild(det); parent.appendChild(li);
      }} else {{
        const li = document.createElement('li'); li.className = 'file';
        li.innerHTML = `<span class="dot" style="background:${{colors[node.ext]||'#6b7280'}}"></span>${{node.name}}<span class="size">${{fmt(node.size)}}</span>`;
        parent.appendChild(li);
      }}
    }}
    data.children.forEach(c => render(c, document.getElementById('root')));
  </script>
</body></html>'''
    output.write_text(html)

if __name__ == '__main__':
    target = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
    stats = {"files": 0, "dirs": 0, "extensions": Counter(), "ext_sizes": Counter()}
    data = scan(target, stats)
    out = Path('codebase-map.html')
    generate_html(data, stats, out)
    print(f'Generated {out.absolute()}')
    webbrowser.open(f'file://{out.absolute()}')
```

To test, open Claude Code in any project and ask "Visualize this codebase." Claude runs the script, generates `codebase-map.html`, and opens it in your browser.

This pattern works for any visual output: dependency graphs, test coverage reports, API documentation, or database schema visualizations. The bundled script does the heavy lifting while Claude handles orchestration.

## Troubleshooting

### Skill not triggering

If Claude doesn't use your skill when expected:

1. Check the description includes keywords users would naturally say
2. Verify the skill appears in `What skills are available?`
3. Try rephrasing your request to match the description more closely
4. Invoke it directly with `/skill-name` if the skill is user-invocable

### Skill triggers too often

If Claude uses your skill when you don't want it:

1. Make the description more specific
2. Add `disable-model-invocation: true` if you only want manual invocation

### Claude doesn't see all my skills

Skill descriptions are loaded into context so Claude knows what's available. If you have many skills, they may exceed the character budget. The budget scales dynamically at 2% of the context window, with a fallback of 16,000 characters. Run `/context` to check for a warning about excluded skills.

To override the limit, set the `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

## Related resources

* **[Subagents](/en/sub-agents)**: delegate tasks to specialized agents
* **[Plugins](/en/plugins)**: package and distribute skills with other extensions
* **[Hooks](/en/hooks)**: automate workflows around tool events
* **[Memory](/en/memory)**: manage CLAUDE.md files for persistent context
* **[Interactive mode](/en/interactive-mode#built-in-commands)**: built-in commands and shortcuts
* **[Permissions](/en/permissions)**: control tool and skill access
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Output styles

> Adapt Claude Code for uses beyond software engineering

Output styles allow you to use Claude Code as any type of agent while keeping
its core capabilities, such as running local scripts, reading/writing files, and
tracking TODOs.

## Built-in output styles

Claude Code's **Default** output style is the existing system prompt, designed
to help you complete software engineering tasks efficiently.

There are two additional built-in output styles focused on teaching you the
codebase and how Claude operates:

* **Explanatory**: Provides educational "Insights" in between helping you
  complete software engineering tasks. Helps you understand implementation
  choices and codebase patterns.

* **Learning**: Collaborative, learn-by-doing mode where Claude will not only
  share "Insights" while coding, but also ask you to contribute small, strategic
  pieces of code yourself. Claude Code will add `TODO(human)` markers in your
  code for you to implement.

## How output styles work

Output styles directly modify Claude Code's system prompt.

* All output styles exclude instructions for efficient output (such as
  responding concisely).
* Custom output styles exclude instructions for coding (such as verifying code
  with tests), unless `keep-coding-instructions` is true.
* All output styles have their own custom instructions added to the end of the
  system prompt.
* All output styles trigger reminders for Claude to adhere to the output style
  instructions during the conversation.

## Change your output style

You can either:

* Run `/output-style` to access a menu and select your output style (this can
  also be accessed from the `/config` menu)

* Run `/output-style [style]`, such as `/output-style explanatory`, to directly
  switch to a style

These changes apply to the [local project level](/en/settings) and are saved in
`.claude/settings.local.json`. You can also directly edit the `outputStyle`
field in a settings file at a different level.

## Create a custom output style

Custom output styles are Markdown files with frontmatter and the text that will
be added to the system prompt:

```markdown  theme={null}
---
name: My Custom Style
description:
  A brief description of what this style does, to be displayed to the user
---

# Custom Style Instructions

You are an interactive CLI tool that helps users with software engineering
tasks. [Your custom instructions here...]

## Specific Behaviors

[Define how the assistant should behave in this style...]
```

You can save these files at the user level (`~/.claude/output-styles`) or
project level (`.claude/output-styles`).

### Frontmatter

Output style files support frontmatter, useful for specifying metadata about the
command:

| Frontmatter                | Purpose                                                                     | Default                 |
| :------------------------- | :-------------------------------------------------------------------------- | :---------------------- |
| `name`                     | Name of the output style, if not the file name                              | Inherits from file name |
| `description`              | Description of the output style. Used only in the UI of `/output-style`     | None                    |
| `keep-coding-instructions` | Whether to keep the parts of Claude Code's system prompt related to coding. | false                   |

## Comparisons to related features

### Output Styles vs. CLAUDE.md vs. --append-system-prompt

Output styles completely "turn off" the parts of Claude Code's default system
prompt specific to software engineering. Neither CLAUDE.md nor
`--append-system-prompt` edit Claude Code's default system prompt. CLAUDE.md
adds the contents as a user message *following* Claude Code's default system
prompt. `--append-system-prompt` appends the content to the system prompt.

### Output Styles vs. [Agents](/en/sub-agents)

Output styles directly affect the main agent loop and only affect the system
prompt. Agents are invoked to handle specific tasks and can include additional
settings like the model to use, the tools they have available, and some context
about when to use the agent.

### Output Styles vs. [Skills](/en/skills)

Output styles modify how Claude responds (formatting, tone, structure) and are always active once selected. Skills are task-specific prompts that you invoke with `/skill-name` or that Claude loads automatically when relevant. Use output styles for consistent formatting preferences; use skills for reusable workflows and tasks.
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Automate workflows with hooks

> Run shell commands automatically when Claude Code edits files, finishes tasks, or needs input. Format code, send notifications, validate commands, and enforce project rules.

Hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle. They provide deterministic control over Claude Code's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them. Use hooks to enforce project rules, automate repetitive tasks, and integrate Claude Code with your existing tools.

For decisions that require judgment rather than deterministic rules, you can also use [prompt-based hooks](#prompt-based-hooks) or [agent-based hooks](#agent-based-hooks) that use a Claude model to evaluate conditions.

For other ways to extend Claude Code, see [skills](/en/skills) for giving Claude additional instructions and executable commands, [subagents](/en/sub-agents) for running tasks in isolated contexts, and [plugins](/en/plugins) for packaging extensions to share across projects.

<Tip>
  This guide covers common use cases and how to get started. For full event schemas, JSON input/output formats, and advanced features like async hooks and MCP tool hooks, see the [Hooks reference](/en/hooks).
</Tip>

## Set up your first hook

The fastest way to create a hook is through the `/hooks` interactive menu in Claude Code. This walkthrough creates a desktop notification hook, so you get alerted whenever Claude is waiting for your input instead of watching the terminal.

<Steps>
  <Step title="Open the hooks menu">
    Type `/hooks` in the Claude Code CLI. You'll see a list of all available hook events, plus an option to disable all hooks. Each event corresponds to a point in Claude's lifecycle where you can run custom code. Select `Notification` to create a hook that fires when Claude needs your attention.
  </Step>

  <Step title="Configure the matcher">
    The menu shows a list of matchers, which filter when the hook fires. Set the matcher to `*` to fire on all notification types. You can narrow it later by changing the matcher to a specific value like `permission_prompt` or `idle_prompt`.
  </Step>

  <Step title="Add your command">
    Select `+ Add new hook…`. The menu prompts you for a shell command to run when the event fires. Hooks run any shell command you provide, so you can use your platform's built-in notification tool. Copy the command for your OS:

    <Tabs>
      <Tab title="macOS">
        Uses [`osascript`](https://ss64.com/mac/osascript.html) to trigger a native macOS notification through AppleScript:

        ```bash  theme={null}
        osascript -e 'display notification "Claude Code needs your attention" with title "Claude Code"'
        ```
      </Tab>

      <Tab title="Linux">
        Uses `notify-send`, which is pre-installed on most Linux desktops with a notification daemon:

        ```bash  theme={null}
        notify-send 'Claude Code' 'Claude Code needs your attention'
        ```
      </Tab>

      <Tab title="Windows (PowerShell)">
        Uses PowerShell to show a native message box through .NET's Windows Forms:

        ```powershell  theme={null}
        powershell.exe -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code')"
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Choose a storage location">
    The menu asks where to save the hook configuration. Select `User settings` to store it in `~/.claude/settings.json`, which applies the hook to all your projects. You could also choose `Project settings` to scope it to the current project. See [Configure hook location](#configure-hook-location) for all available scopes.
  </Step>

  <Step title="Test the hook">
    Press `Esc` to return to the CLI. Ask Claude to do something that requires permission, then switch away from the terminal. You should receive a desktop notification.
  </Step>
</Steps>

## What you can automate

Hooks let you run code at key points in Claude Code's lifecycle: format files after edits, block commands before they execute, send notifications when Claude needs input, inject context at session start, and more. For the full list of hook events, see the [Hooks reference](/en/hooks#hook-lifecycle).

Each example includes a ready-to-use configuration block that you add to a [settings file](#configure-hook-location). The most common patterns:

* [Get notified when Claude needs input](#get-notified-when-claude-needs-input)
* [Auto-format code after edits](#auto-format-code-after-edits)
* [Block edits to protected files](#block-edits-to-protected-files)
* [Re-inject context after compaction](#re-inject-context-after-compaction)
* [Audit configuration changes](#audit-configuration-changes)

### Get notified when Claude needs input

Get a desktop notification whenever Claude finishes working and needs your input, so you can switch to other tasks without checking the terminal.

This hook uses the `Notification` event, which fires when Claude is waiting for input or permission. Each tab below uses the platform's native notification command. Add this to `~/.claude/settings.json`, or use the [interactive walkthrough](#set-up-your-first-hook) above to configure it with `/hooks`:

<Tabs>
  <Tab title="macOS">
    ```json  theme={null}
    {
      "hooks": {
        "Notification": [
          {
            "matcher": "",
            "hooks": [
              {
                "type": "command",
                "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="Linux">
    ```json  theme={null}
    {
      "hooks": {
        "Notification": [
          {
            "matcher": "",
            "hooks": [
              {
                "type": "command",
                "command": "notify-send 'Claude Code' 'Claude Code needs your attention'"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="Windows (PowerShell)">
    ```json  theme={null}
    {
      "hooks": {
        "Notification": [
          {
            "matcher": "",
            "hooks": [
              {
                "type": "command",
                "command": "powershell.exe -Command \"[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code')\""
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

### Auto-format code after edits

Automatically run [Prettier](https://prettier.io/) on every file Claude edits, so formatting stays consistent without manual intervention.

This hook uses the `PostToolUse` event with an `Edit|Write` matcher, so it runs only after file-editing tools. The command extracts the edited file path with [`jq`](https://jqlang.github.io/jq/) and passes it to Prettier. Add this to `.claude/settings.json` in your project root:

```json  theme={null}
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

<Note>
  The Bash examples on this page use `jq` for JSON parsing. Install it with `brew install jq` (macOS), `apt-get install jq` (Debian/Ubuntu), or see [`jq` downloads](https://jqlang.github.io/jq/download/).
</Note>

### Block edits to protected files

Prevent Claude from modifying sensitive files like `.env`, `package-lock.json`, or anything in `.git/`. Claude receives feedback explaining why the edit was blocked, so it can adjust its approach.

This example uses a separate script file that the hook calls. The script checks the target file path against a list of protected patterns and exits with code 2 to block the edit.

<Steps>
  <Step title="Create the hook script">
    Save this to `.claude/hooks/protect-files.sh`:

    ```bash  theme={null}
    #!/bin/bash
    # protect-files.sh

    INPUT=$(cat)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

    PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/")

    for pattern in "${PROTECTED_PATTERNS[@]}"; do
      if [[ "$FILE_PATH" == *"$pattern"* ]]; then
        echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
        exit 2
      fi
    done

    exit 0
    ```
  </Step>

  <Step title="Make the script executable (macOS/Linux)">
    Hook scripts must be executable for Claude Code to run them:

    ```bash  theme={null}
    chmod +x .claude/hooks/protect-files.sh
    ```
  </Step>

  <Step title="Register the hook">
    Add a `PreToolUse` hook to `.claude/settings.json` that runs the script before any `Edit` or `Write` tool call:

    ```json  theme={null}
    {
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "Edit|Write",
            "hooks": [
              {
                "type": "command",
                "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
              }
            ]
          }
        ]
      }
    }
    ```
  </Step>
</Steps>

### Re-inject context after compaction

When Claude's context window fills up, compaction summarizes the conversation to free space. This can lose important details. Use a `SessionStart` hook with a `compact` matcher to re-inject critical context after every compaction.

Any text your command writes to stdout is added to Claude's context. This example reminds Claude of project conventions and recent work. Add this to `.claude/settings.json` in your project root:

```json  theme={null}
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: use Bun, not npm. Run bun test before committing. Current sprint: auth refactor.'"
          }
        ]
      }
    ]
  }
}
```

You can replace the `echo` with any command that produces dynamic output, like `git log --oneline -5` to show recent commits. For injecting context on every session start, consider using [CLAUDE.md](/en/memory) instead. For environment variables, see [`CLAUDE_ENV_FILE`](/en/hooks#persist-environment-variables) in the reference.

### Audit configuration changes

Track when settings or skills files change during a session. The `ConfigChange` event fires when an external process or editor modifies a configuration file, so you can log changes for compliance or block unauthorized modifications.

This example appends each change to an audit log. Add this to `~/.claude/settings.json`:

```json  theme={null}
{
  "hooks": {
    "ConfigChange": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{timestamp: now | todate, source: .source, file: .file_path}' >> ~/claude-config-audit.log"
          }
        ]
      }
    ]
  }
}
```

The matcher filters by configuration type: `user_settings`, `project_settings`, `local_settings`, `policy_settings`, or `skills`. To block a change from taking effect, exit with code 2 or return `{"decision": "block"}`. See the [ConfigChange reference](/en/hooks#configchange) for the full input schema.

## How hooks work

Hook events fire at specific lifecycle points in Claude Code. When an event fires, all matching hooks run in parallel, and identical hook commands are automatically deduplicated. The table below shows each event and when it triggers:

| Event                | When it fires                                                                                                                                  |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionStart`       | When a session begins or resumes                                                                                                               |
| `UserPromptSubmit`   | When you submit a prompt, before Claude processes it                                                                                           |
| `PreToolUse`         | Before a tool call executes. Can block it                                                                                                      |
| `PermissionRequest`  | When a permission dialog appears                                                                                                               |
| `PostToolUse`        | After a tool call succeeds                                                                                                                     |
| `PostToolUseFailure` | After a tool call fails                                                                                                                        |
| `Notification`       | When Claude Code sends a notification                                                                                                          |
| `SubagentStart`      | When a subagent is spawned                                                                                                                     |
| `SubagentStop`       | When a subagent finishes                                                                                                                       |
| `Stop`               | When Claude finishes responding                                                                                                                |
| `TeammateIdle`       | When an [agent team](/en/agent-teams) teammate is about to go idle                                                                             |
| `TaskCompleted`      | When a task is being marked as completed                                                                                                       |
| `InstructionsLoaded` | When a CLAUDE.md or `.claude/rules/*.md` file is loaded into context. Fires at session start and when files are lazily loaded during a session |
| `ConfigChange`       | When a configuration file changes during a session                                                                                             |
| `WorktreeCreate`     | When a worktree is being created via `--worktree` or `isolation: "worktree"`. Replaces default git behavior                                    |
| `WorktreeRemove`     | When a worktree is being removed, either at session exit or when a subagent finishes                                                           |
| `PreCompact`         | Before context compaction                                                                                                                      |
| `SessionEnd`         | When a session terminates                                                                                                                      |

Each hook has a `type` that determines how it runs. Most hooks use `"type": "command"`, which runs a shell command. Three other types are available:

* `"type": "http"`: POST event data to a URL. See [HTTP hooks](#http-hooks).
* `"type": "prompt"`: single-turn LLM evaluation. See [Prompt-based hooks](#prompt-based-hooks).
* `"type": "agent"`: multi-turn verification with tool access. See [Agent-based hooks](#agent-based-hooks).

### Read input and return output

Hooks communicate with Claude Code through stdin, stdout, stderr, and exit codes. When an event fires, Claude Code passes event-specific data as JSON to your script's stdin. Your script reads that data, does its work, and tells Claude Code what to do next via the exit code.

#### Hook input

Every event includes common fields like `session_id` and `cwd`, but each event type adds different data. For example, when Claude runs a Bash command, a `PreToolUse` hook receives something like this on stdin:

```json  theme={null}
{
  "session_id": "abc123",          // unique ID for this session
  "cwd": "/Users/sarah/myproject", // working directory when the event fired
  "hook_event_name": "PreToolUse", // which event triggered this hook
  "tool_name": "Bash",             // the tool Claude is about to use
  "tool_input": {                  // the arguments Claude passed to the tool
    "command": "npm test"          // for Bash, this is the shell command
  }
}
```

Your script can parse that JSON and act on any of those fields. `UserPromptSubmit` hooks get the `prompt` text instead, `SessionStart` hooks get the `source` (startup, resume, clear, compact), and so on. See [Common input fields](/en/hooks#common-input-fields) in the reference for shared fields, and each event's section for event-specific schemas.

#### Hook output

Your script tells Claude Code what to do next by writing to stdout or stderr and exiting with a specific code. For example, a `PreToolUse` hook that wants to block a command:

```bash  theme={null}
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

if echo "$COMMAND" | grep -q "drop table"; then
  echo "Blocked: dropping tables is not allowed" >&2  # stderr becomes Claude's feedback
  exit 2                                               # exit 2 = block the action
fi

exit 0  # exit 0 = let it proceed
```

The exit code determines what happens next:

* **Exit 0**: the action proceeds. For `UserPromptSubmit` and `SessionStart` hooks, anything you write to stdout is added to Claude's context.
* **Exit 2**: the action is blocked. Write a reason to stderr, and Claude receives it as feedback so it can adjust.
* **Any other exit code**: the action proceeds. Stderr is logged but not shown to Claude. Toggle verbose mode with `Ctrl+O` to see these messages in the transcript.

#### Structured JSON output

Exit codes give you two options: allow or block. For more control, exit 0 and print a JSON object to stdout instead.

<Note>
  Use exit 2 to block with a stderr message, or exit 0 with JSON for structured control. Don't mix them: Claude Code ignores JSON when you exit 2.
</Note>

For example, a `PreToolUse` hook can deny a tool call and tell Claude why, or escalate it to the user for approval:

```json  theme={null}
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Use rg instead of grep for better performance"
  }
}
```

Claude Code reads `permissionDecision` and cancels the tool call, then feeds `permissionDecisionReason` back to Claude as feedback. These three options are specific to `PreToolUse`:

* `"allow"`: proceed without showing a permission prompt
* `"deny"`: cancel the tool call and send the reason to Claude
* `"ask"`: show the permission prompt to the user as normal

Other events use different decision patterns. For example, `PostToolUse` and `Stop` hooks use a top-level `decision: "block"` field, while `PermissionRequest` uses `hookSpecificOutput.decision.behavior`. See the [summary table](/en/hooks#decision-control) in the reference for a full breakdown by event.

For `UserPromptSubmit` hooks, use `additionalContext` instead to inject text into Claude's context. Prompt-based hooks (`type: "prompt"`) handle output differently: see [Prompt-based hooks](#prompt-based-hooks).

### Filter hooks with matchers

Without a matcher, a hook fires on every occurrence of its event. Matchers let you narrow that down. For example, if you want to run a formatter only after file edits (not after every tool call), add a matcher to your `PostToolUse` hook:

```json  theme={null}
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "prettier --write ..." }
        ]
      }
    ]
  }
}
```

The `"Edit|Write"` matcher is a regex pattern that matches the tool name. The hook only fires when Claude uses the `Edit` or `Write` tool, not when it uses `Bash`, `Read`, or any other tool.

Each event type matches on a specific field. Matchers support exact strings and regex patterns:

| Event                                                                                           | What the matcher filters  | Example matcher values                                                             |
| :---------------------------------------------------------------------------------------------- | :------------------------ | :--------------------------------------------------------------------------------- |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`                          | tool name                 | `Bash`, `Edit\|Write`, `mcp__.*`                                                   |
| `SessionStart`                                                                                  | how the session started   | `startup`, `resume`, `clear`, `compact`                                            |
| `SessionEnd`                                                                                    | why the session ended     | `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`     |
| `Notification`                                                                                  | notification type         | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`           |
| `SubagentStart`                                                                                 | agent type                | `Bash`, `Explore`, `Plan`, or custom agent names                                   |
| `PreCompact`                                                                                    | what triggered compaction | `manual`, `auto`                                                                   |
| `SubagentStop`                                                                                  | agent type                | same values as `SubagentStart`                                                     |
| `ConfigChange`                                                                                  | configuration source      | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |
| `UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove` | no matcher support        | always fires on every occurrence                                                   |

A few more examples showing matchers on different event types:

<Tabs>
  <Tab title="Log every Bash command">
    Match only `Bash` tool calls and log each command to a file. The `PostToolUse` event fires after the command completes, so `tool_input.command` contains what ran. The hook receives the event data as JSON on stdin, and `jq -r '.tool_input.command'` extracts just the command string, which `>>` appends to the log file:

    ```json  theme={null}
    {
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Bash",
            "hooks": [
              {
                "type": "command",
                "command": "jq -r '.tool_input.command' >> ~/.claude/command-log.txt"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="Match MCP tools">
    MCP tools use a different naming convention than built-in tools: `mcp__<server>__<tool>`, where `<server>` is the MCP server name and `<tool>` is the tool it provides. For example, `mcp__github__search_repositories` or `mcp__filesystem__read_file`. Use a regex matcher to target all tools from a specific server, or match across servers with a pattern like `mcp__.*__write.*`. See [Match MCP tools](/en/hooks#match-mcp-tools) in the reference for the full list of examples.

    The command below extracts the tool name from the hook's JSON input with `jq` and writes it to stderr, where it shows up in verbose mode (`Ctrl+O`):

    ```json  theme={null}
    {
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "mcp__github__.*",
            "hooks": [
              {
                "type": "command",
                "command": "echo \"GitHub tool called: $(jq -r '.tool_name')\" >&2"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="Clean up on session end">
    The `SessionEnd` event supports matchers on the reason the session ended. This hook only fires on `clear` (when you run `/clear`), not on normal exits:

    ```json  theme={null}
    {
      "hooks": {
        "SessionEnd": [
          {
            "matcher": "clear",
            "hooks": [
              {
                "type": "command",
                "command": "rm -f /tmp/claude-scratch-*.txt"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

For full matcher syntax, see the [Hooks reference](/en/hooks#configuration).

### Configure hook location

Where you add a hook determines its scope:

| Location                                                   | Scope                              | Shareable                          |
| :--------------------------------------------------------- | :--------------------------------- | :--------------------------------- |
| `~/.claude/settings.json`                                  | All your projects                  | No, local to your machine          |
| `.claude/settings.json`                                    | Single project                     | Yes, can be committed to the repo  |
| `.claude/settings.local.json`                              | Single project                     | No, gitignored                     |
| Managed policy settings                                    | Organization-wide                  | Yes, admin-controlled              |
| [Plugin](/en/plugins) `hooks/hooks.json`                   | When plugin is enabled             | Yes, bundled with the plugin       |
| [Skill](/en/skills) or [agent](/en/sub-agents) frontmatter | While the skill or agent is active | Yes, defined in the component file |

You can also use the [`/hooks` menu](/en/hooks#the-hooks-menu) in Claude Code to add, delete, and view hooks interactively. To disable all hooks at once, use the toggle at the bottom of the `/hooks` menu or set `"disableAllHooks": true` in your settings file.

Hooks added through the `/hooks` menu take effect immediately. If you edit settings files directly while Claude Code is running, the changes won't take effect until you review them in the `/hooks` menu or restart your session.

## Prompt-based hooks

For decisions that require judgment rather than deterministic rules, use `type: "prompt"` hooks. Instead of running a shell command, Claude Code sends your prompt and the hook's input data to a Claude model (Haiku by default) to make the decision. You can specify a different model with the `model` field if you need more capability.

The model's only job is to return a yes/no decision as JSON:

* `"ok": true`: the action proceeds
* `"ok": false`: the action is blocked. The model's `"reason"` is fed back to Claude so it can adjust.

This example uses a `Stop` hook to ask the model whether all requested tasks are complete. If the model returns `"ok": false`, Claude keeps working and uses the `reason` as its next instruction:

```json  theme={null}
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all tasks are complete. If not, respond with {\"ok\": false, \"reason\": \"what remains to be done\"}."
          }
        ]
      }
    ]
  }
}
```

For full configuration options, see [Prompt-based hooks](/en/hooks#prompt-based-hooks) in the reference.

## Agent-based hooks

When verification requires inspecting files or running commands, use `type: "agent"` hooks. Unlike prompt hooks which make a single LLM call, agent hooks spawn a subagent that can read files, search code, and use other tools to verify conditions before returning a decision.

Agent hooks use the same `"ok"` / `"reason"` response format as prompt hooks, but with a longer default timeout of 60 seconds and up to 50 tool-use turns.

This example verifies that tests pass before allowing Claude to stop:

```json  theme={null}
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify that all unit tests pass. Run the test suite and check the results. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

Use prompt hooks when the hook input data alone is enough to make a decision. Use agent hooks when you need to verify something against the actual state of the codebase.

For full configuration options, see [Agent-based hooks](/en/hooks#agent-based-hooks) in the reference.

## HTTP hooks

Use `type: "http"` hooks to POST event data to an HTTP endpoint instead of running a shell command. The endpoint receives the same JSON that a command hook would receive on stdin, and returns results through the HTTP response body using the same JSON format.

HTTP hooks are useful when you want a web server, cloud function, or external service to handle hook logic: for example, a shared audit service that logs tool use events across a team.

This example posts every tool use to a local logging service:

```json  theme={null}
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:8080/hooks/tool-use",
            "headers": {
              "Authorization": "Bearer $MY_TOKEN"
            },
            "allowedEnvVars": ["MY_TOKEN"]
          }
        ]
      }
    ]
  }
}
```

The endpoint should return a JSON response body using the same [output format](/en/hooks#json-output) as command hooks. To block a tool call, return a 2xx response with the appropriate `hookSpecificOutput` fields. HTTP status codes alone cannot block actions.

Header values support environment variable interpolation using `$VAR_NAME` or `${VAR_NAME}` syntax. Only variables listed in the `allowedEnvVars` array are resolved; all other `$VAR` references remain empty.

<Note>
  HTTP hooks must be configured by editing your settings JSON directly. The `/hooks` interactive menu only supports adding command hooks.
</Note>

For full configuration options and response handling, see [HTTP hooks](/en/hooks#http-hook-fields) in the reference.

## Limitations and troubleshooting

### Limitations

* Command hooks communicate through stdout, stderr, and exit codes only. They cannot trigger commands or tool calls directly. HTTP hooks communicate through the response body instead.
* Hook timeout is 10 minutes by default, configurable per hook with the `timeout` field (in seconds).
* `PostToolUse` hooks cannot undo actions since the tool has already executed.
* `PermissionRequest` hooks do not fire in [non-interactive mode](/en/headless) (`-p`). Use `PreToolUse` hooks for automated permission decisions.
* `Stop` hooks fire whenever Claude finishes responding, not only at task completion. They do not fire on user interrupts.

### Hook not firing

The hook is configured but never executes.

* Run `/hooks` and confirm the hook appears under the correct event
* Check that the matcher pattern matches the tool name exactly (matchers are case-sensitive)
* Verify you're triggering the right event type (e.g., `PreToolUse` fires before tool execution, `PostToolUse` fires after)
* If using `PermissionRequest` hooks in non-interactive mode (`-p`), switch to `PreToolUse` instead

### Hook error in output

You see a message like "PreToolUse hook error: ..." in the transcript.

* Your script exited with a non-zero code unexpectedly. Test it manually by piping sample JSON:
  ```bash  theme={null}
  echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh
  echo $?  # Check the exit code
  ```
* If you see "command not found", use absolute paths or `$CLAUDE_PROJECT_DIR` to reference scripts
* If you see "jq: command not found", install `jq` or use Python/Node.js for JSON parsing
* If the script isn't running at all, make it executable: `chmod +x ./my-hook.sh`

### `/hooks` shows no hooks configured

You edited a settings file but the hooks don't appear in the menu.

* Restart your session or open `/hooks` to reload. Hooks added through the `/hooks` menu take effect immediately, but manual file edits require a reload.
* Verify your JSON is valid (trailing commas and comments are not allowed)
* Confirm the settings file is in the correct location: `.claude/settings.json` for project hooks, `~/.claude/settings.json` for global hooks

### Stop hook runs forever

Claude keeps working in an infinite loop instead of stopping.

Your Stop hook script needs to check whether it already triggered a continuation. Parse the `stop_hook_active` field from the JSON input and exit early if it's `true`:

```bash  theme={null}
#!/bin/bash
INPUT=$(cat)
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0  # Allow Claude to stop
fi
# ... rest of your hook logic
```

### JSON validation failed

Claude Code shows a JSON parsing error even though your hook script outputs valid JSON.

When Claude Code runs a hook, it spawns a shell that sources your profile (`~/.zshrc` or `~/.bashrc`). If your profile contains unconditional `echo` statements, that output gets prepended to your hook's JSON:

```text  theme={null}
Shell ready on arm64
{"decision": "block", "reason": "Not allowed"}
```

Claude Code tries to parse this as JSON and fails. To fix this, wrap echo statements in your shell profile so they only run in interactive shells:

```bash  theme={null}
# In ~/.zshrc or ~/.bashrc
if [[ $- == *i* ]]; then
  echo "Shell ready"
fi
```

The `$-` variable contains shell flags, and `i` means interactive. Hooks run in non-interactive shells, so the echo is skipped.

### Debug techniques

Toggle verbose mode with `Ctrl+O` to see hook output in the transcript, or run `claude --debug` for full execution details including which hooks matched and their exit codes.

## Learn more

* [Hooks reference](/en/hooks): full event schemas, JSON output format, async hooks, and MCP tool hooks
* [Security considerations](/en/hooks#security-considerations): review before deploying hooks in shared or production environments
* [Bash command validator example](https://github.com/anthropics/claude-code/blob/main/examples/hooks/bash_command_validator_example.py): complete reference implementation
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Run Claude Code programmatically

> Use the Agent SDK to run Claude Code programmatically from the CLI, Python, or TypeScript.

The [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) gives you the same tools, agent loop, and context management that power Claude Code. It's available as a CLI for scripts and CI/CD, or as [Python](https://platform.claude.com/docs/en/agent-sdk/python) and [TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript) packages for full programmatic control.

<Note>
  The CLI was previously called "headless mode." The `-p` flag and all CLI options work the same way.
</Note>

To run Claude Code programmatically from the CLI, pass `-p` with your prompt and any [CLI options](/en/cli-reference):

```bash  theme={null}
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
```

This page covers using the Agent SDK via the CLI (`claude -p`). For the Python and TypeScript SDK packages with structured outputs, tool approval callbacks, and native message objects, see the [full Agent SDK documentation](https://platform.claude.com/docs/en/agent-sdk/overview).

## Basic usage

Add the `-p` (or `--print`) flag to any `claude` command to run it non-interactively. All [CLI options](/en/cli-reference) work with `-p`, including:

* `--continue` for [continuing conversations](#continue-conversations)
* `--allowedTools` for [auto-approving tools](#auto-approve-tools)
* `--output-format` for [structured output](#get-structured-output)

This example asks Claude a question about your codebase and prints the response:

```bash  theme={null}
claude -p "What does the auth module do?"
```

## Examples

These examples highlight common CLI patterns.

### Get structured output

Use `--output-format` to control how responses are returned:

* `text` (default): plain text output
* `json`: structured JSON with result, session ID, and metadata
* `stream-json`: newline-delimited JSON for real-time streaming

This example returns a project summary as JSON with session metadata, with the text result in the `result` field:

```bash  theme={null}
claude -p "Summarize this project" --output-format json
```

To get output conforming to a specific schema, use `--output-format json` with `--json-schema` and a [JSON Schema](https://json-schema.org/) definition. The response includes metadata about the request (session ID, usage, etc.) with the structured output in the `structured_output` field.

This example extracts function names and returns them as an array of strings:

```bash  theme={null}
claude -p "Extract the main function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

<Tip>
  Use a tool like [jq](https://jqlang.github.io/jq/) to parse the response and extract specific fields:

  ```bash  theme={null}
  # Extract the text result
  claude -p "Summarize this project" --output-format json | jq -r '.result'

  # Extract structured output
  claude -p "Extract function names from auth.py" \
    --output-format json \
    --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}' \
    | jq '.structured_output'
  ```
</Tip>

### Stream responses

Use `--output-format stream-json` with `--verbose` and `--include-partial-messages` to receive tokens as they're generated. Each line is a JSON object representing an event:

```bash  theme={null}
claude -p "Explain recursion" --output-format stream-json --verbose --include-partial-messages
```

The following example uses [jq](https://jqlang.github.io/jq/) to filter for text deltas and display just the streaming text. The `-r` flag outputs raw strings (no quotes) and `-j` joins without newlines so tokens stream continuously:

```bash  theme={null}
claude -p "Write a poem" --output-format stream-json --verbose --include-partial-messages | \
  jq -rj 'select(.type == "stream_event" and .event.delta.type? == "text_delta") | .event.delta.text'
```

For programmatic streaming with callbacks and message objects, see [Stream responses in real-time](https://platform.claude.com/docs/en/agent-sdk/streaming-output) in the Agent SDK documentation.

### Auto-approve tools

Use `--allowedTools` to let Claude use certain tools without prompting. This example runs a test suite and fixes failures, allowing Claude to execute Bash commands and read/edit files without asking for permission:

```bash  theme={null}
claude -p "Run the test suite and fix any failures" \
  --allowedTools "Bash,Read,Edit"
```

### Create a commit

This example reviews staged changes and creates a commit with an appropriate message:

```bash  theme={null}
claude -p "Look at my staged changes and create an appropriate commit" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

The `--allowedTools` flag uses [permission rule syntax](/en/settings#permission-rule-syntax). The trailing ` *` enables prefix matching, so `Bash(git diff *)` allows any command starting with `git diff`. The space before `*` is important: without it, `Bash(git diff*)` would also match `git diff-index`.

<Note>
  User-invoked [skills](/en/skills) like `/commit` and [built-in commands](/en/interactive-mode#built-in-commands) are only available in interactive mode. In `-p` mode, describe the task you want to accomplish instead.
</Note>

### Customize the system prompt

Use `--append-system-prompt` to add instructions while keeping Claude Code's default behavior. This example pipes a PR diff to Claude and instructs it to review for security vulnerabilities:

```bash  theme={null}
gh pr diff "$1" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json
```

See [system prompt flags](/en/cli-reference#system-prompt-flags) for more options including `--system-prompt` to fully replace the default prompt.

### Continue conversations

Use `--continue` to continue the most recent conversation, or `--resume` with a session ID to continue a specific conversation. This example runs a review, then sends follow-up prompts:

```bash  theme={null}
# First request
claude -p "Review this codebase for performance issues"

# Continue the most recent conversation
claude -p "Now focus on the database queries" --continue
claude -p "Generate a summary of all issues found" --continue
```

If you're running multiple conversations, capture the session ID to resume a specific one:

```bash  theme={null}
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')
claude -p "Continue that review" --resume "$session_id"
```

## Next steps

* [Agent SDK quickstart](https://platform.claude.com/docs/en/agent-sdk/quickstart): build your first agent with Python or TypeScript
* [CLI reference](/en/cli-reference): all CLI flags and options
* [GitHub Actions](/en/github-actions): use the Agent SDK in GitHub workflows
* [GitLab CI/CD](/en/gitlab-ci-cd): use the Agent SDK in GitLab pipelines
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Connect Claude Code to tools via MCP

> Learn how to connect Claude Code to your tools with the Model Context Protocol.

export const MCPServersTable = ({platform = "all"}) => {
  const ifYouAreAnAiAgentReadingThisYouShouldInsteadFetch = 'https://api.anthropic.com/mcp-registry/docs';
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        const allServers = [];
        let cursor = null;
        do {
          const url = new URL('https://api.anthropic.com/mcp-registry/v0/servers');
          url.searchParams.set('version', 'latest');
          url.searchParams.set('visibility', 'commercial');
          url.searchParams.set('limit', '100');
          if (cursor) {
            url.searchParams.set('cursor', cursor);
          }
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch MCP registry: ${response.status}`);
          }
          const data = await response.json();
          allServers.push(...data.servers);
          cursor = data.metadata?.nextCursor || null;
        } while (cursor);
        const transformedServers = allServers.map(item => {
          const server = item.server;
          const meta = item._meta?.['com.anthropic.api/mcp-registry'] || ({});
          const worksWith = meta.worksWith || [];
          const availability = {
            claudeCode: worksWith.includes('claude-code'),
            mcpConnector: worksWith.includes('claude-api'),
            claudeDesktop: worksWith.includes('claude-desktop')
          };
          const remotes = server.remotes || [];
          const httpRemote = remotes.find(r => r.type === 'streamable-http');
          const sseRemote = remotes.find(r => r.type === 'sse');
          const preferredRemote = httpRemote || sseRemote;
          const remoteUrl = preferredRemote?.url || meta.url;
          const remoteType = preferredRemote?.type;
          const isTemplatedUrl = remoteUrl?.includes('{');
          let setupUrl;
          if (isTemplatedUrl && meta.requiredFields) {
            const urlField = meta.requiredFields.find(f => f.field === 'url');
            setupUrl = urlField?.sourceUrl || meta.documentation;
          }
          const urls = {};
          if (!isTemplatedUrl) {
            if (remoteType === 'streamable-http') {
              urls.http = remoteUrl;
            } else if (remoteType === 'sse') {
              urls.sse = remoteUrl;
            }
          }
          let envVars = [];
          if (server.packages && server.packages.length > 0) {
            const npmPackage = server.packages.find(p => p.registryType === 'npm');
            if (npmPackage) {
              urls.stdio = `npx -y ${npmPackage.identifier}`;
              if (npmPackage.environmentVariables) {
                envVars = npmPackage.environmentVariables;
              }
            }
          }
          return {
            name: meta.displayName || server.title || server.name,
            description: meta.oneLiner || server.description,
            documentation: meta.documentation,
            urls: urls,
            envVars: envVars,
            availability: availability,
            customCommands: meta.claudeCodeCopyText ? {
              claudeCode: meta.claudeCodeCopyText
            } : undefined,
            setupUrl: setupUrl
          };
        });
        setServers(transformedServers);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching MCP registry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);
  const generateClaudeCodeCommand = server => {
    if (server.customCommands && server.customCommands.claudeCode) {
      return server.customCommands.claudeCode;
    }
    const serverSlug = server.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (server.urls.http) {
      return `claude mcp add ${serverSlug} --transport http ${server.urls.http}`;
    }
    if (server.urls.sse) {
      return `claude mcp add ${serverSlug} --transport sse ${server.urls.sse}`;
    }
    if (server.urls.stdio) {
      const envFlags = server.envVars && server.envVars.length > 0 ? server.envVars.map(v => `--env ${v.name}=YOUR_${v.name}`).join(' ') : '';
      const baseCommand = `claude mcp add ${serverSlug} --transport stdio`;
      return envFlags ? `${baseCommand} ${envFlags} -- ${server.urls.stdio}` : `${baseCommand} -- ${server.urls.stdio}`;
    }
    return null;
  };
  if (loading) {
    return <div>Loading MCP servers...</div>;
  }
  if (error) {
    return <div>Error loading MCP servers: {error}</div>;
  }
  const filteredServers = servers.filter(server => {
    if (platform === "claudeCode") {
      return server.availability.claudeCode;
    } else if (platform === "mcpConnector") {
      return server.availability.mcpConnector;
    } else if (platform === "claudeDesktop") {
      return server.availability.claudeDesktop;
    } else if (platform === "all") {
      return true;
    } else {
      throw new Error(`Unknown platform: ${platform}`);
    }
  });
  return <>
      <style jsx>{`
        .cards-container {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .server-card {
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          padding: 1rem;
        }
        .command-row {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .command-row code {
          font-size: 0.75rem;
          overflow-x: auto;
        }
      `}</style>

      <div className="cards-container">
        {filteredServers.map(server => {
    const claudeCodeCommand = generateClaudeCodeCommand(server);
    const mcpUrl = server.urls.http || server.urls.sse;
    const commandToShow = platform === "claudeCode" ? claudeCodeCommand : mcpUrl;
    return <div key={server.name} className="server-card">
              <div>
                {server.documentation ? <a href={server.documentation}>
                    <strong>{server.name}</strong>
                  </a> : <strong>{server.name}</strong>}
              </div>

              <p style={{
      margin: '0.5rem 0',
      fontSize: '0.9rem'
    }}>
                {server.description}
              </p>

              {server.setupUrl && <p style={{
      margin: '0.25rem 0',
      fontSize: '0.8rem',
      fontStyle: 'italic',
      opacity: 0.7
    }}>
                  Requires user-specific URL.{' '}
                  <a href={server.setupUrl} style={{
      textDecoration: 'underline'
    }}>
                    Get your URL here
                  </a>.
                </p>}

              {commandToShow && !server.setupUrl && <>
                <p style={{
      display: 'block',
      fontSize: '0.75rem',
      fontWeight: 500,
      minWidth: 'fit-content',
      marginTop: '0.5rem',
      marginBottom: 0
    }}>
                  {platform === "claudeCode" ? "Command" : "URL"}
                </p>
                <div className="command-row">
                  <code>
                    {commandToShow}
                  </code>
                </div>
              </>}
            </div>;
  })}
      </div>
    </>;
};

Claude Code can connect to hundreds of external tools and data sources through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open source standard for AI-tool integrations. MCP servers give Claude Code access to your tools, databases, and APIs.

## What you can do with MCP

With MCP servers connected, you can ask Claude Code to:

* **Implement features from issue trackers**: "Add the feature described in JIRA issue ENG-4521 and create a PR on GitHub."
* **Analyze monitoring data**: "Check Sentry and Statsig to check the usage of the feature described in ENG-4521."
* **Query databases**: "Find emails of 10 random users who used feature ENG-4521, based on our PostgreSQL database."
* **Integrate designs**: "Update our standard email template based on the new Figma designs that were posted in Slack"
* **Automate workflows**: "Create Gmail drafts inviting these 10 users to a feedback session about the new feature."

## Popular MCP servers

Here are some commonly used MCP servers you can connect to Claude Code:

<Warning>
  Use third party MCP servers at your own risk - Anthropic has not verified
  the correctness or security of all these servers.
  Make sure you trust MCP servers you are installing.
  Be especially careful when using MCP servers that could fetch untrusted
  content, as these can expose you to prompt injection risk.
</Warning>

<MCPServersTable platform="claudeCode" />

<Note>
  **Need a specific integration?** [Find hundreds more MCP servers on GitHub](https://github.com/modelcontextprotocol/servers), or build your own using the [MCP SDK](https://modelcontextprotocol.io/quickstart/server).
</Note>

## Installing MCP servers

MCP servers can be configured in three different ways depending on your needs:

### Option 1: Add a remote HTTP server

HTTP servers are the recommended option for connecting to remote MCP servers. This is the most widely supported transport for cloud-based services.

```bash  theme={null}
# Basic syntax
claude mcp add --transport http <name> <url>

# Real example: Connect to Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Example with Bearer token
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### Option 2: Add a remote SSE server

<Warning>
  The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available.
</Warning>

```bash  theme={null}
# Basic syntax
claude mcp add --transport sse <name> <url>

# Real example: Connect to Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Example with authentication header
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

### Option 3: Add a local stdio server

Stdio servers run as local processes on your machine. They're ideal for tools that need direct system access or custom scripts.

```bash  theme={null}
# Basic syntax
claude mcp add [options] <name> -- <command> [args...]

# Real example: Add Airtable server
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

<Note>
  **Important: Option ordering**

  All options (`--transport`, `--env`, `--scope`, `--header`) must come **before** the server name. The `--` (double dash) then separates the server name from the command and arguments that get passed to the MCP server.

  For example:

  * `claude mcp add --transport stdio myserver -- npx server` → runs `npx server`
  * `claude mcp add --transport stdio --env KEY=value myserver -- python server.py --port 8080` → runs `python server.py --port 8080` with `KEY=value` in environment

  This prevents conflicts between Claude's flags and the server's flags.
</Note>

### Managing your servers

Once configured, you can manage your MCP servers with these commands:

```bash  theme={null}
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get github

# Remove a server
claude mcp remove github

# (within Claude Code) Check server status
/mcp
```

### Dynamic tool updates

Claude Code supports MCP `list_changed` notifications, allowing MCP servers to dynamically update their available tools, prompts, and resources without requiring you to disconnect and reconnect. When an MCP server sends a `list_changed` notification, Claude Code automatically refreshes the available capabilities from that server.

<Tip>
  Tips:

  * Use the `--scope` flag to specify where the configuration is stored:
    * `local` (default): Available only to you in the current project (was called `project` in older versions)
    * `project`: Shared with everyone in the project via `.mcp.json` file
    * `user`: Available to you across all projects (was called `global` in older versions)
  * Set environment variables with `--env` flags (for example, `--env KEY=value`)
  * Configure MCP server startup timeout using the MCP\_TIMEOUT environment variable (for example, `MCP_TIMEOUT=10000 claude` sets a 10-second timeout)
  * Claude Code will display a warning when MCP tool output exceeds 10,000 tokens. To increase this limit, set the `MAX_MCP_OUTPUT_TOKENS` environment variable (for example, `MAX_MCP_OUTPUT_TOKENS=50000`)
  * Use `/mcp` to authenticate with remote servers that require OAuth 2.0 authentication
</Tip>

<Warning>
  **Windows Users**: On native Windows (not WSL), local MCP servers that use `npx` require the `cmd /c` wrapper to ensure proper execution.

  ```bash  theme={null}
  # This creates command="cmd" which Windows can execute
  claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
  ```

  Without the `cmd /c` wrapper, you'll encounter "Connection closed" errors because Windows cannot directly execute `npx`. (See the note above for an explanation of the `--` parameter.)
</Warning>

### Plugin-provided MCP servers

[Plugins](/en/plugins) can bundle MCP servers, automatically providing tools and integrations when the plugin is enabled. Plugin MCP servers work identically to user-configured servers.

**How plugin MCP servers work**:

* Plugins define MCP servers in `.mcp.json` at the plugin root or inline in `plugin.json`
* When a plugin is enabled, its MCP servers start automatically
* Plugin MCP tools appear alongside manually configured MCP tools
* Plugin servers are managed through plugin installation (not `/mcp` commands)

**Example plugin MCP configuration**:

In `.mcp.json` at plugin root:

```json  theme={null}
{
  "database-tools": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": {
      "DB_URL": "${DB_URL}"
    }
  }
}
```

Or inline in `plugin.json`:

```json  theme={null}
{
  "name": "my-plugin",
  "mcpServers": {
    "plugin-api": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
      "args": ["--port", "8080"]
    }
  }
}
```

**Plugin MCP features**:

* **Automatic lifecycle**: Servers start when plugin enables, but you must restart Claude Code to apply MCP server changes (enabling or disabling)
* **Environment variables**: Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
* **User environment access**: Access to same environment variables as manually configured servers
* **Multiple transport types**: Support stdio, SSE, and HTTP transports (transport support may vary by server)

**Viewing plugin MCP servers**:

```bash  theme={null}
# Within Claude Code, see all MCP servers including plugin ones
/mcp
```

Plugin servers appear in the list with indicators showing they come from plugins.

**Benefits of plugin MCP servers**:

* **Bundled distribution**: Tools and servers packaged together
* **Automatic setup**: No manual MCP configuration needed
* **Team consistency**: Everyone gets the same tools when plugin is installed

See the [plugin components reference](/en/plugins-reference#mcp-servers) for details on bundling MCP servers with plugins.

## MCP installation scopes

MCP servers can be configured at three different scope levels, each serving distinct purposes for managing server accessibility and sharing. Understanding these scopes helps you determine the best way to configure servers for your specific needs.

### Local scope

Local-scoped servers represent the default configuration level and are stored in `~/.claude.json` under your project's path. These servers remain private to you and are only accessible when working within the current project directory. This scope is ideal for personal development servers, experimental configurations, or servers containing sensitive credentials that shouldn't be shared.

<Note>
  The term "local scope" for MCP servers differs from general local settings. MCP local-scoped servers are stored in `~/.claude.json` (your home directory), while general local settings use `.claude/settings.local.json` (in the project directory). See [Settings](/en/settings#settings-files) for details on settings file locations.
</Note>

```bash  theme={null}
# Add a local-scoped server (default)
claude mcp add --transport http stripe https://mcp.stripe.com

# Explicitly specify local scope
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
```

### Project scope

Project-scoped servers enable team collaboration by storing configurations in a `.mcp.json` file at your project's root directory. This file is designed to be checked into version control, ensuring all team members have access to the same MCP tools and services. When you add a project-scoped server, Claude Code automatically creates or updates this file with the appropriate configuration structure.

```bash  theme={null}
# Add a project-scoped server
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

The resulting `.mcp.json` file follows a standardized format:

```json  theme={null}
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    }
  }
}
```

For security reasons, Claude Code prompts for approval before using project-scoped servers from `.mcp.json` files. If you need to reset these approval choices, use the `claude mcp reset-project-choices` command.

### User scope

User-scoped servers are stored in `~/.claude.json` and provide cross-project accessibility, making them available across all projects on your machine while remaining private to your user account. This scope works well for personal utility servers, development tools, or services you frequently use across different projects.

```bash  theme={null}
# Add a user server
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### Choosing the right scope

Select your scope based on:

* **Local scope**: Personal servers, experimental configurations, or sensitive credentials specific to one project
* **Project scope**: Team-shared servers, project-specific tools, or services required for collaboration
* **User scope**: Personal utilities needed across multiple projects, development tools, or frequently used services

<Note>
  **Where are MCP servers stored?**

  * **User and local scope**: `~/.claude.json` (in the `mcpServers` field or under project paths)
  * **Project scope**: `.mcp.json` in your project root (checked into source control)
  * **Managed**: `managed-mcp.json` in system directories (see [Managed MCP configuration](#managed-mcp-configuration))
</Note>

### Scope hierarchy and precedence

MCP server configurations follow a clear precedence hierarchy. When servers with the same name exist at multiple scopes, the system resolves conflicts by prioritizing local-scoped servers first, followed by project-scoped servers, and finally user-scoped servers. This design ensures that personal configurations can override shared ones when needed.

### Environment variable expansion in `.mcp.json`

Claude Code supports environment variable expansion in `.mcp.json` files, allowing teams to share configurations while maintaining flexibility for machine-specific paths and sensitive values like API keys.

**Supported syntax:**

* `${VAR}` - Expands to the value of environment variable `VAR`
* `${VAR:-default}` - Expands to `VAR` if set, otherwise uses `default`

**Expansion locations:**
Environment variables can be expanded in:

* `command` - The server executable path
* `args` - Command-line arguments
* `env` - Environment variables passed to the server
* `url` - For HTTP server types
* `headers` - For HTTP server authentication

**Example with variable expansion:**

```json  theme={null}
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

If a required environment variable is not set and has no default value, Claude Code will fail to parse the config.

## Practical examples

{/* ### Example: Automate browser testing with Playwright

  ```bash
  # 1. Add the Playwright MCP server
  claude mcp add --transport stdio playwright -- npx -y @playwright/mcp@latest

  # 2. Write and run browser tests
  > "Test if the login flow works with test@example.com"
  > "Take a screenshot of the checkout page on mobile"
  > "Verify that the search feature returns results"
  ``` */}

### Example: Monitor errors with Sentry

```bash  theme={null}
# 1. Add the Sentry MCP server
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# 2. Use /mcp to authenticate with your Sentry account
> /mcp

# 3. Debug production issues
> "What are the most common errors in the last 24 hours?"
> "Show me the stack trace for error ID abc123"
> "Which deployment introduced these new errors?"
```

### Example: Connect to GitHub for code reviews

```bash  theme={null}
# 1. Add the GitHub MCP server
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# 2. In Claude Code, authenticate if needed
> /mcp
# Select "Authenticate" for GitHub

# 3. Now you can ask Claude to work with GitHub
> "Review PR #456 and suggest improvements"
> "Create a new issue for the bug we just found"
> "Show me all open PRs assigned to me"
```

### Example: Query your PostgreSQL database

```bash  theme={null}
# 1. Add the database server with your connection string
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"

# 2. Query your database naturally
> "What's our total revenue this month?"
> "Show me the schema for the orders table"
> "Find customers who haven't made a purchase in 90 days"
```

## Authenticate with remote MCP servers

Many cloud-based MCP servers require authentication. Claude Code supports OAuth 2.0 for secure connections.

<Steps>
  <Step title="Add the server that requires authentication">
    For example:

    ```bash  theme={null}
    claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
    ```
  </Step>

  <Step title="Use the /mcp command within Claude Code">
    In Claude code, use the command:

    ```
    > /mcp
    ```

    Then follow the steps in your browser to login.
  </Step>
</Steps>

<Tip>
  Tips:

  * Authentication tokens are stored securely and refreshed automatically
  * Use "Clear authentication" in the `/mcp` menu to revoke access
  * If your browser doesn't open automatically, copy the provided URL and open it manually
  * If the browser redirect fails with a connection error after authenticating, paste the full callback URL from your browser's address bar into the URL prompt that appears in Claude Code
  * OAuth authentication works with HTTP servers
</Tip>

### Use a fixed OAuth callback port

Some MCP servers require a specific redirect URI registered in advance. By default, Claude Code picks a random available port for the OAuth callback. Use `--callback-port` to fix the port so it matches a pre-registered redirect URI of the form `http://localhost:PORT/callback`.

You can use `--callback-port` on its own (with dynamic client registration) or together with `--client-id` (with pre-configured credentials).

```bash  theme={null}
# Fixed callback port with dynamic client registration
claude mcp add --transport http \
  --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

### Use pre-configured OAuth credentials

Some MCP servers don't support automatic OAuth setup. If you see an error like "Incompatible auth server: does not support dynamic client registration," the server requires pre-configured credentials. Register an OAuth app through the server's developer portal first, then provide the credentials when adding the server.

<Steps>
  <Step title="Register an OAuth app with the server">
    Create an app through the server's developer portal and note your client ID and client secret.

    Many servers also require a redirect URI. If so, choose a port and register a redirect URI in the format `http://localhost:PORT/callback`. Use that same port with `--callback-port` in the next step.
  </Step>

  <Step title="Add the server with your credentials">
    Choose one of the following methods. The port used for `--callback-port` can be any available port. It just needs to match the redirect URI you registered in the previous step.

    <Tabs>
      <Tab title="claude mcp add">
        Use `--client-id` to pass your app's client ID. The `--client-secret` flag prompts for the secret with masked input:

        ```bash  theme={null}
        claude mcp add --transport http \
          --client-id your-client-id --client-secret --callback-port 8080 \
          my-server https://mcp.example.com/mcp
        ```
      </Tab>

      <Tab title="claude mcp add-json">
        Include the `oauth` object in the JSON config and pass `--client-secret` as a separate flag:

        ```bash  theme={null}
        claude mcp add-json my-server \
          '{"type":"http","url":"https://mcp.example.com/mcp","oauth":{"clientId":"your-client-id","callbackPort":8080}}' \
          --client-secret
        ```
      </Tab>

      <Tab title="claude mcp add-json (callback port only)">
        Use `--callback-port` without a client ID to fix the port while using dynamic client registration:

        ```bash  theme={null}
        claude mcp add-json my-server \
          '{"type":"http","url":"https://mcp.example.com/mcp","oauth":{"callbackPort":8080}}'
        ```
      </Tab>

      <Tab title="CI / env var">
        Set the secret via environment variable to skip the interactive prompt:

        ```bash  theme={null}
        MCP_CLIENT_SECRET=your-secret claude mcp add --transport http \
          --client-id your-client-id --client-secret --callback-port 8080 \
          my-server https://mcp.example.com/mcp
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Authenticate in Claude Code">
    Run `/mcp` in Claude Code and follow the browser login flow.
  </Step>
</Steps>

<Tip>
  Tips:

  * The client secret is stored securely in your system keychain (macOS) or a credentials file, not in your config
  * If the server uses a public OAuth client with no secret, use only `--client-id` without `--client-secret`
  * `--callback-port` can be used with or without `--client-id`
  * These flags only apply to HTTP and SSE transports. They have no effect on stdio servers
  * Use `claude mcp get <name>` to verify that OAuth credentials are configured for a server
</Tip>

### Override OAuth metadata discovery

If your MCP server returns errors on the standard OAuth metadata endpoint (`/.well-known/oauth-authorization-server`) but exposes a working OIDC endpoint, you can tell Claude Code to fetch OAuth metadata directly from a URL you specify, bypassing the standard discovery chain.

Set `authServerMetadataUrl` in the `oauth` object of your server's config in `.mcp.json`:

```json  theme={null}
{
  "mcpServers": {
    "my-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "authServerMetadataUrl": "https://auth.example.com/.well-known/openid-configuration"
      }
    }
  }
}
```

The URL must use `https://`. This option requires Claude Code v2.1.64 or later.

## Add MCP servers from JSON configuration

If you have a JSON configuration for an MCP server, you can add it directly:

<Steps>
  <Step title="Add an MCP server from JSON">
    ```bash  theme={null}
    # Basic syntax
    claude mcp add-json <name> '<json>'

    # Example: Adding an HTTP server with JSON configuration
    claude mcp add-json weather-api '{"type":"http","url":"https://api.weather.com/mcp","headers":{"Authorization":"Bearer token"}}'

    # Example: Adding a stdio server with JSON configuration
    claude mcp add-json local-weather '{"type":"stdio","command":"/path/to/weather-cli","args":["--api-key","abc123"],"env":{"CACHE_DIR":"/tmp"}}'

    # Example: Adding an HTTP server with pre-configured OAuth credentials
    claude mcp add-json my-server '{"type":"http","url":"https://mcp.example.com/mcp","oauth":{"clientId":"your-client-id","callbackPort":8080}}' --client-secret
    ```
  </Step>

  <Step title="Verify the server was added">
    ```bash  theme={null}
    claude mcp get weather-api
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Make sure the JSON is properly escaped in your shell
  * The JSON must conform to the MCP server configuration schema
  * You can use `--scope user` to add the server to your user configuration instead of the project-specific one
</Tip>

## Import MCP servers from Claude Desktop

If you've already configured MCP servers in Claude Desktop, you can import them:

<Steps>
  <Step title="Import servers from Claude Desktop">
    ```bash  theme={null}
    # Basic syntax 
    claude mcp add-from-claude-desktop 
    ```
  </Step>

  <Step title="Select which servers to import">
    After running the command, you'll see an interactive dialog that allows you to select which servers you want to import.
  </Step>

  <Step title="Verify the servers were imported">
    ```bash  theme={null}
    claude mcp list 
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * This feature only works on macOS and Windows Subsystem for Linux (WSL)
  * It reads the Claude Desktop configuration file from its standard location on those platforms
  * Use the `--scope user` flag to add servers to your user configuration
  * Imported servers will have the same names as in Claude Desktop
  * If servers with the same names already exist, they will get a numerical suffix (for example, `server_1`)
</Tip>

## Use MCP servers from Claude.ai

If you've logged into Claude Code with a [Claude.ai](https://claude.ai) account, MCP servers you've added in Claude.ai are automatically available in Claude Code:

<Steps>
  <Step title="Configure MCP servers in Claude.ai">
    Add servers at [claude.ai/settings/connectors](https://claude.ai/settings/connectors). On Team and Enterprise plans, only admins can add servers.
  </Step>

  <Step title="Authenticate the MCP server">
    Complete any required authentication steps in Claude.ai.
  </Step>

  <Step title="View and manage servers in Claude Code">
    In Claude Code, use the command:

    ```
    # Within Claude Code, see all MCP servers including Claude.ai ones
    > /mcp
    ```

    Claude.ai servers appear in the list with indicators showing they come from Claude.ai.
  </Step>
</Steps>

To disable claude.ai MCP servers in Claude Code, set the `ENABLE_CLAUDEAI_MCP_SERVERS` environment variable to `false`:

```bash  theme={null}
ENABLE_CLAUDEAI_MCP_SERVERS=false claude
```

## Use Claude Code as an MCP server

You can use Claude Code itself as an MCP server that other applications can connect to:

```bash  theme={null}
# Start Claude as a stdio MCP server
claude mcp serve
```

You can use this in Claude Desktop by adding this configuration to claude\_desktop\_config.json:

```json  theme={null}
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

<Warning>
  **Configuring the executable path**: The `command` field must reference the Claude Code executable. If the `claude` command is not in your system's PATH, you'll need to specify the full path to the executable.

  To find the full path:

  ```bash  theme={null}
  which claude
  ```

  Then use the full path in your configuration:

  ```json  theme={null}
  {
    "mcpServers": {
      "claude-code": {
        "type": "stdio",
        "command": "/full/path/to/claude",
        "args": ["mcp", "serve"],
        "env": {}
      }
    }
  }
  ```

  Without the correct executable path, you'll encounter errors like `spawn claude ENOENT`.
</Warning>

<Tip>
  Tips:

  * The server provides access to Claude's tools like View, Edit, LS, etc.
  * In Claude Desktop, try asking Claude to read files in a directory, make edits, and more.
  * Note that this MCP server is only exposing Claude Code's tools to your MCP client, so your own client is responsible for implementing user confirmation for individual tool calls.
</Tip>

## MCP output limits and warnings

When MCP tools produce large outputs, Claude Code helps manage the token usage to prevent overwhelming your conversation context:

* **Output warning threshold**: Claude Code displays a warning when any MCP tool output exceeds 10,000 tokens
* **Configurable limit**: You can adjust the maximum allowed MCP output tokens using the `MAX_MCP_OUTPUT_TOKENS` environment variable
* **Default limit**: The default maximum is 25,000 tokens

To increase the limit for tools that produce large outputs:

```bash  theme={null}
# Set a higher limit for MCP tool outputs
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

This is particularly useful when working with MCP servers that:

* Query large datasets or databases
* Generate detailed reports or documentation
* Process extensive log files or debugging information

<Warning>
  If you frequently encounter output warnings with specific MCP servers, consider increasing the limit or configuring the server to paginate or filter its responses.
</Warning>

## Use MCP resources

MCP servers can expose resources that you can reference using @ mentions, similar to how you reference files.

### Reference MCP resources

<Steps>
  <Step title="List available resources">
    Type `@` in your prompt to see available resources from all connected MCP servers. Resources appear alongside files in the autocomplete menu.
  </Step>

  <Step title="Reference a specific resource">
    Use the format `@server:protocol://resource/path` to reference a resource:

    ```
    > Can you analyze @github:issue://123 and suggest a fix?
    ```

    ```
    > Please review the API documentation at @docs:file://api/authentication
    ```
  </Step>

  <Step title="Multiple resource references">
    You can reference multiple resources in a single prompt:

    ```
    > Compare @postgres:schema://users with @docs:file://database/user-model
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Resources are automatically fetched and included as attachments when referenced
  * Resource paths are fuzzy-searchable in the @ mention autocomplete
  * Claude Code automatically provides tools to list and read MCP resources when servers support them
  * Resources can contain any type of content that the MCP server provides (text, JSON, structured data, etc.)
</Tip>

## Scale with MCP Tool Search

When you have many MCP servers configured, tool definitions can consume a significant portion of your context window. MCP Tool Search solves this by dynamically loading tools on-demand instead of preloading all of them.

### How it works

Claude Code automatically enables Tool Search when your MCP tool descriptions would consume more than 10% of the context window. You can [adjust this threshold](#configure-tool-search) or disable tool search entirely. When triggered:

1. MCP tools are deferred rather than loaded into context upfront
2. Claude uses a search tool to discover relevant MCP tools when needed
3. Only the tools Claude actually needs are loaded into context
4. MCP tools continue to work exactly as before from your perspective

### For MCP server authors

If you're building an MCP server, the server instructions field becomes more useful with Tool Search enabled. Server instructions help Claude understand when to search for your tools, similar to how [skills](/en/skills) work.

Add clear, descriptive server instructions that explain:

* What category of tasks your tools handle
* When Claude should search for your tools
* Key capabilities your server provides

### Configure tool search

Tool search runs in auto mode by default, meaning it activates only when your MCP tool definitions exceed the context threshold. If you have few tools, they load normally without tool search. This feature requires models that support `tool_reference` blocks: Sonnet 4 and later, or Opus 4 and later. Haiku models do not support tool search.

Control tool search behavior with the `ENABLE_TOOL_SEARCH` environment variable:

| Value      | Behavior                                                                           |
| :--------- | :--------------------------------------------------------------------------------- |
| `auto`     | Activates when MCP tools exceed 10% of context (default)                           |
| `auto:<N>` | Activates at custom threshold, where `<N>` is a percentage (e.g., `auto:5` for 5%) |
| `true`     | Always enabled                                                                     |
| `false`    | Disabled, all MCP tools loaded upfront                                             |

```bash  theme={null}
# Use a custom 5% threshold
ENABLE_TOOL_SEARCH=auto:5 claude

# Disable tool search entirely
ENABLE_TOOL_SEARCH=false claude
```

Or set the value in your [settings.json `env` field](/en/settings#available-settings).

You can also disable the MCPSearch tool specifically using the `disallowedTools` setting:

```json  theme={null}
{
  "permissions": {
    "deny": ["MCPSearch"]
  }
}
```

## Use MCP prompts as commands

MCP servers can expose prompts that become available as commands in Claude Code.

### Execute MCP prompts

<Steps>
  <Step title="Discover available prompts">
    Type `/` to see all available commands, including those from MCP servers. MCP prompts appear with the format `/mcp__servername__promptname`.
  </Step>

  <Step title="Execute a prompt without arguments">
    ```
    > /mcp__github__list_prs
    ```
  </Step>

  <Step title="Execute a prompt with arguments">
    Many prompts accept arguments. Pass them space-separated after the command:

    ```
    > /mcp__github__pr_review 456
    ```

    ```
    > /mcp__jira__create_issue "Bug in login flow" high
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * MCP prompts are dynamically discovered from connected servers
  * Arguments are parsed based on the prompt's defined parameters
  * Prompt results are injected directly into the conversation
  * Server and prompt names are normalized (spaces become underscores)
</Tip>

## Managed MCP configuration

For organizations that need centralized control over MCP servers, Claude Code supports two configuration options:

1. **Exclusive control with `managed-mcp.json`**: Deploy a fixed set of MCP servers that users cannot modify or extend
2. **Policy-based control with allowlists/denylists**: Allow users to add their own servers, but restrict which ones are permitted

These options allow IT administrators to:

* **Control which MCP servers employees can access**: Deploy a standardized set of approved MCP servers across the organization
* **Prevent unauthorized MCP servers**: Restrict users from adding unapproved MCP servers
* **Disable MCP entirely**: Remove MCP functionality completely if needed

### Option 1: Exclusive control with managed-mcp.json

When you deploy a `managed-mcp.json` file, it takes **exclusive control** over all MCP servers. Users cannot add, modify, or use any MCP servers other than those defined in this file. This is the simplest approach for organizations that want complete control.

System administrators deploy the configuration file to a system-wide directory:

* macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
* Linux and WSL: `/etc/claude-code/managed-mcp.json`
* Windows: `C:\Program Files\ClaudeCode\managed-mcp.json`

<Note>
  These are system-wide paths (not user home directories like `~/Library/...`) that require administrator privileges. They are designed to be deployed by IT administrators.
</Note>

The `managed-mcp.json` file uses the same format as a standard `.mcp.json` file:

```json  theme={null}
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    },
    "company-internal": {
      "type": "stdio",
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp-config.json"],
      "env": {
        "COMPANY_API_URL": "https://internal.company.com"
      }
    }
  }
}
```

### Option 2: Policy-based control with allowlists and denylists

Instead of taking exclusive control, administrators can allow users to configure their own MCP servers while enforcing restrictions on which servers are permitted. This approach uses `allowedMcpServers` and `deniedMcpServers` in the [managed settings file](/en/settings#settings-files).

<Note>
  **Choosing between options**: Use Option 1 (`managed-mcp.json`) when you want to deploy a fixed set of servers with no user customization. Use Option 2 (allowlists/denylists) when you want to allow users to add their own servers within policy constraints.
</Note>

#### Restriction options

Each entry in the allowlist or denylist can restrict servers in three ways:

1. **By server name** (`serverName`): Matches the configured name of the server
2. **By command** (`serverCommand`): Matches the exact command and arguments used to start stdio servers
3. **By URL pattern** (`serverUrl`): Matches remote server URLs with wildcard support

**Important**: Each entry must have exactly one of `serverName`, `serverCommand`, or `serverUrl`.

#### Example configuration

```json  theme={null}
{
  "allowedMcpServers": [
    // Allow by server name
    { "serverName": "github" },
    { "serverName": "sentry" },

    // Allow by exact command (for stdio servers)
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem"] },
    { "serverCommand": ["python", "/usr/local/bin/approved-server.py"] },

    // Allow by URL pattern (for remote servers)
    { "serverUrl": "https://mcp.company.com/*" },
    { "serverUrl": "https://*.internal.corp/*" }
  ],
  "deniedMcpServers": [
    // Block by server name
    { "serverName": "dangerous-server" },

    // Block by exact command (for stdio servers)
    { "serverCommand": ["npx", "-y", "unapproved-package"] },

    // Block by URL pattern (for remote servers)
    { "serverUrl": "https://*.untrusted.com/*" }
  ]
}
```

#### How command-based restrictions work

**Exact matching**:

* Command arrays must match **exactly** - both the command and all arguments in the correct order
* Example: `["npx", "-y", "server"]` will NOT match `["npx", "server"]` or `["npx", "-y", "server", "--flag"]`

**Stdio server behavior**:

* When the allowlist contains **any** `serverCommand` entries, stdio servers **must** match one of those commands
* Stdio servers cannot pass by name alone when command restrictions are present
* This ensures administrators can enforce which commands are allowed to run

**Non-stdio server behavior**:

* Remote servers (HTTP, SSE, WebSocket) use URL-based matching when `serverUrl` entries exist in the allowlist
* If no URL entries exist, remote servers fall back to name-based matching
* Command restrictions do not apply to remote servers

#### How URL-based restrictions work

URL patterns support wildcards using `*` to match any sequence of characters. This is useful for allowing entire domains or subdomains.

**Wildcard examples**:

* `https://mcp.company.com/*` - Allow all paths on a specific domain
* `https://*.example.com/*` - Allow any subdomain of example.com
* `http://localhost:*/*` - Allow any port on localhost

**Remote server behavior**:

* When the allowlist contains **any** `serverUrl` entries, remote servers **must** match one of those URL patterns
* Remote servers cannot pass by name alone when URL restrictions are present
* This ensures administrators can enforce which remote endpoints are allowed

<Accordion title="Example: URL-only allowlist">
  ```json  theme={null}
  {
    "allowedMcpServers": [
      { "serverUrl": "https://mcp.company.com/*" },
      { "serverUrl": "https://*.internal.corp/*" }
    ]
  }
  ```

  **Result**:

  * HTTP server at `https://mcp.company.com/api`: ✅ Allowed (matches URL pattern)
  * HTTP server at `https://api.internal.corp/mcp`: ✅ Allowed (matches wildcard subdomain)
  * HTTP server at `https://external.com/mcp`: ❌ Blocked (doesn't match any URL pattern)
  * Stdio server with any command: ❌ Blocked (no name or command entries to match)
</Accordion>

<Accordion title="Example: Command-only allowlist">
  ```json  theme={null}
  {
    "allowedMcpServers": [
      { "serverCommand": ["npx", "-y", "approved-package"] }
    ]
  }
  ```

  **Result**:

  * Stdio server with `["npx", "-y", "approved-package"]`: ✅ Allowed (matches command)
  * Stdio server with `["node", "server.js"]`: ❌ Blocked (doesn't match command)
  * HTTP server named "my-api": ❌ Blocked (no name entries to match)
</Accordion>

<Accordion title="Example: Mixed name and command allowlist">
  ```json  theme={null}
  {
    "allowedMcpServers": [
      { "serverName": "github" },
      { "serverCommand": ["npx", "-y", "approved-package"] }
    ]
  }
  ```

  **Result**:

  * Stdio server named "local-tool" with `["npx", "-y", "approved-package"]`: ✅ Allowed (matches command)
  * Stdio server named "local-tool" with `["node", "server.js"]`: ❌ Blocked (command entries exist but doesn't match)
  * Stdio server named "github" with `["node", "server.js"]`: ❌ Blocked (stdio servers must match commands when command entries exist)
  * HTTP server named "github": ✅ Allowed (matches name)
  * HTTP server named "other-api": ❌ Blocked (name doesn't match)
</Accordion>

<Accordion title="Example: Name-only allowlist">
  ```json  theme={null}
  {
    "allowedMcpServers": [
      { "serverName": "github" },
      { "serverName": "internal-tool" }
    ]
  }
  ```

  **Result**:

  * Stdio server named "github" with any command: ✅ Allowed (no command restrictions)
  * Stdio server named "internal-tool" with any command: ✅ Allowed (no command restrictions)
  * HTTP server named "github": ✅ Allowed (matches name)
  * Any server named "other": ❌ Blocked (name doesn't match)
</Accordion>

#### Allowlist behavior (`allowedMcpServers`)

* `undefined` (default): No restrictions - users can configure any MCP server
* Empty array `[]`: Complete lockdown - users cannot configure any MCP servers
* List of entries: Users can only configure servers that match by name, command, or URL pattern

#### Denylist behavior (`deniedMcpServers`)

* `undefined` (default): No servers are blocked
* Empty array `[]`: No servers are blocked
* List of entries: Specified servers are explicitly blocked across all scopes

#### Important notes

* **Option 1 and Option 2 can be combined**: If `managed-mcp.json` exists, it has exclusive control and users cannot add servers. Allowlists/denylists still apply to the managed servers themselves.
* **Denylist takes absolute precedence**: If a server matches a denylist entry (by name, command, or URL), it will be blocked even if it's on the allowlist
* Name-based, command-based, and URL-based restrictions work together: a server passes if it matches **either** a name entry, a command entry, or a URL pattern (unless blocked by denylist)

<Note>
  **When using `managed-mcp.json`**: Users cannot add MCP servers through `claude mcp add` or configuration files. The `allowedMcpServers` and `deniedMcpServers` settings still apply to filter which managed servers are actually loaded.
</Note>
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Troubleshooting

> Discover solutions to common issues with Claude Code installation and usage.

## Troubleshoot installation issues

<Tip>
  If you'd rather skip the terminal entirely, the [Claude Code Desktop app](/en/desktop-quickstart) lets you install and use Claude Code through a graphical interface. Download it for [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code\&utm_medium=docs) or [Windows](https://claude.ai/api/desktop/win32/x64/exe/latest/redirect?utm_source=claude_code\&utm_medium=docs) and start coding without any command-line setup.
</Tip>

Find the error message or symptom you're seeing:

| What you see                                                | Solution                                                                                                                |
| :---------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| `command not found: claude` or `'claude' is not recognized` | [Fix your PATH](#command-not-found-claude-after-installation)                                                           |
| `syntax error near unexpected token '<'`                    | [Install script returns HTML](#install-script-returns-html-instead-of-a-shell-script)                                   |
| `curl: (56) Failure writing output to destination`          | [Download script first, then run it](#curl-56-failure-writing-output-to-destination)                                    |
| `Killed` during install on Linux                            | [Add swap space for low-memory servers](#install-killed-on-low-memory-linux-servers)                                    |
| `TLS connect error` or `SSL/TLS secure channel`             | [Update CA certificates](#tls-or-ssl-connection-errors)                                                                 |
| `Failed to fetch version` or can't reach download server    | [Check network and proxy settings](#check-network-connectivity)                                                         |
| `irm is not recognized` or `&& is not valid`                | [Use the right command for your shell](#windows-irm-or--not-recognized)                                                 |
| `Claude Code on Windows requires git-bash`                  | [Install or configure Git Bash](#windows-claude-code-on-windows-requires-git-bash)                                      |
| `Error loading shared library`                              | [Wrong binary variant for your system](#linux-wrong-binary-variant-installed-muslglibc-mismatch)                        |
| `Illegal instruction` on Linux                              | [Architecture mismatch](#illegal-instruction-on-linux)                                                                  |
| `dyld: cannot load` or `Abort trap` on macOS                | [Binary incompatibility](#dyld-cannot-load-on-macos)                                                                    |
| `Invoke-Expression: Missing argument in parameter list`     | [Install script returns HTML](#install-script-returns-html-instead-of-a-shell-script)                                   |
| `App unavailable in region`                                 | Claude Code is not available in your country. See [supported countries](https://www.anthropic.com/supported-countries). |
| `unable to get local issuer certificate`                    | [Configure corporate CA certificates](#tls-or-ssl-connection-errors)                                                    |
| `OAuth error` or `403 Forbidden`                            | [Fix authentication](#authentication-issues)                                                                            |

If your issue isn't listed, work through these diagnostic steps.

## Debug installation problems

### Check network connectivity

The installer downloads from `storage.googleapis.com`. Verify you can reach it:

```bash  theme={null}
curl -sI https://storage.googleapis.com
```

If this fails, your network may be blocking the connection. Common causes:

* Corporate firewalls or proxies blocking Google Cloud Storage
* Regional network restrictions: try a VPN or alternative network
* TLS/SSL issues: update your system's CA certificates, or check if `HTTPS_PROXY` is configured

If you're behind a corporate proxy, set `HTTPS_PROXY` and `HTTP_PROXY` to your proxy's address before installing. Ask your IT team for the proxy URL if you don't know it, or check your browser's proxy settings.

This example sets both proxy variables, then runs the installer through your proxy:

```bash  theme={null}
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
curl -fsSL https://claude.ai/install.sh | bash
```

### Verify your PATH

If installation succeeded but you get a `command not found` or `not recognized` error when running `claude`, the install directory isn't in your PATH. Your shell searches for programs in directories listed in PATH, and the installer places `claude` at `~/.local/bin/claude` on macOS/Linux or `%USERPROFILE%\.local\bin\claude.exe` on Windows.

Check if the install directory is in your PATH by listing your PATH entries and filtering for `local/bin`:

<Tabs>
  <Tab title="macOS/Linux">
    ```bash  theme={null}
    echo $PATH | tr ':' '\n' | grep local/bin
    ```

    If there's no output, the directory is missing. Add it to your shell configuration:

    ```bash  theme={null}
    # Zsh (macOS default)
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc

    # Bash (Linux default)
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    ```

    Alternatively, close and reopen your terminal.

    Verify the fix worked:

    ```bash  theme={null}
    claude --version
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    $env:PATH -split ';' | Select-String 'local\\bin'
    ```

    If there's no output, add the install directory to your User PATH:

    ```powershell  theme={null}
    $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
    [Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
    ```

    Restart your terminal for the change to take effect.

    Verify the fix worked:

    ```powershell  theme={null}
    claude --version
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch  theme={null}
    echo %PATH% | findstr /i "local\bin"
    ```

    If there's no output, open System Settings, go to Environment Variables, and add `%USERPROFILE%\.local\bin` to your User PATH variable. Restart your terminal.

    Verify the fix worked:

    ```batch  theme={null}
    claude --version
    ```
  </Tab>
</Tabs>

### Check for conflicting installations

Multiple Claude Code installations can cause version mismatches or unexpected behavior. Check what's installed:

<Tabs>
  <Tab title="macOS/Linux">
    List all `claude` binaries found in your PATH:

    ```bash  theme={null}
    which -a claude
    ```

    Check whether the native installer and npm versions are present:

    ```bash  theme={null}
    ls -la ~/.local/bin/claude
    ```

    ```bash  theme={null}
    ls -la ~/.claude/local/
    ```

    ```bash  theme={null}
    npm -g ls @anthropic-ai/claude-code 2>/dev/null
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    where.exe claude
    Test-Path "$env:LOCALAPPDATA\Claude Code\claude.exe"
    ```
  </Tab>
</Tabs>

If you find multiple installations, keep only one. The native install at `~/.local/bin/claude` is recommended. Remove any extra installations:

Uninstall an npm global install:

```bash  theme={null}
npm uninstall -g @anthropic-ai/claude-code
```

Remove a Homebrew install on macOS:

```bash  theme={null}
brew uninstall --cask claude-code
```

### Check directory permissions

The installer needs write access to `~/.local/bin/` and `~/.claude/`. If installation fails with permission errors, check whether these directories are writable:

```bash  theme={null}
test -w ~/.local/bin && echo "writable" || echo "not writable"
test -w ~/.claude && echo "writable" || echo "not writable"
```

If either directory isn't writable, create the install directory and set your user as the owner:

```bash  theme={null}
sudo mkdir -p ~/.local/bin
sudo chown -R $(whoami) ~/.local
```

### Verify the binary works

If `claude` is installed but crashes or hangs on startup, run these checks to narrow down the cause.

Confirm the binary exists and is executable:

```bash  theme={null}
ls -la $(which claude)
```

On Linux, check for missing shared libraries. If `ldd` shows missing libraries, you may need to install system packages. On Alpine Linux and other musl-based distributions, see [Alpine Linux setup](/en/setup#alpine-linux-and-musl-based-distributions).

```bash  theme={null}
ldd $(which claude) | grep "not found"
```

Run a quick sanity check that the binary can execute:

```bash  theme={null}
claude --version
```

## Common installation issues

These are the most frequently encountered installation problems and their solutions.

### Install script returns HTML instead of a shell script

When running the install command, you may see one of these errors:

```
bash: line 1: syntax error near unexpected token `<'
bash: line 1: `<!DOCTYPE html>'
```

On PowerShell, the same problem appears as:

```
Invoke-Expression: Missing argument in parameter list.
```

This means the install URL returned an HTML page instead of the install script. If the HTML page says "App unavailable in region," Claude Code is not available in your country. See [supported countries](https://www.anthropic.com/supported-countries).

Otherwise, this can happen due to network issues, regional routing, or a temporary service disruption.

**Solutions:**

1. **Use an alternative install method**:

   On macOS or Linux, install via Homebrew:

   ```bash  theme={null}
   brew install --cask claude-code
   ```

   On Windows, install via WinGet:

   ```powershell  theme={null}
   winget install Anthropic.ClaudeCode
   ```

2. **Retry after a few minutes**: the issue is often temporary. Wait and try the original command again.

### `command not found: claude` after installation

The install finished but `claude` doesn't work. The exact error varies by platform:

| Platform    | Error message                                                          |
| :---------- | :--------------------------------------------------------------------- |
| macOS       | `zsh: command not found: claude`                                       |
| Linux       | `bash: claude: command not found`                                      |
| Windows CMD | `'claude' is not recognized as an internal or external command`        |
| PowerShell  | `claude : The term 'claude' is not recognized as the name of a cmdlet` |

This means the install directory isn't in your shell's search path. See [Verify your PATH](#verify-your-path) for the fix on each platform.

### `curl: (56) Failure writing output to destination`

The `curl ... | bash` command downloads the script and passes it directly to Bash for execution using a pipe (`|`). This error means the connection broke before the script finished downloading. Common causes include network interruptions, the download being blocked mid-stream, or system resource limits.

**Solutions:**

1. **Check network stability**: Claude Code binaries are hosted on Google Cloud Storage. Test that you can reach it:
   ```bash  theme={null}
   curl -fsSL https://storage.googleapis.com -o /dev/null
   ```
   If the command completes silently, your connection is fine and the issue is likely intermittent. Retry the install command. If you see an error, your network may be blocking the download.

2. **Try an alternative install method**:

   On macOS or Linux:

   ```bash  theme={null}
   brew install --cask claude-code
   ```

   On Windows:

   ```powershell  theme={null}
   winget install Anthropic.ClaudeCode
   ```

### TLS or SSL connection errors

Errors like `curl: (35) TLS connect error`, `schannel: next InitializeSecurityContext failed`, or PowerShell's `Could not establish trust relationship for the SSL/TLS secure channel` indicate TLS handshake failures.

**Solutions:**

1. **Update your system CA certificates**:

   On Ubuntu/Debian:

   ```bash  theme={null}
   sudo apt-get update && sudo apt-get install ca-certificates
   ```

   On macOS via Homebrew:

   ```bash  theme={null}
   brew install ca-certificates
   ```

2. **On Windows, enable TLS 1.2** in PowerShell before running the installer:
   ```powershell  theme={null}
   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
   irm https://claude.ai/install.ps1 | iex
   ```

3. **Check for proxy or firewall interference**: corporate proxies that perform TLS inspection can cause these errors, including `unable to get local issuer certificate`. Set `NODE_EXTRA_CA_CERTS` to your corporate CA certificate bundle:
   ```bash  theme={null}
   export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem
   ```
   Ask your IT team for the certificate file if you don't have it. You can also try on a direct connection to confirm the proxy is the cause.

### `Failed to fetch version from storage.googleapis.com`

The installer couldn't reach the download server. This typically means `storage.googleapis.com` is blocked on your network.

**Solutions:**

1. **Test connectivity directly**:
   ```bash  theme={null}
   curl -sI https://storage.googleapis.com
   ```

2. **If behind a proxy**, set `HTTPS_PROXY` so the installer can route through it. See [proxy configuration](/en/network-config#proxy-configuration) for details.
   ```bash  theme={null}
   export HTTPS_PROXY=http://proxy.example.com:8080
   curl -fsSL https://claude.ai/install.sh | bash
   ```

3. **If on a restricted network**, try a different network or VPN, or use an alternative install method:

   On macOS or Linux:

   ```bash  theme={null}
   brew install --cask claude-code
   ```

   On Windows:

   ```powershell  theme={null}
   winget install Anthropic.ClaudeCode
   ```

### Windows: `irm` or `&&` not recognized

If you see `'irm' is not recognized` or `The token '&&' is not valid`, you're running the wrong command for your shell.

* **`irm` not recognized**: you're in CMD, not PowerShell. You have two options:

  Open PowerShell by searching for "PowerShell" in the Start menu, then run the original install command:

  ```powershell  theme={null}
  irm https://claude.ai/install.ps1 | iex
  ```

  Or stay in CMD and use the CMD installer instead:

  ```batch  theme={null}
  curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
  ```

* **`&&` not valid**: you're in PowerShell but ran the CMD installer command. Use the PowerShell installer:
  ```powershell  theme={null}
  irm https://claude.ai/install.ps1 | iex
  ```

### Install killed on low-memory Linux servers

If you see `Killed` during installation on a VPS or cloud instance:

```
Setting up Claude Code...
Installing Claude Code native build latest...
bash: line 142: 34803 Killed    "$binary_path" install ${TARGET:+"$TARGET"}
```

The Linux OOM killer terminated the process because the system ran out of memory. Claude Code requires at least 4 GB of available RAM.

**Solutions:**

1. **Add swap space** if your server has limited RAM. Swap uses disk space as overflow memory, letting the install complete even with low physical RAM.

   Create a 2 GB swap file and enable it:

   ```bash  theme={null}
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

   Then retry the installation:

   ```bash  theme={null}
   curl -fsSL https://claude.ai/install.sh | bash
   ```

2. **Close other processes** to free memory before installing.

3. **Use a larger instance** if possible. Claude Code requires at least 4 GB of RAM.

### Install hangs in Docker

When installing Claude Code in a Docker container, installing as root into `/` can cause hangs.

**Solutions:**

1. **Set a working directory** before running the installer. When run from `/`, the installer scans the entire filesystem, which causes excessive memory usage. Setting `WORKDIR` limits the scan to a small directory:
   ```dockerfile  theme={null}
   WORKDIR /tmp
   RUN curl -fsSL https://claude.ai/install.sh | bash
   ```

2. **Increase Docker memory limits** if using Docker Desktop:
   ```bash  theme={null}
   docker build --memory=4g .
   ```

### Windows: Claude Desktop overrides `claude` CLI command

If you installed an older version of Claude Desktop, it may register a `Claude.exe` in the `WindowsApps` directory that takes PATH priority over Claude Code CLI. Running `claude` opens the Desktop app instead of the CLI.

Update Claude Desktop to the latest version to fix this issue.

### Windows: "Claude Code on Windows requires git-bash"

Claude Code on native Windows needs [Git for Windows](https://git-scm.com/downloads/win), which includes Git Bash.

**If Git is not installed**, download and install it from [git-scm.com/downloads/win](https://git-scm.com/downloads/win). During setup, select "Add to PATH." Restart your terminal after installing.

**If Git is already installed** but Claude Code still can't find it, set the path in your [settings.json file](/en/settings):

```json  theme={null}
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

If your Git is installed somewhere else, find the path by running `where.exe git` in PowerShell and use the `bin\bash.exe` path from that directory.

### Linux: wrong binary variant installed (musl/glibc mismatch)

If you see errors about missing shared libraries like `libstdc++.so.6` or `libgcc_s.so.1` after installation, the installer may have downloaded the wrong binary variant for your system.

```
Error loading shared library libstdc++.so.6: No such file or directory
```

This can happen on glibc-based systems that have musl cross-compilation packages installed, causing the installer to misdetect the system as musl.

**Solutions:**

1. **Check which libc your system uses**:
   ```bash  theme={null}
   ldd /bin/ls | head -1
   ```
   If it shows `linux-vdso.so` or references to `/lib/x86_64-linux-gnu/`, you're on glibc. If it shows `musl`, you're on musl.

2. **If you're on glibc but got the musl binary**, remove the installation and reinstall. You can also manually download the correct binary from the GCS bucket at `https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases/{VERSION}/manifest.json`. File a [GitHub issue](https://github.com/anthropics/claude-code/issues) with the output of `ldd /bin/ls` and `ls /lib/libc.musl*`.

3. **If you're actually on musl** (Alpine Linux), install the required packages:
   ```bash  theme={null}
   apk add libgcc libstdc++ ripgrep
   ```

### `Illegal instruction` on Linux

If the installer prints `Illegal instruction` instead of the OOM `Killed` message, the downloaded binary doesn't match your CPU architecture. This commonly happens on ARM servers that receive an x86 binary, or on older CPUs that lack required instruction sets.

```
bash: line 142: 2238232 Illegal instruction    "$binary_path" install ${TARGET:+"$TARGET"}
```

**Solutions:**

1. **Verify your architecture**:
   ```bash  theme={null}
   uname -m
   ```
   `x86_64` means 64-bit Intel/AMD, `aarch64` means ARM64. If the binary doesn't match, [file a GitHub issue](https://github.com/anthropics/claude-code/issues) with the output.

2. **Try an alternative install method** while the architecture issue is resolved:
   ```bash  theme={null}
   brew install --cask claude-code
   ```

### `dyld: cannot load` on macOS

If you see `dyld: cannot load` or `Abort trap: 6` during installation, the binary is incompatible with your macOS version or hardware.

```
dyld: cannot load 'claude-2.1.42-darwin-x64' (load command 0x80000034 is unknown)
Abort trap: 6
```

**Solutions:**

1. **Check your macOS version**: Claude Code requires macOS 13.0 or later. Open the Apple menu and select About This Mac to check your version.

2. **Update macOS** if you're on an older version. The binary uses load commands that older macOS versions don't support.

3. **Try Homebrew** as an alternative install method:
   ```bash  theme={null}
   brew install --cask claude-code
   ```

### Windows installation issues: errors in WSL

You might encounter the following issues in WSL:

**OS/platform detection issues**: if you receive an error during installation, WSL may be using Windows `npm`. Try:

* Run `npm config set os linux` before installation
* Install with `npm install -g @anthropic-ai/claude-code --force --no-os-check`. Do not use `sudo`.

**Node not found errors**: if you see `exec: node: not found` when running `claude`, your WSL environment may be using a Windows installation of Node.js. You can confirm this with `which npm` and `which node`, which should point to Linux paths starting with `/usr/` rather than `/mnt/c/`. To fix this, try installing Node via your Linux distribution's package manager or via [`nvm`](https://github.com/nvm-sh/nvm).

**nvm version conflicts**: if you have nvm installed in both WSL and Windows, you may experience version conflicts when switching Node versions in WSL. This happens because WSL imports the Windows PATH by default, causing Windows nvm/npm to take priority over the WSL installation.

You can identify this issue by:

* Running `which npm` and `which node` - if they point to Windows paths (starting with `/mnt/c/`), Windows versions are being used
* Experiencing broken functionality after switching Node versions with nvm in WSL

To resolve this issue, fix your Linux PATH to ensure the Linux node/npm versions take priority:

**Primary solution: Ensure nvm is properly loaded in your shell**

The most common cause is that nvm isn't loaded in non-interactive shells. Add the following to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.):

```bash  theme={null}
# Load nvm if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Or run directly in your current session:

```bash  theme={null}
source ~/.nvm/nvm.sh
```

**Alternative: Adjust PATH order**

If nvm is properly loaded but Windows paths still take priority, you can explicitly prepend your Linux paths to PATH in your shell configuration:

```bash  theme={null}
export PATH="$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"
```

<Warning>
  Avoid disabling Windows PATH importing via `appendWindowsPath = false` as this breaks the ability to call Windows executables from WSL. Similarly, avoid uninstalling Node.js from Windows if you use it for Windows development.
</Warning>

### WSL2 sandbox setup

[Sandboxing](/en/sandboxing) is supported on WSL2 but requires installing additional packages. If you see an error like "Sandbox requires socat and bubblewrap" when running `/sandbox`, install the dependencies:

<Tabs>
  <Tab title="Ubuntu/Debian">
    ```bash  theme={null}
    sudo apt-get install bubblewrap socat
    ```
  </Tab>

  <Tab title="Fedora">
    ```bash  theme={null}
    sudo dnf install bubblewrap socat
    ```
  </Tab>
</Tabs>

WSL1 does not support sandboxing. If you see "Sandboxing requires WSL2", you need to upgrade to WSL2 or run Claude Code without sandboxing.

### Permission errors during installation

If the native installer fails with permission errors, the target directory may not be writable. See [Check directory permissions](#check-directory-permissions).

If you previously installed with npm and are hitting npm-specific permission errors, switch to the native installer:

```bash  theme={null}
curl -fsSL https://claude.ai/install.sh | bash
```

## Permissions and authentication

These sections address login failures, token issues, and permission prompt behavior.

### Repeated permission prompts

If you find yourself repeatedly approving the same commands, you can allow specific tools
to run without approval using the `/permissions` command. See [Permissions docs](/en/permissions#manage-permissions).

### Authentication issues

If you're experiencing authentication problems:

1. Run `/logout` to sign out completely
2. Close Claude Code
3. Restart with `claude` and complete the authentication process again

If the browser doesn't open automatically during login, press `c` to copy the OAuth URL to your clipboard, then paste it into your browser manually.

### OAuth error: Invalid code

If you see `OAuth error: Invalid code. Please make sure the full code was copied`, the login code expired or was truncated during copy-paste.

**Solutions:**

* Press Enter to retry and complete the login quickly after the browser opens
* Type `c` to copy the full URL if the browser doesn't open automatically
* If using a remote/SSH session, the browser may open on the wrong machine. Copy the URL displayed in the terminal and open it in your local browser instead.

### 403 Forbidden after login

If you see `API Error: 403 {"error":{"type":"forbidden","message":"Request not allowed"}}` after logging in:

* **Claude Pro/Max users**: verify your subscription is active at [claude.ai/settings](https://claude.ai/settings)
* **Console users**: confirm your account has the "Claude Code" or "Developer" role assigned by your admin
* **Behind a proxy**: corporate proxies can interfere with API requests. See [network configuration](/en/network-config) for proxy setup.

### OAuth login fails in WSL2

Browser-based login in WSL2 may fail if WSL can't open your Windows browser. Set the `BROWSER` environment variable:

```bash  theme={null}
export BROWSER="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
claude
```

Or copy the URL manually: when the login prompt appears, press `c` to copy the OAuth URL, then paste it into your Windows browser.

### "Not logged in" or token expired

If Claude Code prompts you to log in again after a session, your OAuth token may have expired.

Run `/login` to re-authenticate. If this happens frequently, check that your system clock is accurate, as token validation depends on correct timestamps.

## Configuration file locations

Claude Code stores configuration in several locations:

| File                          | Purpose                                                                                                |
| :---------------------------- | :----------------------------------------------------------------------------------------------------- |
| `~/.claude/settings.json`     | User settings (permissions, hooks, model overrides)                                                    |
| `.claude/settings.json`       | Project settings (checked into source control)                                                         |
| `.claude/settings.local.json` | Local project settings (not committed)                                                                 |
| `~/.claude.json`              | Global state (theme, OAuth, MCP servers)                                                               |
| `.mcp.json`                   | Project MCP servers (checked into source control)                                                      |
| `managed-mcp.json`            | [Managed MCP servers](/en/mcp#managed-mcp-configuration)                                               |
| Managed settings              | [Managed settings](/en/settings#settings-files) (server-managed, MDM/OS-level policies, or file-based) |

On Windows, `~` refers to your user home directory, such as `C:\Users\YourName`.

For details on configuring these files, see [Settings](/en/settings) and [MCP](/en/mcp).

### Resetting configuration

To reset Claude Code to default settings, you can remove the configuration files:

```bash  theme={null}
# Reset all user settings and state
rm ~/.claude.json
rm -rf ~/.claude/

# Reset project-specific settings
rm -rf .claude/
rm .mcp.json
```

<Warning>
  This will remove all your settings, MCP server configurations, and session history.
</Warning>

## Performance and stability

These sections cover issues related to resource usage, responsiveness, and search behavior.

### High CPU or memory usage

Claude Code is designed to work with most development environments, but may consume significant resources when processing large codebases. If you're experiencing performance issues:

1. Use `/compact` regularly to reduce context size
2. Close and restart Claude Code between major tasks
3. Consider adding large build directories to your `.gitignore` file

### Command hangs or freezes

If Claude Code seems unresponsive:

1. Press Ctrl+C to attempt to cancel the current operation
2. If unresponsive, you may need to close the terminal and restart

### Search and discovery issues

If Search tool, `@file` mentions, custom agents, and custom skills aren't working, install system `ripgrep`:

```bash  theme={null}
# macOS (Homebrew)  
brew install ripgrep

# Windows (winget)
winget install BurntSushi.ripgrep.MSVC

# Ubuntu/Debian
sudo apt install ripgrep

# Alpine Linux
apk add ripgrep

# Arch Linux
pacman -S ripgrep
```

Then set `USE_BUILTIN_RIPGREP=0` in your [environment](/en/settings#environment-variables).

### Slow or incomplete search results on WSL

Disk read performance penalties when [working across file systems on WSL](https://learn.microsoft.com/en-us/windows/wsl/filesystems) may result in fewer-than-expected matches when using Claude Code on WSL. Search still functions, but returns fewer results than on a native filesystem.

<Note>
  `/doctor` will show Search as OK in this case.
</Note>

**Solutions:**

1. **Submit more specific searches**: reduce the number of files searched by specifying directories or file types: "Search for JWT validation logic in the auth-service package" or "Find use of md5 hash in JS files".

2. **Move project to Linux filesystem**: if possible, ensure your project is located on the Linux filesystem (`/home/`) rather than the Windows filesystem (`/mnt/c/`).

3. **Use native Windows instead**: consider running Claude Code natively on Windows instead of through WSL, for better file system performance.

## IDE integration issues

If Claude Code does not connect to your IDE or behaves unexpectedly within an IDE terminal, try the solutions below.

### JetBrains IDE not detected on WSL2

If you're using Claude Code on WSL2 with JetBrains IDEs and getting "No available IDEs detected" errors, this is likely due to WSL2's networking configuration or Windows Firewall blocking the connection.

#### WSL2 networking modes

WSL2 uses NAT networking by default, which can prevent IDE detection. You have two options:

**Option 1: Configure Windows Firewall** (recommended)

1. Find your WSL2 IP address:
   ```bash  theme={null}
   wsl hostname -I
   # Example output: 172.21.123.45
   ```

2. Open PowerShell as Administrator and create a firewall rule:
   ```powershell  theme={null}
   New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow -RemoteAddress 172.21.0.0/16 -LocalAddress 172.21.0.0/16
   ```
   Adjust the IP range based on your WSL2 subnet from step 1.

3. Restart both your IDE and Claude Code

**Option 2: Switch to mirrored networking**

Add to `.wslconfig` in your Windows user directory:

```ini  theme={null}
[wsl2]
networkingMode=mirrored
```

Then restart WSL with `wsl --shutdown` from PowerShell.

<Note>
  These networking issues only affect WSL2. WSL1 uses the host's network directly and doesn't require these configurations.
</Note>

For additional JetBrains configuration tips, see the [JetBrains IDE guide](/en/jetbrains#plugin-settings).

### Report Windows IDE integration issues

If you're experiencing IDE integration problems on Windows, [create an issue](https://github.com/anthropics/claude-code/issues) with the following information:

* Environment type: native Windows (Git Bash) or WSL1/WSL2
* WSL networking mode, if applicable: NAT or mirrored
* IDE name and version
* Claude Code extension/plugin version
* Shell type: Bash, Zsh, PowerShell, etc.

### Escape key not working in JetBrains IDE terminals

If you're using Claude Code in JetBrains terminals and the `Esc` key doesn't interrupt the agent as expected, this is likely due to a keybinding clash with JetBrains' default shortcuts.

To fix this issue:

1. Go to Settings → Tools → Terminal
2. Either:
   * Uncheck "Move focus to the editor with Escape", or
   * Click "Configure terminal keybindings" and delete the "Switch focus to Editor" shortcut
3. Apply the changes

This allows the `Esc` key to properly interrupt Claude Code operations.

## Markdown formatting issues

Claude Code sometimes generates markdown files with missing language tags on code fences, which can affect syntax highlighting and readability in GitHub, editors, and documentation tools.

### Missing language tags in code blocks

If you notice code blocks like this in generated markdown:

````markdown  theme={null}
```
function example() {
  return "hello";
}
```text
````

Instead of properly tagged blocks like:

````markdown  theme={null}
```javascript
function example() {
  return "hello";
}
```text
````

**Solutions:**

1. **Ask Claude to add language tags**: request "Add appropriate language tags to all code blocks in this markdown file."

2. **Use post-processing hooks**: set up automatic formatting hooks to detect and add missing language tags. See [Auto-format code after edits](/en/hooks-guide#auto-format-code-after-edits) for an example of a PostToolUse formatting hook.

3. **Manual verification**: after generating markdown files, review them for proper code block formatting and request corrections if needed.

### Inconsistent spacing and formatting

If generated markdown has excessive blank lines or inconsistent spacing:

**Solutions:**

1. **Request formatting corrections**: ask Claude to "Fix spacing and formatting issues in this markdown file."

2. **Use formatting tools**: set up hooks to run markdown formatters like `prettier` or custom formatting scripts on generated markdown files.

3. **Specify formatting preferences**: include formatting requirements in your prompts or project [memory](/en/memory) files.

### Reduce markdown formatting issues

To minimize formatting issues:

* **Be explicit in requests**: ask for "properly formatted markdown with language-tagged code blocks"
* **Use project conventions**: document your preferred markdown style in [`CLAUDE.md`](/en/memory)
* **Set up validation hooks**: use post-processing hooks to automatically verify and fix common formatting issues

## Get more help

If you're experiencing issues not covered here:

1. Use the `/bug` command within Claude Code to report problems directly to Anthropic
2. Check the [GitHub repository](https://github.com/anthropics/claude-code) for known issues
3. Run `/doctor` to diagnose issues. It checks:
   * Installation type, version, and search functionality
   * Auto-update status and available versions
   * Invalid settings files (malformed JSON, incorrect types)
   * MCP server configuration errors
   * Keybinding configuration problems
   * Context usage warnings (large CLAUDE.md files, high MCP token usage, unreachable permission rules)
   * Plugin and agent loading errors
4. Ask Claude directly about its capabilities and features - Claude has built-in access to its documentation
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Advanced setup

> System requirements, platform-specific installation, version management, and uninstallation for Claude Code.

This page covers system requirements, platform-specific installation details, updates, and uninstallation. For a guided walkthrough of your first session, see the [quickstart](/en/quickstart). If you've never used a terminal before, see the [terminal guide](/en/terminal-guide).

## System requirements

Claude Code runs on the following platforms and configurations:

* **Operating system**:
  * macOS 13.0+
  * Windows 10 1809+ or Windows Server 2019+
  * Ubuntu 20.04+
  * Debian 10+
  * Alpine Linux 3.19+
* **Hardware**: 4 GB+ RAM
* **Network**: internet connection required. See [network configuration](/en/network-config#network-access-requirements).
* **Shell**: Bash, Zsh, PowerShell, or CMD. On Windows, [Git for Windows](https://git-scm.com/downloads/win) is required.
* **Location**: [Anthropic supported countries](https://www.anthropic.com/supported-countries)

### Additional dependencies

* **ripgrep**: usually included with Claude Code. If search fails, see [search troubleshooting](/en/troubleshooting#search-and-discovery-issues).

## Install Claude Code

<Tip>
  Prefer a graphical interface? The [Desktop app](/en/desktop-quickstart) lets you use Claude Code without the terminal. Download it for [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code\&utm_medium=docs) or [Windows](https://claude.ai/api/desktop/win32/x64/exe/latest/redirect?utm_source=claude_code\&utm_medium=docs).

  New to the terminal? See the [terminal guide](/en/terminal-guide) for step-by-step instructions.
</Tip>

To install Claude Code, use one of the following methods:

<Tabs>
  <Tab title="Native Install (Recommended)">
    **macOS, Linux, WSL:**

    ```bash  theme={null}
    curl -fsSL https://claude.ai/install.sh | bash
    ```

    **Windows PowerShell:**

    ```powershell  theme={null}
    irm https://claude.ai/install.ps1 | iex
    ```

    **Windows CMD:**

    ```batch  theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
    ```

    **Windows requires [Git for Windows](https://git-scm.com/downloads/win).** Install it first if you don't have it.

    <Info>
      Native installations automatically update in the background to keep you on the latest version.
    </Info>
  </Tab>

  <Tab title="Homebrew">
    ```bash  theme={null}
    brew install --cask claude-code
    ```

    <Info>
      Homebrew installations do not auto-update. Run `brew upgrade claude-code` periodically to get the latest features and security fixes.
    </Info>
  </Tab>

  <Tab title="WinGet">
    ```powershell  theme={null}
    winget install Anthropic.ClaudeCode
    ```

    <Info>
      WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.
    </Info>
  </Tab>
</Tabs>

After installation completes, open a terminal in the project you want to work in and start Claude Code:

```bash  theme={null}
claude
```

If you encounter any issues during installation, see the [troubleshooting guide](/en/troubleshooting).

### Set up on Windows

Claude Code on Windows requires [Git for Windows](https://git-scm.com/downloads/win) or WSL. You can launch `claude` from PowerShell, CMD, or Git Bash. Claude Code uses Git Bash internally to run commands. You do not need to run PowerShell as Administrator.

**Option 1: Native Windows with Git Bash**

Install [Git for Windows](https://git-scm.com/downloads/win), then run the install command from PowerShell or CMD.

If Claude Code can't find your Git Bash installation, set the path in your [settings.json file](/en/settings):

```json  theme={null}
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

**Option 2: WSL**

Both WSL 1 and WSL 2 are supported. WSL 2 supports [sandboxing](/en/sandboxing) for enhanced security. WSL 1 does not support sandboxing.

### Alpine Linux and musl-based distributions

The native installer on Alpine and other musl/uClibc-based distributions requires `libgcc`, `libstdc++`, and `ripgrep`. Install these using your distribution's package manager, then set `USE_BUILTIN_RIPGREP=0`.

This example installs the required packages on Alpine:

```bash  theme={null}
apk add libgcc libstdc++ ripgrep
```

Then set `USE_BUILTIN_RIPGREP` to `0` in your [settings.json file](/en/settings#environment-variables):

```json  theme={null}
{
  "env": {
    "USE_BUILTIN_RIPGREP": "0"
  }
}
```

## Verify your installation

After installing, confirm Claude Code is working:

```bash  theme={null}
claude --version
```

For a more detailed check of your installation and configuration, run [`claude doctor`](/en/troubleshooting#get-more-help):

```bash  theme={null}
claude doctor
```

## Authenticate

Claude Code requires a Pro, Max, Teams, Enterprise, or Console account. The free Claude.ai plan does not include Claude Code access. You can also use Claude Code with a third-party API provider like [Amazon Bedrock](/en/amazon-bedrock), [Google Vertex AI](/en/google-vertex-ai), or [Microsoft Foundry](/en/microsoft-foundry).

After installing, log in by running `claude` and following the browser prompts. See [Authentication](/en/authentication) for all account types and team setup options.

## Update Claude Code

Native installations automatically update in the background. You can [configure the release channel](#configure-release-channel) to control whether you receive updates immediately or on a delayed stable schedule, or [disable auto-updates](#disable-auto-updates) entirely. Homebrew and WinGet installations require manual updates.

### Auto-updates

Claude Code checks for updates on startup and periodically while running. Updates download and install in the background, then take effect the next time you start Claude Code.

<Note>
  Homebrew and WinGet installations do not auto-update. Use `brew upgrade claude-code` or `winget upgrade Anthropic.ClaudeCode` to update manually.

  **Known issue:** Claude Code may notify you of updates before the new version is available in these package managers. If an upgrade fails, wait and try again later.

  Homebrew keeps old versions on disk after upgrades. Run `brew cleanup claude-code` periodically to reclaim disk space.
</Note>

### Configure release channel

Control which release channel Claude Code follows for auto-updates and `claude update` with the `autoUpdatesChannel` setting:

* `"latest"`, the default: receive new features as soon as they're released
* `"stable"`: use a version that is typically about one week old, skipping releases with major regressions

Configure this via `/config` → **Auto-update channel**, or add it to your [settings.json file](/en/settings):

```json  theme={null}
{
  "autoUpdatesChannel": "stable"
}
```

For enterprise deployments, you can enforce a consistent release channel across your organization using [managed settings](/en/permissions#managed-settings).

### Disable auto-updates

Set `DISABLE_AUTOUPDATER` to `"1"` in the `env` key of your [settings.json file](/en/settings#environment-variables):

```json  theme={null}
{
  "env": {
    "DISABLE_AUTOUPDATER": "1"
  }
}
```

### Update manually

To apply an update immediately without waiting for the next background check, run:

```bash  theme={null}
claude update
```

## Advanced installation options

These options are for version pinning, migrating from npm, and verifying binary integrity.

### Install a specific version

The native installer accepts either a specific version number or a release channel (`latest` or `stable`). The channel you choose at install time becomes your default for auto-updates. See [configure release channel](#configure-release-channel) for more information.

To install the latest version (default):

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash  theme={null}
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    irm https://claude.ai/install.ps1 | iex
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch  theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
    ```
  </Tab>
</Tabs>

To install the stable version:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash  theme={null}
    curl -fsSL https://claude.ai/install.sh | bash -s stable
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    & ([scriptblock]::Create((irm https://claude.ai/install.ps1))) stable
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch  theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd stable && del install.cmd
    ```
  </Tab>
</Tabs>

To install a specific version number:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash  theme={null}
    curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    & ([scriptblock]::Create((irm https://claude.ai/install.ps1))) 1.0.58
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch  theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd 1.0.58 && del install.cmd
    ```
  </Tab>
</Tabs>

### Deprecated npm installation

npm installation is deprecated. The native installer is faster, requires no dependencies, and auto-updates in the background. Use the [native installation](#install-claude-code) method when possible.

#### Migrate from npm to native

If you previously installed Claude Code with npm, switch to the native installer:

```bash  theme={null}
# Install the native binary
curl -fsSL https://claude.ai/install.sh | bash

# Remove the old npm installation
npm uninstall -g @anthropic-ai/claude-code
```

You can also run `claude install` from an existing npm installation to install the native binary alongside it, then remove the npm version.

#### Install with npm

If you need npm installation for compatibility reasons, you must have [Node.js 18+](https://nodejs.org/en/download) installed. Install the package globally:

```bash  theme={null}
npm install -g @anthropic-ai/claude-code
```

<Warning>
  Do NOT use `sudo npm install -g` as this can lead to permission issues and security risks. If you encounter permission errors, see [troubleshooting permission errors](/en/troubleshooting#permission-errors-during-installation).
</Warning>

### Binary integrity and code signing

You can verify the integrity of Claude Code binaries using SHA256 checksums and code signatures.

* SHA256 checksums for all platforms are published in the release manifests at `https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases/{VERSION}/manifest.json`. Replace `{VERSION}` with a version number such as `2.0.30`.
* Signed binaries are distributed for the following platforms:
  * **macOS**: signed by "Anthropic PBC" and notarized by Apple
  * **Windows**: signed by "Anthropic, PBC"

## Uninstall Claude Code

To remove Claude Code, follow the instructions for your installation method.

### Native installation

Remove the Claude Code binary and version files:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash  theme={null}
    rm -f ~/.local/bin/claude
    rm -rf ~/.local/share/claude
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    Remove-Item -Path "$env:USERPROFILE\.local\bin\claude.exe" -Force
    Remove-Item -Path "$env:USERPROFILE\.local\share\claude" -Recurse -Force
    ```
  </Tab>
</Tabs>

### Homebrew installation

Remove the Homebrew cask:

```bash  theme={null}
brew uninstall --cask claude-code
```

### WinGet installation

Remove the WinGet package:

```powershell  theme={null}
winget uninstall Anthropic.ClaudeCode
```

### npm

Remove the global npm package:

```bash  theme={null}
npm uninstall -g @anthropic-ai/claude-code
```

### Remove configuration files

<Warning>
  Removing configuration files will delete all your settings, allowed tools, MCP server configurations, and session history.
</Warning>

To remove Claude Code settings and cached data:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash  theme={null}
    # Remove user settings and state
    rm -rf ~/.claude
    rm ~/.claude.json

    # Remove project-specific settings (run from your project directory)
    rm -rf .claude
    rm -f .mcp.json
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell  theme={null}
    # Remove user settings and state
    Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force
    Remove-Item -Path "$env:USERPROFILE\.claude.json" -Force

    # Remove project-specific settings (run from your project directory)
    Remove-Item -Path ".claude" -Recurse -Force
    Remove-Item -Path ".mcp.json" -Force
    ```
  </Tab>
</Tabs>
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication

> Log in to Claude Code and configure authentication for individuals, teams, and organizations.

Claude Code supports multiple authentication methods depending on your setup. Individual users can log in with a Claude.ai account, while teams can use Claude for Teams or Enterprise, the Claude Console, or a cloud provider like Amazon Bedrock, Google Vertex AI, or Microsoft Foundry.

## Log in to Claude Code

After [installing Claude Code](/en/setup#install-claude-code), run `claude` in your terminal. On first launch, Claude Code opens a browser window for you to log in.

If the browser doesn't open automatically, press `c` to copy the login URL to your clipboard, then paste it into your browser.

You can authenticate with any of these account types:

* **Claude Pro or Max subscription**: log in with your Claude.ai account. Subscribe at [claude.com/pricing](https://claude.com/pricing).
* **Claude for Teams or Enterprise**: log in with the Claude.ai account your team admin invited you to.
* **Claude Console**: log in with your Console credentials. Your admin must have [invited you](#claude-console-authentication) first.
* **Cloud providers**: if your organization uses [Amazon Bedrock](/en/amazon-bedrock), [Google Vertex AI](/en/google-vertex-ai), or [Microsoft Foundry](/en/microsoft-foundry), set the required environment variables before running `claude`. No browser login is needed.

To log out and re-authenticate, type `/logout` at the Claude Code prompt.

If you're having trouble logging in, see [authentication troubleshooting](/en/troubleshooting#authentication-issues).

## Set up team authentication

For teams and organizations, you can configure Claude Code access in one of these ways:

* [Claude for Teams or Enterprise](#claude-for-teams-or-enterprise), recommended for most teams
* [Claude Console](#claude-console-authentication)
* [Amazon Bedrock](/en/amazon-bedrock)
* [Google Vertex AI](/en/google-vertex-ai)
* [Microsoft Foundry](/en/microsoft-foundry)

### Claude for Teams or Enterprise

[Claude for Teams](https://claude.com/pricing#team-&-enterprise) and [Claude for Enterprise](https://anthropic.com/contact-sales) provide the best experience for organizations using Claude Code. Team members get access to both Claude Code and Claude on the web with centralized billing and team management.

* **Claude for Teams**: self-service plan with collaboration features, admin tools, and billing management. Best for smaller teams.
* **Claude for Enterprise**: adds SSO, domain capture, role-based permissions, compliance API, and managed policy settings for organization-wide Claude Code configurations. Best for larger organizations with security and compliance requirements.

<Steps>
  <Step title="Subscribe">
    Subscribe to [Claude for Teams](https://claude.com/pricing#team-&-enterprise) or contact sales for [Claude for Enterprise](https://anthropic.com/contact-sales).
  </Step>

  <Step title="Invite team members">
    Invite team members from the admin dashboard.
  </Step>

  <Step title="Install and log in">
    Team members install Claude Code and log in with their Claude.ai accounts.
  </Step>
</Steps>

### Claude Console authentication

For organizations that prefer API-based billing, you can set up access through the Claude Console.

<Steps>
  <Step title="Create or use a Console account">
    Use your existing Claude Console account or create a new one.
  </Step>

  <Step title="Add users">
    You can add users through either method:

    * Bulk invite users from within the Console: Settings -> Members -> Invite
    * [Set up SSO](https://support.claude.com/en/articles/13132885-setting-up-single-sign-on-sso)
  </Step>

  <Step title="Assign roles">
    When inviting users, assign one of:

    * **Claude Code** role: users can only create Claude Code API keys
    * **Developer** role: users can create any kind of API key
  </Step>

  <Step title="Users complete setup">
    Each invited user needs to:

    * Accept the Console invite
    * [Check system requirements](/en/setup#system-requirements)
    * [Install Claude Code](/en/setup#install-claude-code)
    * Log in with Console account credentials
  </Step>
</Steps>

### Cloud provider authentication

For teams using Amazon Bedrock, Google Vertex AI, or Microsoft Foundry:

<Steps>
  <Step title="Follow provider setup">
    Follow the [Bedrock docs](/en/amazon-bedrock), [Vertex docs](/en/google-vertex-ai), or [Microsoft Foundry docs](/en/microsoft-foundry).
  </Step>

  <Step title="Distribute configuration">
    Distribute the environment variables and instructions for generating cloud credentials to your users. Read more about how to [manage configuration here](/en/settings).
  </Step>

  <Step title="Install Claude Code">
    Users can [install Claude Code](/en/setup#install-claude-code).
  </Step>
</Steps>

## Credential management

Claude Code securely manages your authentication credentials:

* **Storage location**: on macOS, credentials are stored in the encrypted macOS Keychain.
* **Supported authentication types**: Claude.ai credentials, Claude API credentials, Azure Auth, Bedrock Auth, and Vertex Auth.
* **Custom credential scripts**: the [`apiKeyHelper`](/en/settings#available-settings) setting can be configured to run a shell script that returns an API key.
* **Refresh intervals**: by default, `apiKeyHelper` is called after 5 minutes or on HTTP 401 response. Set `CLAUDE_CODE_API_KEY_HELPER_TTL_MS` environment variable for custom refresh intervals.
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Security

> Learn about Claude Code's security safeguards and best practices for safe usage.

## How we approach security

### Security foundation

Your code's security is paramount. Claude Code is built with security at its core, developed according to Anthropic's comprehensive security program. Learn more and access resources (SOC 2 Type 2 report, ISO 27001 certificate, etc.) at [Anthropic Trust Center](https://trust.anthropic.com).

### Permission-based architecture

Claude Code uses strict read-only permissions by default. When additional actions are needed (editing files, running tests, executing commands), Claude Code requests explicit permission. Users control whether to approve actions once or allow them automatically.

We designed Claude Code to be transparent and secure. For example, we require approval for bash commands before executing them, giving you direct control. This approach enables users and organizations to configure permissions directly.

For detailed permission configuration, see [Permissions](/en/permissions).

### Built-in protections

To mitigate risks in agentic systems:

* **Sandboxed bash tool**: [Sandbox](/en/sandboxing) bash commands with filesystem and network isolation, reducing permission prompts while maintaining security. Enable with `/sandbox` to define boundaries where Claude Code can work autonomously
* **Write access restriction**: Claude Code can only write to the folder where it was started and its subfolders—it cannot modify files in parent directories without explicit permission. While Claude Code can read files outside the working directory (useful for accessing system libraries and dependencies), write operations are strictly confined to the project scope, creating a clear security boundary
* **Prompt fatigue mitigation**: Support for allowlisting frequently used safe commands per-user, per-codebase, or per-organization
* **Accept Edits mode**: Batch accept multiple edits while maintaining permission prompts for commands with side effects

### User responsibility

Claude Code only has the permissions you grant it. You're responsible for reviewing proposed code and commands for safety before approval.

## Protect against prompt injection

Prompt injection is a technique where an attacker attempts to override or manipulate an AI assistant's instructions by inserting malicious text. Claude Code includes several safeguards against these attacks:

### Core protections

* **Permission system**: Sensitive operations require explicit approval
* **Context-aware analysis**: Detects potentially harmful instructions by analyzing the full request
* **Input sanitization**: Prevents command injection by processing user inputs
* **Command blocklist**: Blocks risky commands that fetch arbitrary content from the web like `curl` and `wget` by default. When explicitly allowed, be aware of [permission pattern limitations](/en/permissions#tool-specific-permission-rules)

### Privacy safeguards

We have implemented several safeguards to protect your data, including:

* Limited retention periods for sensitive information (see the [Privacy Center](https://privacy.anthropic.com/en/articles/10023548-how-long-do-you-store-my-data) to learn more)
* Restricted access to user session data
* User control over data training preferences. Consumer users can change their [privacy settings](https://claude.ai/settings/privacy) at any time.

For full details, please review our [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) (for Team, Enterprise, and API users) or [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (for Free, Pro, and Max users) and [Privacy Policy](https://www.anthropic.com/legal/privacy).

### Additional safeguards

* **Network request approval**: Tools that make network requests require user approval by default
* **Isolated context windows**: Web fetch uses a separate context window to avoid injecting potentially malicious prompts
* **Trust verification**: First-time codebase runs and new MCP servers require trust verification
  * Note: Trust verification is disabled when running non-interactively with the `-p` flag
* **Command injection detection**: Suspicious bash commands require manual approval even if previously allowlisted
* **Fail-closed matching**: Unmatched commands default to requiring manual approval
* **Natural language descriptions**: Complex bash commands include explanations for user understanding
* **Secure credential storage**: API keys and tokens are encrypted. See [Credential Management](/en/authentication#credential-management)

<Warning>
  **Windows WebDAV security risk**: When running Claude Code on Windows, we recommend against enabling WebDAV or allowing Claude Code to access paths such as `\\*` that may contain WebDAV subdirectories. [WebDAV has been deprecated by Microsoft](https://learn.microsoft.com/en-us/windows/whats-new/deprecated-features#:~:text=The%20Webclient%20\(WebDAV\)%20service%20is%20deprecated) due to security risks. Enabling WebDAV may allow Claude Code to trigger network requests to remote hosts, bypassing the permission system.
</Warning>

**Best practices for working with untrusted content**:

1. Review suggested commands before approval
2. Avoid piping untrusted content directly to Claude
3. Verify proposed changes to critical files
4. Use virtual machines (VMs) to run scripts and make tool calls, especially when interacting with external web services
5. Report suspicious behavior with `/bug`

<Warning>
  While these protections significantly reduce risk, no system is completely
  immune to all attacks. Always maintain good security practices when working
  with any AI tool.
</Warning>

## MCP security

Claude Code allows users to configure Model Context Protocol (MCP) servers. The list of allowed MCP servers is configured in your source code, as part of Claude Code settings engineers check into source control.

We encourage either writing your own MCP servers or using MCP servers from providers that you trust. You are able to configure Claude Code permissions for MCP servers. Anthropic does not manage or audit any MCP servers.

## IDE security

See [VS Code security and privacy](/en/vs-code#security-and-privacy) for more information on running Claude Code in an IDE.

## Cloud execution security

When using [Claude Code on the web](/en/claude-code-on-the-web), additional security controls are in place:

* **Isolated virtual machines**: Each cloud session runs in an isolated, Anthropic-managed VM
* **Network access controls**: Network access is limited by default and can be configured to be disabled or allow only specific domains
* **Credential protection**: Authentication is handled through a secure proxy that uses a scoped credential inside the sandbox, which is then translated to your actual GitHub authentication token
* **Branch restrictions**: Git push operations are restricted to the current working branch
* **Audit logging**: All operations in cloud environments are logged for compliance and audit purposes
* **Automatic cleanup**: Cloud environments are automatically terminated after session completion

For more details on cloud execution, see [Claude Code on the web](/en/claude-code-on-the-web).

[Remote Control](/en/remote-control) sessions work differently: the web interface connects to a Claude Code process running on your local machine. All code execution and file access stays local, and the same data that flows during any local Claude Code session travels through the Anthropic API over TLS. No cloud VMs or sandboxing are involved. The connection uses multiple short-lived, narrowly scoped credentials, each limited to a specific purpose and expiring independently, to limit the blast radius of any single compromised credential.

## Security best practices

### Working with sensitive code

* Review all suggested changes before approval
* Use project-specific permission settings for sensitive repositories
* Consider using [devcontainers](/en/devcontainer) for additional isolation
* Regularly audit your permission settings with `/permissions`

### Team security

* Use [managed settings](/en/settings#settings-files) to enforce organizational standards
* Share approved permission configurations through version control
* Train team members on security best practices
* Monitor Claude Code usage through [OpenTelemetry metrics](/en/monitoring-usage)
* Audit or block settings changes during sessions with [`ConfigChange` hooks](/en/hooks#configchange)

### Reporting security issues

If you discover a security vulnerability in Claude Code:

1. Do not disclose it publicly
2. Report it through our [HackerOne program](https://hackerone.com/anthropic-vdp/reports/new?type=team\&report_type=vulnerability)
3. Include detailed reproduction steps
4. Allow time for us to address the issue before public disclosure

## Related resources

* [Sandboxing](/en/sandboxing) - Filesystem and network isolation for bash commands
* [Permissions](/en/permissions) - Configure permissions and access controls
* [Monitoring usage](/en/monitoring-usage) - Track and audit Claude Code activity
* [Development containers](/en/devcontainer) - Secure, isolated environments
* [Anthropic Trust Center](https://trust.anthropic.com) - Security certifications and compliance
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Security

> Learn about Claude Code's security safeguards and best practices for safe usage.

## How we approach security

### Security foundation

Your code's security is paramount. Claude Code is built with security at its core, developed according to Anthropic's comprehensive security program. Learn more and access resources (SOC 2 Type 2 report, ISO 27001 certificate, etc.) at [Anthropic Trust Center](https://trust.anthropic.com).

### Permission-based architecture

Claude Code uses strict read-only permissions by default. When additional actions are needed (editing files, running tests, executing commands), Claude Code requests explicit permission. Users control whether to approve actions once or allow them automatically.

We designed Claude Code to be transparent and secure. For example, we require approval for bash commands before executing them, giving you direct control. This approach enables users and organizations to configure permissions directly.

For detailed permission configuration, see [Permissions](/en/permissions).

### Built-in protections

To mitigate risks in agentic systems:

* **Sandboxed bash tool**: [Sandbox](/en/sandboxing) bash commands with filesystem and network isolation, reducing permission prompts while maintaining security. Enable with `/sandbox` to define boundaries where Claude Code can work autonomously
* **Write access restriction**: Claude Code can only write to the folder where it was started and its subfolders—it cannot modify files in parent directories without explicit permission. While Claude Code can read files outside the working directory (useful for accessing system libraries and dependencies), write operations are strictly confined to the project scope, creating a clear security boundary
* **Prompt fatigue mitigation**: Support for allowlisting frequently used safe commands per-user, per-codebase, or per-organization
* **Accept Edits mode**: Batch accept multiple edits while maintaining permission prompts for commands with side effects

### User responsibility

Claude Code only has the permissions you grant it. You're responsible for reviewing proposed code and commands for safety before approval.

## Protect against prompt injection

Prompt injection is a technique where an attacker attempts to override or manipulate an AI assistant's instructions by inserting malicious text. Claude Code includes several safeguards against these attacks:

### Core protections

* **Permission system**: Sensitive operations require explicit approval
* **Context-aware analysis**: Detects potentially harmful instructions by analyzing the full request
* **Input sanitization**: Prevents command injection by processing user inputs
* **Command blocklist**: Blocks risky commands that fetch arbitrary content from the web like `curl` and `wget` by default. When explicitly allowed, be aware of [permission pattern limitations](/en/permissions#tool-specific-permission-rules)

### Privacy safeguards

We have implemented several safeguards to protect your data, including:

* Limited retention periods for sensitive information (see the [Privacy Center](https://privacy.anthropic.com/en/articles/10023548-how-long-do-you-store-my-data) to learn more)
* Restricted access to user session data
* User control over data training preferences. Consumer users can change their [privacy settings](https://claude.ai/settings/privacy) at any time.

For full details, please review our [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) (for Team, Enterprise, and API users) or [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (for Free, Pro, and Max users) and [Privacy Policy](https://www.anthropic.com/legal/privacy).

### Additional safeguards

* **Network request approval**: Tools that make network requests require user approval by default
* **Isolated context windows**: Web fetch uses a separate context window to avoid injecting potentially malicious prompts
* **Trust verification**: First-time codebase runs and new MCP servers require trust verification
  * Note: Trust verification is disabled when running non-interactively with the `-p` flag
* **Command injection detection**: Suspicious bash commands require manual approval even if previously allowlisted
* **Fail-closed matching**: Unmatched commands default to requiring manual approval
* **Natural language descriptions**: Complex bash commands include explanations for user understanding
* **Secure credential storage**: API keys and tokens are encrypted. See [Credential Management](/en/authentication#credential-management)

<Warning>
  **Windows WebDAV security risk**: When running Claude Code on Windows, we recommend against enabling WebDAV or allowing Claude Code to access paths such as `\\*` that may contain WebDAV subdirectories. [WebDAV has been deprecated by Microsoft](https://learn.microsoft.com/en-us/windows/whats-new/deprecated-features#:~:text=The%20Webclient%20\(WebDAV\)%20service%20is%20deprecated) due to security risks. Enabling WebDAV may allow Claude Code to trigger network requests to remote hosts, bypassing the permission system.
</Warning>

**Best practices for working with untrusted content**:

1. Review suggested commands before approval
2. Avoid piping untrusted content directly to Claude
3. Verify proposed changes to critical files
4. Use virtual machines (VMs) to run scripts and make tool calls, especially when interacting with external web services
5. Report suspicious behavior with `/bug`

<Warning>
  While these protections significantly reduce risk, no system is completely
  immune to all attacks. Always maintain good security practices when working
  with any AI tool.
</Warning>

## MCP security

Claude Code allows users to configure Model Context Protocol (MCP) servers. The list of allowed MCP servers is configured in your source code, as part of Claude Code settings engineers check into source control.

We encourage either writing your own MCP servers or using MCP servers from providers that you trust. You are able to configure Claude Code permissions for MCP servers. Anthropic does not manage or audit any MCP servers.

## IDE security

See [VS Code security and privacy](/en/vs-code#security-and-privacy) for more information on running Claude Code in an IDE.

## Cloud execution security

When using [Claude Code on the web](/en/claude-code-on-the-web), additional security controls are in place:

* **Isolated virtual machines**: Each cloud session runs in an isolated, Anthropic-managed VM
* **Network access controls**: Network access is limited by default and can be configured to be disabled or allow only specific domains
* **Credential protection**: Authentication is handled through a secure proxy that uses a scoped credential inside the sandbox, which is then translated to your actual GitHub authentication token
* **Branch restrictions**: Git push operations are restricted to the current working branch
* **Audit logging**: All operations in cloud environments are logged for compliance and audit purposes
* **Automatic cleanup**: Cloud environments are automatically terminated after session completion

For more details on cloud execution, see [Claude Code on the web](/en/claude-code-on-the-web).

[Remote Control](/en/remote-control) sessions work differently: the web interface connects to a Claude Code process running on your local machine. All code execution and file access stays local, and the same data that flows during any local Claude Code session travels through the Anthropic API over TLS. No cloud VMs or sandboxing are involved. The connection uses multiple short-lived, narrowly scoped credentials, each limited to a specific purpose and expiring independently, to limit the blast radius of any single compromised credential.

## Security best practices

### Working with sensitive code

* Review all suggested changes before approval
* Use project-specific permission settings for sensitive repositories
* Consider using [devcontainers](/en/devcontainer) for additional isolation
* Regularly audit your permission settings with `/permissions`

### Team security

* Use [managed settings](/en/settings#settings-files) to enforce organizational standards
* Share approved permission configurations through version control
* Train team members on security best practices
* Monitor Claude Code usage through [OpenTelemetry metrics](/en/monitoring-usage)
* Audit or block settings changes during sessions with [`ConfigChange` hooks](/en/hooks#configchange)

### Reporting security issues

If you discover a security vulnerability in Claude Code:

1. Do not disclose it publicly
2. Report it through our [HackerOne program](https://hackerone.com/anthropic-vdp/reports/new?type=team\&report_type=vulnerability)
3. Include detailed reproduction steps
4. Allow time for us to address the issue before public disclosure

## Related resources

* [Sandboxing](/en/sandboxing) - Filesystem and network isolation for bash commands
* [Permissions](/en/permissions) - Configure permissions and access controls
* [Monitoring usage](/en/monitoring-usage) - Track and audit Claude Code activity
* [Development containers](/en/devcontainer) - Secure, isolated environments
* [Anthropic Trust Center](https://trust.anthropic.com) - Security certifications and compliance
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Monitoring

> Learn how to enable and configure OpenTelemetry for Claude Code.

Track Claude Code usage, costs, and tool activity across your organization by exporting telemetry data through OpenTelemetry (OTel). Claude Code exports metrics as time series data via the standard metrics protocol, and events via the logs/events protocol. Configure your metrics and logs backends to match your monitoring requirements.

## Quick start

Configure OpenTelemetry using environment variables:

```bash  theme={null}
# 1. Enable telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# 2. Choose exporters (both are optional - configure only what you need)
export OTEL_METRICS_EXPORTER=otlp       # Options: otlp, prometheus, console
export OTEL_LOGS_EXPORTER=otlp          # Options: otlp, console

# 3. Configure OTLP endpoint (for OTLP exporter)
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# 4. Set authentication (if required)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# 5. For debugging: reduce export intervals
export OTEL_METRIC_EXPORT_INTERVAL=10000  # 10 seconds (default: 60000ms)
export OTEL_LOGS_EXPORT_INTERVAL=5000     # 5 seconds (default: 5000ms)

# 6. Run Claude Code
claude
```

<Note>
  The default export intervals are 60 seconds for metrics and 5 seconds for logs. During setup, you may want to use shorter intervals for debugging purposes. Remember to reset these for production use.
</Note>

For full configuration options, see the [OpenTelemetry specification](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/protocol/exporter.md#configuration-options).

## Administrator configuration

Administrators can configure OpenTelemetry settings for all users through the [managed settings file](/en/settings#settings-files). This allows for centralized control of telemetry settings across an organization. See the [settings precedence](/en/settings#settings-precedence) for more information about how settings are applied.

Example managed settings configuration:

```json  theme={null}
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.example.com:4317",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer example-token"
  }
}
```

<Note>
  Managed settings can be distributed via MDM (Mobile Device Management) or other device management solutions. Environment variables defined in the managed settings file have high precedence and cannot be overridden by users.
</Note>

## Configuration details

### Common configuration variables

| Environment Variable                                | Description                                                                                                           | Example Values                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `CLAUDE_CODE_ENABLE_TELEMETRY`                      | Enables telemetry collection (required)                                                                               | `1`                                  |
| `OTEL_METRICS_EXPORTER`                             | Metrics exporter types, comma-separated                                                                               | `console`, `otlp`, `prometheus`      |
| `OTEL_LOGS_EXPORTER`                                | Logs/events exporter types, comma-separated                                                                           | `console`, `otlp`                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                       | Protocol for OTLP exporter, applies to all signals                                                                    | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                       | OTLP collector endpoint for all signals                                                                               | `http://localhost:4317`              |
| `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`               | Protocol for metrics, overrides general setting                                                                       | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`               | OTLP metrics endpoint, overrides general setting                                                                      | `http://localhost:4318/v1/metrics`   |
| `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`                  | Protocol for logs, overrides general setting                                                                          | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`                  | OTLP logs endpoint, overrides general setting                                                                         | `http://localhost:4318/v1/logs`      |
| `OTEL_EXPORTER_OTLP_HEADERS`                        | Authentication headers for OTLP                                                                                       | `Authorization=Bearer token`         |
| `OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY`             | Client key for mTLS authentication                                                                                    | Path to client key file              |
| `OTEL_EXPORTER_OTLP_METRICS_CLIENT_CERTIFICATE`     | Client certificate for mTLS authentication                                                                            | Path to client cert file             |
| `OTEL_METRIC_EXPORT_INTERVAL`                       | Export interval in milliseconds (default: 60000)                                                                      | `5000`, `60000`                      |
| `OTEL_LOGS_EXPORT_INTERVAL`                         | Logs export interval in milliseconds (default: 5000)                                                                  | `1000`, `10000`                      |
| `OTEL_LOG_USER_PROMPTS`                             | Enable logging of user prompt content (default: disabled)                                                             | `1` to enable                        |
| `OTEL_LOG_TOOL_DETAILS`                             | Enable logging of MCP server/tool names and skill names in tool events (default: disabled)                            | `1` to enable                        |
| `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE` | Metrics temporality preference (default: `delta`). Set to `cumulative` if your backend expects cumulative temporality | `delta`, `cumulative`                |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`       | Interval for refreshing dynamic headers (default: 1740000ms / 29 minutes)                                             | `900000`                             |

### Metrics cardinality control

The following environment variables control which attributes are included in metrics to manage cardinality:

| Environment Variable                | Description                                     | Default Value | Example to Disable |
| ----------------------------------- | ----------------------------------------------- | ------------- | ------------------ |
| `OTEL_METRICS_INCLUDE_SESSION_ID`   | Include session.id attribute in metrics         | `true`        | `false`            |
| `OTEL_METRICS_INCLUDE_VERSION`      | Include app.version attribute in metrics        | `false`       | `true`             |
| `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` | Include user.account\_uuid attribute in metrics | `true`        | `false`            |

These variables help control the cardinality of metrics, which affects storage requirements and query performance in your metrics backend. Lower cardinality generally means better performance and lower storage costs but less granular data for analysis.

### Dynamic headers

For enterprise environments that require dynamic authentication, you can configure a script to generate headers dynamically:

#### Settings configuration

Add to your `.claude/settings.json`:

```json  theme={null}
{
  "otelHeadersHelper": "/bin/generate_opentelemetry_headers.sh"
}
```

#### Script requirements

The script must output valid JSON with string key-value pairs representing HTTP headers:

```bash  theme={null}
#!/bin/bash
# Example: Multiple headers
echo "{\"Authorization\": \"Bearer $(get-token.sh)\", \"X-API-Key\": \"$(get-api-key.sh)\"}"
```

#### Refresh behavior

The headers helper script runs at startup and periodically thereafter to support token refresh. By default, the script runs every 29 minutes. Customize the interval with the `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS` environment variable.

### Multi-team organization support

Organizations with multiple teams or departments can add custom attributes to distinguish between different groups using the `OTEL_RESOURCE_ATTRIBUTES` environment variable:

```bash  theme={null}
# Add custom attributes for team identification
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=platform,cost_center=eng-123"
```

These custom attributes will be included in all metrics and events, allowing you to:

* Filter metrics by team or department
* Track costs per cost center
* Create team-specific dashboards
* Set up alerts for specific teams

<Warning>
  **Important formatting requirements for OTEL\_RESOURCE\_ATTRIBUTES:**

  The `OTEL_RESOURCE_ATTRIBUTES` environment variable uses comma-separated key=value pairs with strict formatting requirements:

  * **No spaces allowed**: Values cannot contain spaces. For example, `user.organizationName=My Company` is invalid
  * **Format**: Must be comma-separated key=value pairs: `key1=value1,key2=value2`
  * **Allowed characters**: Only US-ASCII characters excluding control characters, whitespace, double quotes, commas, semicolons, and backslashes
  * **Special characters**: Characters outside the allowed range must be percent-encoded

  **Examples:**

  ```bash  theme={null}
  # ❌ Invalid - contains spaces
  export OTEL_RESOURCE_ATTRIBUTES="org.name=John's Organization"

  # ✅ Valid - use underscores or camelCase instead
  export OTEL_RESOURCE_ATTRIBUTES="org.name=Johns_Organization"
  export OTEL_RESOURCE_ATTRIBUTES="org.name=JohnsOrganization"

  # ✅ Valid - percent-encode special characters if needed
  export OTEL_RESOURCE_ATTRIBUTES="org.name=John%27s%20Organization"
  ```

  Note: wrapping values in quotes doesn't escape spaces. For example, `org.name="My Company"` results in the literal value `"My Company"` (with quotes included), not `My Company`.
</Warning>

### Example configurations

Set these environment variables before running `claude`. Each block shows a complete configuration for a different exporter or deployment scenario:

```bash  theme={null}
# Console debugging (1-second intervals)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=1000

# OTLP/gRPC
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Prometheus
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=prometheus

# Multiple exporters
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console,otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json

# Different endpoints/backends for metrics and logs
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://metrics.example.com:4318
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://logs.example.com:4317

# Metrics only (no events/logs)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Events/logs only (no metrics)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

## Available metrics and events

### Standard attributes

All metrics and events share these standard attributes:

| Attribute           | Description                                                                      | Controlled By                                       |
| ------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| `session.id`        | Unique session identifier                                                        | `OTEL_METRICS_INCLUDE_SESSION_ID` (default: true)   |
| `app.version`       | Current Claude Code version                                                      | `OTEL_METRICS_INCLUDE_VERSION` (default: false)     |
| `organization.id`   | Organization UUID (when authenticated)                                           | Always included when available                      |
| `user.account_uuid` | Account UUID (when authenticated)                                                | `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` (default: true) |
| `user.id`           | Anonymous device/installation identifier, generated per Claude Code installation | Always included                                     |
| `user.email`        | User email address (when authenticated via OAuth)                                | Always included when available                      |
| `terminal.type`     | Terminal type, such as `iTerm.app`, `vscode`, `cursor`, or `tmux`                | Always included when detected                       |

### Metrics

Claude Code exports the following metrics:

| Metric Name                           | Description                                     | Unit   |
| ------------------------------------- | ----------------------------------------------- | ------ |
| `claude_code.session.count`           | Count of CLI sessions started                   | count  |
| `claude_code.lines_of_code.count`     | Count of lines of code modified                 | count  |
| `claude_code.pull_request.count`      | Number of pull requests created                 | count  |
| `claude_code.commit.count`            | Number of git commits created                   | count  |
| `claude_code.cost.usage`              | Cost of the Claude Code session                 | USD    |
| `claude_code.token.usage`             | Number of tokens used                           | tokens |
| `claude_code.code_edit_tool.decision` | Count of code editing tool permission decisions | count  |
| `claude_code.active_time.total`       | Total active time in seconds                    | s      |

### Metric details

Each metric includes the standard attributes listed above. Metrics with additional context-specific attributes are noted below.

#### Session counter

Incremented at the start of each session.

**Attributes**:

* All [standard attributes](#standard-attributes)

#### Lines of code counter

Incremented when code is added or removed.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `type`: (`"added"`, `"removed"`)

#### Pull request counter

Incremented when creating pull requests via Claude Code.

**Attributes**:

* All [standard attributes](#standard-attributes)

#### Commit counter

Incremented when creating git commits via Claude Code.

**Attributes**:

* All [standard attributes](#standard-attributes)

#### Cost counter

Incremented after each API request.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `model`: Model identifier (for example, "claude-sonnet-4-6")

#### Token counter

Incremented after each API request.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `type`: (`"input"`, `"output"`, `"cacheRead"`, `"cacheCreation"`)
* `model`: Model identifier (for example, "claude-sonnet-4-6")

#### Code edit tool decision counter

Incremented when user accepts or rejects Edit, Write, or NotebookEdit tool usage.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `tool_name`: Tool name (`"Edit"`, `"Write"`, `"NotebookEdit"`)
* `decision`: User decision (`"accept"`, `"reject"`)
* `source`: Decision source - `"config"`, `"hook"`, `"user_permanent"`, `"user_temporary"`, `"user_abort"`, or `"user_reject"`
* `language`: Programming language of the edited file, such as `"TypeScript"`, `"Python"`, `"JavaScript"`, or `"Markdown"`. Returns `"unknown"` for unrecognized file extensions.

#### Active time counter

Tracks actual time spent actively using Claude Code, excluding idle time. This metric is incremented during user interactions (typing, reading responses) and during CLI processing (tool execution, AI response generation).

**Attributes**:

* All [standard attributes](#standard-attributes)
* `type`: `"user"` for keyboard interactions, `"cli"` for tool execution and AI responses

### Events

Claude Code exports the following events via OpenTelemetry logs/events (when `OTEL_LOGS_EXPORTER` is configured):

#### Event correlation attributes

When a user submits a prompt, Claude Code may make multiple API calls and run several tools. The `prompt.id` attribute lets you tie all of those events back to the single prompt that triggered them.

| Attribute   | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| `prompt.id` | UUID v4 identifier linking all events produced while processing a single user prompt |

To trace all activity triggered by a single prompt, filter your events by a specific `prompt.id` value. This returns the user\_prompt event, any api\_request events, and any tool\_result events that occurred while processing that prompt.

<Note>
  `prompt.id` is intentionally excluded from metrics because each prompt generates a unique ID, which would create an ever-growing number of time series. Use it for event-level analysis and audit trails only.
</Note>

#### User prompt event

Logged when a user submits a prompt.

**Event Name**: `claude_code.user_prompt`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"user_prompt"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `prompt_length`: Length of the prompt
* `prompt`: Prompt content (redacted by default, enable with `OTEL_LOG_USER_PROMPTS=1`)

#### Tool result event

Logged when a tool completes execution.

**Event Name**: `claude_code.tool_result`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"tool_result"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `tool_name`: Name of the tool
* `success`: `"true"` or `"false"`
* `duration_ms`: Execution time in milliseconds
* `error`: Error message (if failed)
* `decision_type`: Either `"accept"` or `"reject"`
* `decision_source`: Decision source - `"config"`, `"hook"`, `"user_permanent"`, `"user_temporary"`, `"user_abort"`, or `"user_reject"`
* `tool_result_size_bytes`: Size of the tool result in bytes
* `mcp_server_scope`: MCP server scope identifier (for MCP tools)
* `tool_parameters`: JSON string containing tool-specific parameters (when available)
  * For Bash tool: includes `bash_command`, `full_command`, `timeout`, `description`, `dangerouslyDisableSandbox`, and `git_commit_id` (the commit SHA, when a `git commit` command succeeds)
  * For MCP tools (when `OTEL_LOG_TOOL_DETAILS=1`): includes `mcp_server_name`, `mcp_tool_name`
  * For Skill tool (when `OTEL_LOG_TOOL_DETAILS=1`): includes `skill_name`

#### API request event

Logged for each API request to Claude.

**Event Name**: `claude_code.api_request`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_request"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `model`: Model used (for example, "claude-sonnet-4-6")
* `cost_usd`: Estimated cost in USD
* `duration_ms`: Request duration in milliseconds
* `input_tokens`: Number of input tokens
* `output_tokens`: Number of output tokens
* `cache_read_tokens`: Number of tokens read from cache
* `cache_creation_tokens`: Number of tokens used for cache creation
* `speed`: `"fast"` or `"normal"`, indicating whether fast mode was active

#### API error event

Logged when an API request to Claude fails.

**Event Name**: `claude_code.api_error`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_error"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `model`: Model used (for example, "claude-sonnet-4-6")
* `error`: Error message
* `status_code`: HTTP status code as a string, or `"undefined"` for non-HTTP errors
* `duration_ms`: Request duration in milliseconds
* `attempt`: Attempt number (for retried requests)
* `speed`: `"fast"` or `"normal"`, indicating whether fast mode was active

#### Tool decision event

Logged when a tool permission decision is made (accept/reject).

**Event Name**: `claude_code.tool_decision`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"tool_decision"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `tool_name`: Name of the tool (for example, "Read", "Edit", "Write", "NotebookEdit")
* `decision`: Either `"accept"` or `"reject"`
* `source`: Decision source - `"config"`, `"hook"`, `"user_permanent"`, `"user_temporary"`, `"user_abort"`, or `"user_reject"`

## Interpret metrics and events data

The exported metrics and events support a range of analyses:

### Usage monitoring

| Metric                                                        | Analysis Opportunity                                      |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| `claude_code.token.usage`                                     | Break down by `type` (input/output), user, team, or model |
| `claude_code.session.count`                                   | Track adoption and engagement over time                   |
| `claude_code.lines_of_code.count`                             | Measure productivity by tracking code additions/removals  |
| `claude_code.commit.count` & `claude_code.pull_request.count` | Understand impact on development workflows                |

### Cost monitoring

The `claude_code.cost.usage` metric helps with:

* Tracking usage trends across teams or individuals
* Identifying high-usage sessions for optimization

<Note>
  Cost metrics are approximations. For official billing data, refer to your API provider (Claude Console, AWS Bedrock, or Google Cloud Vertex).
</Note>

### Alerting and segmentation

Common alerts to consider:

* Cost spikes
* Unusual token consumption
* High session volume from specific users

All metrics can be segmented by `user.account_uuid`, `organization.id`, `session.id`, `model`, and `app.version`.

### Event analysis

The event data provides detailed insights into Claude Code interactions:

**Tool Usage Patterns**: analyze tool result events to identify:

* Most frequently used tools
* Tool success rates
* Average tool execution times
* Error patterns by tool type

**Performance Monitoring**: track API request durations and tool execution times to identify performance bottlenecks.

## Backend considerations

Your choice of metrics and logs backends determines the types of analyses you can perform:

### For metrics

* **Time series databases (for example, Prometheus)**: Rate calculations, aggregated metrics
* **Columnar stores (for example, ClickHouse)**: Complex queries, unique user analysis
* **Full-featured observability platforms (for example, Honeycomb, Datadog)**: Advanced querying, visualization, alerting

### For events/logs

* **Log aggregation systems (for example, Elasticsearch, Loki)**: Full-text search, log analysis
* **Columnar stores (for example, ClickHouse)**: Structured event analysis
* **Full-featured observability platforms (for example, Honeycomb, Datadog)**: Correlation between metrics and events

For organizations requiring Daily/Weekly/Monthly Active User (DAU/WAU/MAU) metrics, consider backends that support efficient unique value queries.

## Service information

All metrics and events are exported with the following resource attributes:

* `service.name`: `claude-code`
* `service.version`: Current Claude Code version
* `os.type`: Operating system type (for example, `linux`, `darwin`, `windows`)
* `os.version`: Operating system version string
* `host.arch`: Host architecture (for example, `amd64`, `arm64`)
* `wsl.version`: WSL version number (only present when running on Windows Subsystem for Linux)
* Meter Name: `com.anthropic.claude_code`

## ROI measurement resources

For a comprehensive guide on measuring return on investment for Claude Code, including telemetry setup, cost analysis, productivity metrics, and automated reporting, see the [Claude Code ROI Measurement Guide](https://github.com/anthropics/claude-code-monitoring-guide). This repository provides ready-to-use Docker Compose configurations, Prometheus and OpenTelemetry setups, and templates for generating productivity reports integrated with tools like Linear.

## Security and privacy

* Telemetry is opt-in and requires explicit configuration
* Raw file contents and code snippets are not included in metrics or events. Tool execution events include bash commands and file paths in the `tool_parameters` field, which may contain sensitive values. If your commands may include secrets, configure your telemetry backend to filter or redact `tool_parameters`
* When authenticated via OAuth, `user.email` is included in telemetry attributes. If this is a concern for your organization, work with your telemetry backend to filter or redact this field
* User prompt content is not collected by default. Only prompt length is recorded. To include prompt content, set `OTEL_LOG_USER_PROMPTS=1`
* MCP server/tool names and skill names are not logged by default because they can reveal user-specific configurations. To include them, set `OTEL_LOG_TOOL_DETAILS=1`

## Monitor Claude Code on Amazon Bedrock

For detailed Claude Code usage monitoring guidance for Amazon Bedrock, see [Claude Code Monitoring Implementation (Bedrock)](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/blob/main/assets/docs/MONITORING.md).
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Manage costs effectively

> Track token usage, set team spend limits, and reduce Claude Code costs with context management, model selection, extended thinking settings, and preprocessing hooks.

Claude Code consumes tokens for each interaction. Costs vary based on codebase size, query complexity, and conversation length. The average cost is \$6 per developer per day, with daily costs remaining below \$12 for 90% of users.

For team usage, Claude Code charges by API token consumption. On average, Claude Code costs \~\$100-200/developer per month with Sonnet 4.6 though there is large variance depending on how many instances users are running and whether they're using it in automation.

This page covers how to [track your costs](#track-your-costs), [manage costs for teams](#managing-costs-for-teams), and [reduce token usage](#reduce-token-usage).

## Track your costs

### Using the `/cost` command

<Note>
  The `/cost` command shows API token usage and is intended for API users. Claude Max and Pro subscribers have usage included in their subscription, so `/cost` data isn't relevant for billing purposes. Subscribers can use `/stats` to view usage patterns.
</Note>

The `/cost` command provides detailed token usage statistics for your current session:

```text  theme={null}
Total cost:            $0.55
Total duration (API):  6m 19.7s
Total duration (wall): 6h 33m 10.2s
Total code changes:    0 lines added, 0 lines removed
```

## Managing costs for teams

When using Claude API, you can [set workspace spend limits](https://platform.claude.com/docs/en/build-with-claude/workspaces#workspace-limits) on the total Claude Code workspace spend. Admins can [view cost and usage reporting](https://platform.claude.com/docs/en/build-with-claude/workspaces#usage-and-cost-tracking) in the Console.

<Note>
  When you first authenticate Claude Code with your Claude Console account, a workspace called "Claude Code" is automatically created for you. This workspace provides centralized cost tracking and management for all Claude Code usage in your organization. You cannot create API keys for this workspace; it is exclusively for Claude Code authentication and usage.
</Note>

On Bedrock, Vertex, and Foundry, Claude Code does not send metrics from your cloud. To get cost metrics, several large enterprises reported using [LiteLLM](/en/llm-gateway#litellm-configuration), which is an open-source tool that helps companies [track spend by key](https://docs.litellm.ai/docs/proxy/virtual_keys#tracking-spend). This project is unaffiliated with Anthropic and has not been audited for security.

### Rate limit recommendations

When setting up Claude Code for teams, consider these Token Per Minute (TPM) and Request Per Minute (RPM) per-user recommendations based on your organization size:

| Team size     | TPM per user | RPM per user |
| ------------- | ------------ | ------------ |
| 1-5 users     | 200k-300k    | 5-7          |
| 5-20 users    | 100k-150k    | 2.5-3.5      |
| 20-50 users   | 50k-75k      | 1.25-1.75    |
| 50-100 users  | 25k-35k      | 0.62-0.87    |
| 100-500 users | 15k-20k      | 0.37-0.47    |
| 500+ users    | 10k-15k      | 0.25-0.35    |

For example, if you have 200 users, you might request 20k TPM for each user, or 4 million total TPM (200\*20,000 = 4 million).

The TPM per user decreases as team size grows because fewer users tend to use Claude Code concurrently in larger organizations. These rate limits apply at the organization level, not per individual user, which means individual users can temporarily consume more than their calculated share when others aren't actively using the service.

<Note>
  If you anticipate scenarios with unusually high concurrent usage (such as live training sessions with large groups), you may need higher TPM allocations per user.
</Note>

### Agent team token costs

[Agent teams](/en/agent-teams) spawn multiple Claude Code instances, each with its own context window. Token usage scales with the number of active teammates and how long each one runs.

To keep agent team costs manageable:

* Use Sonnet for teammates. It balances capability and cost for coordination tasks.
* Keep teams small. Each teammate runs its own context window, so token usage is roughly proportional to team size.
* Keep spawn prompts focused. Teammates load CLAUDE.md, MCP servers, and skills automatically, but everything in the spawn prompt adds to their context from the start.
* Clean up teams when work is done. Active teammates continue consuming tokens even if idle.
* Agent teams are disabled by default. Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your [settings.json](/en/settings) or environment to enable them. See [enable agent teams](/en/agent-teams#enable-agent-teams).

## Reduce token usage

Token costs scale with context size: the more context Claude processes, the more tokens you use. Claude Code automatically optimizes costs through prompt caching (which reduces costs for repeated content like system prompts) and auto-compaction (which summarizes conversation history when approaching context limits).

The following strategies help you keep context small and reduce per-message costs.

### Manage context proactively

Use `/cost` to check your current token usage, or [configure your status line](/en/statusline#context-window-usage) to display it continuously.

* **Clear between tasks**: Use `/clear` to start fresh when switching to unrelated work. Stale context wastes tokens on every subsequent message. Use `/rename` before clearing so you can easily find the session later, then `/resume` to return to it.
* **Add custom compaction instructions**: `/compact Focus on code samples and API usage` tells Claude what to preserve during summarization.

You can also customize compaction behavior in your CLAUDE.md:

```markdown  theme={null}
# Compact instructions

When you are using compact, please focus on test output and code changes
```

### Choose the right model

Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning. Use `/model` to switch models mid-session, or set a default in `/config`. For simple subagent tasks, specify `model: haiku` in your [subagent configuration](/en/sub-agents#choose-a-model).

### Reduce MCP server overhead

Each MCP server adds tool definitions to your context, even when idle. Run `/context` to see what's consuming space.

* **Prefer CLI tools when available**: Tools like `gh`, `aws`, `gcloud`, and `sentry-cli` are more context-efficient than MCP servers because they don't add persistent tool definitions. Claude can run CLI commands directly without the overhead.
* **Disable unused servers**: Run `/mcp` to see configured servers and disable any you're not actively using.
* **Tool search is automatic**: When MCP tool descriptions exceed 10% of your context window, Claude Code automatically defers them and loads tools on-demand via [tool search](/en/mcp#scale-with-mcp-tool-search). Since deferred tools only enter context when actually used, a lower threshold means fewer idle tool definitions consuming space. Set a lower threshold with `ENABLE_TOOL_SEARCH=auto:<N>` (for example, `auto:5` triggers when tools exceed 5% of your context window).

### Install code intelligence plugins for typed languages

[Code intelligence plugins](/en/discover-plugins#code-intelligence) give Claude precise symbol navigation instead of text-based search, reducing unnecessary file reads when exploring unfamiliar code. A single "go to definition" call replaces what might otherwise be a grep followed by reading multiple candidate files. Installed language servers also report type errors automatically after edits, so Claude catches mistakes without running a compiler.

### Offload processing to hooks and skills

Custom [hooks](/en/hooks) can preprocess data before Claude sees it. Instead of Claude reading a 10,000-line log file to find errors, a hook can grep for `ERROR` and return only matching lines, reducing context from tens of thousands of tokens to hundreds.

A [skill](/en/skills) can give Claude domain knowledge so it doesn't have to explore. For example, a "codebase-overview" skill could describe your project's architecture, key directories, and naming conventions. When Claude invokes the skill, it gets this context immediately instead of spending tokens reading multiple files to understand the structure.

For example, this PreToolUse hook filters test output to show only failures:

<Tabs>
  <Tab title="settings.json">
    Add this to your [settings.json](/en/settings#settings-files) to run the hook before every Bash command:

    ```json  theme={null}
    {
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "Bash",
            "hooks": [
              {
                "type": "command",
                "command": "~/.claude/hooks/filter-test-output.sh"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="filter-test-output.sh">
    The hook calls this script, which checks if the command is a test runner and modifies it to show only failures:

    ```bash  theme={null}
    #!/bin/bash
    input=$(cat)
    cmd=$(echo "$input" | jq -r '.tool_input.command')

    # If running tests, filter to show only failures
    if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
      filtered_cmd="$cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100"
      echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"allow\",\"updatedInput\":{\"command\":\"$filtered_cmd\"}}}"
    else
      echo "{}"
    fi
    ```
  </Tab>
</Tabs>

### Move instructions from CLAUDE.md to skills

Your [CLAUDE.md](/en/memory) file is loaded into context at session start. If it contains detailed instructions for specific workflows (like PR reviews or database migrations), those tokens are present even when you're doing unrelated work. [Skills](/en/skills) load on-demand only when invoked, so moving specialized instructions into skills keeps your base context smaller. Aim to keep CLAUDE.md under \~500 lines by including only essentials.

### Adjust extended thinking

Extended thinking is enabled by default with a budget of 31,999 tokens because it significantly improves performance on complex planning and reasoning tasks. However, thinking tokens are billed as output tokens, so for simpler tasks where deep reasoning isn't needed, you can reduce costs by lowering the [effort level](/en/model-config#adjust-effort-level) in `/model` for Opus 4.6, disabling thinking in `/config`, or lowering the budget (for example, `MAX_THINKING_TOKENS=8000`).

### Delegate verbose operations to subagents

Running tests, fetching documentation, or processing log files can consume significant context. Delegate these to [subagents](/en/sub-agents#isolate-high-volume-operations) so the verbose output stays in the subagent's context while only a summary returns to your main conversation.

### Manage agent team costs

Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode, because each teammate maintains its own context window and runs as a separate Claude instance. Keep team tasks small and self-contained to limit per-teammate token usage. See [agent teams](/en/agent-teams) for details.

### Write specific prompts

Vague requests like "improve this codebase" trigger broad scanning. Specific requests like "add input validation to the login function in auth.ts" let Claude work efficiently with minimal file reads.

### Work efficiently on complex tasks

For longer or more complex work, these habits help avoid wasted tokens from going down the wrong path:

* **Use plan mode for complex tasks**: Press Shift+Tab to enter [plan mode](/en/common-workflows#use-plan-mode-for-safe-code-analysis) before implementation. Claude explores the codebase and proposes an approach for your approval, preventing expensive re-work when the initial direction is wrong.
* **Course-correct early**: If Claude starts heading the wrong direction, press Escape to stop immediately. Use `/rewind` or double-tap Escape to restore conversation and code to a previous checkpoint.
* **Give verification targets**: Include test cases, paste screenshots, or define expected output in your prompt. When Claude can verify its own work, it catches issues before you need to request fixes.
* **Test incrementally**: Write one file, test it, then continue. This catches issues early when they're cheap to fix.

## Background token usage

Claude Code uses tokens for some background functionality even when idle:

* **Conversation summarization**: Background jobs that summarize previous conversations for the `claude --resume` feature
* **Command processing**: Some commands like `/cost` may generate requests to check status

These background processes consume a small amount of tokens (typically under \$0.04 per session) even without active interaction.

## Understanding changes in Claude Code behavior

Claude Code regularly receives updates that may change how features work, including cost reporting. Run `claude --version` to check your current version. For specific billing questions, contact Anthropic support through your [Console account](https://platform.claude.com/login). For team deployments, start with a small pilot group to establish usage patterns before wider rollout.
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Claude Code settings

> Configure Claude Code with global and project-level settings, and environment variables.

Claude Code offers a variety of settings to configure its behavior to meet your needs. You can configure Claude Code by running the `/config` command when using the interactive REPL, which opens a tabbed Settings interface where you can view status information and modify configuration options.

## Configuration scopes

Claude Code uses a **scope system** to determine where configurations apply and who they're shared with. Understanding scopes helps you decide how to configure Claude Code for personal use, team collaboration, or enterprise deployment.

### Available scopes

| Scope       | Location                                                                           | Who it affects                       | Shared with team?      |
| :---------- | :--------------------------------------------------------------------------------- | :----------------------------------- | :--------------------- |
| **Managed** | Server-managed settings, plist / registry, or system-level `managed-settings.json` | All users on the machine             | Yes (deployed by IT)   |
| **User**    | `~/.claude/` directory                                                             | You, across all projects             | No                     |
| **Project** | `.claude/` in repository                                                           | All collaborators on this repository | Yes (committed to git) |
| **Local**   | `.claude/*.local.*` files                                                          | You, in this repository only         | No (gitignored)        |

### When to use each scope

**Managed scope** is for:

* Security policies that must be enforced organization-wide
* Compliance requirements that can't be overridden
* Standardized configurations deployed by IT/DevOps

**User scope** is best for:

* Personal preferences you want everywhere (themes, editor settings)
* Tools and plugins you use across all projects
* API keys and authentication (stored securely)

**Project scope** is best for:

* Team-shared settings (permissions, hooks, MCP servers)
* Plugins the whole team should have
* Standardizing tooling across collaborators

**Local scope** is best for:

* Personal overrides for a specific project
* Testing configurations before sharing with the team
* Machine-specific settings that won't work for others

### How scopes interact

When the same setting is configured in multiple scopes, more specific scopes take precedence:

1. **Managed** (highest) - can't be overridden by anything
2. **Command line arguments** - temporary session overrides
3. **Local** - overrides project and user settings
4. **Project** - overrides user settings
5. **User** (lowest) - applies when nothing else specifies the setting

For example, if a permission is allowed in user settings but denied in project settings, the project setting takes precedence and the permission is blocked.

### What uses scopes

Scopes apply to many Claude Code features:

| Feature         | User location             | Project location                   | Local location                 |
| :-------------- | :------------------------ | :--------------------------------- | :----------------------------- |
| **Settings**    | `~/.claude/settings.json` | `.claude/settings.json`            | `.claude/settings.local.json`  |
| **Subagents**   | `~/.claude/agents/`       | `.claude/agents/`                  | —                              |
| **MCP servers** | `~/.claude.json`          | `.mcp.json`                        | `~/.claude.json` (per-project) |
| **Plugins**     | `~/.claude/settings.json` | `.claude/settings.json`            | `.claude/settings.local.json`  |
| **CLAUDE.md**   | `~/.claude/CLAUDE.md`     | `CLAUDE.md` or `.claude/CLAUDE.md` | `CLAUDE.local.md`              |

***

## Settings files

The `settings.json` file is our official mechanism for configuring Claude
Code through hierarchical settings:

* **User settings** are defined in `~/.claude/settings.json` and apply to all
  projects.
* **Project settings** are saved in your project directory:
  * `.claude/settings.json` for settings that are checked into source control and shared with your team
  * `.claude/settings.local.json` for settings that are not checked in, useful for personal preferences and experimentation. Claude Code will configure git to ignore `.claude/settings.local.json` when it is created.
* **Managed settings**: For organizations that need centralized control, Claude Code supports multiple delivery mechanisms for managed settings. All use the same JSON format and cannot be overridden by user or project settings:

  * **Server-managed settings**: delivered from Anthropic's servers via the Claude.ai admin console. See [server-managed settings](/en/server-managed-settings).
  * **MDM/OS-level policies**: delivered through native device management on macOS and Windows:
    * macOS: `com.anthropic.claudecode` managed preferences domain (deployed via configuration profiles in Jamf, Kandji, or other MDM tools)
    * Windows: `HKLM\SOFTWARE\Policies\ClaudeCode` registry key with a `Settings` value (REG\_SZ or REG\_EXPAND\_SZ) containing JSON (deployed via Group Policy or Intune)
    * Windows (user-level): `HKCU\SOFTWARE\Policies\ClaudeCode` (lowest policy priority, only used when no admin-level source exists)
  * **File-based**: `managed-settings.json` and `managed-mcp.json` deployed to system directories:
    * macOS: `/Library/Application Support/ClaudeCode/`
    * Linux and WSL: `/etc/claude-code/`
    * Windows: `C:\Program Files\ClaudeCode\`

  See [managed settings](/en/permissions#managed-only-settings) and [Managed MCP configuration](/en/mcp#managed-mcp-configuration) for details.

  <Note>
    Managed deployments can also restrict **plugin marketplace additions** using
    `strictKnownMarketplaces`. For more information, see [Managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions).
  </Note>
* **Other configuration** is stored in `~/.claude.json`. This file contains your preferences (theme, notification settings, editor mode), OAuth session, [MCP server](/en/mcp) configurations for user and local scopes, per-project state (allowed tools, trust settings), and various caches. Project-scoped MCP servers are stored separately in `.mcp.json`.

<Note>
  Claude Code automatically creates timestamped backups of configuration files and retains the five most recent backups to prevent data loss.
</Note>

```JSON Example settings.json theme={null}
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test *)",
      "Read(~/.zshrc)"
    ],
    "deny": [
      "Bash(curl *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp"
  },
  "companyAnnouncements": [
    "Welcome to Acme Corp! Review our code guidelines at docs.acme.com",
    "Reminder: Code reviews required for all PRs",
    "New security policy in effect"
  ]
}
```

The `$schema` line in the example above points to the [official JSON schema](https://json.schemastore.org/claude-code-settings.json) for Claude Code settings. Adding it to your `settings.json` enables autocomplete and inline validation in VS Code, Cursor, and any other editor that supports JSON schema validation.

### Available settings

`settings.json` supports a number of options:

| Key                               | Description                                                                                                                                                                                                                                                                                                     | Example                                                                 |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `apiKeyHelper`                    | Custom script, to be executed in `/bin/sh`, to generate an auth value. This value will be sent as `X-Api-Key` and `Authorization: Bearer` headers for model requests                                                                                                                                            | `/bin/generate_temp_api_key.sh`                                         |
| `cleanupPeriodDays`               | Sessions inactive for longer than this period are deleted at startup. Setting to `0` immediately deletes all sessions. (default: 30 days)                                                                                                                                                                       | `20`                                                                    |
| `companyAnnouncements`            | Announcement to display to users at startup. If multiple announcements are provided, they will be cycled through at random.                                                                                                                                                                                     | `["Welcome to Acme Corp! Review our code guidelines at docs.acme.com"]` |
| `env`                             | Environment variables that will be applied to every session                                                                                                                                                                                                                                                     | `{"FOO": "bar"}`                                                        |
| `attribution`                     | Customize attribution for git commits and pull requests. See [Attribution settings](#attribution-settings)                                                                                                                                                                                                      | `{"commit": "🤖 Generated with Claude Code", "pr": ""}`                 |
| `includeCoAuthoredBy`             | **Deprecated**: Use `attribution` instead. Whether to include the `co-authored-by Claude` byline in git commits and pull requests (default: `true`)                                                                                                                                                             | `false`                                                                 |
| `includeGitInstructions`          | Include built-in commit and PR workflow instructions in Claude's system prompt (default: `true`). Set to `false` to remove these instructions, for example when using your own git workflow skills. The `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` environment variable takes precedence over this setting when set | `false`                                                                 |
| `permissions`                     | See table below for structure of permissions.                                                                                                                                                                                                                                                                   |                                                                         |
| `hooks`                           | Configure custom commands to run at lifecycle events. See [hooks documentation](/en/hooks) for format                                                                                                                                                                                                           | See [hooks](/en/hooks)                                                  |
| `disableAllHooks`                 | Disable all [hooks](/en/hooks) and any custom [status line](/en/statusline)                                                                                                                                                                                                                                     | `true`                                                                  |
| `allowManagedHooksOnly`           | (Managed settings only) Prevent loading of user, project, and plugin hooks. Only allows managed hooks and SDK hooks. See [Hook configuration](#hook-configuration)                                                                                                                                              | `true`                                                                  |
| `allowedHttpHookUrls`             | Allowlist of URL patterns that HTTP hooks may target. Supports `*` as a wildcard. When set, hooks with non-matching URLs are blocked. Undefined = no restriction, empty array = block all HTTP hooks. Arrays merge across settings sources. See [Hook configuration](#hook-configuration)                       | `["https://hooks.example.com/*"]`                                       |
| `httpHookAllowedEnvVars`          | Allowlist of environment variable names HTTP hooks may interpolate into headers. When set, each hook's effective `allowedEnvVars` is the intersection with this list. Undefined = no restriction. Arrays merge across settings sources. See [Hook configuration](#hook-configuration)                           | `["MY_TOKEN", "HOOK_SECRET"]`                                           |
| `allowManagedPermissionRulesOnly` | (Managed settings only) Prevent user and project settings from defining `allow`, `ask`, or `deny` permission rules. Only rules in managed settings apply. See [Managed-only settings](/en/permissions#managed-only-settings)                                                                                    | `true`                                                                  |
| `allowManagedMcpServersOnly`      | (Managed settings only) Only `allowedMcpServers` from managed settings are respected. `deniedMcpServers` still merges from all sources. Users can still add MCP servers, but only the admin-defined allowlist applies. See [Managed MCP configuration](/en/mcp#managed-mcp-configuration)                       | `true`                                                                  |
| `model`                           | Override the default model to use for Claude Code                                                                                                                                                                                                                                                               | `"claude-sonnet-4-6"`                                                   |
| `availableModels`                 | Restrict which models users can select via `/model`, `--model`, Config tool, or `ANTHROPIC_MODEL`. Does not affect the Default option. See [Restrict model selection](/en/model-config#restrict-model-selection)                                                                                                | `["sonnet", "haiku"]`                                                   |
| `otelHeadersHelper`               | Script to generate dynamic OpenTelemetry headers. Runs at startup and periodically (see [Dynamic headers](/en/monitoring-usage#dynamic-headers))                                                                                                                                                                | `/bin/generate_otel_headers.sh`                                         |
| `statusLine`                      | Configure a custom status line to display context. See [`statusLine` documentation](/en/statusline)                                                                                                                                                                                                             | `{"type": "command", "command": "~/.claude/statusline.sh"}`             |
| `fileSuggestion`                  | Configure a custom script for `@` file autocomplete. See [File suggestion settings](#file-suggestion-settings)                                                                                                                                                                                                  | `{"type": "command", "command": "~/.claude/file-suggestion.sh"}`        |
| `respectGitignore`                | Control whether the `@` file picker respects `.gitignore` patterns. When `true` (default), files matching `.gitignore` patterns are excluded from suggestions                                                                                                                                                   | `false`                                                                 |
| `outputStyle`                     | Configure an output style to adjust the system prompt. See [output styles documentation](/en/output-styles)                                                                                                                                                                                                     | `"Explanatory"`                                                         |
| `forceLoginMethod`                | Use `claudeai` to restrict login to Claude.ai accounts, `console` to restrict login to Claude Console (API usage billing) accounts                                                                                                                                                                              | `claudeai`                                                              |
| `forceLoginOrgUUID`               | Specify the UUID of an organization to automatically select it during login, bypassing the organization selection step. Requires `forceLoginMethod` to be set                                                                                                                                                   | `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`                                |
| `enableAllProjectMcpServers`      | Automatically approve all MCP servers defined in project `.mcp.json` files                                                                                                                                                                                                                                      | `true`                                                                  |
| `enabledMcpjsonServers`           | List of specific MCP servers from `.mcp.json` files to approve                                                                                                                                                                                                                                                  | `["memory", "github"]`                                                  |
| `disabledMcpjsonServers`          | List of specific MCP servers from `.mcp.json` files to reject                                                                                                                                                                                                                                                   | `["filesystem"]`                                                        |
| `allowedMcpServers`               | When set in managed-settings.json, allowlist of MCP servers users can configure. Undefined = no restrictions, empty array = lockdown. Applies to all scopes. Denylist takes precedence. See [Managed MCP configuration](/en/mcp#managed-mcp-configuration)                                                      | `[{ "serverName": "github" }]`                                          |
| `deniedMcpServers`                | When set in managed-settings.json, denylist of MCP servers that are explicitly blocked. Applies to all scopes including managed servers. Denylist takes precedence over allowlist. See [Managed MCP configuration](/en/mcp#managed-mcp-configuration)                                                           | `[{ "serverName": "filesystem" }]`                                      |
| `strictKnownMarketplaces`         | When set in managed-settings.json, allowlist of plugin marketplaces users can add. Undefined = no restrictions, empty array = lockdown. Applies to marketplace additions only. See [Managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions)                                 | `[{ "source": "github", "repo": "acme-corp/plugins" }]`                 |
| `blockedMarketplaces`             | (Managed settings only) Blocklist of marketplace sources. Blocked sources are checked before downloading, so they never touch the filesystem. See [Managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions)                                                                  | `[{ "source": "github", "repo": "untrusted/plugins" }]`                 |
| `pluginTrustMessage`              | (Managed settings only) Custom message appended to the plugin trust warning shown before installation. Use this to add organization-specific context, for example to confirm that plugins from your internal marketplace are vetted.                                                                            | `"All plugins from our marketplace are approved by IT"`                 |
| `awsAuthRefresh`                  | Custom script that modifies the `.aws` directory (see [advanced credential configuration](/en/amazon-bedrock#advanced-credential-configuration))                                                                                                                                                                | `aws sso login --profile myprofile`                                     |
| `awsCredentialExport`             | Custom script that outputs JSON with AWS credentials (see [advanced credential configuration](/en/amazon-bedrock#advanced-credential-configuration))                                                                                                                                                            | `/bin/generate_aws_grant.sh`                                            |
| `alwaysThinkingEnabled`           | Enable [extended thinking](/en/common-workflows#use-extended-thinking-thinking-mode) by default for all sessions. Typically configured via the `/config` command rather than editing directly                                                                                                                   | `true`                                                                  |
| `plansDirectory`                  | Customize where plan files are stored. Path is relative to project root. Default: `~/.claude/plans`                                                                                                                                                                                                             | `"./plans"`                                                             |
| `showTurnDuration`                | Show turn duration messages after responses (e.g., "Cooked for 1m 6s"). Set to `false` to hide these messages                                                                                                                                                                                                   | `true`                                                                  |
| `spinnerVerbs`                    | Customize the action verbs shown in the spinner and turn duration messages. Set `mode` to `"replace"` to use only your verbs, or `"append"` to add them to the defaults                                                                                                                                         | `{"mode": "append", "verbs": ["Pondering", "Crafting"]}`                |
| `language`                        | Configure Claude's preferred response language (e.g., `"japanese"`, `"spanish"`, `"french"`). Claude will respond in this language by default                                                                                                                                                                   | `"japanese"`                                                            |
| `autoUpdatesChannel`              | Release channel to follow for updates. Use `"stable"` for a version that is typically about one week old and skips versions with major regressions, or `"latest"` (default) for the most recent release                                                                                                         | `"stable"`                                                              |
| `spinnerTipsEnabled`              | Show tips in the spinner while Claude is working. Set to `false` to disable tips (default: `true`)                                                                                                                                                                                                              | `false`                                                                 |
| `spinnerTipsOverride`             | Override spinner tips with custom strings. `tips`: array of tip strings. `excludeDefault`: if `true`, only show custom tips; if `false` or absent, custom tips are merged with built-in tips                                                                                                                    | `{ "excludeDefault": true, "tips": ["Use our internal tool X"] }`       |
| `terminalProgressBarEnabled`      | Enable the terminal progress bar that shows progress in supported terminals like Windows Terminal and iTerm2 (default: `true`)                                                                                                                                                                                  | `false`                                                                 |
| `prefersReducedMotion`            | Reduce or disable UI animations (spinners, shimmer, flash effects) for accessibility                                                                                                                                                                                                                            | `true`                                                                  |
| `fastModePerSessionOptIn`         | When `true`, fast mode does not persist across sessions. Each session starts with fast mode off, requiring users to enable it with `/fast`. The user's fast mode preference is still saved. See [Require per-session opt-in](/en/fast-mode#require-per-session-opt-in)                                          | `true`                                                                  |
| `teammateMode`                    | How [agent team](/en/agent-teams) teammates display: `auto` (picks split panes in tmux or iTerm2, in-process otherwise), `in-process`, or `tmux`. See [set up agent teams](/en/agent-teams#set-up-agent-teams)                                                                                                  | `"in-process"`                                                          |

### Permission settings

| Keys                           | Description                                                                                                                                                                                                                                      | Example                                                                |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| `allow`                        | Array of permission rules to allow tool use. See [Permission rule syntax](#permission-rule-syntax) below for pattern matching details                                                                                                            | `[ "Bash(git diff *)" ]`                                               |
| `ask`                          | Array of permission rules to ask for confirmation upon tool use. See [Permission rule syntax](#permission-rule-syntax) below                                                                                                                     | `[ "Bash(git push *)" ]`                                               |
| `deny`                         | Array of permission rules to deny tool use. Use this to exclude sensitive files from Claude Code access. See [Permission rule syntax](#permission-rule-syntax) and [Bash permission limitations](/en/permissions#tool-specific-permission-rules) | `[ "WebFetch", "Bash(curl *)", "Read(./.env)", "Read(./secrets/**)" ]` |
| `additionalDirectories`        | Additional [working directories](/en/permissions#working-directories) that Claude has access to                                                                                                                                                  | `[ "../docs/" ]`                                                       |
| `defaultMode`                  | Default [permission mode](/en/permissions#permission-modes) when opening Claude Code                                                                                                                                                             | `"acceptEdits"`                                                        |
| `disableBypassPermissionsMode` | Set to `"disable"` to prevent `bypassPermissions` mode from being activated. This disables the `--dangerously-skip-permissions` command-line flag. See [managed settings](/en/permissions#managed-only-settings)                                 | `"disable"`                                                            |

### Permission rule syntax

Permission rules follow the format `Tool` or `Tool(specifier)`. Rules are evaluated in order: deny rules first, then ask, then allow. The first matching rule wins.

Quick examples:

| Rule                           | Effect                                   |
| :----------------------------- | :--------------------------------------- |
| `Bash`                         | Matches all Bash commands                |
| `Bash(npm run *)`              | Matches commands starting with `npm run` |
| `Read(./.env)`                 | Matches reading the `.env` file          |
| `WebFetch(domain:example.com)` | Matches fetch requests to example.com    |

For the complete rule syntax reference, including wildcard behavior, tool-specific patterns for Read, Edit, WebFetch, MCP, and Agent rules, and security limitations of Bash patterns, see [Permission rule syntax](/en/permissions#permission-rule-syntax).

### Sandbox settings

Configure advanced sandboxing behavior. Sandboxing isolates bash commands from your filesystem and network. See [Sandboxing](/en/sandboxing) for details.

| Keys                              | Description                                                                                                                                                                                                                                                                                                                                     | Example                         |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| `enabled`                         | Enable bash sandboxing (macOS, Linux, and WSL2). Default: false                                                                                                                                                                                                                                                                                 | `true`                          |
| `autoAllowBashIfSandboxed`        | Auto-approve bash commands when sandboxed. Default: true                                                                                                                                                                                                                                                                                        | `true`                          |
| `excludedCommands`                | Commands that should run outside of the sandbox                                                                                                                                                                                                                                                                                                 | `["git", "docker"]`             |
| `allowUnsandboxedCommands`        | Allow commands to run outside the sandbox via the `dangerouslyDisableSandbox` parameter. When set to `false`, the `dangerouslyDisableSandbox` escape hatch is completely disabled and all commands must run sandboxed (or be in `excludedCommands`). Useful for enterprise policies that require strict sandboxing. Default: true               | `false`                         |
| `filesystem.allowWrite`           | Additional paths where sandboxed commands can write. Arrays are merged across all settings scopes: user, project, and managed paths are combined, not replaced. Also merged with paths from `Edit(...)` allow permission rules. See [path prefixes](#sandbox-path-prefixes) below.                                                              | `["//tmp/build", "~/.kube"]`    |
| `filesystem.denyWrite`            | Paths where sandboxed commands cannot write. Arrays are merged across all settings scopes. Also merged with paths from `Edit(...)` deny permission rules.                                                                                                                                                                                       | `["//etc", "//usr/local/bin"]`  |
| `filesystem.denyRead`             | Paths where sandboxed commands cannot read. Arrays are merged across all settings scopes. Also merged with paths from `Read(...)` deny permission rules.                                                                                                                                                                                        | `["~/.aws/credentials"]`        |
| `network.allowUnixSockets`        | Unix socket paths accessible in sandbox (for SSH agents, etc.)                                                                                                                                                                                                                                                                                  | `["~/.ssh/agent-socket"]`       |
| `network.allowAllUnixSockets`     | Allow all Unix socket connections in sandbox. Default: false                                                                                                                                                                                                                                                                                    | `true`                          |
| `network.allowLocalBinding`       | Allow binding to localhost ports (macOS only). Default: false                                                                                                                                                                                                                                                                                   | `true`                          |
| `network.allowedDomains`          | Array of domains to allow for outbound network traffic. Supports wildcards (e.g., `*.example.com`).                                                                                                                                                                                                                                             | `["github.com", "*.npmjs.org"]` |
| `network.allowManagedDomainsOnly` | (Managed settings only) Only `allowedDomains` and `WebFetch(domain:...)` allow rules from managed settings are respected. Domains from user, project, and local settings are ignored. Non-allowed domains are blocked automatically without prompting the user. Denied domains are still respected from all sources. Default: false             | `true`                          |
| `network.httpProxyPort`           | HTTP proxy port used if you wish to bring your own proxy. If not specified, Claude will run its own proxy.                                                                                                                                                                                                                                      | `8080`                          |
| `network.socksProxyPort`          | SOCKS5 proxy port used if you wish to bring your own proxy. If not specified, Claude will run its own proxy.                                                                                                                                                                                                                                    | `8081`                          |
| `enableWeakerNestedSandbox`       | Enable weaker sandbox for unprivileged Docker environments (Linux and WSL2 only). **Reduces security.** Default: false                                                                                                                                                                                                                          | `true`                          |
| `enableWeakerNetworkIsolation`    | (macOS only) Allow access to the system TLS trust service (`com.apple.trustd.agent`) in the sandbox. Required for Go-based tools like `gh`, `gcloud`, and `terraform` to verify TLS certificates when using `httpProxyPort` with a MITM proxy and custom CA. **Reduces security** by opening a potential data exfiltration path. Default: false | `true`                          |

#### Sandbox path prefixes

Paths in `filesystem.allowWrite`, `filesystem.denyWrite`, and `filesystem.denyRead` support these prefixes:

| Prefix            | Meaning                                     | Example                                |
| :---------------- | :------------------------------------------ | :------------------------------------- |
| `//`              | Absolute path from filesystem root          | `//tmp/build` becomes `/tmp/build`     |
| `~/`              | Relative to home directory                  | `~/.kube` becomes `$HOME/.kube`        |
| `/`               | Relative to the settings file's directory   | `/build` becomes `$SETTINGS_DIR/build` |
| `./` or no prefix | Relative path (resolved by sandbox runtime) | `./output`                             |

**Configuration example:**

```json  theme={null}
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker"],
    "filesystem": {
      "allowWrite": ["//tmp/build", "~/.kube"],
      "denyRead": ["~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org", "registry.yarnpkg.com"],
      "allowUnixSockets": [
        "/var/run/docker.sock"
      ],
      "allowLocalBinding": true
    }
  }
}
```

**Filesystem and network restrictions** can be configured in two ways that are merged together:

* **`sandbox.filesystem` settings** (shown above): Control paths at the OS-level sandbox boundary. These restrictions apply to all subprocess commands (e.g., `kubectl`, `terraform`, `npm`), not just Claude's file tools.
* **Permission rules**: Use `Edit` allow/deny rules to control Claude's file tool access, `Read` deny rules to block reads, and `WebFetch` allow/deny rules to control network domains. Paths from these rules are also merged into the sandbox configuration.

### Attribution settings

Claude Code adds attribution to git commits and pull requests. These are configured separately:

* Commits use [git trailers](https://git-scm.com/docs/git-interpret-trailers) (like `Co-Authored-By`) by default,  which can be customized or disabled
* Pull request descriptions are plain text

| Keys     | Description                                                                                |
| :------- | :----------------------------------------------------------------------------------------- |
| `commit` | Attribution for git commits, including any trailers. Empty string hides commit attribution |
| `pr`     | Attribution for pull request descriptions. Empty string hides pull request attribution     |

**Default commit attribution:**

```text  theme={null}
🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Default pull request attribution:**

```text  theme={null}
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Example:**

```json  theme={null}
{
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <ai@example.com>",
    "pr": ""
  }
}
```

<Note>
  The `attribution` setting takes precedence over the deprecated `includeCoAuthoredBy` setting. To hide all attribution, set `commit` and `pr` to empty strings.
</Note>

### File suggestion settings

Configure a custom command for `@` file path autocomplete. The built-in file suggestion uses fast filesystem traversal, but large monorepos may benefit from project-specific indexing such as a pre-built file index or custom tooling.

```json  theme={null}
{
  "fileSuggestion": {
    "type": "command",
    "command": "~/.claude/file-suggestion.sh"
  }
}
```

The command runs with the same environment variables as [hooks](/en/hooks), including `CLAUDE_PROJECT_DIR`. It receives JSON via stdin with a `query` field:

```json  theme={null}
{"query": "src/comp"}
```

Output newline-separated file paths to stdout (currently limited to 15):

```text  theme={null}
src/components/Button.tsx
src/components/Modal.tsx
src/components/Form.tsx
```

**Example:**

```bash  theme={null}
#!/bin/bash
query=$(cat | jq -r '.query')
your-repo-file-index --query "$query" | head -20
```

### Hook configuration

These settings control which hooks are allowed to run and what HTTP hooks can access. The `allowManagedHooksOnly` setting can only be configured in [managed settings](#settings-files). The URL and env var allowlists can be set at any settings level and merge across sources.

**Behavior when `allowManagedHooksOnly` is `true`:**

* Managed hooks and SDK hooks are loaded
* User hooks, project hooks, and plugin hooks are blocked

**Restrict HTTP hook URLs:**

Limit which URLs HTTP hooks can target. Supports `*` as a wildcard for matching. When the array is defined, HTTP hooks targeting non-matching URLs are silently blocked.

```json  theme={null}
{
  "allowedHttpHookUrls": ["https://hooks.example.com/*", "http://localhost:*"]
}
```

**Restrict HTTP hook environment variables:**

Limit which environment variable names HTTP hooks can interpolate into header values. Each hook's effective `allowedEnvVars` is the intersection of its own list and this setting.

```json  theme={null}
{
  "httpHookAllowedEnvVars": ["MY_TOKEN", "HOOK_SECRET"]
}
```

### Settings precedence

Settings apply in order of precedence. From highest to lowest:

1. **Managed settings** ([server-managed](/en/server-managed-settings), [MDM/OS-level policies](#configuration-scopes), or [managed settings](/en/settings#settings-files))
   * Policies deployed by IT through server delivery, MDM configuration profiles, registry policies, or managed settings files
   * Cannot be overridden by any other level, including command line arguments
   * Within the managed tier, precedence is: server-managed > MDM/OS-level policies > `managed-settings.json` > HKCU registry (Windows only). Only one managed source is used; sources do not merge.

2. **Command line arguments**
   * Temporary overrides for a specific session

3. **Local project settings** (`.claude/settings.local.json`)
   * Personal project-specific settings

4. **Shared project settings** (`.claude/settings.json`)
   * Team-shared project settings in source control

5. **User settings** (`~/.claude/settings.json`)
   * Personal global settings

This hierarchy ensures that organizational policies are always enforced while still allowing teams and individuals to customize their experience.

For example, if your user settings allow `Bash(npm run *)` but a project's shared settings deny it, the project setting takes precedence and the command is blocked.

<Note>
  **Array settings merge across scopes.** When the same array-valued setting (such as `sandbox.filesystem.allowWrite` or `permissions.allow`) appears in multiple scopes, the arrays are **concatenated and deduplicated**, not replaced. This means lower-priority scopes can add entries without overriding those set by higher-priority scopes, and vice versa. For example, if managed settings set `allowWrite` to `["//opt/company-tools"]` and a user adds `["~/.kube"]`, both paths are included in the final configuration.
</Note>

### Verify active settings

Run `/status` inside Claude Code to see which settings sources are active and where they come from. The output shows each configuration layer (managed, user, project) along with its origin, such as `Enterprise managed settings (remote)`, `Enterprise managed settings (plist)`, `Enterprise managed settings (HKLM)`, or `Enterprise managed settings (file)`. If a settings file contains errors, `/status` reports the issue so you can fix it.

### Key points about the configuration system

* **Memory files (`CLAUDE.md`)**: Contain instructions and context that Claude loads at startup
* **Settings files (JSON)**: Configure permissions, environment variables, and tool behavior
* **Skills**: Custom prompts that can be invoked with `/skill-name` or loaded by Claude automatically
* **MCP servers**: Extend Claude Code with additional tools and integrations
* **Precedence**: Higher-level configurations (Managed) override lower-level ones (User/Project)
* **Inheritance**: Settings are merged, with more specific settings adding to or overriding broader ones

### System prompt

Claude Code's internal system prompt is not published. To add custom instructions, use `CLAUDE.md` files or the `--append-system-prompt` flag.

### Excluding sensitive files

To prevent Claude Code from accessing files containing sensitive information like API keys, secrets, and environment files, use the `permissions.deny` setting in your `.claude/settings.json` file:

```json  theme={null}
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)",
      "Read(./build)"
    ]
  }
}
```

This replaces the deprecated `ignorePatterns` configuration. Files matching these patterns are excluded from file discovery and search results, and read operations on these files are denied.

## Subagent configuration

Claude Code supports custom AI subagents that can be configured at both user and project levels. These subagents are stored as Markdown files with YAML frontmatter:

* **User subagents**: `~/.claude/agents/` - Available across all your projects
* **Project subagents**: `.claude/agents/` - Specific to your project and can be shared with your team

Subagent files define specialized AI assistants with custom prompts and tool permissions. Learn more about creating and using subagents in the [subagents documentation](/en/sub-agents).

## Plugin configuration

Claude Code supports a plugin system that lets you extend functionality with skills, agents, hooks, and MCP servers. Plugins are distributed through marketplaces and can be configured at both user and repository levels.

### Plugin settings

Plugin-related settings in `settings.json`:

```json  theme={null}
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true,
    "analyzer@security-plugins": false
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": "github",
      "repo": "acme-corp/claude-plugins"
    }
  }
}
```

#### `enabledPlugins`

Controls which plugins are enabled. Format: `"plugin-name@marketplace-name": true/false`

**Scopes**:

* **User settings** (`~/.claude/settings.json`): Personal plugin preferences
* **Project settings** (`.claude/settings.json`): Project-specific plugins shared with team
* **Local settings** (`.claude/settings.local.json`): Per-machine overrides (not committed)

**Example**:

```json  theme={null}
{
  "enabledPlugins": {
    "code-formatter@team-tools": true,
    "deployment-tools@team-tools": true,
    "experimental-features@personal": false
  }
}
```

#### `extraKnownMarketplaces`

Defines additional marketplaces that should be made available for the repository. Typically used in repository-level settings to ensure team members have access to required plugin sources.

**When a repository includes `extraKnownMarketplaces`**:

1. Team members are prompted to install the marketplace when they trust the folder
2. Team members are then prompted to install plugins from that marketplace
3. Users can skip unwanted marketplaces or plugins (stored in user settings)
4. Installation respects trust boundaries and requires explicit consent

**Example**:

```json  theme={null}
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/claude-plugins"
      }
    },
    "security-plugins": {
      "source": {
        "source": "git",
        "url": "https://git.example.com/security/plugins.git"
      }
    }
  }
}
```

**Marketplace source types**:

* `github`: GitHub repository (uses `repo`)
* `git`: Any git URL (uses `url`)
* `directory`: Local filesystem path (uses `path`, for development only)
* `hostPattern`: regex pattern to match marketplace hosts (uses `hostPattern`)

#### `strictKnownMarketplaces`

**Managed settings only**: Controls which plugin marketplaces users are allowed to add. This setting can only be configured in [managed settings](/en/settings#settings-files) and provides administrators with strict control over marketplace sources.

**Managed settings file locations**:

* **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
* **Linux and WSL**: `/etc/claude-code/managed-settings.json`
* **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`

**Key characteristics**:

* Only available in managed settings (`managed-settings.json`)
* Cannot be overridden by user or project settings (highest precedence)
* Enforced BEFORE network/filesystem operations (blocked sources never execute)
* Uses exact matching for source specifications (including `ref`, `path` for git sources), except `hostPattern`, which uses regex matching

**Allowlist behavior**:

* `undefined` (default): No restrictions - users can add any marketplace
* Empty array `[]`: Complete lockdown - users cannot add any new marketplaces
* List of sources: Users can only add marketplaces that match exactly

**All supported source types**:

The allowlist supports seven marketplace source types. Most sources use exact matching, while `hostPattern` uses regex matching against the marketplace host.

1. **GitHub repositories**:

```json  theme={null}
{ "source": "github", "repo": "acme-corp/approved-plugins" }
{ "source": "github", "repo": "acme-corp/security-tools", "ref": "v2.0" }
{ "source": "github", "repo": "acme-corp/plugins", "ref": "main", "path": "marketplace" }
```

Fields: `repo` (required), `ref` (optional: branch/tag/SHA), `path` (optional: subdirectory)

2. **Git repositories**:

```json  theme={null}
{ "source": "git", "url": "https://gitlab.example.com/tools/plugins.git" }
{ "source": "git", "url": "https://bitbucket.org/acme-corp/plugins.git", "ref": "production" }
{ "source": "git", "url": "ssh://git@git.example.com/plugins.git", "ref": "v3.1", "path": "approved" }
```

Fields: `url` (required), `ref` (optional: branch/tag/SHA), `path` (optional: subdirectory)

3. **URL-based marketplaces**:

```json  theme={null}
{ "source": "url", "url": "https://plugins.example.com/marketplace.json" }
{ "source": "url", "url": "https://cdn.example.com/marketplace.json", "headers": { "Authorization": "Bearer ${TOKEN}" } }
```

Fields: `url` (required), `headers` (optional: HTTP headers for authenticated access)

<Note>
  URL-based marketplaces only download the `marketplace.json` file. They do not download plugin files from the server. Plugins in URL-based marketplaces must use external sources (GitHub, npm, or git URLs) rather than relative paths. For plugins with relative paths, use a Git-based marketplace instead. See [Troubleshooting](/en/plugin-marketplaces#plugins-with-relative-paths-fail-in-url-based-marketplaces) for details.
</Note>

4. **NPM packages**:

```json  theme={null}
{ "source": "npm", "package": "@acme-corp/claude-plugins" }
{ "source": "npm", "package": "@acme-corp/approved-marketplace" }
```

Fields: `package` (required, supports scoped packages)

5. **File paths**:

```json  theme={null}
{ "source": "file", "path": "/usr/local/share/claude/acme-marketplace.json" }
{ "source": "file", "path": "/opt/acme-corp/plugins/marketplace.json" }
```

Fields: `path` (required: absolute path to marketplace.json file)

6. **Directory paths**:

```json  theme={null}
{ "source": "directory", "path": "/usr/local/share/claude/acme-plugins" }
{ "source": "directory", "path": "/opt/acme-corp/approved-marketplaces" }
```

Fields: `path` (required: absolute path to directory containing `.claude-plugin/marketplace.json`)

7. **Host pattern matching**:

```json  theme={null}
{ "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
{ "source": "hostPattern", "hostPattern": "^gitlab\\.internal\\.example\\.com$" }
```

Fields: `hostPattern` (required: regex pattern to match against the marketplace host)

Use host pattern matching when you want to allow all marketplaces from a specific host without enumerating each repository individually. This is useful for organizations with internal GitHub Enterprise or GitLab servers where developers create their own marketplaces.

Host extraction by source type:

* `github`: always matches against `github.com`
* `git`: extracts hostname from the URL (supports both HTTPS and SSH formats)
* `url`: extracts hostname from the URL
* `npm`, `file`, `directory`: not supported for host pattern matching

**Configuration examples**:

Example: allow specific marketplaces only:

```json  theme={null}
{
  "strictKnownMarketplaces": [
    {
      "source": "github",
      "repo": "acme-corp/approved-plugins"
    },
    {
      "source": "github",
      "repo": "acme-corp/security-tools",
      "ref": "v2.0"
    },
    {
      "source": "url",
      "url": "https://plugins.example.com/marketplace.json"
    },
    {
      "source": "npm",
      "package": "@acme-corp/compliance-plugins"
    }
  ]
}
```

Example - Disable all marketplace additions:

```json  theme={null}
{
  "strictKnownMarketplaces": []
}
```

Example: allow all marketplaces from an internal git server:

```json  theme={null}
{
  "strictKnownMarketplaces": [
    {
      "source": "hostPattern",
      "hostPattern": "^github\\.example\\.com$"
    }
  ]
}
```

**Exact matching requirements**:

Marketplace sources must match **exactly** for a user's addition to be allowed. For git-based sources (`github` and `git`), this includes all optional fields:

* The `repo` or `url` must match exactly
* The `ref` field must match exactly (or both be undefined)
* The `path` field must match exactly (or both be undefined)

Examples of sources that **do NOT match**:

```json  theme={null}
// These are DIFFERENT sources:
{ "source": "github", "repo": "acme-corp/plugins" }
{ "source": "github", "repo": "acme-corp/plugins", "ref": "main" }

// These are also DIFFERENT:
{ "source": "github", "repo": "acme-corp/plugins", "path": "marketplace" }
{ "source": "github", "repo": "acme-corp/plugins" }
```

**Comparison with `extraKnownMarketplaces`**:

| Aspect                | `strictKnownMarketplaces`            | `extraKnownMarketplaces`             |
| --------------------- | ------------------------------------ | ------------------------------------ |
| **Purpose**           | Organizational policy enforcement    | Team convenience                     |
| **Settings file**     | `managed-settings.json` only         | Any settings file                    |
| **Behavior**          | Blocks non-allowlisted additions     | Auto-installs missing marketplaces   |
| **When enforced**     | Before network/filesystem operations | After user trust prompt              |
| **Can be overridden** | No (highest precedence)              | Yes (by higher precedence settings)  |
| **Source format**     | Direct source object                 | Named marketplace with nested source |
| **Use case**          | Compliance, security restrictions    | Onboarding, standardization          |

**Format difference**:

`strictKnownMarketplaces` uses direct source objects:

```json  theme={null}
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/plugins" }
  ]
}
```

`extraKnownMarketplaces` requires named marketplaces:

```json  theme={null}
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": { "source": "github", "repo": "acme-corp/plugins" }
    }
  }
}
```

**Important notes**:

* Restrictions are checked BEFORE any network requests or filesystem operations
* When blocked, users see clear error messages indicating the source is blocked by managed policy
* The restriction applies only to adding NEW marketplaces; previously installed marketplaces remain accessible
* Managed settings have the highest precedence and cannot be overridden

See [Managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions) for user-facing documentation.

### Managing plugins

Use the `/plugin` command to manage plugins interactively:

* Browse available plugins from marketplaces
* Install/uninstall plugins
* Enable/disable plugins
* View plugin details (commands, agents, hooks provided)
* Add/remove marketplaces

Learn more about the plugin system in the [plugins documentation](/en/plugins).

## Environment variables

Claude Code supports the following environment variables to control its behavior:

<Note>
  All environment variables can also be configured in [`settings.json`](#available-settings). This is useful as a way to automatically set environment variables for each session, or to roll out a set of environment variables for your whole team or organization.
</Note>

| Variable                                       | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |     |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `ANTHROPIC_API_KEY`                            | API key sent as `X-Api-Key` header, typically for the Claude SDK (for interactive usage, run `/login`)                                                                                                                                                                                                                                                                                                                                                                                                |     |
| `ANTHROPIC_AUTH_TOKEN`                         | Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)                                                                                                                                                                                                                                                                                                                                                                                                  |     |
| `ANTHROPIC_CUSTOM_HEADERS`                     | Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers)                                                                                                                                                                                                                                                                                                                                                                                                      |     |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`                | See [Model configuration](/en/model-config#environment-variables)                                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`                 | See [Model configuration](/en/model-config#environment-variables)                                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| `ANTHROPIC_DEFAULT_SONNET_MODEL`               | See [Model configuration](/en/model-config#environment-variables)                                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| `ANTHROPIC_FOUNDRY_API_KEY`                    | API key for Microsoft Foundry authentication (see [Microsoft Foundry](/en/microsoft-foundry))                                                                                                                                                                                                                                                                                                                                                                                                         |     |
| `ANTHROPIC_FOUNDRY_BASE_URL`                   | Full base URL for the Foundry resource (for example, `https://my-resource.services.ai.azure.com/anthropic`). Alternative to `ANTHROPIC_FOUNDRY_RESOURCE` (see [Microsoft Foundry](/en/microsoft-foundry))                                                                                                                                                                                                                                                                                             |     |
| `ANTHROPIC_FOUNDRY_RESOURCE`                   | Foundry resource name (for example, `my-resource`). Required if `ANTHROPIC_FOUNDRY_BASE_URL` is not set (see [Microsoft Foundry](/en/microsoft-foundry))                                                                                                                                                                                                                                                                                                                                              |     |
| `ANTHROPIC_MODEL`                              | Name of the model setting to use (see [Model Configuration](/en/model-config#environment-variables))                                                                                                                                                                                                                                                                                                                                                                                                  |     |
| `ANTHROPIC_SMALL_FAST_MODEL`                   | \[DEPRECATED] Name of [Haiku-class model for background tasks](/en/costs)                                                                                                                                                                                                                                                                                                                                                                                                                             |     |
| `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION`        | Override AWS region for the Haiku-class model when using Bedrock                                                                                                                                                                                                                                                                                                                                                                                                                                      |     |
| `AWS_BEARER_TOKEN_BEDROCK`                     | Bedrock API key for authentication (see [Bedrock API keys](https://aws.amazon.com/blogs/machine-learning/accelerate-ai-development-with-amazon-bedrock-api-keys/))                                                                                                                                                                                                                                                                                                                                    |     |
| `BASH_DEFAULT_TIMEOUT_MS`                      | Default timeout for long-running bash commands                                                                                                                                                                                                                                                                                                                                                                                                                                                        |     |
| `BASH_MAX_OUTPUT_LENGTH`                       | Maximum number of characters in bash outputs before they are middle-truncated                                                                                                                                                                                                                                                                                                                                                                                                                         |     |
| `BASH_MAX_TIMEOUT_MS`                          | Maximum timeout the model can set for long-running bash commands                                                                                                                                                                                                                                                                                                                                                                                                                                      |     |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`              | Set the percentage of context capacity (1-100) at which auto-compaction triggers. By default, auto-compaction triggers at approximately 95% capacity. Use lower values like `50` to compact earlier. Values above the default threshold have no effect. Applies to both main conversations and subagents. This percentage aligns with the `context_window.used_percentage` field available in [status line](/en/statusline)                                                                           |     |
| `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`     | Return to the original working directory after each Bash command                                                                                                                                                                                                                                                                                                                                                                                                                                      |     |
| `CLAUDE_CODE_ACCOUNT_UUID`                     | Account UUID for the authenticated user. Used by SDK callers to provide account information synchronously, avoiding a race condition where early telemetry events lack account metadata. Requires `CLAUDE_CODE_USER_EMAIL` and `CLAUDE_CODE_ORGANIZATION_UUID` to also be set                                                                                                                                                                                                                         |     |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` | Set to `1` to load CLAUDE.md files from directories specified with `--add-dir`. By default, additional directories do not load memory files                                                                                                                                                                                                                                                                                                                                                           | `1` |
| `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`            | Interval in milliseconds at which credentials should be refreshed (when using `apiKeyHelper`)                                                                                                                                                                                                                                                                                                                                                                                                         |     |
| `CLAUDE_CODE_CLIENT_CERT`                      | Path to client certificate file for mTLS authentication                                                                                                                                                                                                                                                                                                                                                                                                                                               |     |
| `CLAUDE_CODE_CLIENT_KEY`                       | Path to client private key file for mTLS authentication                                                                                                                                                                                                                                                                                                                                                                                                                                               |     |
| `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`            | Passphrase for encrypted CLAUDE\_CODE\_CLIENT\_KEY (optional)                                                                                                                                                                                                                                                                                                                                                                                                                                         |     |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT`               | Set to `1` to disable [1M context window](/en/model-config#extended-context) support. When set, 1M model variants are unavailable in the model picker. Useful for enterprise environments with compliance requirements                                                                                                                                                                                                                                                                                |     |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`        | Set to `1` to disable [adaptive reasoning](/en/model-config#adjust-effort-level) for Opus 4.6 and Sonnet 4.6. When disabled, these models fall back to the fixed thinking budget controlled by `MAX_THINKING_TOKENS`                                                                                                                                                                                                                                                                                  |     |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY`              | Set to `1` to disable [auto memory](/en/memory#auto-memory). Set to `0` to force auto memory on during the gradual rollout. When disabled, Claude does not create or load auto memory files                                                                                                                                                                                                                                                                                                           |     |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`         | Set to `1` to remove built-in commit and PR workflow instructions from Claude's system prompt. Useful when using your own git workflow skills. Takes precedence over the [`includeGitInstructions`](#available-settings) setting when set                                                                                                                                                                                                                                                             |     |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`         | Set to `1` to disable all background task functionality, including the `run_in_background` parameter on Bash and subagent tools, auto-backgrounding, and the Ctrl+B shortcut                                                                                                                                                                                                                                                                                                                          |     |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`       | Set to `1` to disable Anthropic API-specific `anthropic-beta` headers. Use this if experiencing issues like "Unexpected value(s) for the `anthropic-beta` header" when using an LLM gateway with third-party providers                                                                                                                                                                                                                                                                                |     |
| `CLAUDE_CODE_DISABLE_FAST_MODE`                | Set to `1` to disable [fast mode](/en/fast-mode)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |     |
| `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`          | Set to `1` to disable the "How is Claude doing?" session quality surveys. Also disabled when using third-party providers or when telemetry is disabled. See [Session quality surveys](/en/data-usage#session-quality-surveys)                                                                                                                                                                                                                                                                         |     |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`     | Equivalent of setting `DISABLE_AUTOUPDATER`, `DISABLE_BUG_COMMAND`, `DISABLE_ERROR_REPORTING`, and `DISABLE_TELEMETRY`                                                                                                                                                                                                                                                                                                                                                                                |     |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`           | Set to `1` to disable automatic terminal title updates based on conversation context                                                                                                                                                                                                                                                                                                                                                                                                                  |     |
| `CLAUDE_CODE_EFFORT_LEVEL`                     | Set the effort level for supported models. Values: `low`, `medium`, `high`. Lower effort is faster and cheaper, higher effort provides deeper reasoning. Supported on Opus 4.6 and Sonnet 4.6. See [Adjust effort level](/en/model-config#adjust-effort-level)                                                                                                                                                                                                                                        |     |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`         | Set to `false` to disable prompt suggestions (the "Prompt suggestions" toggle in `/config`). These are the grayed-out predictions that appear in your prompt input after Claude responds. See [Prompt suggestions](/en/interactive-mode#prompt-suggestions)                                                                                                                                                                                                                                           |     |
| `CLAUDE_CODE_ENABLE_TASKS`                     | Set to `false` to temporarily revert to the previous TODO list instead of the task tracking system. Default: `true`. See [Task list](/en/interactive-mode#task-list)                                                                                                                                                                                                                                                                                                                                  |     |
| `CLAUDE_CODE_ENABLE_TELEMETRY`                 | Set to `1` to enable OpenTelemetry data collection for metrics and logging. Required before configuring OTel exporters. See [Monitoring](/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                        |     |
| `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`            | Time in milliseconds to wait after the query loop becomes idle before automatically exiting. Useful for automated workflows and scripts using SDK mode                                                                                                                                                                                                                                                                                                                                                |     |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`         | Set to `1` to enable [agent teams](/en/agent-teams). Agent teams are experimental and disabled by default                                                                                                                                                                                                                                                                                                                                                                                             |     |
| `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`      | Override the default token limit for file reads. Useful when you need to read larger files in full                                                                                                                                                                                                                                                                                                                                                                                                    |     |
| `CLAUDE_CODE_HIDE_ACCOUNT_INFO`                | Set to `1` to hide your email address and organization name from the Claude Code UI. Useful when streaming or recording                                                                                                                                                                                                                                                                                                                                                                               |     |
| `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`            | Skip auto-installation of IDE extensions                                                                                                                                                                                                                                                                                                                                                                                                                                                              |     |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS`                | Set the maximum number of output tokens for most requests. Default: 32,000. Maximum: 64,000. Increasing this value reduces the effective context window available before [auto-compaction](/en/costs#reduce-token-usage) triggers.                                                                                                                                                                                                                                                                    |     |
| `CLAUDE_CODE_ORGANIZATION_UUID`                | Organization UUID for the authenticated user. Used by SDK callers to provide account information synchronously. Requires `CLAUDE_CODE_ACCOUNT_UUID` and `CLAUDE_CODE_USER_EMAIL` to also be set                                                                                                                                                                                                                                                                                                       |     |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`  | Interval for refreshing dynamic OpenTelemetry headers in milliseconds (default: 1740000 / 29 minutes). See [Dynamic headers](/en/monitoring-usage#dynamic-headers)                                                                                                                                                                                                                                                                                                                                    |     |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED`               | Auto-set to `true` on [agent team](/en/agent-teams) teammates that require plan approval. Read-only: set by Claude Code when spawning teammates. See [require plan approval](/en/agent-teams#require-plan-approval-for-teammates)                                                                                                                                                                                                                                                                     |     |
| `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`            | Timeout in milliseconds for git operations when installing or updating plugins (default: 120000). Increase this value for large repositories or slow network connections. See [Git operations time out](/en/plugin-marketplaces#git-operations-time-out)                                                                                                                                                                                                                                              |     |
| `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`             | Set to `true` to allow the proxy to perform DNS resolution instead of the caller. Opt-in for environments where the proxy should handle hostname resolution                                                                                                                                                                                                                                                                                                                                           |     |
| `CLAUDE_CODE_SHELL`                            | Override automatic shell detection. Useful when your login shell differs from your preferred working shell (for example, `bash` vs `zsh`)                                                                                                                                                                                                                                                                                                                                                             |     |
| `CLAUDE_CODE_SHELL_PREFIX`                     | Command prefix to wrap all bash commands (for example, for logging or auditing). Example: `/path/to/logger.sh` will execute `/path/to/logger.sh <command>`                                                                                                                                                                                                                                                                                                                                            |     |
| `CLAUDE_CODE_SIMPLE`                           | Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools. Disables MCP tools, attachments, hooks, and CLAUDE.md files                                                                                                                                                                                                                                                                                                                                         |     |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH`                | Skip AWS authentication for Bedrock (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                                          |     |
| `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`                | Skip Azure authentication for Microsoft Foundry (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                              |     |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH`                 | Skip Google authentication for Vertex (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                                        |     |
| `CLAUDE_CODE_SUBAGENT_MODEL`                   | See [Model configuration](/en/model-config)                                                                                                                                                                                                                                                                                                                                                                                                                                                           |     |
| `CLAUDE_CODE_TASK_LIST_ID`                     | Share a task list across sessions. Set the same ID in multiple Claude Code instances to coordinate on a shared task list. See [Task list](/en/interactive-mode#task-list)                                                                                                                                                                                                                                                                                                                             |     |
| `CLAUDE_CODE_TEAM_NAME`                        | Name of the agent team this teammate belongs to. Set automatically on [agent team](/en/agent-teams) members                                                                                                                                                                                                                                                                                                                                                                                           |     |
| `CLAUDE_CODE_TMPDIR`                           | Override the temp directory used for internal temp files. Claude Code appends `/claude/` to this path. Default: `/tmp` on Unix/macOS, `os.tmpdir()` on Windows                                                                                                                                                                                                                                                                                                                                        |     |
| `CLAUDE_CODE_USER_EMAIL`                       | Email address for the authenticated user. Used by SDK callers to provide account information synchronously. Requires `CLAUDE_CODE_ACCOUNT_UUID` and `CLAUDE_CODE_ORGANIZATION_UUID` to also be set                                                                                                                                                                                                                                                                                                    |     |
| `CLAUDE_CODE_USE_BEDROCK`                      | Use [Bedrock](/en/amazon-bedrock)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| `CLAUDE_CODE_USE_FOUNDRY`                      | Use [Microsoft Foundry](/en/microsoft-foundry)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |     |
| `CLAUDE_CODE_USE_VERTEX`                       | Use [Vertex](/en/google-vertex-ai)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |     |
| `CLAUDE_CONFIG_DIR`                            | Customize where Claude Code stores its configuration and data files                                                                                                                                                                                                                                                                                                                                                                                                                                   |     |
| `DISABLE_AUTOUPDATER`                          | Set to `1` to disable automatic updates.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |     |
| `DISABLE_BUG_COMMAND`                          | Set to `1` to disable the `/bug` command                                                                                                                                                                                                                                                                                                                                                                                                                                                              |     |
| `DISABLE_COST_WARNINGS`                        | Set to `1` to disable cost warning messages                                                                                                                                                                                                                                                                                                                                                                                                                                                           |     |
| `DISABLE_ERROR_REPORTING`                      | Set to `1` to opt out of Sentry error reporting                                                                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| `DISABLE_INSTALLATION_CHECKS`                  | Set to `1` to disable installation warnings. Use only when manually managing the installation location, as this can mask issues with standard installations                                                                                                                                                                                                                                                                                                                                           |     |
| `DISABLE_NON_ESSENTIAL_MODEL_CALLS`            | Set to `1` to disable model calls for non-critical paths like flavor text                                                                                                                                                                                                                                                                                                                                                                                                                             |     |
| `DISABLE_PROMPT_CACHING`                       | Set to `1` to disable prompt caching for all models (takes precedence over per-model settings)                                                                                                                                                                                                                                                                                                                                                                                                        |     |
| `DISABLE_PROMPT_CACHING_HAIKU`                 | Set to `1` to disable prompt caching for Haiku models                                                                                                                                                                                                                                                                                                                                                                                                                                                 |     |
| `DISABLE_PROMPT_CACHING_OPUS`                  | Set to `1` to disable prompt caching for Opus models                                                                                                                                                                                                                                                                                                                                                                                                                                                  |     |
| `DISABLE_PROMPT_CACHING_SONNET`                | Set to `1` to disable prompt caching for Sonnet models                                                                                                                                                                                                                                                                                                                                                                                                                                                |     |
| `DISABLE_TELEMETRY`                            | Set to `1` to opt out of Statsig telemetry (note that Statsig events do not include user data like code, file paths, or bash commands)                                                                                                                                                                                                                                                                                                                                                                |     |
| `ENABLE_CLAUDEAI_MCP_SERVERS`                  | Set to `false` to disable [claude.ai MCP servers](/en/mcp#use-mcp-servers-from-claudeai) in Claude Code. Enabled by default for logged-in users                                                                                                                                                                                                                                                                                                                                                       |     |
| `ENABLE_TOOL_SEARCH`                           | Controls [MCP tool search](/en/mcp#scale-with-mcp-tool-search). Values: `auto` (default, enables at 10% context), `auto:N` (custom threshold, e.g., `auto:5` for 5%), `true` (always on), `false` (disabled)                                                                                                                                                                                                                                                                                          |     |
| `FORCE_AUTOUPDATE_PLUGINS`                     | Set to `true` to force plugin auto-updates even when the main auto-updater is disabled via `DISABLE_AUTOUPDATER`                                                                                                                                                                                                                                                                                                                                                                                      |     |
| `HTTP_PROXY`                                   | Specify HTTP proxy server for network connections                                                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| `HTTPS_PROXY`                                  | Specify HTTPS proxy server for network connections                                                                                                                                                                                                                                                                                                                                                                                                                                                    |     |
| `IS_DEMO`                                      | Set to `true` to enable demo mode: hides email and organization from the UI, skips onboarding, and hides internal commands. Useful for streaming or recording sessions                                                                                                                                                                                                                                                                                                                                |     |
| `MAX_MCP_OUTPUT_TOKENS`                        | Maximum number of tokens allowed in MCP tool responses. Claude Code displays a warning when output exceeds 10,000 tokens (default: 25000)                                                                                                                                                                                                                                                                                                                                                             |     |
| `MAX_THINKING_TOKENS`                          | Override the [extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) token budget. Thinking is enabled at max budget (31,999 tokens) by default. Use this to limit the budget (for example, `MAX_THINKING_TOKENS=10000`) or disable thinking entirely (`MAX_THINKING_TOKENS=0`). For Opus 4.6, thinking depth is controlled by [effort level](/en/model-config#adjust-effort-level) instead, and this variable is ignored unless set to `0` to disable thinking. |     |
| `MCP_CLIENT_SECRET`                            | OAuth client secret for MCP servers that require [pre-configured credentials](/en/mcp#use-pre-configured-oauth-credentials). Avoids the interactive prompt when adding a server with `--client-secret`                                                                                                                                                                                                                                                                                                |     |
| `MCP_OAUTH_CALLBACK_PORT`                      | Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with [pre-configured credentials](/en/mcp#use-pre-configured-oauth-credentials)                                                                                                                                                                                                                                                                                                          |     |
| `MCP_TIMEOUT`                                  | Timeout in milliseconds for MCP server startup                                                                                                                                                                                                                                                                                                                                                                                                                                                        |     |
| `MCP_TOOL_TIMEOUT`                             | Timeout in milliseconds for MCP tool execution                                                                                                                                                                                                                                                                                                                                                                                                                                                        |     |
| `NO_PROXY`                                     | List of domains and IPs to which requests will be directly issued, bypassing proxy                                                                                                                                                                                                                                                                                                                                                                                                                    |     |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET`               | Override the character budget for skill metadata shown to the [Skill tool](/en/skills#control-who-invokes-a-skill). The budget scales dynamically at 2% of the context window, with a fallback of 16,000 characters. Legacy name kept for backwards compatibility                                                                                                                                                                                                                                     |     |
| `USE_BUILTIN_RIPGREP`                          | Set to `0` to use system-installed `rg` instead of `rg` included with Claude Code                                                                                                                                                                                                                                                                                                                                                                                                                     |     |
| `VERTEX_REGION_CLAUDE_3_5_HAIKU`               | Override region for Claude 3.5 Haiku when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                             |     |
| `VERTEX_REGION_CLAUDE_3_7_SONNET`              | Override region for Claude 3.7 Sonnet when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                            |     |
| `VERTEX_REGION_CLAUDE_4_0_OPUS`                | Override region for Claude 4.0 Opus when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                              |     |
| `VERTEX_REGION_CLAUDE_4_0_SONNET`              | Override region for Claude 4.0 Sonnet when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                            |     |
| `VERTEX_REGION_CLAUDE_4_1_OPUS`                | Override region for Claude 4.1 Opus when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                              |     |

## Tools available to Claude

Claude Code has access to a set of powerful tools that help it understand and modify your codebase:

| Tool                | Description                                                                                                                                                                                                                                                                                                                                                                 | Permission Required |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| **AskUserQuestion** | Asks multiple-choice questions to gather requirements or clarify ambiguity                                                                                                                                                                                                                                                                                                  | No                  |
| **Bash**            | Executes shell commands in your environment (see [Bash tool behavior](#bash-tool-behavior) below)                                                                                                                                                                                                                                                                           | Yes                 |
| **TaskOutput**      | Retrieves output from a background task (bash shell or subagent)                                                                                                                                                                                                                                                                                                            | No                  |
| **Edit**            | Makes targeted edits to specific files                                                                                                                                                                                                                                                                                                                                      | Yes                 |
| **ExitPlanMode**    | Prompts the user to exit plan mode and start coding                                                                                                                                                                                                                                                                                                                         | Yes                 |
| **Glob**            | Finds files based on pattern matching                                                                                                                                                                                                                                                                                                                                       | No                  |
| **Grep**            | Searches for patterns in file contents                                                                                                                                                                                                                                                                                                                                      | No                  |
| **KillShell**       | Kills a running background bash shell by its ID                                                                                                                                                                                                                                                                                                                             | No                  |
| **MCPSearch**       | Searches for and loads MCP tools when [tool search](/en/mcp#scale-with-mcp-tool-search) is enabled                                                                                                                                                                                                                                                                          | No                  |
| **NotebookEdit**    | Modifies Jupyter notebook cells                                                                                                                                                                                                                                                                                                                                             | Yes                 |
| **Read**            | Reads the contents of files                                                                                                                                                                                                                                                                                                                                                 | No                  |
| **Skill**           | Executes a [skill](/en/skills#control-who-invokes-a-skill) within the main conversation                                                                                                                                                                                                                                                                                     | Yes                 |
| **Agent**           | Runs a sub-agent to handle complex, multi-step tasks                                                                                                                                                                                                                                                                                                                        | No                  |
| **TaskCreate**      | Creates a new task in the task list                                                                                                                                                                                                                                                                                                                                         | No                  |
| **TaskGet**         | Retrieves full details for a specific task                                                                                                                                                                                                                                                                                                                                  | No                  |
| **TaskList**        | Lists all tasks with their current status                                                                                                                                                                                                                                                                                                                                   | No                  |
| **TaskUpdate**      | Updates task status, dependencies, details, or deletes tasks                                                                                                                                                                                                                                                                                                                | No                  |
| **WebFetch**        | Fetches content from a specified URL                                                                                                                                                                                                                                                                                                                                        | Yes                 |
| **WebSearch**       | Performs web searches with domain filtering                                                                                                                                                                                                                                                                                                                                 | Yes                 |
| **Write**           | Creates or overwrites files                                                                                                                                                                                                                                                                                                                                                 | Yes                 |
| **LSP**             | Code intelligence via language servers. Reports type errors and warnings automatically after file edits. Also supports navigation operations: jump to definitions, find references, get type info, list symbols, find implementations, trace call hierarchies. Requires a [code intelligence plugin](/en/discover-plugins#code-intelligence) and its language server binary | No                  |

Permission rules can be configured using `/allowed-tools` or in [permission settings](/en/settings#available-settings). Also see [Tool-specific permission rules](/en/permissions#tool-specific-permission-rules).

### Bash tool behavior

The Bash tool executes shell commands with the following persistence behavior:

* **Working directory persists**: When Claude changes the working directory (for example, `cd /path/to/dir`), subsequent Bash commands will execute in that directory. You can use `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1` to reset to the project directory after each command.
* **Environment variables do NOT persist**: Environment variables set in one Bash command (for example, `export MY_VAR=value`) are **not** available in subsequent Bash commands. Each Bash command runs in a fresh shell environment.

To make environment variables available in Bash commands, you have **three options**:

**Option 1: Activate environment before starting Claude Code** (simplest approach)

Activate your virtual environment in your terminal before launching Claude Code:

```bash  theme={null}
conda activate myenv
# or: source /path/to/venv/bin/activate
claude
```

This works for shell environments but environment variables set within Claude's Bash commands will not persist between commands.

**Option 2: Set CLAUDE\_ENV\_FILE before starting Claude Code** (persistent environment setup)

Export the path to a shell script containing your environment setup:

```bash  theme={null}
export CLAUDE_ENV_FILE=/path/to/env-setup.sh
claude
```

Where `/path/to/env-setup.sh` contains:

```bash  theme={null}
conda activate myenv
# or: source /path/to/venv/bin/activate
# or: export MY_VAR=value
```

Claude Code will source this file before each Bash command, making the environment persistent across all commands.

**Option 3: Use a SessionStart hook** (project-specific configuration)

Configure in `.claude/settings.json`:

```json  theme={null}
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "echo 'conda activate myenv' >> \"$CLAUDE_ENV_FILE\""
      }]
    }]
  }
}
```

The hook writes to `$CLAUDE_ENV_FILE`, which is then sourced before each Bash command. This is ideal for team-shared project configurations.

See [SessionStart hooks](/en/hooks#persist-environment-variables) for more details on Option 3.

### Extending tools with hooks

You can run custom commands before or after any tool executes using
[Claude Code hooks](/en/hooks-guide).

For example, you could automatically run a Python formatter after Claude
modifies Python files, or prevent modifications to production configuration
files by blocking Write operations to certain paths.

## See also

* [Permissions](/en/permissions): permission system, rule syntax, tool-specific patterns, and managed policies
* [Authentication](/en/authentication): set up user access to Claude Code
* [Troubleshooting](/en/troubleshooting): solutions for common configuration issues
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure permissions

> Control what Claude Code can access and do with fine-grained permission rules, modes, and managed policies.

Claude Code supports fine-grained permissions so that you can specify exactly what the agent is allowed to do and what it cannot. Permission settings can be checked into version control and distributed to all developers in your organization, as well as customized by individual developers.

## Permission system

Claude Code uses a tiered permission system to balance power and safety:

| Tool type         | Example          | Approval required | "Yes, don't ask again" behavior               |
| :---------------- | :--------------- | :---------------- | :-------------------------------------------- |
| Read-only         | File reads, Grep | No                | N/A                                           |
| Bash commands     | Shell execution  | Yes               | Permanently per project directory and command |
| File modification | Edit/write files | Yes               | Until session end                             |

## Manage permissions

You can view and manage Claude Code's tool permissions with `/permissions`. This UI lists all permission rules and the settings.json file they are sourced from.

* **Allow** rules let Claude Code use the specified tool without manual approval.
* **Ask** rules prompt for confirmation whenever Claude Code tries to use the specified tool.
* **Deny** rules prevent Claude Code from using the specified tool.

Rules are evaluated in order: **deny -> ask -> allow**. The first matching rule wins, so deny rules always take precedence.

## Permission modes

Claude Code supports several permission modes that control how tools are approved. Set the `defaultMode` in your [settings files](/en/settings#settings-files):

| Mode                | Description                                                                           |
| :------------------ | :------------------------------------------------------------------------------------ |
| `default`           | Standard behavior: prompts for permission on first use of each tool                   |
| `acceptEdits`       | Automatically accepts file edit permissions for the session                           |
| `plan`              | Plan Mode: Claude can analyze but not modify files or execute commands                |
| `dontAsk`           | Auto-denies tools unless pre-approved via `/permissions` or `permissions.allow` rules |
| `bypassPermissions` | Skips all permission prompts (requires safe environment, see warning below)           |

<Warning>
  `bypassPermissions` mode disables all permission checks. Only use this in isolated environments like containers or VMs where Claude Code cannot cause damage. Administrators can prevent this mode by setting `disableBypassPermissionsMode` to `"disable"` in [managed settings](#managed-settings).
</Warning>

## Permission rule syntax

Permission rules follow the format `Tool` or `Tool(specifier)`.

### Match all uses of a tool

To match all uses of a tool, use just the tool name without parentheses:

| Rule       | Effect                         |
| :--------- | :----------------------------- |
| `Bash`     | Matches all Bash commands      |
| `WebFetch` | Matches all web fetch requests |
| `Read`     | Matches all file reads         |

`Bash(*)` is equivalent to `Bash` and matches all Bash commands.

### Use specifiers for fine-grained control

Add a specifier in parentheses to match specific tool uses:

| Rule                           | Effect                                                   |
| :----------------------------- | :------------------------------------------------------- |
| `Bash(npm run build)`          | Matches the exact command `npm run build`                |
| `Read(./.env)`                 | Matches reading the `.env` file in the current directory |
| `WebFetch(domain:example.com)` | Matches fetch requests to example.com                    |

### Wildcard patterns

Bash rules support glob patterns with `*`. Wildcards can appear at any position in the command. This configuration allows npm and git commit commands while blocking git push:

```json  theme={null}
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Bash(git * main)",
      "Bash(* --version)",
      "Bash(* --help *)"
    ],
    "deny": [
      "Bash(git push *)"
    ]
  }
}
```

The space before `*` matters: `Bash(ls *)` matches `ls -la` but not `lsof`, while `Bash(ls*)` matches both. The legacy `:*` suffix syntax is equivalent to ` *` but is deprecated.

## Tool-specific permission rules

### Bash

Bash permission rules support wildcard matching with `*`. Wildcards can appear at any position in the command, including at the beginning, middle, or end:

* `Bash(npm run build)` matches the exact Bash command `npm run build`
* `Bash(npm run test *)` matches Bash commands starting with `npm run test`
* `Bash(npm *)` matches any command starting with `npm `
* `Bash(* install)` matches any command ending with ` install`
* `Bash(git * main)` matches commands like `git checkout main`, `git merge main`

When `*` appears at the end with a space before it (like `Bash(ls *)`), it enforces a word boundary, requiring the prefix to be followed by a space or end-of-string. For example, `Bash(ls *)` matches `ls -la` but not `lsof`. In contrast, `Bash(ls*)` without a space matches both `ls -la` and `lsof` because there's no word boundary constraint.

<Tip>
  Claude Code is aware of shell operators (like `&&`) so a prefix match rule like `Bash(safe-cmd *)` won't give it permission to run the command `safe-cmd && other-cmd`.
</Tip>

<Warning>
  Bash permission patterns that try to constrain command arguments are fragile. For example, `Bash(curl http://github.com/ *)` intends to restrict curl to GitHub URLs, but won't match variations like:

  * Options before URL: `curl -X GET http://github.com/...`
  * Different protocol: `curl https://github.com/...`
  * Redirects: `curl -L http://bit.ly/xyz` (redirects to github)
  * Variables: `URL=http://github.com && curl $URL`
  * Extra spaces: `curl  http://github.com`

  For more reliable URL filtering, consider:

  * **Restrict Bash network tools**: use deny rules to block `curl`, `wget`, and similar commands, then use the WebFetch tool with `WebFetch(domain:github.com)` permission for allowed domains
  * **Use PreToolUse hooks**: implement a hook that validates URLs in Bash commands and blocks disallowed domains
  * Instructing Claude Code about your allowed curl patterns via CLAUDE.md

  Note that using WebFetch alone does not prevent network access. If Bash is allowed, Claude can still use `curl`, `wget`, or other tools to reach any URL.
</Warning>

### Read and Edit

`Edit` rules apply to all built-in tools that edit files. Claude makes a best-effort attempt to apply `Read` rules to all built-in tools that read files like Grep and Glob.

Read and Edit rules both follow the [gitignore](https://git-scm.com/docs/gitignore) specification with four distinct pattern types:

| Pattern            | Meaning                                | Example                          | Matches                        |
| ------------------ | -------------------------------------- | -------------------------------- | ------------------------------ |
| `//path`           | **Absolute** path from filesystem root | `Read(//Users/alice/secrets/**)` | `/Users/alice/secrets/**`      |
| `~/path`           | Path from **home** directory           | `Read(~/Documents/*.pdf)`        | `/Users/alice/Documents/*.pdf` |
| `/path`            | Path **relative to project root**      | `Edit(/src/**/*.ts)`             | `<project root>/src/**/*.ts`   |
| `path` or `./path` | Path **relative to current directory** | `Read(*.env)`                    | `<cwd>/*.env`                  |

<Warning>
  A pattern like `/Users/alice/file` is NOT an absolute path. It's relative to the project root. Use `//Users/alice/file` for absolute paths.
</Warning>

Examples:

* `Edit(/docs/**)`: edits in `<project>/docs/` (NOT `/docs/` and NOT `<project>/.claude/docs/`)
* `Read(~/.zshrc)`: reads your home directory's `.zshrc`
* `Edit(//tmp/scratch.txt)`: edits the absolute path `/tmp/scratch.txt`
* `Read(src/**)`: reads from `<current-directory>/src/`

<Note>
  In gitignore patterns, `*` matches files in a single directory while `**` matches recursively across directories. To allow all file access, use just the tool name without parentheses: `Read`, `Edit`, or `Write`.
</Note>

### WebFetch

* `WebFetch(domain:example.com)` matches fetch requests to example.com

### MCP

* `mcp__puppeteer` matches any tool provided by the `puppeteer` server (name configured in Claude Code)
* `mcp__puppeteer__*` wildcard syntax that also matches all tools from the `puppeteer` server
* `mcp__puppeteer__puppeteer_navigate` matches the `puppeteer_navigate` tool provided by the `puppeteer` server

### Agent (subagents)

Use `Agent(AgentName)` rules to control which [subagents](/en/sub-agents) Claude can use:

* `Agent(Explore)` matches the Explore subagent
* `Agent(Plan)` matches the Plan subagent
* `Agent(my-custom-agent)` matches a custom subagent named `my-custom-agent`

Add these rules to the `deny` array in your settings or use the `--disallowedTools` CLI flag to disable specific agents. To disable the Explore agent:

```json  theme={null}
{
  "permissions": {
    "deny": ["Agent(Explore)"]
  }
}
```

## Extend permissions with hooks

[Claude Code hooks](/en/hooks-guide) provide a way to register custom shell commands to perform permission evaluation at runtime. When Claude Code makes a tool call, PreToolUse hooks run before the permission system, and the hook output can determine whether to approve or deny the tool call in place of the permission system.

## Working directories

By default, Claude has access to files in the directory where it was launched. You can extend this access:

* **During startup**: use `--add-dir <path>` CLI argument
* **During session**: use `/add-dir` command
* **Persistent configuration**: add to `additionalDirectories` in [settings files](/en/settings#settings-files)

Files in additional directories follow the same permission rules as the original working directory: they become readable without prompts, and file editing permissions follow the current permission mode.

## How permissions interact with sandboxing

Permissions and [sandboxing](/en/sandboxing) are complementary security layers:

* **Permissions** control which tools Claude Code can use and which files or domains it can access. They apply to all tools (Bash, Read, Edit, WebFetch, MCP, and others).
* **Sandboxing** provides OS-level enforcement that restricts the Bash tool's filesystem and network access. It applies only to Bash commands and their child processes.

Use both for defense-in-depth:

* Permission deny rules block Claude from even attempting to access restricted resources
* Sandbox restrictions prevent Bash commands from reaching resources outside defined boundaries, even if a prompt injection bypasses Claude's decision-making
* Filesystem restrictions in the sandbox use Read and Edit deny rules, not separate sandbox configuration
* Network restrictions combine WebFetch permission rules with the sandbox's `allowedDomains` list

## Managed settings

For organizations that need centralized control over Claude Code configuration, administrators can deploy managed settings that cannot be overridden by user or project settings. These policy settings follow the same format as regular settings files and can be delivered through MDM/OS-level policies, managed settings files, or [server-managed settings](/en/server-managed-settings). See [settings files](/en/settings#settings-files) for delivery mechanisms and file locations.

### Managed-only settings

Some settings are only effective in managed settings:

| Setting                                   | Description                                                                                                                                                                                                                          |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disableBypassPermissionsMode`            | Set to `"disable"` to prevent `bypassPermissions` mode and the `--dangerously-skip-permissions` flag                                                                                                                                 |
| `allowManagedPermissionRulesOnly`         | When `true`, prevents user and project settings from defining `allow`, `ask`, or `deny` permission rules. Only rules in managed settings apply                                                                                       |
| `allowManagedHooksOnly`                   | When `true`, prevents loading of user, project, and plugin hooks. Only managed hooks and SDK hooks are allowed                                                                                                                       |
| `allowManagedMcpServersOnly`              | When `true`, only `allowedMcpServers` from managed settings are respected. `deniedMcpServers` still merges from all sources. See [Managed MCP configuration](/en/mcp#managed-mcp-configuration)                                      |
| `blockedMarketplaces`                     | Blocklist of marketplace sources. Blocked sources are checked before downloading, so they never touch the filesystem. See [managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions)               |
| `sandbox.network.allowManagedDomainsOnly` | When `true`, only `allowedDomains` and `WebFetch(domain:...)` allow rules from managed settings are respected. Non-allowed domains are blocked automatically without prompting the user. Denied domains still merge from all sources |
| `strictKnownMarketplaces`                 | Controls which plugin marketplaces users can add. See [managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions)                                                                                   |
| `allow_remote_sessions`                   | When `true`, allows users to start [Remote Control](/en/remote-control) and [web sessions](/en/claude-code-on-the-web). Defaults to `true`. Set to `false` to prevent remote session access                                          |

## Settings precedence

Permission rules follow the same [settings precedence](/en/settings#settings-precedence) as all other Claude Code settings:

1. **Managed settings**: cannot be overridden by any other level, including command line arguments
2. **Command line arguments**: temporary session overrides
3. **Local project settings** (`.claude/settings.local.json`)
4. **Shared project settings** (`.claude/settings.json`)
5. **User settings** (`~/.claude/settings.json`)

If a tool is denied at any level, no other level can allow it. For example, a managed settings deny cannot be overridden by `--allowedTools`, and `--disallowedTools` can add restrictions beyond what managed settings define.

If a permission is allowed in user settings but denied in project settings, the project setting takes precedence and the permission is blocked.

## Example configurations

This [repository](https://github.com/anthropics/claude-code/tree/main/examples/settings) includes starter settings configurations for common deployment scenarios. Use these as starting points and adjust them to fit your needs.

## See also

* [Settings](/en/settings): complete configuration reference including the permission settings table
* [Sandboxing](/en/sandboxing): OS-level filesystem and network isolation for Bash commands
* [Authentication](/en/authentication): set up user access to Claude Code
* [Security](/en/security): security safeguards and best practices
* [Hooks](/en/hooks-guide): automate workflows and extend permission evaluation
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Sandboxing

> Learn how Claude Code's sandboxed bash tool provides filesystem and network isolation for safer, more autonomous agent execution.

## Overview

Claude Code features native sandboxing to provide a more secure environment for agent execution while reducing the need for constant permission prompts. Instead of asking permission for each bash command, sandboxing creates defined boundaries upfront where Claude Code can work more freely with reduced risk.

The sandboxed bash tool uses OS-level primitives to enforce both filesystem and network isolation.

## Why sandboxing matters

Traditional permission-based security requires constant user approval for bash commands. While this provides control, it can lead to:

* **Approval fatigue**: Repeatedly clicking "approve" can cause users to pay less attention to what they're approving
* **Reduced productivity**: Constant interruptions slow down development workflows
* **Limited autonomy**: Claude Code cannot work as efficiently when waiting for approvals

Sandboxing addresses these challenges by:

1. **Defining clear boundaries**: Specify exactly which directories and network hosts Claude Code can access
2. **Reducing permission prompts**: Safe commands within the sandbox don't require approval
3. **Maintaining security**: Attempts to access resources outside the sandbox trigger immediate notifications
4. **Enabling autonomy**: Claude Code can run more independently within defined limits

<Warning>
  Effective sandboxing requires **both** filesystem and network isolation. Without network isolation, a compromised agent could exfiltrate sensitive files like SSH keys. Without filesystem isolation, a compromised agent could backdoor system resources to gain network access. When configuring sandboxing it is important to ensure that your configured settings do not create bypasses in these systems.
</Warning>

## How it works

### Filesystem isolation

The sandboxed bash tool restricts file system access to specific directories:

* **Default writes behavior**: Read and write access to the current working directory and its subdirectories
* **Default read behavior**: Read access to the entire computer, except certain denied directories
* **Blocked access**: Cannot modify files outside the current working directory without explicit permission
* **Configurable**: Define custom allowed and denied paths through settings

You can grant write access to additional paths using `sandbox.filesystem.allowWrite` in your settings. These restrictions are enforced at the OS level (Seatbelt on macOS, bubblewrap on Linux), so they apply to all subprocess commands, including tools like `kubectl`, `terraform`, and `npm`, not just Claude's file tools.

### Network isolation

Network access is controlled through a proxy server running outside the sandbox:

* **Domain restrictions**: Only approved domains can be accessed
* **User confirmation**: New domain requests trigger permission prompts (unless [`allowManagedDomainsOnly`](/en/settings#sandbox-settings) is enabled, which blocks non-allowed domains automatically)
* **Custom proxy support**: Advanced users can implement custom rules on outgoing traffic
* **Comprehensive coverage**: Restrictions apply to all scripts, programs, and subprocesses spawned by commands

### OS-level enforcement

The sandboxed bash tool leverages operating system security primitives:

* **macOS**: Uses Seatbelt for sandbox enforcement
* **Linux**: Uses [bubblewrap](https://github.com/containers/bubblewrap) for isolation
* **WSL2**: Uses bubblewrap, same as Linux

WSL1 is not supported because bubblewrap requires kernel features only available in WSL2.

These OS-level restrictions ensure that all child processes spawned by Claude Code's commands inherit the same security boundaries.

## Getting started

### Prerequisites

On **macOS**, sandboxing works out of the box using the built-in Seatbelt framework.

On **Linux and WSL2**, install the required packages first:

<Tabs>
  <Tab title="Ubuntu/Debian">
    ```bash  theme={null}
    sudo apt-get install bubblewrap socat
    ```
  </Tab>

  <Tab title="Fedora">
    ```bash  theme={null}
    sudo dnf install bubblewrap socat
    ```
  </Tab>
</Tabs>

### Enable sandboxing

You can enable sandboxing by running the `/sandbox` command:

```text  theme={null}
> /sandbox
```

This opens a menu where you can choose between sandbox modes. If required dependencies are missing (such as `bubblewrap` or `socat` on Linux), the menu displays installation instructions for your platform.

### Sandbox modes

Claude Code offers two sandbox modes:

**Auto-allow mode**: Bash commands will attempt to run inside the sandbox and are automatically allowed without requiring permission. Commands that cannot be sandboxed (such as those needing network access to non-allowed hosts) fall back to the regular permission flow. Explicit ask/deny rules you've configured are always respected.

**Regular permissions mode**: All bash commands go through the standard permission flow, even when sandboxed. This provides more control but requires more approvals.

In both modes, the sandbox enforces the same filesystem and network restrictions. The difference is only in whether sandboxed commands are auto-approved or require explicit permission.

<Info>
  Auto-allow mode works independently of your permission mode setting. Even if you're not in "accept edits" mode, sandboxed bash commands will run automatically when auto-allow is enabled. This means bash commands that modify files within the sandbox boundaries will execute without prompting, even when file edit tools would normally require approval.
</Info>

### Configure sandboxing

Customize sandbox behavior through your `settings.json` file. See [Settings](/en/settings#sandbox-settings) for complete configuration reference.

#### Granting subprocess write access to specific paths

By default, sandboxed commands can only write to the current working directory. If subprocess commands like `kubectl`, `terraform`, or `npm` need to write outside the project directory, use `sandbox.filesystem.allowWrite` to grant access to specific paths:

```json  theme={null}
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["~/.kube", "//tmp/build"]
    }
  }
}
```

These paths are enforced at the OS level, so all commands running inside the sandbox, including their child processes, respect them. This is the recommended approach when a tool needs write access to a specific location, rather than excluding the tool from the sandbox entirely with `excludedCommands`.

When `allowWrite` (or `denyWrite`/`denyRead`) is defined in multiple [settings scopes](/en/settings#settings-precedence), the arrays are **merged**, meaning paths from every scope are combined, not replaced. For example, if managed settings allow writes to `//opt/company-tools` and a user adds `~/.kube` in their personal settings, both paths are included in the final sandbox configuration. This means users and projects can extend the list without duplicating or overriding paths set by higher-priority scopes.

Path prefixes control how paths are resolved:

| Prefix            | Meaning                                     | Example                                |
| :---------------- | :------------------------------------------ | :------------------------------------- |
| `//`              | Absolute path from filesystem root          | `//tmp/build` becomes `/tmp/build`     |
| `~/`              | Relative to home directory                  | `~/.kube` becomes `$HOME/.kube`        |
| `/`               | Relative to the settings file's directory   | `/build` becomes `$SETTINGS_DIR/build` |
| `./` or no prefix | Relative path (resolved by sandbox runtime) | `./output`                             |

You can also deny write or read access using `sandbox.filesystem.denyWrite` and `sandbox.filesystem.denyRead`. These are merged with any paths from `Edit(...)` and `Read(...)` permission rules.

<Tip>
  Not all commands are compatible with sandboxing out of the box. Some notes that may help you make the most out of the sandbox:

  * Many CLI tools require accessing certain hosts. As you use these tools, they will request permission to access certain hosts. Granting permission will allow them to access these hosts now and in the future, enabling them to safely execute inside the sandbox.
  * `watchman` is incompatible with running in the sandbox. If you're running `jest`, consider using `jest --no-watchman`
  * `docker` is incompatible with running in the sandbox. Consider specifying `docker` in `excludedCommands` to force it to run outside of the sandbox.
</Tip>

<Note>
  Claude Code includes an intentional escape hatch mechanism that allows commands to run outside the sandbox when necessary. When a command fails due to sandbox restrictions (such as network connectivity issues or incompatible tools), Claude is prompted to analyze the failure and may retry the command with the `dangerouslyDisableSandbox` parameter. Commands that use this parameter go through the normal Claude Code permissions flow requiring user permission to execute. This allows Claude Code to handle edge cases where certain tools or network operations cannot function within sandbox constraints.

  You can disable this escape hatch by setting `"allowUnsandboxedCommands": false` in your [sandbox settings](/en/settings#sandbox-settings). When disabled, the `dangerouslyDisableSandbox` parameter is completely ignored and all commands must run sandboxed or be explicitly listed in `excludedCommands`.
</Note>

## Security benefits

### Protection against prompt injection

Even if an attacker successfully manipulates Claude Code's behavior through prompt injection, the sandbox ensures your system remains secure:

**Filesystem protection:**

* Cannot modify critical config files such as `~/.bashrc`
* Cannot modify system-level files in `/bin/`
* Cannot read files that are denied in your [Claude permission settings](/en/permissions#manage-permissions)

**Network protection:**

* Cannot exfiltrate data to attacker-controlled servers
* Cannot download malicious scripts from unauthorized domains
* Cannot make unexpected API calls to unapproved services
* Cannot contact any domains not explicitly allowed

**Monitoring and control:**

* All access attempts outside the sandbox are blocked at the OS level
* You receive immediate notifications when boundaries are tested
* You can choose to deny, allow once, or permanently update your configuration

### Reduced attack surface

Sandboxing limits the potential damage from:

* **Malicious dependencies**: NPM packages or other dependencies with harmful code
* **Compromised scripts**: Build scripts or tools with security vulnerabilities
* **Social engineering**: Attacks that trick users into running dangerous commands
* **Prompt injection**: Attacks that trick Claude into running dangerous commands

### Transparent operation

When Claude Code attempts to access network resources outside the sandbox:

1. The operation is blocked at the OS level
2. You receive an immediate notification
3. You can choose to:
   * Deny the request
   * Allow it once
   * Update your sandbox configuration to permanently allow it

## Security Limitations

* Network Sandboxing Limitations: The network filtering system operates by restricting the domains that processes are allowed to connect to. It does not otherwise inspect the traffic passing through the proxy and users are responsible for ensuring they only allow trusted domains in their policy.

<Warning>
  Users should be aware of potential risks that come from allowing broad domains like `github.com` that may allow for data exfiltration. Also, in some cases it may be possible to bypass the network filtering through [domain fronting](https://en.wikipedia.org/wiki/Domain_fronting).
</Warning>

* Privilege Escalation via Unix Sockets: The `allowUnixSockets` configuration can inadvertently grant access to powerful system services that could lead to sandbox bypasses. For example, if it is used to allow access to `/var/run/docker.sock` this would effectively grant access to the host system through exploiting the docker socket. Users are encouraged to carefully consider any unix sockets that they allow through the sandbox.
* Filesystem Permission Escalation: Overly broad filesystem write permissions can enable privilege escalation attacks. Allowing writes to directories containing executables in `$PATH`, system configuration directories, or user shell configuration files (`.bashrc`, `.zshrc`) can lead to code execution in different security contexts when other users or system processes access these files.
* Linux Sandbox Strength: The Linux implementation provides strong filesystem and network isolation but includes an `enableWeakerNestedSandbox` mode that enables it to work inside of Docker environments without privileged namespaces. This option considerably weakens security and should only be used in cases where additional isolation is otherwise enforced.

## How sandboxing relates to permissions

Sandboxing and [permissions](/en/permissions) are complementary security layers that work together:

* **Permissions** control which tools Claude Code can use and are evaluated before any tool runs. They apply to all tools: Bash, Read, Edit, WebFetch, MCP, and others.
* **Sandboxing** provides OS-level enforcement that restricts what Bash commands can access at the filesystem and network level. It applies only to Bash commands and their child processes.

Filesystem and network restrictions are configured through both sandbox settings and permission rules:

* Use `sandbox.filesystem.allowWrite` to grant subprocess write access to paths outside the working directory
* Use `sandbox.filesystem.denyWrite` and `sandbox.filesystem.denyRead` to block subprocess access to specific paths
* Use `Read` and `Edit` deny rules to block access to specific files or directories
* Use `WebFetch` allow/deny rules to control domain access
* Use sandbox `allowedDomains` to control which domains Bash commands can reach

Paths from both `sandbox.filesystem` settings and permission rules are merged together into the final sandbox configuration.

This [repository](https://github.com/anthropics/claude-code/tree/main/examples/settings) includes starter settings configurations for common deployment scenarios, including sandbox-specific examples. Use these as starting points and adjust them to fit your needs.

## Advanced usage

### Custom proxy configuration

For organizations requiring advanced network security, you can implement a custom proxy to:

* Decrypt and inspect HTTPS traffic
* Apply custom filtering rules
* Log all network requests
* Integrate with existing security infrastructure

```json  theme={null}
{
  "sandbox": {
    "network": {
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

### Integration with existing security tools

The sandboxed bash tool works alongside:

* **Permission rules**: Combine with [permission settings](/en/permissions) for defense-in-depth
* **Development containers**: Use with [devcontainers](/en/devcontainer) for additional isolation
* **Enterprise policies**: Enforce sandbox configurations through [managed settings](/en/settings#settings-precedence)

## Best practices

1. **Start restrictive**: Begin with minimal permissions and expand as needed
2. **Monitor logs**: Review sandbox violation attempts to understand Claude Code's needs
3. **Use environment-specific configs**: Different sandbox rules for development vs. production contexts
4. **Combine with permissions**: Use sandboxing alongside IAM policies for comprehensive security
5. **Test configurations**: Verify your sandbox settings don't block legitimate workflows

## Open source

The sandbox runtime is available as an open source npm package for use in your own agent projects. This enables the broader AI agent community to build safer, more secure autonomous systems. This can also be used to sandbox other programs you may wish to run. For example, to sandbox an MCP server you could run:

```bash  theme={null}
npx @anthropic-ai/sandbox-runtime <command-to-sandbox>
```

For implementation details and source code, visit the [GitHub repository](https://github.com/anthropic-experimental/sandbox-runtime).

## Limitations

* **Performance overhead**: Minimal, but some filesystem operations may be slightly slower
* **Compatibility**: Some tools that require specific system access patterns may need configuration adjustments, or may even need to be run outside of the sandbox
* **Platform support**: Supports macOS, Linux, and WSL2. WSL1 is not supported. Native Windows support is planned.

## See also

* [Security](/en/security) - Comprehensive security features and best practices
* [Permissions](/en/permissions) - Permission configuration and access control
* [Settings](/en/settings) - Complete configuration reference
* [CLI reference](/en/cli-reference) - Command-line options
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Optimize your terminal setup

> Claude Code works best when your terminal is properly configured. Follow these guidelines to optimize your experience.

### Themes and appearance

Claude cannot control the theme of your terminal. That's handled by your terminal application. You can match Claude Code's theme to your terminal any time via the `/config` command.

For additional customization of the Claude Code interface itself, you can configure a [custom status line](/en/statusline) to display contextual information like the current model, working directory, or git branch at the bottom of your terminal.

### Line breaks

You have several options for entering line breaks into Claude Code:

* **Quick escape**: Type `\` followed by Enter to create a newline
* **Shift+Enter**: Works out of the box in iTerm2, WezTerm, Ghostty, and Kitty
* **Keyboard shortcut**: Set up a keybinding to insert a newline in other terminals

**Set up Shift+Enter for other terminals**

Run `/terminal-setup` within Claude Code to automatically configure Shift+Enter for VS Code, Alacritty, Zed, and Warp.

<Note>
  The `/terminal-setup` command is only visible in terminals that require manual configuration. If you're using iTerm2, WezTerm, Ghostty, or Kitty, you won't see this command because Shift+Enter already works natively.
</Note>

**Set up Option+Enter (VS Code, iTerm2 or macOS Terminal.app)**

**For Mac Terminal.app:**

1. Open Settings → Profiles → Keyboard
2. Check "Use Option as Meta Key"

**For iTerm2 and VS Code terminal:**

1. Open Settings → Profiles → Keys
2. Under General, set Left/Right Option key to "Esc+"

### Notification setup

When Claude finishes working and is waiting for your input, it fires a notification event. You can surface this event as a desktop notification through your terminal or run custom logic with [notification hooks](/en/hooks#notification).

#### Terminal notifications

Kitty and Ghostty support desktop notifications without additional configuration. iTerm 2 requires setup:

1. Open iTerm 2 Settings → Profiles → Terminal
2. Enable "Notification Center Alerts"
3. Click "Filter Alerts" and check "Send escape sequence-generated alerts"

If notifications aren't appearing, verify that your terminal app has notification permissions in your OS settings.

Other terminals, including the default macOS Terminal, do not support native notifications. Use [notification hooks](/en/hooks#notification) instead.

#### Notification hooks

To add custom behavior when notifications fire, such as playing a sound or sending a message, configure a [notification hook](/en/hooks#notification). Hooks run alongside terminal notifications, not as a replacement.

### Handling large inputs

When working with extensive code or long instructions:

* **Avoid direct pasting**: Claude Code may struggle with very long pasted content
* **Use file-based workflows**: Write content to a file and ask Claude to read it
* **Be aware of VS Code limitations**: The VS Code terminal is particularly prone to truncating long pastes

### Vim Mode

Claude Code supports a subset of Vim keybindings that can be enabled with `/vim` or configured via `/config`.

The supported subset includes:

* Mode switching: `Esc` (to NORMAL), `i`/`I`, `a`/`A`, `o`/`O` (to INSERT)
* Navigation: `h`/`j`/`k`/`l`, `w`/`e`/`b`, `0`/`$`/`^`, `gg`/`G`, `f`/`F`/`t`/`T` with `;`/`,` repeat
* Editing: `x`, `dw`/`de`/`db`/`dd`/`D`, `cw`/`ce`/`cb`/`cc`/`C`, `.` (repeat)
* Yank/paste: `yy`/`Y`, `yw`/`ye`/`yb`, `p`/`P`
* Text objects: `iw`/`aw`, `iW`/`aW`, `i"`/`a"`, `i'`/`a'`, `i(`/`a(`, `i[`/`a[`, `i{`/`a{`
* Indentation: `>>`/`<<`
* Line operations: `J` (join lines)

See [Interactive mode](/en/interactive-mode#vim-editor-mode) for the complete reference.
> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Model configuration

> Learn about the Claude Code model configuration, including model aliases like `opusplan`

## Available models

For the `model` setting in Claude Code, you can configure either:

* A **model alias**
* A **model name**
  * Anthropic API: A full **[model name](https://platform.claude.com/docs/en/about-claude/models/overview)**
  * Bedrock: an inference profile ARN
  * Foundry: a deployment name
  * Vertex: a version name

### Model aliases

Model aliases provide a convenient way to select model settings without
remembering exact version numbers:

| Model alias      | Behavior                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`default`**    | Recommended model setting, depending on your account type                                                                                                            |
| **`sonnet`**     | Uses the latest Sonnet model (currently Sonnet 4.6) for daily coding tasks                                                                                           |
| **`opus`**       | Uses the latest Opus model (currently Opus 4.6) for complex reasoning tasks                                                                                          |
| **`haiku`**      | Uses the fast and efficient Haiku model for simple tasks                                                                                                             |
| **`sonnet[1m]`** | Uses Sonnet with a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) for long sessions |
| **`opusplan`**   | Special mode that uses `opus` during plan mode, then switches to `sonnet` for execution                                                                              |

Aliases always point to the latest version. To pin to a specific version, use the full model name (for example, `claude-opus-4-6`) or set the corresponding environment variable like `ANTHROPIC_DEFAULT_OPUS_MODEL`.

### Setting your model

You can configure your model in several ways, listed in order of priority:

1. **During session** - Use `/model <alias|name>` to switch models mid-session
2. **At startup** - Launch with `claude --model <alias|name>`
3. **Environment variable** - Set `ANTHROPIC_MODEL=<alias|name>`
4. **Settings** - Configure permanently in your settings file using the `model`
   field.

Example usage:

```bash  theme={null}
# Start with Opus
claude --model opus

# Switch to Sonnet during session
/model sonnet
```

Example settings file:

```json  theme={null}
{
    "permissions": {
        ...
    },
    "model": "opus"
}
```

## Restrict model selection

Enterprise administrators can use `availableModels` in [managed or policy settings](/en/settings#settings-files) to restrict which models users can select.

When `availableModels` is set, users cannot switch to models not in the list via `/model`, `--model` flag, Config tool, or `ANTHROPIC_MODEL` environment variable.

```json  theme={null}
{
  "availableModels": ["sonnet", "haiku"]
}
```

### Default model behavior

The Default option in the model picker is not affected by `availableModels`. It always remains available and represents the system's runtime default [based on the user's subscription tier](#default-model-setting).

Even with `availableModels: []`, users can still use Claude Code with the Default model for their tier.

### Control the model users run on

To fully control the model experience, use `availableModels` together with the `model` setting:

* **availableModels**: restricts what users can switch to
* **model**: sets the explicit model override, taking precedence over the Default

This example ensures all users run Sonnet 4.6 and can only choose between Sonnet and Haiku:

```json  theme={null}
{
  "model": "sonnet",
  "availableModels": ["sonnet", "haiku"]
}
```

### Merge behavior

When `availableModels` is set at multiple levels, such as user settings and project settings, arrays are merged and deduplicated. To enforce a strict allowlist, set `availableModels` in managed or policy settings which take highest priority.

## Special model behavior

### `default` model setting

The behavior of `default` depends on your account type:

* **Max and Team Premium**: defaults to Opus 4.6
* **Pro and Team Standard**: defaults to Sonnet 4.6
* **Enterprise**: Opus 4.6 is available but not the default

Claude Code may automatically fall back to Sonnet if you hit a usage threshold with Opus.

### `opusplan` model setting

The `opusplan` model alias provides an automated hybrid approach:

* **In plan mode** - Uses `opus` for complex reasoning and architecture
  decisions
* **In execution mode** - Automatically switches to `sonnet` for code generation
  and implementation

This gives you the best of both worlds: Opus's superior reasoning for planning,
and Sonnet's efficiency for execution.

### Adjust effort level

[Effort levels](https://platform.claude.com/docs/en/build-with-claude/effort) control adaptive reasoning, which dynamically allocates thinking based on task complexity. Lower effort is faster and cheaper for straightforward tasks, while higher effort provides deeper reasoning for complex problems.

Three levels are available: **low**, **medium**, and **high**. Opus 4.6 defaults to medium effort for Max and Team subscribers.

**Setting effort:**

* **In `/model`**: use left/right arrow keys to adjust the effort slider when selecting a model
* **Environment variable**: set `CLAUDE_CODE_EFFORT_LEVEL=low|medium|high`
* **Settings**: set `effortLevel` in your settings file

Effort is supported on Opus 4.6 and Sonnet 4.6. The effort slider appears in `/model` when a supported model is selected. The current effort level is also displayed next to the logo and spinner (for example, "with low effort"), so you can confirm which setting is active without opening `/model`.

To disable adaptive reasoning on Opus 4.6 and Sonnet 4.6 and revert to the previous fixed thinking budget, set `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`. When disabled, these models use the fixed budget controlled by `MAX_THINKING_TOKENS`. See [environment variables](/en/settings#environment-variables).

### Extended context

Opus 4.6 and Sonnet 4.6 support a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) for long sessions with large codebases.

<Note>
  The 1M context window is currently in beta. Features, pricing, and availability may change.
</Note>

Extended context is available for:

* **API and pay-as-you-go users**: full access to 1M context
* **Pro, Max, Teams, and Enterprise subscribers**: available with [extra usage](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) enabled

To disable 1M context entirely, set `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`. This removes 1M model variants from the model picker. See [environment variables](/en/settings#environment-variables).

Selecting a 1M model does not immediately change billing. Your session uses standard rates until it exceeds 200K tokens of context. Beyond 200K tokens, requests are charged at [long-context pricing](https://platform.claude.com/docs/en/about-claude/pricing#long-context-pricing) with dedicated [rate limits](https://platform.claude.com/docs/en/api/rate-limits#long-context-rate-limits). For subscribers, tokens beyond 200K are billed as extra usage rather than through the subscription.

If your account supports 1M context, the option appears in the model picker (`/model`) in the latest versions of Claude Code. If you don't see it, try restarting your session.

You can also use the `[1m]` suffix with model aliases or full model names:

```bash  theme={null}
# Use the sonnet[1m] alias
/model sonnet[1m]

# Or append [1m] to a full model name
/model claude-sonnet-4-6[1m]
```

## Checking your current model

You can see which model you're currently using in several ways:

1. In [status line](/en/statusline) (if configured)
2. In `/status`, which also displays your account information.

## Environment variables

You can use the following environment variables, which must be full **model
names** (or equivalent for your API provider), to control the model names that the aliases map to.

| Environment variable             | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | The model to use for `opus`, or for `opusplan` when Plan Mode is active.                      |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | The model to use for `sonnet`, or for `opusplan` when Plan Mode is not active.                |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | The model to use for `haiku`, or [background functionality](/en/costs#background-token-usage) |
| `CLAUDE_CODE_SUBAGENT_MODEL`     | The model to use for [subagents](/en/sub-agents)                                              |

Note: `ANTHROPIC_SMALL_FAST_MODEL` is deprecated in favor of
`ANTHROPIC_DEFAULT_HAIKU_MODEL`.

### Pin models for third-party deployments

When deploying Claude Code through [Bedrock](/en/amazon-bedrock), [Vertex AI](/en/google-vertex-ai), or [Foundry](/en/microsoft-foundry), pin model versions before rolling out to users.

Without pinning, Claude Code uses model aliases (`sonnet`, `opus`, `haiku`) that resolve to the latest version. When Anthropic releases a new model, users whose accounts don't have the new version enabled will break silently.

<Warning>
  Set all three model environment variables to specific version IDs as part of your initial setup. Skipping this step means a Claude Code update can break your users without any action on your part.
</Warning>

Use the following environment variables with version-specific model IDs for your provider:

| Provider  | Example                                                                 |
| :-------- | :---------------------------------------------------------------------- |
| Bedrock   | `export ANTHROPIC_DEFAULT_OPUS_MODEL='us.anthropic.claude-opus-4-6-v1'` |
| Vertex AI | `export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-6'`                 |
| Foundry   | `export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-6'`                 |

Apply the same pattern for `ANTHROPIC_DEFAULT_SONNET_MODEL` and `ANTHROPIC_DEFAULT_HAIKU_MODEL`. For current and legacy model IDs across all providers, see [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). To upgrade users to a new model version, update these environment variables and redeploy.

<Note>
  The `settings.availableModels` allowlist still applies when using third-party providers. Filtering matches on the model alias (`opus`, `sonnet`, `haiku`), not the provider-specific model ID.
</Note>

### Prompt caching configuration

Claude Code automatically uses [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) to optimize performance and reduce costs. You can disable prompt caching globally or for specific model tiers:

| Environment variable            | Description                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `DISABLE_PROMPT_CACHING`        | Set to `1` to disable prompt caching for all models (takes precedence over per-model settings) |
| `DISABLE_PROMPT_CACHING_HAIKU`  | Set to `1` to disable prompt caching for Haiku models only                                     |
| `DISABLE_PROMPT_CACHING_SONNET` | Set to `1` to disable prompt caching for Sonnet models only                                    |
| `DISABLE_PROMPT_CACHING_OPUS`   | Set to `1` to disable prompt caching for Opus models only                                      |

These environment variables give you fine-grained control over prompt caching behavior. The global `DISABLE_PROMPT_CACHING` setting takes precedence over the model-specific settings, allowing you to quickly disable all caching when needed. The per-model settings are useful for selective control, such as when debugging specific models or working with cloud providers that may have different caching implementations.
