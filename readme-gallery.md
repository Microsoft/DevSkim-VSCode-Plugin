# README

DevSkim is a framework of IDE plugins and Language analyzers that provide inline security analysis in the dev environment as the developer writes code. It is designed to work with multiple IDEs (VS, VS Code, Sublime Text, etc.), and has a flexible rule model that supports multiple programming languages. The idea is to give the developer notification as they are introducing a security vulnerability in order to fix the issue at the point of introduction, and to help build awareness for the developer.

## PUBLIC PREVIEW

DevSkim is currently in public preview. We're looking forward to working with the community to improve both the scanning engines and rules over the next few months, and welcome your feedback and contributions! You can find us at [Github](https://github.com/Microsoft/DevSkim)

## Usage

As a developer codes DevSkim will flag certain security issues and call attention to them with errors or warnings (depending on a very generalized estimation of the severity).  Mousing over the issue will show a description of the problem and how to address it, and a link to more information.  For some issues, one or more safe alternatives are available in the light bulb menu so that the issue can be fixed with a couple mouse clicks.  For issues where the alternative has different parameters than the unsafe API that is called out, guidance for the parameters will be inserted in the form of \<some guidance info\>  (example, when DevSkim turns gets() into fgets() it adds \<size of firstparamname\> to cue a user that they need to provide the size of the buffer).

![screenshot of devskim](https://github.com/Microsoft/DevSkim-VSCode-Plugin/raw/master/vsc-example.gif)

### Suppressions

DevSkim has built in the ability to suppress any of its warnings, either permanently, or for a period of time.  The permanent Suppressions are for scenarios where, for whatever reason, the flagged code shouldn't be changed.  Timed Suppressions are for scenarios where the code should change, but the developer doesn't want to change it right now.  In both cases, DevSkim will insert a comment after the code to notify it (and anyone reviewing the code) that the usage should be ignored, and in the case of timed suppressions, when DevSkim should alert of the usage again.  Users can add additional comments after the suppression to describe why the issue is being suppressed.

For timed suppressions, the default period is 30 days, but this can be adjusted in the settings file.

Suppressions can be accessed from the light bulb menu.  Once a suppression is added, DevSkim will highlight the issue number that identifies the check being suppressed (the gets() example above is issue number DS181021 for example), and mousing over will provide details.  This will let other contributors to a project know what was suppressed, so that they aren't confused by the comment

![screenshot of devskim suppression](https://github.com/Microsoft/DevSkim-VSCode-Plugin/raw/master/vsc-suppression-example.png)

### Code Reviews

Most of DevSkim's rules are meant to be used by all developers, flagging programming practices that are generally bad for security.  For example,the hashing function SHA-1 is broken, so generally should never be used.  There are some scenarios where the security relevance is not as clear cut.  For example, many dynamic languages support some form of eval() to create code on the fly.  If an
attacker can get their data into the eval function, they can get their own code created, but if there isn't a clear path for an attacker to manipulate the contents of eval() it is probably ok.  For scenarios such as this, DevSkim is conservative and by default won't alert to the usage.  However, if the user turns on the Manual Review rules in settings they will start seeing issues that take a bit of analysis to determine whether the usage is safe or dangerous.  The intent is to make manual security code reviews a bit easier, by calling attention to *potentially* dangerous code.  When the reviewer deems the code safe they can click on the light bulb menu and mark it as reviewed. Similar to suppressions, DevSkim will no longer flag that usage, but will highlight the issue number in its comment so that other people seeing the comment can understand what was reviewed.

There is also a DevSkim setting to set the reviewer name (person's name, or github handle, etc.).  If set, DevSkim will mark that the code was reviewed by that specific person.

![screenshot of devskim code reviews](https://github.com/Microsoft/DevSkim-VSCode-Plugin/raw/master/vsc-review-example.png)

## Programming Language Support

DevSkim takes an approach that is programming language agnostic.  At this stage, it primarily finds issues via regular expression, so rules can be written for just about any programming language.  Out of the box DevSkim can find dangerous crypto usage in most programming languages and has regular expressions for language specific issues for C/C++, Java, C#, JavaScript, PHP, and a number of other languages.  We are growing  our built in ruleset regularly, but we have also tried to make it very easy for people to write their own rules.  All it requires is a passable knowledge of regular expressions and json.  Details can be found [on our Github wiki](https://github.com/Microsoft/DevSkim/wiki/Writing-Rules)

## Thank You

Thanks for trying DevSkim.  Its a work in progress.  If you find issues please [report them on Github](https://github.com/Microsoft/DevSkim-VSCode-Plugin/) and feel free to contribute!
