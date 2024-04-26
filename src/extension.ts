/*─ extension.ts ─────────────────────────────────────────────────────────────*
  Code re2c extension code.
 *────────────────────────────────────────────────────────────────────────────*
  Copyright (c) 2024 Deimonn (a.k.a. Nahuel S. Cisterna)

  This file is licensed under the MIT License.

  See https://raw.githubusercontent.com/deimonn/code-re2c/master/LICENSE for
  license information.
 *────────────────────────────────────────────────────────────────────────────*/

import child_process = require("child_process")

import * as vscode from "vscode"

/** Output channel for debugging. */
let outputChannel: vscode.OutputChannel
/** Diagnostics collection. */
let activeDiagnostics: vscode.DiagnosticCollection

/** Fetch string timestamp for logging. */
function timestamp() {
    return new Date().toISOString()
}

/** Lint and publish diagnostics for re2c code. */
function publishDiagnostics(document: vscode.TextDocument) {
    // Figure out language.
    let lang: string
    if (document.languageId === "c" || document.languageId === "cpp") {
        lang = "c"
    } else if (document.languageId === "go") {
        lang = "go"
    } else if (document.languageId === "rust") {
        lang = "rust"
    } else {
        return
    }

    // Fetch configuration.
    const configuration = vscode.workspace.getConfiguration("code-re2c")
    const re2c = configuration.get<string>("re2c.path") ?? "re2c"
    const args = configuration.get<string[]>("re2c.arguments") ?? ["-W"]

    // Push language and path arguments.
    args.push("--lang", lang)
    args.push(document.uri.fsPath)

    // Execute `re2c` with the given arguments.
    outputChannel.appendLine(
        `[${timestamp()}] Executing '${re2c}' with args: ${args.join(" ")}`
    )

    child_process.execFile(re2c, args, (error, _, stderr) => {
        // Check for error.
        if (error) {
            outputChannel.appendLine(
                `[${timestamp()}] error: ${error.message}`
            )

            return
        }

        // Parse diagnostics.
        const diagnostics: vscode.Diagnostic[] = []
        for (const line of stderr.split("\n")) {
            outputChannel.appendLine(line)

            // Match regular expression.
            const match = line.match(
                /((?:[a-z]:)?[^:]+):([0-9]+):([0-9]+): (error|warning): (.*)/i
            )

            if (!match) {
                continue
            }

            // Validate file.
            const file = match[1].replace(/\\\\/g, "\\")
            if (file !== document.uri.fsPath) {
                return
            }

            // Extract position.
            const lineno = Number.parseInt(match[2]) - 1
            const columnno = Number.parseInt(match[3])

            // Extract kind.
            const kind = match[4] === "error"
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning

            // Extract message.
            const message = "re2c: " + match[5]

            // Push.
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(
                new vscode.Position(lineno, columnno),
                new vscode.Position(lineno, columnno + 1)
            ), message, kind))
        }

        // Set in collection.
        activeDiagnostics.set(document.uri, diagnostics)
    })
}

/** Clear diagnostics for re2c code. */
function clearDiagnostics(document: vscode.TextDocument) {
    if (!document.languageId.match(/^(c|cpp|go|rust)$/)) {
        return
    }

    activeDiagnostics.set(document.uri, undefined)
}

/** Extension activation. */
export function activate(context: vscode.ExtensionContext) {
    // Push context subscriptions.
    context.subscriptions.push(
        // Create the output channel.
        outputChannel = vscode.window.createOutputChannel("Code re2c", "log"),

        // Create the diagnostics collection.
        activeDiagnostics = vscode.languages.createDiagnosticCollection("re2c"),

        // Linting for re2c code blocks.
        vscode.workspace.onDidOpenTextDocument(publishDiagnostics),
        vscode.workspace.onDidSaveTextDocument(publishDiagnostics),
        vscode.workspace.onDidCloseTextDocument(clearDiagnostics)
    )
}

/** Extension deactivation. */
export function deactivate() {
    return undefined
}
