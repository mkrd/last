import lastcss from "./lastcss"
import { log, time, dispatch } from "./tools"
import { apply_all } from "./utils"


window.lastcss = lastcss

// Check if body exists
if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag")
}

log("🟣 Last: start init")

// Load
time("Last init")

dispatch(document, "last:init")

// Parse and validate substitutions
lastcss.refresh = apply_all
// Here, a MutationObserver could be created to run apply_all when any ui tag changes
// apply_all should keep track of the current styles state and only apply changes when
// the set of css rules actually changes

// Perform substitutions
apply_all()

dispatch(document, "last:initialized")
time("Last init")
