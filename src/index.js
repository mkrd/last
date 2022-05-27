import lastcss from "./lastcss"
import utils from "./utils"
import substitutions from "./substitutions"


window.lastcss = lastcss

// Check if body exists
if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag")
}

console.log("🟣 Last: start init")

// Load
console.time("🟣 Last init")
utils.dispatch(document, "last:init")

// Parse and validate substitutions
lastcss.substitutions = utils.parse_and_validate_substitutions(substitutions)

// Perform substitutions
utils.substitute_ui_attributes_with_css()

utils.dispatch(document, "last:initialized")
console.timeEnd("🟣 Last init")
