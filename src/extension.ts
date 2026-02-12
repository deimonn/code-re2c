/*── extension.ts ── Main script for code-re2c ──*
 │
 │ Copyright (c) 2024-2026 Deimonn
 │
 │ This file is licensed under the MIT License.
 │
 │ See https://deimonn.dev/code-re2c/license.txt for icense information.
 │
 */

// SPDX-License-Identifier: MIT

import child_process = require("child_process");

import * as vscode from "vscode";
import * as minimatch from "minimatch";

/** Output channel, for debugging purposes. */
let outputChannel: vscode.OutputChannel;
/** Diagnostics collection. */
let diagnosticCollection: vscode.DiagnosticCollection;
/** List of languages registered in this VSCode instance. */
let registeredLanguages: string[] = [];

/** Map of re2c binary names to associated languages. */
const re2cBinaries: { [key: string]: string } = {
    re2c: "cpp",
    re2d: "d",
    re2go: "go",
    re2hs: "haskell",
    re2java: "java",
    re2js: "javascript",
    re2ocaml: "ocaml",
    re2py: "python",
    re2rust: "rust",
    re2swift: "swift",
    re2v: "v",
    re2zig: "zig"
};

/** Map of --lang flag values to associated languages. */
const re2cLanguages: { [key: string]: string } = {
    c: "cpp",
    d: "d",
    go: "go",
    haskell: "haskell",
    java: "java",
    js: "javascript",
    ocaml: "ocaml",
    python: "python",
    rust: "rust",
    swift: "swift",
    v: "v",
    zig: "zig",
    none: "user-defined"
};

/** Generates a string timestamp. */
function timestamp(): string {
    return new Date().toISOString();
}

/** Checks if the path is satisfied by any of the given globs. */
function match(path: string, globs: string[]): boolean {
    let matched = false;

    for (const glob of globs) {
        if (minimatch.minimatch(path, glob)) {
            matched = true;
            break;
        }
    }

    return matched;
}

/** Detect and update a document's language. */
function detectLanguage(
    document: vscode.TextDocument,
    configuration: vscode.WorkspaceConfiguration
): void {
    // Fetch configuration.
    const customLanguageId = configuration.get<string | null>("re2c.customLanguageId") ?? null;
    const defaultLanguageId = configuration.get<string | null>("re2c.defaultLanguageId") ?? null;

    // Fetch first document line.
    const line = document.lineAt(0).text;

    // Look for keyword.
    let language = null;

    for (const binaryName in re2cBinaries) {
        const regex = new RegExp(`\\b${binaryName}\\b`);
        if (regex.test(line)) {
            language = re2cBinaries[binaryName];
            break;
        }
    }

    // No keyword found.
    if (language === null) {
        // Attempt to default the language.
        if (defaultLanguageId) {
            if (!registeredLanguages.includes(defaultLanguageId)) {
                vscode.window.showErrorMessage(
                    `No registered language with identifier "${defaultLanguageId}".`
                );

                return;
            }

            vscode.languages.setTextDocumentLanguage(document, defaultLanguageId);
            return;
        }

        // Show language detection failure notification.
        vscode.window.showWarningMessage(
            `Could not detect language of document "${document.uri.fsPath}"; consider adding ` +
            `the re2c invocation as a comment at the top, or setting a default language to ` +
            `assume in the settings.`,
            "Add Comment", "Go to Settings", "Dismiss"
        ).then(option => {
            // Fix with comment.
            if (option === "Add Comment") {
                const textEditor = vscode.window.activeTextEditor;
                if (textEditor === undefined) {
                    return;
                }

                textEditor
                    .edit((b) => b.insert(new vscode.Position(0, 0), "// re2c --lang c\n"))
                    .then(() => {
                        vscode.window.showTextDocument(textEditor.document, {
                            selection: new vscode.Range(
                                new vscode.Position(0, 0),
                                new vscode.Position(0, 16)
                            )
                        });
                    });

                return;
            }

            // Fix with setting.
            if (option === "Go to Settings") {
                vscode.commands.executeCommand(
                    "workbench.action.openSettings",
                    "code-re2c.re2c.defaultLanguageId"
                );

                return;
            }
        });

        return;
    }

    // Look for optional flag.
    for (const languageName in re2cLanguages) {
        const regex = new RegExp(`--lang\\s+${languageName}\\b`);
        if (regex.test(line)) {
            language = re2cLanguages[languageName];
            break;
        }
    }

    // User-defined language handling.
    if (language === "user-defined") {
        // None set; give up detection.
        if (customLanguageId === null) {
            return;
        }

        // Check that the ID is registed, or show an error otherwise.
        if (!registeredLanguages.includes(customLanguageId)) {
            vscode.window.showErrorMessage(
                `No registered language with identifier "${customLanguageId}".`
            );

            return;
        }

        // Set language.
        language = customLanguageId;
    }

    // Ensure the language ID is registered.
    if (!registeredLanguages.includes(language)) {
        return;
    }

    // Update document language.
    vscode.languages.setTextDocumentLanguage(document, language);
}

/**
 * Detect language and publish diagnostics for the document.
 *
 * If `force` is true, updates the document regardless of whether its open in an editor yet or not.
 */
function updateDocument(document: vscode.TextDocument, force: boolean): void {
    // Only operate on text documents that are open on the editor, unless `force` is true.
    if (!force) {
        let index = vscode.window.visibleTextEditors.findIndex(e => e.document.uri == document.uri);
        if (index == -1) {
            return;
        }
    }

    // Fetch configuration.
    const configuration = vscode.workspace.getConfiguration("code-re2c");

    const re2c = configuration.get<string>("re2c.path") ?? "re2c";
    const args = configuration.get<string[]>("re2c.arguments") ?? ["-W"];
    const detect = configuration.get<string[]>("re2c.detect") ?? ["**/*.re"];
    const ignore = configuration.get<string[]>("re2c.ignore") ?? [];
    const customLanguageId = configuration.get<string | null>("re2c.customLanguageId") ?? null;

    // Skip ignored files.
    if (match(document.uri.fsPath, ignore)) {
        resetDocument(document);
        return;
    }

    // Detect language for files where detection is enabled.
    if (match(document.uri.fsPath, detect)) {
        detectLanguage(document, configuration);
    }

    // Push language flag to arguments; skip unsupported languages.
    switch (document.languageId) {
        // Known language.
        case "c":
        case "d":
        case "go":
        case "haskell":
        case "java":
        case "ocaml":
        case "python":
        case "rust":
        case "swift":
        case "v":
        case "zig":
            args.push("--lang", document.languageId);
            break;
        case "cpp":
            args.push("--lang", "c");
            break;
        case "javascript":
            args.push("--lang", "js");
            break;

        // Other.
        default:
            // Custom language.
            if (document.languageId === customLanguageId) {
                args.push("--lang", "none");
                break;
            }

            // Unknown language.
            resetDocument(document);
            return;
    }

    // Push document path to arguments.
    args.push(document.uri.fsPath);

    // Execute `re2c` with the given arguments.
    outputChannel.appendLine(`[${timestamp()}] Executing '${re2c}' with args: ${args.join(" ")}`);
    child_process.execFile(re2c, args, (error, _, stderr) => {
        // Check for error.
        if (error) {
            outputChannel.appendLine(`[${timestamp()}] Errored: ${error.message}`);
        }

        // Parse diagnostics.
        const diagnostics = [];
        for (const line of stderr.split("\n")) {
            outputChannel.appendLine(line);

            // Match regular expression.
            const match = line.match(/((?:[a-z]:)?[^:]+):([0-9]+):([0-9]+): (error|warning):(.*)/i);
            if (!match) {
                continue;
            }

            // Validate file.
            const file = match[1].replace(/\\\\/g, "\\");
            if (file !== document.uri.fsPath) {
                continue;
            }

            // Extract position.
            const lineno = Number.parseInt(match[2]) - 1;
            const columnno = Number.parseInt(match[3]);

            // Extract kind.
            let kind: vscode.DiagnosticSeverity;
            switch (match[4]) {
                case "error":
                    kind = vscode.DiagnosticSeverity.Error;
                    break;

                case "warning":
                    kind = vscode.DiagnosticSeverity.Warning;
                    break;

                default:
                    continue;
            }

            // Extract message.
            const message = "re2c: " + match[5].trim();

            // Push.
            diagnostics.push(
                new vscode.Diagnostic(
                    new vscode.Range(
                        new vscode.Position(lineno, columnno),
                        new vscode.Position(lineno, columnno + 1)
                    ),
                    message,
                    kind
                )
            );
        }

        // Set in collection.
        diagnosticCollection.set(document.uri, diagnostics);
    });
}

/** Clears diagnostics from the document. */
function resetDocument(document: vscode.TextDocument): void {
    diagnosticCollection.set(document.uri, undefined);
}

/** Extension activation event. */
export async function activate(context: vscode.ExtensionContext) {
    // Fetch registered languages.
    registeredLanguages = await vscode.languages.getLanguages();

    // Push context subscriptions.
    context.subscriptions.push(
        // Create the output channel.
        outputChannel = vscode.window.createOutputChannel("Code re2c", "log"),

        // Create the diagnostics collection.
        diagnosticCollection = vscode.languages.createDiagnosticCollection("re2c"),

        // Update event.
        vscode.workspace.onDidOpenTextDocument((document) => updateDocument(document, true)),
        vscode.workspace.onDidSaveTextDocument((document) => updateDocument(document, false)),

        // Reset event.
        vscode.workspace.onDidCloseTextDocument(resetDocument)
    );
}
