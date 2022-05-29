import lastcss from "./lastcss"

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


export function time(label) {
    if (!lastcss.config.log) return
    console.time(label)
}


export function timeEnd(label) {
    if (!lastcss.config.log) return
    console.timeEnd(label)
}
