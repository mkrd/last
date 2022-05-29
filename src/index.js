import lastcss from "./lastcss"
import { log, time, timeEnd } from "./logging"
import utils from "./utils"


window.lastcss = lastcss

// Check if body exists
if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag")
}

log("🟣 Last: start init")

// Load
time("🟣 Last init")
utils.dispatch(document, "last:init")

// Parse and validate substitutions
lastcss.refresh = utils.apply_all


// Perform substitutions
utils.apply_all()

utils.dispatch(document, "last:initialized")
timeEnd("🟣 Last init")
