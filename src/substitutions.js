const substitutions = [
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
    // Colors
    ["bg", "background"],
    ["bg-color", "background-color"],
    // Text
    ["header", "font-size.3rem font-weight.800"],
    ["tiny", "transform.scale(0.5)"],
    // Custom Components
]


function parse_and_validate_substitutions(substitutions) {
    // Check substitution shortcuts for duplicates
    const duplicates = substitutions.map(e => e[0]).filter((e, i, a) => a.indexOf(e) !== i)
    if (duplicates.length > 0) {
        throw new Error(`Duplicate substitution shortcuts: ${duplicates.join(", ")}`)
    }
    return Object.fromEntries(substitutions)
}

const parsed_and_validated_substitutions = parse_and_validate_substitutions(substitutions)

export default parsed_and_validated_substitutions
