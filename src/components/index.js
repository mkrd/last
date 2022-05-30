import { log } from "../tools"
import substitutions from "../substitutions"
import { UIComponent } from "./models"
import { button_component } from "./all/button"

/**
 * The set of all registered components, keyed by their name.
 * @type {Object.<string, UIComponent>}
 */
let components = {}

/**
 * Registers a new component that will be saved to the components object.
 * An error will be thrown if a component with the same name already exists,
 * or if a substitution wih the same name already exists.
 * @param {Object} component - The json object that describes the component.
 */
function register_component(component) {
    log("🖐", "Register component", component.name)
    if (component.name in components) {
        throw new Error(`Cannot register component with name ${component.name} because a component with that name already exists`)
    }
    if (component.name in substitutions) {
        throw new Error(`Cannot register component with name ${component.name} because a substitution with that name already exists`)
    }
    components[component.name] = new UIComponent(component)
}

// Perform registrations of all components
register_component(button_component)

export {
    register_component,
    components,
}
