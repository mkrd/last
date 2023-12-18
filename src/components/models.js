export class UIComponent {
    /** @type {string} */ name
    /** @type {string} */ ui_tag
    /** @type {Object.<string, string>} */ modifiers
    /** @type {function} @param {Element} ele */ init
    /** @type {Object} */ events

    constructor(json) {
        this.name = json.name
        this.ui_tag = json.ui_tag
        this.init = json.init
        this.events = json.events
        this.modifiers = {}
        if("modifiers" in json) {
            this.modifiers = json.modifiers
        }
    }


}
