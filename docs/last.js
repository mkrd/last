(function () {
"use strict"

// TODO: use esbuild and node with live reload
// TODO: Fix problem with multiple consecutive spaces in ui tag
// TODO: In expanded ui styles, remove duplicate style by the property name, keeping the last one
// TODO: Add support for modifiers, eg. <div ui:hover="border-radius.30px"> and <div ui:dark="background-color.#222">
// TODO: Make it easy to add new styles to the ui styles

let lastcss = {
    config: {
        mode: "global" // global, inline
    },
}


////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Substitutions
////////////////////////////////////////////////////////////////////////////////

const __substitutions = [
    // Margin
    ["m", "margin"],
    ["mt", "margin-top"],
    ["mb", "margin-bottom"],
    ["ml", "margin-left"],
    ["mr", "margin-right"],
    // Padding
    ["p", "padding"],
    ["pt", "padding-top"],
    ["pb", "padding-bottom"],
    ["pl", "padding-left"],
    ["pr", "padding-right"],
    // Flex
    ["flex", "display.flex"],
    ["flow", "display.flex flex-flow"],
    ["justify-content", "display.flex justify-content"],
    ["align-items", "display.flex align-items"],
    ["align-content", "display.flex align-content"],
    ["grow", "flex-grow"],
    ["shrink", "flex-shrink"],
    // Sizing
    ["w", "width"],
    ["h", "height"],
    ["min-w", "min-width"],
    ["min-h", "min-height"],
    ["max-w", "max-width"],
    ["max-h", "max-height"],
    // Positioning
    ["pos", "position"],
    ["pos.abs", "position.absolute"],
    ["pos.rel", "position.relative"],
    ["t", "top"],
    ["b", "bottom"],
    ["l", "left"],
    ["r", "right"],
    ["z", "z-index"],
    // Custom Components
    ["button", "background-color.var(--ui-primary-color) color.#fff border.none padding.10px border-radius.5px font-size.16px font-weight.bold cursor.pointer"],
]






function parse_and_validate_substitutions(substitutions) {
    // Check substitution shortcuts for duplicates
    const shortcuts = substitutions.map(e => e[0])
    if (shortcuts.length !== [...new Set(shortcuts)].length) {
        throw new Error("Duplicate shortcuts")
    }
    return Object.fromEntries(substitutions)
}

////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Utils
////////////////////////////////////////////////////////////////////////////////

function dispatch(el, name, detail = {}) {
    el.dispatchEvent(
        new CustomEvent(name, {
            detail,
            bubbles: true,
            // Allows events to pass the shadow DOM barrier.
            composed: true,
            cancelable: true,
        })
    )
}


/**
 * Like querySelectorAll, but also returns all elements inside <template> tags.
 * Unlike querySelectorAll, this function returns an array, not a NodeList.
 */
function querySelectorAllIncudingTemplates(root, selector) {
    let res = [...root.querySelectorAll(selector)]
    const templates = root.querySelectorAll("template")
    for (const t of templates) {
        res = res.concat([...t.content.querySelectorAll(selector)])
    }
    return res
}


function remove_duplicates_fast(a) {
    var seen = {}
    var out = []
    var len = a.length
    var j = 0
    for (var i = 0; i < len; i++) {
        var item = a[i]
        if (seen[item] !== 1) {
            seen[item] = 1
            out[j++] = item
        }
    }
    return out
}


/**
 * Takes a string of the format "css_property_name.value1.value2.<more_values> css_property_name.value1.value2.<more_values> ..." and
 * converts it to a list of the format [{name : "value1 value2 <more_values>", name: "value1 value2 <more_values>"}]
 *
 */
function parse_ui_expanded_styler(ui_expanded_styler) {
    let res = []
    for (const style of ui_expanded_styler.split(" ")) {
        res.push({
            name: style.split(".")[0],
            value: style.split(".").slice(1).join(" ")
        })
    }
    console.log("parse_ui_expanded_styler", res)
    return res
}


function expand_shortcuts(ui_styler) {
    let res = new Set()
    for (const s of ui_styler.split(" ")) {
        console.log("-",s, "-", s in lastcss.substitutions)

        let shortcut = s.split(".")[0]
        // Case 1: shortcut like "pos.abs"
        if (s in lastcss.substitutions) {
            res.add(lastcss.substitutions[s])
        }
        // Case 2: shortcut like "m.<...>"
        else if (shortcut in lastcss.substitutions) {
            const expanded = lastcss.substitutions[shortcut] + s.substring(shortcut.length)
            for (const e of expanded.split(" ")) {
                res.add(e)
            }
        }
        // Case 3: No substitution exists
        else {
            res.add(s)
        }
    }

    // Return string of unique css properties
    return [...res].join(" ")
}


function apply_style_inline(elements) {
    for(const element of elements) {
        const ui_styler = element.getAttribute("ui")
        const ui_expanded_styler = expand_shortcuts(ui_styler)
        for (const { name, value } of parse_ui_expanded_styler(ui_expanded_styler)) {
            element.style[name] = value
        }
        element.removeAttribute("ui")
    }
}

/**
 * Generate a style selector for every used ui tag element.
 * Problematic: The order in the ui tag is not guaranteed.
 * The elements further to the right in the ui tag should overwrite elements further to the left.
 */
function apply_style_global(elements) {
    let styles = {}

    for (const element of elements) {
        const ui_styler = element.getAttribute("ui")

        let style_str = ""
        for (const { name, value } of parse_ui_expanded_styler(expand_shortcuts(ui_styler))) {
            style_str += `${name}:${value};`
        }

        if (style_str in styles) {
            styles[style_str].push(element)
        } else {
            styles[style_str] = [element]
        }
    }

    let style_str = Object.entries(styles).map(([style, style_elements], i) => {
        style_elements.map(e => e.setAttribute("ui", i))
        return `[ui="${i}"]{\n${style.split(";").join(";\n")}}`
    }).join("\n")

    var style = document.createElement('style')
    style.innerHTML = style_str
    document.head.appendChild(style)
}


function substitute_ui_attributes_with_css() {
    // Get all elements with ui tag, including those in template elements
    let elements = querySelectorAllIncudingTemplates(document, "[ui]")
    // Apply styles based on configured mode
    if (lastcss.config.mode === "global") {
        apply_style_global(elements)
    }
    else if (lastcss.config.mode === "inline") {
        apply_style_inline(elements)
    }
}


////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Register object and queue init task
////////////////////////////////////////////////////////////////////////////////

window.lastcss = lastcss

// Check if body exists
if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag")
}

console.log("🟣 Last: start init")

// Load
console.time("🟣 Last init")
dispatch(document, "last:init")

// Parse and validate substitutions
lastcss.substitutions = parse_and_validate_substitutions(__substitutions)

// Perform substitutions
substitute_ui_attributes_with_css()

dispatch(document, "last:initialized")
console.timeEnd("🟣 Last init")

})()
