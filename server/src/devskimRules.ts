/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------
 *
 * This file contains the actual meat and potatoes of analysis.  The DevSkimWorker class does
 * the actual work of analyzing data it was given
 *
 * Most of the type declerations representing things like the rules used to analyze a file, and
 * problems found in a file, are in devskimObjects.ts
 *
 * ------------------------------------------------------------------------------------------ */
import * as fs from "fs";

const {promisify} = require('util');
const {glob} = require('glob-promise');
const readFile = promisify(fs.readFile);

import {IConnection} from 'vscode-languageserver';
import {
    DevskimRuleSeverity, Rule, IDevSkimSettings,
}
    from "./devskimObjects";
import {IRuleValidator} from "./ruleValidator";
import {DevSkimWorkerSettings} from "./devskimWorkerSettings";
import {DevSkimWorker} from "./devskimWorker";
import * as Path from "path";

/**
 * The bulk of the DevSkim analysis logic.  Loads rules in, exposes functions to run rules across a file
 */
export class DevSkimRules {
    public readonly rulesDirectory: string;
    private analysisRules: Rule[];


    constructor(private connection: IConnection, private settings: IDevSkimSettings, private ruleValidator: IRuleValidator) {
        this.rulesDirectory = DevSkimWorkerSettings.getRulesDirectory();
        this.loadRules();
    }


    /**
     * Reload the rules from the file system.  Since this right now is just a proxy for loadRules this *could* have been achieved by
     * exposing loadRules as public.  I chose not to, as eventually it might make sense here to check if an analysis is actively running
     * and hold off until it is complete.  I don't forsee that being an issue when analyzing an indivudal file (it's fast enoguh a race condition
     * should exist with reloading rules), but might be if doing a full analysis of a lot of files.  So in anticipation of that, I broke this
     * into its own function so such a check could be added.
     */
    public refreshAnalysisRules(): void {
        this.loadRules();
    }


    /**
     * recursively load all of the JSON files in the $userhome/.vscode/extensions/vscode-devskim/rules sub directories
     *
     * @private
     */
    private async loadRules(): Promise<void> {
        return null;
    }

    /**
     * Low, Defense In Depth, and Informational severity rules may be turned on and off via a setting
     * prior to running an analysis, verify that the rule is enabled based on its severity and the user settings
     *
     * @private
     * @param {DevskimRuleSeverity} ruleSeverity
     * @returns {boolean}
     *
     * @memberOf DevSkimWorker
     */
    public RuleSeverityEnabled(ruleSeverity: DevskimRuleSeverity): boolean {
        return ruleSeverity == DevskimRuleSeverity.Critical ||
            ruleSeverity == DevskimRuleSeverity.Important ||
            ruleSeverity == DevskimRuleSeverity.Moderate ||
            (ruleSeverity == DevskimRuleSeverity.BestPractice &&
                this.settings.enableBestPracticeRules == true) ||
            (ruleSeverity == DevskimRuleSeverity.ManualReview &&
                this.settings.enableManualReviewRules == true);
    }

    /**
     * maps the string for severity recieved from the rules into the enum (there is inconsistencies with the case used
     * in the rules, so this is case incencitive).  We convert to the enum as we do comparisons in a number of places
     * and by using an enum we can get a transpiler error if we remove/change a label
     *
     * @param {string} severity
     * @returns {DevskimRuleSeverity}
     *
     * @memberOf DevSkimWorker
     */
    public static MapRuleSeverity(severity: string): DevskimRuleSeverity {
        switch (severity.toLowerCase()) {
            case "critical":
                return DevskimRuleSeverity.Critical;
            case "important":
                return DevskimRuleSeverity.Important;
            case "moderate":
                return DevskimRuleSeverity.Moderate;
            case "best-practice":
                return DevskimRuleSeverity.BestPractice;
            case "manual-review":
                return DevskimRuleSeverity.ManualReview;
            default:
                return DevskimRuleSeverity.BestPractice;
        }
    }


}