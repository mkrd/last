import lastcss from "./lastcss"
import { log, time, dispatch_event } from "./tools"
import { apply_all, on_mutation } from "./utils"


window.lastcss = lastcss

// Check if body exists
if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag")
}

log("🟣 Last: start init")

// Load
time("Last init")

dispatch_event(document, "last:init")


// Perform substitutions
apply_all()

// Register MutationObserver
window.last_css_observer = new MutationObserver(on_mutation)
window.last_css_observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["ui"],
    attributeOldValue: true,
})

dispatch_event(document, "last:initialized")
time("Last init")
