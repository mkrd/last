////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Utils
////////////////////////////////////////////////////////////////////////////////

function parse_and_validate_substitutions(substitutions) {
    // Check substitution shortcuts for duplicates
    const shortcuts = substitutions.map(e => e[0])
    if (shortcuts.length !== [...new Set(shortcuts)].length) {
        throw new Error("Duplicate shortcuts")
    }

    return Object.fromEntries(substitutions)
}






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


function log(...args) {
    if (!lastcss.config.log) return
    console.log(...args)

}


function time(label) {
    if (!lastcss.config.log) return
    console.time(label)
}


function timeEnd(label) {
    if (!lastcss.config.log) return
    console.timeEnd(label)
}


function remove_with_numeric_ui_tag(elements) {
    return elements.filter(e => !e.getAttribute("ui").match(/^\d+$/))
}


let __counter = 0
function get_unique_id()
{
    const id = `${__counter}`
    __counter++
    return id
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


function remove_duplicates_keeping_last(array, key) {
    return [...new Map(array.map(x => [key(x), x])).values()]
}


/**
 * Takes a string of the format "css_property_name.value1.value2.<more_values>" and
 * converts it to an object of the format {property: "css_property_name", value: "value1 value2 ..." }
 */
function parse_dot_notation_to_object(style_dot_notation) {
    const split = style_dot_notation.split(".")
    const property = split[0]
    // Only replace dot if not in parentheses
    let value = split.slice(1).join(".")
    let parenthesis_is_open = false
    for (var i = 0; i < value.length; i++) {
        if (value[i] === "(") {
            parenthesis_is_open = true
            continue
        }
        if (value[i] === ")") {
            parenthesis_is_open = false
            continue
        }
        if (!parenthesis_is_open && value[i] === ".") {
            value = value.substring(0, i) + " " + value.substring(i + 1)
        }
    }

    return {
        property: property,
        value: value,
    }
}


function parse_ui_tag(ui_tag) {
    let style_components = [] // {property: <property>, value: <value>}
    for (const s of ui_tag.split(" ")) {
        // Case 1: shortcut like "pos.abs" or "button"
        if (s in lastcss.substitutions) {
            for (const e of lastcss.substitutions[s].split(" ")) {
                style_components.push(parse_dot_notation_to_object(e))
            }
            continue
        }
        // Case 2: shortcut like "m.<...>"
        let shortcut = s.split(".")[0]
        if (shortcut in lastcss.substitutions) {
            const expanded = lastcss.substitutions[shortcut] + s.substring(shortcut.length)
            for (const e of expanded.split(" ")) {
                style_components.push(parse_dot_notation_to_object(e))
            }
            continue
        }
        // Case 3: No substitution exists
        style_components.push(parse_dot_notation_to_object(s))
    }

    return remove_duplicates_keeping_last(style_components, e => e.property)
}


function apply_style_inline(elements) {
    for (const element of elements) {
        const ui_tag = element.getAttribute("ui")
        for (const { property, value } of parse_ui_tag(ui_tag)) {
            element.style[property] = value
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
        const ui_tag = element.getAttribute("ui")

        let style_str = ""
        for (const { property, value } of parse_ui_tag(ui_tag)) {
            style_str += `${property}:${value};`
        }

        if (style_str in styles) {
            styles[style_str].push(element)
        } else {
            styles[style_str] = [element]
        }
    }

    let style_str = Object.entries(styles).map(([style, style_elements], i) => {
        const id = get_unique_id()
        style_elements.map(e => e.setAttribute("ui", id))
        return `[ui="${id}"]{\n${style.split(";").join(";\n")}}`
    }).join("\n")

    var style = document.createElement('style')
    style.innerHTML = style_str
    document.head.appendChild(style)
}

// function create_ele_wrap(elements) {
//     let res = []
//     for (const element of elements) {
//         const ui_tag = element.getAttribute("ui")
//         res.push({
//             element: element,
//             ui_tag: ui_tag,
//             ui_props: ui_tag.split(" "),
//             ui_props_expanded: expand_shortcuts(ui_tag),

//         })
//     }
// }


function substitute_ui_attributes_with_css() {
    time("🟣🏁 Apply styles")

    // Get all elements with ui tag, including those in template elements
    let elements = querySelectorAllIncudingTemplates(document, "[ui]")
    elements = remove_with_numeric_ui_tag(elements)


    // Apply styles based on configured mode
    if (lastcss.config.mode === "global") {
        apply_style_global(elements)
    }
    else if (lastcss.config.mode === "inline") {
        apply_style_inline(elements)
    }

    timeEnd("🟣🏁 Apply styles")
}

export default {
    log,
    time,
    timeEnd,
    parse_and_validate_substitutions,
    dispatch,
    get_unique_id,
    querySelectorAllIncudingTemplates,
    apply_style_global,
    substitute_ui_attributes_with_css,
}
