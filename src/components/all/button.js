import { log } from "../../tools"

log("🪃 Parse components/button")

export const button_component = {
    name: "button",
    ui_tag: "bg-color.var(--ui-primary-color) color.#fff border.none p.10px border-radius.5px font-size.18px font-weight.bold cursor.pointer",
    modifiers: {
        "secondary": "bg-color.var(--ui-secondary-color)",
    },
    init: (ele) => {
        log("Button component init", ele)
    },
    events: {
        click: (event) => {
            log("Button component clicked", event.target)
        }
    }
}
