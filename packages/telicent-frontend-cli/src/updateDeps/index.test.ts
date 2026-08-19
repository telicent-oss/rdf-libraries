import { beforeEach, afterEach, describe, it, expect, vi, afterAll } from 'vitest';
import fs from 'fs';
import { updateDeps } from './index.js';
import { execSync } from 'child_process';

vi.mock('fs', () => {
  const mocks = {
    readFileSync: vi.fn().mockReturnValue('{}'),
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
  };
  return {
    __esModule: true,
    default: mocks,
    ...mocks,
  };
});

vi.mock('child_process', () => {
  const mocks = { execSync: vi.fn() };
  return {
    __esModule: true,
    default: mocks,
    ...mocks,
  };
});

const cwd = '/app';
const source = 'package.json';
const target = 'cfg.json';
const packageJSON = { name: 'x', version: '9.9.9' };

let exitSpy: any;
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('updateDeps', () => {
  it('exits if source missing', () => {
    (fs.existsSync as any).mockReturnValueOnce(false);
    updateDeps({ source, target });
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect({
      log: (console.log as any).mock.calls,
      error: (console.error as any).mock.calls,
      warn: (console.warn as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [
          [
            "ERROR: source not found (package.json)",
          ],
          [
            "ERROR: no repos in config",
          ],
        ],
        "log": [
          [
            "
      USER ACTION REQUIRED - fill out cfg.json

      Example:
      {
        "../project-to-update": {},
        "../project-to-update-and-install": {
          "postUpdateDependency": "yarn local-install"
        }
      }",
          ],
        ],
        "warn": [],
      }
    `);
  });

  it('exits if target missing', () => {
    (fs.existsSync as any).mockReturnValueOnce(true).mockReturnValueOnce(false);
    updateDeps({ source, target });
    expect(exitSpy).toHaveBeenCalledWith(1);

    expect({
      log: (console.log as any).mock.calls,
      error: (console.error as any).mock.calls,
      warn: (console.warn as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [
          [
            "ERROR: no repos in config",
          ],
        ],
        "log": [
          [
            "Created file: cfg.json",
          ],
          [
            "
      USER ACTION REQUIRED - fill out cfg.json

      Example:
      {
        "../project-to-update": {},
        "../project-to-update-and-install": {
          "postUpdateDependency": "yarn local-install"
        }
      }",
          ],
          [
            "
      USER ACTION REQUIRED - fill out cfg.json

      Example:
      {
        "../project-to-update": {},
        "../project-to-update-and-install": {
          "postUpdateDependency": "yarn local-install"
        }
      }",
          ],
        ],
        "warn": [],
      }
    `);
  });

  it('writes updated package.json', () => {
    (fs.existsSync as any)
      .mockReturnValueOnce(true) // --source exists
      .mockReturnValueOnce(true) // --target exists
      .mockReturnValueOnce(true); // repo/package.json from within --target exists
    (fs.readFileSync as any)
      .mockReturnValueOnce(JSON.stringify(packageJSON))
      .mockReturnValueOnce(JSON.stringify({ repo: {} }))
      .mockReturnValueOnce(JSON.stringify({ dependencies: { x: '0.0.1' } }));

    updateDeps({ source, target });

    expect((fs.writeFileSync as any).mock.calls.length).toBe(1);
    expect((fs.writeFileSync as any).mock.calls[0]).toMatchInlineSnapshot(`
      [
        "/app/repo/package.json",
        "{
        "dependencies": {
          "x": "9.9.9"
        }
      }
      ",
      ]
    `);
    expect(exitSpy).not.toHaveBeenCalled();

    expect({
      log: (console.log as any).mock.calls,
      error: (console.error as any).mock.calls,
      warn: (console.warn as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [],
        "log": [
          [
            "✔ Updated x@9.9.9 in repo",
          ],
        ],
        "warn": [],
      }
    `);
  });

  it('Skips if repo/package.json does not exist', () => {
    (fs.existsSync as any)
      .mockReturnValueOnce(true) // --source exists
      .mockReturnValueOnce(true) // --target exists
      .mockReturnValueOnce(false); // repo/package.json from within --target exists
    (fs.readFileSync as any)
      .mockReturnValueOnce(JSON.stringify(packageJSON))
      .mockReturnValueOnce(JSON.stringify({ repo: {} }))
      .mockReturnValueOnce(JSON.stringify({ dependencies: { x: '0.0.1' } }));

    updateDeps({ source, target });

    expect({
      log: (console.log as any).mock.calls,
      error: (console.error as any).mock.calls,
      warn: (console.warn as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [],
        "log": [
          [
            "✔ Updated x@9.9.9 in repo",
          ],
        ],
        "warn": [
          [
            "WARNING NO ACTION TAKEN —  repo: package.json not found",
          ],
        ],
      }
    `);
  });

  it('logs skip-updateDependency when flagged', () => {
    (fs.existsSync as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    (fs.readFileSync as any)
      .mockReturnValueOnce(JSON.stringify(packageJSON))
      .mockReturnValueOnce(JSON.stringify({ repo: {} }))
      .mockReturnValueOnce('{}');

    updateDeps({ source, target, skipUpdateDependency: true });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('skip-updateDependency'));

    expect({
      log: (console.log as any).mock.calls,
      error: (console.error as any).mock.calls,
      warn: (console.warn as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [],
        "log": [
          [
            "SKIPPED updateDependency (--skip-updateDependency)",
          ],
          [
            "✔ Updated x@9.9.9 in repo",
          ],
        ],
        "warn": [],
      }
    `);
  });
  it('logs skip-postUpdateDependency when flagged', () => {
    (fs.existsSync as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    (fs.readFileSync as any)
      .mockReturnValueOnce(JSON.stringify(packageJSON))
      .mockReturnValueOnce(JSON.stringify({ repo: {} }))
      .mockReturnValueOnce('{}');

    updateDeps({ source, target, skipPostUpdateDependency: true });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('skip-postUpdateDependency'));

    expect({
      log: (console.log as any).mock.calls,
      error: (console.error as any).mock.calls,
      warn: (console.warn as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [],
        "log": [
          [
            "✔ Updated x@9.9.9 in repo",
          ],
          [
            "SKIPPED postUpdateDependency (--skip-postUpdateDependency)",
          ],
        ],
        "warn": [],
      }
    `);
  });
  it('executes postUpdateDependency', () => {
    (fs.existsSync as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    (fs.readFileSync as any)
      .mockReturnValueOnce(JSON.stringify(packageJSON))
      .mockReturnValueOnce(JSON.stringify({ repo: { postUpdateDependency: 'echo hi' } }))
      .mockReturnValueOnce('{}');

    updateDeps({ source, target });
    expect((execSync as any).mock.calls).toMatchInlineSnapshot(`
      [
        [
          "echo hi",
          {
            "cwd": "repo",
            "stdio": "inherit",
          },
        ],
      ]
    `);
  });
  it('executes postUpdateDependency but fails', () => {
    (fs.existsSync as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    (fs.readFileSync as any)
      .mockReturnValueOnce(JSON.stringify(packageJSON))
      .mockReturnValueOnce(JSON.stringify({ repo: { postUpdateDependency: 'echo hi' } }))
      .mockReturnValueOnce('{}');

    (execSync as any).mockImplementation((val) => {
      throw new Error(`FAILED: ${val}`);
    });
    updateDeps({ source, target });

    expect({
      error: (console.error as any).mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "error": [
          [
            "Error in repo postUpdate:",
            [Error: FAILED: echo hi],
          ],
        ],
      }
    `);
  });
});
