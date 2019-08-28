/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ 
 * 
 * This file contains a wrapper for the settings interface, providing additional utility functions
 * 
 * ------------------------------------------------------------------------------------------ */
import { IDevSkimSettings } from "./devskimObjects";
import * as path from "path";
import { DebugLogger } from "./utility_classes/logger";
import { isArray } from 'util';


/**
 * Wrapper class for IDevSkimSettings interface, providing additional functionality on top of the
 * raw data structure in the interface
 */
export class DevSkimWorkerSettings
{

    private settings: IDevSkimSettings;

    /**
     * Update the settings used by this object.  If the incoming object has invalid values for any field
     * those values will be replaced with the defaults.  This is useful if only wanting to update 
     * some settings from the defaults (for example, when running from the CLI)
     * @param settings the new settings
     */ 
    public setSettings(settings: IDevSkimSettings)
    {
        let defaults : IDevSkimSettings = DevSkimWorkerSettings.defaultSettings();

        //validating the incoming settings, and replace with defaults for fields that don't validate
        settings.enableBestPracticeRules = (settings.enableBestPracticeRules != undefined && settings.enableBestPracticeRules != null) ?
                                            settings.enableBestPracticeRules : defaults.enableBestPracticeRules;

        settings.enableManualReviewRules = (settings.enableManualReviewRules != undefined && settings.enableManualReviewRules != null) ?
                                            settings.enableManualReviewRules : defaults.enableManualReviewRules;      
        
        settings.guidanceBaseURL = (settings.guidanceBaseURL != undefined && settings.guidanceBaseURL != null && settings.guidanceBaseURL.length > 0) ?
                                            settings.guidanceBaseURL : defaults.guidanceBaseURL;       

        settings.suppressionCommentStyle = (settings.suppressionCommentStyle != undefined && settings.suppressionCommentStyle != null && (settings.suppressionCommentStyle == "line" || settings.suppressionCommentStyle == "block")) ?
                                            settings.suppressionCommentStyle : defaults.suppressionCommentStyle;    
                                            
        settings.suppressionDurationInDays = (settings.suppressionDurationInDays != undefined && settings.suppressionDurationInDays != null  && settings.suppressionDurationInDays > -1) ?
                                            settings.suppressionDurationInDays : defaults.suppressionDurationInDays;     
                                            
        settings.ignoreFilesList = (settings.ignoreFilesList != undefined && settings.ignoreFilesList != null && isArray(settings.ignoreFilesList)) ?
                                            settings.ignoreFilesList : defaults.ignoreFilesList;  
                                            
        settings.ignoreRulesList = (settings.ignoreRulesList != undefined && settings.ignoreRulesList != null && isArray(settings.ignoreRulesList)) ?
                                            settings.ignoreRulesList : defaults.ignoreRulesList;      
                                            
        settings.manualReviewerName = (settings.manualReviewerName != undefined && settings.manualReviewerName != null && settings.manualReviewerName.length > 0) ?
                                            settings.manualReviewerName : defaults.manualReviewerName;   
                                            
        settings.removeFindingsOnClose = (settings.removeFindingsOnClose != undefined && settings.removeFindingsOnClose != null) ?
                                            settings.removeFindingsOnClose : defaults.removeFindingsOnClose ;     
                                            
        settings.validateRulesFiles = (settings.validateRulesFiles != undefined && settings.validateRulesFiles != null) ?
                                            settings.validateRulesFiles : defaults.validateRulesFiles ;   
                                            
        settings.logToConsole = (settings.logToConsole != undefined && settings.logToConsole != null) ?
                                            settings.logToConsole : defaults.logToConsole ;                                              
                                            
        this.settings = settings;
    }

    /**
     * Get the current settings for this object
     * @returns {DevSkimProblem[]} the current settings
     */
    public getSettings(): IDevSkimSettings
    {
        if (this.settings)
        {
            return this.settings;
        }
        if (!this.settings)
        {
            this.settings = DevSkimWorkerSettings.defaultSettings();
        }
        return this.settings;
    }

    /**
     * Determine where the rules live, given the executing context of DevSkim (CLI, IDE, etc.)
     * @param logger The logger object to use for message logging
     * @return the directory rules should be loaded from
     */
    public static getRulesDirectory(logger: DebugLogger): string
    {
        const configRulesDir = DevSkimWorkerSettings.getRulesDirectoryFromEnvironment();
        const rulesDir = configRulesDir || path.join(__dirname, "../data/rules");
        logger.log(`DevSkimWorkerSettings: getRulesDirectory - ${rulesDir}`);
        return rulesDir;
    }

    /**
     * generate a default settings object for scenarios where the settings may not be available
     * e.g. for the CLI, or on first startup before the IDE configuration has synced
     * @return a settings object with the same defaults as set in the root package.json for the IDE
     */
    public static defaultSettings(): IDevSkimSettings
    {
        return {
            enableBestPracticeRules: false,
            enableManualReviewRules: true,
            guidanceBaseURL: "https://github.com/Microsoft/DevSkim/blob/master/guidance/",
            ignoreFilesList: [
                "out/*",
                "bin/*",
                "node_modules/*",
                ".vscode/*",
                "*.lock",
                "*-lock",
                "logs/*",
                "*.log",
                "*.git",
                "*.sarif",
                ".cache/*",
                "NuGet/*",
                "*.exe",                
                "tests/*",
                "test/*",
                "_tests_/*",
                "_mocks_/*",
                "*.test",
                "rulesValidationLog.json",
            ],
            ignoreRulesList: [],
            manualReviewerName: "",
            removeFindingsOnClose: true,
            suppressionDurationInDays: 30,
            suppressionCommentStyle: "line",
            suppressionCommentPlacement : "same line as finding",
            validateRulesFiles: false,
            logToConsole: false
        };
    }

    /**
     * Extract the potential rules directory from the process environment
     * @return the directory if it can be intuited from the environment, otherwise null
     */
    public static getRulesDirectoryFromEnvironment(): string | null
    {
        const { DEV_SKIM_RULES_DIRECTORY } = process.env;

        let value = null;

        // When DEV_SKIM_RULES_DIRECTORY is not defined and assigned
        if ((typeof DEV_SKIM_RULES_DIRECTORY === 'string') && DEV_SKIM_RULES_DIRECTORY !== 'undefined')
        {
            value = DEV_SKIM_RULES_DIRECTORY;
        }

        // When DEV_SKIM_RULES_DIRECTORY is defined but not assigned
        if (typeof DEV_SKIM_RULES_DIRECTORY === 'string' && DEV_SKIM_RULES_DIRECTORY === "undefined")
        {
            value = null;
        }

        // When DEV_SKIM_RULES_DIRECTORY is undefined
        if (typeof DEV_SKIM_RULES_DIRECTORY === 'undefined')
        {
            value = null;
        }
        return value;
    }
}
