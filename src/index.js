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


// Perform substitutions
apply_all()

dispatch(document, "last:initialized")
time("Last init")
