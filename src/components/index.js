import { log } from "../logging"
import { button_component } from "./button"


let components = {}

function register_component(component) {
    log("🖐", "Register component", component.shortcut)
    if (component.shortcut in components) {
        throw new Error(`Component with shortcut ${component.shortcut} already registered`)
    }

    components[component.shortcut] = component
}


register_component(button_component)



function intersect(a, b) {
    return a.filter(x => b.includes(x))
}


export function apply_components(element) {
    let ui_tag_split = element.getAttribute("ui").split(" ")

    let components_to_apply = intersect(ui_tag_split, Object.keys(components))
    if (components_to_apply.length === 0) return
    if (components_to_apply.length > 1) {
        throw new Error(`Cannot apply multiple ui components to one element. Choose one from: ${components_to_apply.join(", ")}`)
    }

    // Found exactly one component
    const component = components[components_to_apply[0]]


    // Extract modifiers from ui_tag_split
    let modifiers = []
    if ("modifiers" in component) {
        for (const [modifier, modifier_value] of Object.entries(component.modifiers)) {
            const modifier_index = ui_tag_split.indexOf(modifier)
            if (modifier_index !== -1) {
                ui_tag_split.splice(modifier_index, 1)
                modifiers.push(modifier_value)
            }
        }
    }

    ui_tag_split.splice(ui_tag_split.indexOf(component.shortcut), 1, component.ui_tag, ...modifiers)
    if ("init" in component) component.init(element)
    if ("events" in component) {
        for (const event in component.events) {
            element.addEventListener(event, component.events[event])
        }
    }

    element.setAttribute("ui", ui_tag_split.join(" "))
}
