import { log } from "../logging"

log("🪃 Parse components/button")

export const button_component = {
    shortcut: "button",
    ui_tag: "bg-color.var(--ui-primary-color) color.#fff border.none p.10px border-radius.5px font-size.18px font-weight.bold cursor.pointer",
    modifiers: {
        "secondary": "bg-color.var(--ui-secondary-color)",
    },
    init: (ele) => {
        log("Init button")
    },
    events: {
        click: (event) => {
            log("Clicked button", event.target)
        }
    }
}
