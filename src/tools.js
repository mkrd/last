import lastcss from "./lastcss"

////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Testing
////////////////////////////////////////////////////////////////////////////////

function assert(condition) {
    if (!condition) {
        throw new Error("Assertion failed")
    }
    console.log("assertion passed")
}


function array_equals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// Logging
////////////////////////////////////////////////////////////////////////////////

export function log(...args) {
    if (!lastcss.config.log) return
    console.log(...args)

}

let __active_timers = {}

export function time(label) {
    if (!lastcss.config.log) return
    if (label in __active_timers) {
        const ms = performance.now() - __active_timers[label]
        console.log(`${label} - ${ms.toFixed(1)}ms`)
        delete __active_timers[label]
    }
    else {
        __active_timers[label] = performance.now()
    }
}

////
////
////
////
////////////////////////////////////////////////////////////////////////////////
//// JS specific
////////////////////////////////////////////////////////////////////////////////


/**
 * Dispatch a custom event with the given name and detail object
 * @param {Element} element - The element to dispatch the event on.
 * @param {string} name - The name of the event.
 */
export function dispatch_event(element, name, detail = {}) {
    element.dispatchEvent(
        new CustomEvent(name, {
            detail,
            bubbles: true,
            // Allows events to pass the shadow DOM barrier.
            composed: true,
            cancelable: true,
        })
    )
}


let __unique_id_counter = 0

/**
 * Get a unique id during the runtime of this script.
 * @returns {string}
 */
export function get_unique_id() {
    const id = `${__unique_id_counter}`
    __unique_id_counter++
    return id
}


/**
 * @param {any[]} a
 * @param {any[]} b
 * @returns {any[]} The intersection of elements that are in both arrays.
 */
export function intersect(a, b) {
    return a.filter(x => b.includes(x))
}
