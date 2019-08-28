/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ 
 * 
 * This file contains the object and enumeration definitions for DevSkim Rules (the logic to 
 * find an issue), Problems (a specific part of the code in which a rule triggered on), and 
 * fixes for problems (instructions to VS Code on how to transform problematic code into safe code)
 * 
 *  ------------------------------------------------------------------------------------------ */

import
{
	Diagnostic, DiagnosticSeverity, Range,
} from 'vscode-languageserver';

import { DevSkimWorkerSettings } from "./devskimWorkerSettings";
import {GitRepoInfo } from 'git-repo-info';

/**
 * A collection of data about a run in a folder containing .git info and all the files under it.
 * If DevSkim was run on a folder structure without .git info, there should only be one run with the top level folder
 * Used in the CLI but not the IDE
 */
export class Run
{

     /**
      * Create a run object
      * @param directoryInfo Info for the highest level directory this analysis took place in
      * @param rules the active rules used in this analysis run
      * @param files all the files scanned by the run, even if no issues were detected
      * @param problems all of the findings from this run
      */
    constructor(public directoryInfo : DirectoryInfo, 
                public rules : Rule[], 
                public files : FileInfo[],
                public problems : DevSkimProblem[]  )
    {
        
    }
}

// These are the example settings defined in the client's package.json
export interface IDevSkimSettings
{
	enableBestPracticeRules: boolean;
	enableManualReviewRules: boolean;
	guidanceBaseURL: string;
	ignoreFilesList: string[];
	ignoreRulesList: string[];
	manualReviewerName: string;
	removeFindingsOnClose: boolean;
	suppressionDurationInDays: number;
	suppressionCommentStyle: string;
	suppressionCommentPlacement: string;
	validateRulesFiles: boolean;
	logToConsole : boolean;
}

export class DevSkimSettings implements IDevSkimSettings
{
	enableBestPracticeRules: boolean = false;
	enableManualReviewRules: boolean = false;
	guidanceBaseURL: string = '';
	ignoreFilesList: string[] = [];
	ignoreRulesList: string[] = [];
	manualReviewerName: string = '';
	removeFindingsOnClose: boolean = false;
	suppressionDurationInDays: number = 0;
	suppressionCommentStyle : string = "line";
	suppressionCommentPlacement : string = "same line as finding";
	validateRulesFiles: boolean = false;
	logToConsole : boolean = false;
}

export interface FileInfo
{
	fileURI : string;
	sourceLanguage : string;
	fileSize : number;
	sha256hash : string;
	sha512hash : string;
}

export interface DirectoryInfo
{
	directoryPath : string;
	gitRepo : string;
	gitInfo : GitRepoInfo;
}

/**
 * An Interface corresponding to the Pattern section of the JSON
 * rules files.  The pattern is used to match a problem within the source
 * 
 * @export
 * @interface Pattern
 */
export interface Pattern
{
	pattern: string;
	type: string;
	modifiers?: string[];
	scopes?: string[];
	_comment?: string;
}

/**
 * An Interface corresponding to the lambda section of the JSON
 * rules files.  This object can only be used within conditions, and
 * is an alternative to pattern
 * 
 * @export
 * @interface Lambda
 */
export interface Lambda
{
	lambda_code: string;
	_comment?: string;
}


/**
 * An Interface corresponding to the FixIt section of the JSON
 * rules files.  The FixIt contains the instructions to translate a flagged piece
 * of code into a preferred alternative
 * 
 * @export
 * @interface FixIt
 */
export interface FixIt
{
	type: string;
	name: string;
	pattern: Pattern;
	replacement: string;
	_comment?: string;
}


/**
 * An Interface corresponding to an individual rule within the JSON
 * rules files.  The rule definition includes how to find the problem (the patterns),
 * description of the problem, text on how to fix it, and optionally an automated fix ( Fix_it)
 * 
 * @export
 * @interface Rule
 */
export interface Rule
{
	id: string;
	overrides?: string[];
	name: string;
	active: boolean;
	tags: string[];
	applies_to?: string[];
	severity: string;
	description: string;
	recommendation: string;
	ruleInfo: string;
	patterns: Pattern[];
	conditions?: Condition[];
	fix_its?: FixIt[];
	filepath?: string; //filepath to the rules file the rule came from
	_comment?: string;
}

export interface Condition
{
	pattern: Pattern;
	lambda: Lambda;
	search_in: string;
	_comment?: string;
	negateFinding?: boolean;

}


/**
 * A Key/Object collection, used to associate a particular fix with a diagnostic and the file it is located in
 * 
 * @export
 * @interface Map
 * @template V
 */
export interface Map<V>
{
	[key: string]: V;
}


/**
 * An object to represent a fix at a particular line of code, including which revision of a file it applies to
 * 
 * @export
 * @interface AutoFix
 */
export interface AutoFix
{
	label: string;
	documentVersion: number;
	ruleId: string;
	edit: DevSkimAutoFixEdit;
}

/**
 * the specific technical details of a fix to apply 
 * 
 * @export
 * @interface DevSkimAutoFixEdit
 */
export interface DevSkimAutoFixEdit
{
	range: Range;
	fixName?: string;
	text: string;
}


/**
 * The nomenclature for DevSkim severities is based on the MSRC bug bar.  There are  
 * many different severity ranking systems and nomenclatures in use, and no clear "best"
 * so since this project was started by Microsoft employees the Microsoft nomenclature was
 * chosen
 * 
 * @export
 * @enum {number}
 */
export enum DevskimRuleSeverity
{
	Critical,
	Important,
	Moderate,
	BestPractice,
	WarningInfo,
	ManualReview,
	// this isn't actually an error level in rules, but used when flagging
	// DS identifiers in suppression and other comments
}

/**
 * A class to represent a finding at a particular line of code
 * 
 * @export
 * @class DevSkimProblem
 */
export class DevSkimProblem
{
	public range: Range;
	public source: string;
	public severity: DevskimRuleSeverity;
	public ruleId: string; //the id in the rules JSON files
	public message: string; //a description of the problem
	public issueURL: string; //url for more info on the issue
	public replacement: string; //text on how to deal with the problem, intended to guide the user
	public fixes: DevSkimAutoFixEdit[]; //fixes for the issue discovered
	public suppressedFindingRange: Range; //if there is a suppression comment, the range for that comment
	public filePath: string; //the location of the file the finding was discovered in
	public overrides: string[]; //a collection of ruleIDs that this rule supersedes
	public snippet: string; //the offending code snippet that the problem is located in

    /**
     * Creates an instance of DevSkimProblem.
     * 
     * @param {string} message guidance to display for the problem (description in the rules JSON)
     * @param {string} source the name of the rule that was triggered (name in the rules JSON)
     * @param {string} ruleId a unique identifier for that particular rule (id in the rules JSON)
     * @param {string} severity MSRC based severity for the rule - Critical, Important, Moderate, Low, Informational (severity in rules JSON)
     * @param replacement @todo update this
     * @param {string} issueURL a URL to some place the dev can get more information on the problem (rules_info in the rules JSON)
     * @param {Range} range where the problem was found in the file (line start, column start, line end, column end) 
     */
	constructor(message: string, source: string, ruleId: string, severity: DevskimRuleSeverity, replacement: string, issueURL: string, range: Range, snippet : string)
	{
		this.fixes = [];
		this.overrides = [];
		this.message = (message !== undefined && message.length > 0) ? message : "";
		this.source = (source !== undefined && source.length > 0) ? source : "";
		this.ruleId = (ruleId !== undefined && ruleId.length > 0) ? ruleId : "";
		this.issueURL = (issueURL !== undefined && issueURL.length > 0) ? issueURL : "";
		this.replacement = (replacement !== undefined && replacement.length > 0) ? replacement : "";
		this.range = (range !== undefined) ? range : Range.create(0, 0, 0, 0);
		this.severity = severity;
		this.suppressedFindingRange = null;
		this.snippet = snippet;
	}

	/**
	 * Shorten the severity name for output
	 * 
	 * @param {DevskimRuleSeverity} severity the current enum value for the severity we are converting
	 * @returns {string} short name of the severity rating
	 * 
	 * @memberOf DevSkimProblem
	 */
	public static getSeverityName(severity: DevskimRuleSeverity): string
	{
		switch (severity)
		{
			case DevskimRuleSeverity.Critical: return "[Critical]";
			case DevskimRuleSeverity.Important: return "[Important]";
			case DevskimRuleSeverity.Moderate: return "[Moderate]";
			case DevskimRuleSeverity.ManualReview: return "[Review]";
			default: return "[Best Practice]";
		}
	}

    /**
     * Converts the MSRC based rating (Critical, Important, Moderate, Low, Informational) into a VS Code Warning level
     * Critical/Important get translated as Errors, and everything else as a Warning
     * 
     * @returns {DiagnosticSeverity}
     */
	public getWarningLevel(): DiagnosticSeverity
	{
		//mark any optional rule, or rule that is simply informational as a warning (i.e. green squiggle)
		switch (this.severity)
		{
			case DevskimRuleSeverity.WarningInfo:
			case DevskimRuleSeverity.ManualReview: return DiagnosticSeverity.Information;

			case DevskimRuleSeverity.BestPractice: return DiagnosticSeverity.Warning;

			case DevskimRuleSeverity.Moderate:
			case DevskimRuleSeverity.Important:
			case DevskimRuleSeverity.Critical:
			default: return DiagnosticSeverity.Error;
		}
	}

    /**
     * Make a VS Code Diagnostic object from the information in this DevSkim problem
     * 
     * @returns {Diagnostic}
     */
	public makeDiagnostic(dswSettings: DevSkimWorkerSettings): Diagnostic
	{
		const diagnostic: Diagnostic = Object.create(null);
		let fullMessage =
			`${this.source}\nSeverity: ${DevSkimProblem.getSeverityName(this.severity)}\n\n${this.message}`;

		fullMessage = (this.replacement.length > 0) ?
			fullMessage + "\n\nFix Guidance: " + this.replacement :
			fullMessage;

		fullMessage = (this.issueURL.length > 0) ?
			fullMessage + "\n\nMore Info:\n" + dswSettings.getSettings().guidanceBaseURL + this.issueURL + "\n" :
			fullMessage;

		diagnostic.message = fullMessage;
		diagnostic.code = this.ruleId;
		diagnostic.source = "Devskim: Finding " + this.ruleId;
		diagnostic.range = this.range;
		diagnostic.severity = this.getWarningLevel();

		return diagnostic;
	}
}

/**
 * this creates a unique key for a diagnostic & code fix combo (i.e. two different code fixes for the same diagnostic get different keys)
 * used to correlate a code fix with the line of code it is supposed to fix, and the problem it should fix
 * 
 * @export
 * @param {Range} range the location of an issue within a document
 * @param {number} diagnosticCode the code value in a Diagnostic, or similar numeric ID
 * @returns {string} a unique key identifying a diagnostics+fix combination
 */
export function computeKey(range: Range, diagnosticCode: string | number): string
{
	return `[${range.start.line},${range.start.character},${range.end.line},${range.end.character}]-${diagnosticCode}`;
}


/**
 * Class of Code Fixes corresponding to a line of code
 * 
 * @export
 * @class Fixes
 */
export class Fixes
{
	private keys: string[];

	constructor(private edits: Map<AutoFix>)
	{
		this.keys = Object.keys(edits);
	}

	public static overlaps(lastEdit: AutoFix, newEdit: AutoFix): boolean
	{
		return !!lastEdit && lastEdit.edit.range[1] > newEdit.edit.range[0];
	}

	public isEmpty(): boolean
	{
		return this.keys.length === 0;
	}

	public getDocumentVersion(): number
	{
		return this.edits[this.keys[0]].documentVersion;
	}

	public getScoped(diagnostics: Diagnostic[]): AutoFix[]
	{
		let result: AutoFix[] = [];
		for (let diagnostic of diagnostics)
		{
			let key = computeKey(diagnostic.range, diagnostic.code);
			let x = 0;
			let editInfo: AutoFix = this.edits[key + x.toString(10)];
			while (editInfo)
			{
				result.push(editInfo);
				x++;
				editInfo = this.edits[key + x.toString(10)];
			}
		}
		return result;
	}

	public getAllSorted(): AutoFix[]
	{
		let result = this.keys.map(key => this.edits[key]);
		return result.sort((a, b) =>
		{
			let d = a.edit.range[0] - b.edit.range[0];
			if (d !== 0)
			{
				return d;
			}
			if (a.edit.range[1] === 0)
			{
				return -1;
			}
			if (b.edit.range[1] === 0)
			{
				return 1;
			}
			return a.edit.range[1] - b.edit.range[1];
		});
	}

	public getOverlapFree(): AutoFix[]
	{
		let sorted = this.getAllSorted();
		if (sorted.length <= 1)
		{
			return sorted;
		}
		let result: AutoFix[] = [];
		let last: AutoFix = sorted[0];
		result.push(last);
		for (let i = 1; i < sorted.length; i++)
		{
			let current = sorted[i];
			if (!Fixes.overlaps(last, current))
			{
				result.push(current);
				last = current;
			}
		}
		return result;
	}
}






