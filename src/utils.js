import { log, time, intersect, get_unique_id } from "./tools"

////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Utils
////////////////////////////////////////////////////////////////////////////////

/**
 * It removes elements from a list that have a "ui" attribute that is a number
 * @param {Element[]} elements - The elements to filter.
 * @returns {Element[]} The elements that do not have a ui attribute that is a number.
 */
function filter_elements_with_number_ui_attr(elements) {

    let filtered = []

    for (const e of elements) {
        const split = e.getAttribute("ui").split(" ")
        let found_match = false
        for (const part of split) {
            if (part.match(/^\d+$/)) found_match = true
        }
        if (!found_match) filtered.push(e)
    }
    return filtered
}


/**
 * Like querySelectorAll, but also returns all elements inside <template> tags.
 * Unlike querySelectorAll, this function returns an array, not a NodeList.
 * @param {Element} root
 * @param {string} selector
 * @returns {Element[]}
 */
function querySelectorAllIncudingTemplates(root, selector) {
    let res = [...root.querySelectorAll(selector)]
    const templates = root.querySelectorAll("template")
    for (const t of templates) {
        res = res.concat([...t.content.querySelectorAll(selector)])
    }
    return res
}


/**
 *
 * @param {any[]} array
 * @param {function} key
 * @returns {any[]}
 */
function remove_duplicates_keeping_last(array, key) {
    return [...new Map(array.map(x => [key(x), x])).values()]
}


/**
 * Takes a string of the format "css_property_name.value1.value2.<more_values>" and
 * converts it to an object of the format {property: "css_property_name", value: "value1 value2 ..." }
 * @param {string} style_dot_notation
 */
function parse_dot_notation_to_object(style_dot_notation) {
    const split = style_dot_notation.split(".")
    const property = split[0]
    // Only replace dot if not in parentheses
    let value = split.slice(1).join(".")
    let parenthesis_is_open = false
    for (var i = 0; i < value.length; i++) {
        if ("()".includes(value[i])) {
            parenthesis_is_open = value[i] === "("
            continue
        }
        if (!parenthesis_is_open && value[i] === ".") {
            value = value.substring(0, i) + " " + value.substring(i + 1)
        }
    }

    return { property, value }
}


/**
 * Takes a ui_tag string and returns an array of objects with the format
 * { property: "css_property_name", value: "value1 value2 ..." }.
 * All substitutions are performed, and duplicate properties are removed by
 * keeping the last one.
 * @param {string} ui_tag
 * @returns {[{property: string, value: string}]}
 */
function parse_ui_tag(ui_tag) {
    let css_rules = [] // {property: <property>, value: <value>}
    for (const s of ui_tag.split(" ")) {
        // Case 1: shortcut like "pos.abs" or "button"
        if (s in lastcss.substitutions) {
            for (const e of lastcss.substitutions[s].split(" ")) {
                css_rules.push(parse_dot_notation_to_object(e))
            }
            continue
        }
        // Case 2: shortcut like "m.<...>"
        let shortcut = s.split(".")[0]
        if (shortcut in lastcss.substitutions) {
            const expanded = lastcss.substitutions[shortcut] + s.substring(shortcut.length)
            for (const e of expanded.split(" ")) {
                css_rules.push(parse_dot_notation_to_object(e))
            }
            continue
        }
        // Case 3: No substitution exists
        css_rules.push(parse_dot_notation_to_object(s))
    }
    return remove_duplicates_keeping_last(css_rules, e => e.property)
}






// Can be an abbreviation, like ml.5px (later evaluated to margin-left: 5px;)
// But also could already represent a stict CCS rule
class LaxUIProperty {
    /**
     * @param {string} property
     */
    constructor(property) {
        this.property = property
    }
}


// Must be strictly valid CSS
class StrictUIProperty {
    /**
     * @param {string} css_str
     *
     */
    constructor(css_str) {
        const {property, value} = parse_dot_notation_to_object(css_str)
        this.name = property
        this.value = value
    }
}



import { components } from "./components"




class UIElement {
    /** @type {Element} */ element
    /** @type {string[]} */ ui_tag_list
    /** @type {UIComponent|null} */ component
    /** @type {string[]} */ used_component_modifiers

    /**
     * @param {Element} element
     */
    constructor(element) {
        this.element = element
        this.ui_tag_list = element.getAttribute("ui").split(" ")
        element.removeAttribute("ui")
    }

    extract_component_properties = () => {
        let components_to_apply = intersect(this.ui_tag_list, Object.keys(components))
        // To many components found
        if (components_to_apply.length > 1) {
            throw new Error(`Cannot apply multiple ui components to one element. Choose one from: ${components_to_apply.join(", ")}`)
        }
        // No component found
        if (components_to_apply.length === 0) {
            this.component = null
            return
        }
        // Found exactly one component
        this.component = components[components_to_apply[0]]

        // Remove component and its modifiers from ui tag list
        this.ui_tag_list = this.ui_tag_list.filter(e => e !== this.component.shortcut)

        // Extract used modifiers and remove them from ui tag list
        this.used_component_modifiers = intersect(this.ui_tag_list, Object.keys(this.component.modifiers))
        this.ui_tag_list = this.ui_tag_list.filter(e => !this.used_component_modifiers.includes(e))
    }


    apply_component_functions = () => {
        if (!this.component) {
            return
        }
        if ("init" in this.component) {
          this.component.init(this.element)
        }
        if ("events" in this.component) {
            for (const event in this.component.events) {
                this.element.addEventListener(event, this.component.events[event])
            }
        }

        // Set the final value of the ui tag to the component name and the used modifiers

        const new_ui_tag = `${this.used_component_modifiers.join(" ")} ${this.ui_tag_list.join(" ")}`
        if (this.element.getAttribute("ui") !== new_ui_tag) {
            this.element.setAttribute("ui", `${this.used_component_modifiers.join(" ")} ${this.ui_tag_list.join(" ")}`)
        }
    }

    apply_style_inline = () => {
        const ui_tag = this.ui_tag_list.join(" ")
        for (const { property, value } of parse_ui_tag(ui_tag)) {
            this.element.style[property] = value
        }
    }

}




class UIElementList {
    /** @type {UIElement[]} */ elements

    /**
     * @param {Element[]} elements
     */
    constructor(elements) {
        this.elements = []
        for (const element of elements) {
            const ui_element = new UIElement(element)
            ui_element.extract_component_properties()
            this.elements.push(ui_element)
        }
    }

    make_global_component_style_sheet = () => {
        let all_styles = {}
        for (const element of this.elements) {
            if (!element.component){
                continue
            }
            const element_selector = `[ui~="${element.component.name}"]`

            if (!(element_selector in all_styles)) {
                all_styles[element_selector] = parse_ui_tag(element.component.ui_tag).map(e => `${e.property}:${e.value};\n`).join("")
            }

            for (const modifier of element.used_component_modifiers) {
                const modifier_selector = `:where([ui~="${element.component.name}"])[ui~="${modifier}"]`
                if(!(modifier_selector in all_styles)) {
                    const css_rules = parse_ui_tag(element.component.modifiers[modifier])
                    let style_str = css_rules.map(e => `${e.property}:${e.value};\n`).join("")
                    all_styles[modifier_selector] = style_str
                }
            }
        }

        // Insert style before the first style tag to obtain lowest priority
        var style_ele = document.createElement("style")
        style_ele.innerHTML = Object.entries(all_styles).map(e => `${e[0]}{\n${e[1]}}`).join("")
        document.head.insertBefore(style_ele, document.head.querySelector("style"))
    }

    apply_component_functions = () => {
        for (const element of this.elements) {
            element.apply_component_functions()
        }
    }

    apply_styles_inline = () => {
        for (const element of this.elements) {
            element.apply_style_inline()
        }
    }

    apply_styles_global = () => {
        const elements = this.elements
        let styles = {}

        for (const element of elements) {
            const ui_tag = element.ui_tag_list.join(" ")

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

            style_elements.map(e => e.element.setAttribute("ui", [e.element.getAttribute("ui") ?? "", id].join(" ")))
            return `[ui~="${id}"]{\n${style.split(";").join(";\n")}}`
        }).join("\n")

        let style = document.createElement('style')
        style.innerHTML = style_str
        document.head.appendChild(style)
    }


}


/**
 * Applies all substitutions to the given string.
 * @param {Element} element
 * @returns {string}
 */
function apply_to_element(element, source=null) {
    if (source !== null) {
        console.log("📍 Run apply_to_element from source", source, "for element", element)
    }
    else {
        console.log("📍 Run apply_to_element for element", element)
    }


    const ui_element_list = new UIElementList([element])
    ui_element_list.make_global_component_style_sheet()
    ui_element_list.apply_component_functions()
    ui_element_list.apply_styles_inline()

    // Apply styles based on configured mode
    if (lastcss.config.mode === "global") {
        ui_element_list.apply_styles_global()
    }
    else if (lastcss.config.mode === "inline") {
        ui_element_list.apply_styles_inline()
    }
}



function apply_all() {
    time("🟣🏁 Apply all styles")

    // Get all elements with ui tag, including those in template elements
    let elements = querySelectorAllIncudingTemplates(document, "[ui]")

    // Remove elements that have a ui attribute that is a number
    elements = filter_elements_with_number_ui_attr(elements)

    // alpine duplicates id tag from first init, but then buttons wont be parsed again.

    for (const element of elements) {
        apply_to_element(element, "apply_all")
    }

    time("🟣🏁 Apply all styles")
}


function on_mutation(mutation_list, observer) {
    time("Mutation observer callback")
    console.log("mutation_list", mutation_list)
    for (const mutation of mutation_list) {
        if (mutation.type === "childList") {
            for (const added_node of mutation.addedNodes) {
                if (added_node.nodeType !== Node.ELEMENT_NODE) {
                    continue
                }
                if (!added_node.hasAttribute("ui")) {
                    continue
                }
                apply_to_element(added_node, "childList mutation")
            }
        }
        else if (mutation.type === "attributes") {
            if (mutation.target.nodeType !== Node.ELEMENT_NODE) {
                continue
            }
            if (!mutation.target.hasAttribute("ui")) {
                continue
            }
            if (mutation.oldValue === null) {
                continue
            }

            const old_ui_tag = String(mutation.oldValue).trim()
            const new_ui_tag = mutation.target.getAttribute("ui").trim()

            if (old_ui_tag === new_ui_tag) {
                continue
            }
            apply_to_element(mutation.target, "attribute mutation (" + old_ui_tag + " -> " + new_ui_tag + ")")
        }
    }
    time("Mutation observer callback")
}



export {
    apply_all,
    on_mutation,
}
