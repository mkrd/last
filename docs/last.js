(() => {
  // src/lastcss.js
  var lastcss_default = {
    config: {
      mode: "global",
      log: false
    }
  };

  // src/utils.js
  function parse_and_validate_substitutions(substitutions) {
    const shortcuts = substitutions.map((e) => e[0]);
    if (shortcuts.length !== [...new Set(shortcuts)].length) {
      throw new Error("Duplicate shortcuts");
    }
    return Object.fromEntries(substitutions);
  }
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }
  function log(...args) {
    if (!lastcss.config.log)
      return;
    console.log(...args);
  }
  function time(label) {
    if (!lastcss.config.log)
      return;
    console.time(label);
  }
  function timeEnd(label) {
    if (!lastcss.config.log)
      return;
    console.timeEnd(label);
  }
  function remove_with_numeric_ui_tag(elements) {
    return elements.filter((e) => !e.getAttribute("ui").match(/^\d+$/));
  }
  var __counter = 0;
  function get_unique_id() {
    const id = `${__counter}`;
    __counter++;
    return id;
  }
  function querySelectorAllIncudingTemplates(root, selector) {
    let res = [...root.querySelectorAll(selector)];
    const templates = root.querySelectorAll("template");
    for (const t of templates) {
      res = res.concat([...t.content.querySelectorAll(selector)]);
    }
    return res;
  }
  function remove_duplicates_keeping_last(array, key) {
    return [...new Map(array.map((x) => [key(x), x])).values()];
  }
  function parse_dot_notation_to_object(style_dot_notation) {
    const split = style_dot_notation.split(".");
    return {
      property: split[0],
      value: split.slice(1).join(" ")
    };
  }
  function parse_ui_tag(ui_tag) {
    let style_components = [];
    for (const s of ui_tag.split(" ")) {
      if (s in lastcss.substitutions) {
        for (const e of lastcss.substitutions[s].split(" ")) {
          style_components.push(parse_dot_notation_to_object(e));
        }
        continue;
      }
      let shortcut = s.split(".")[0];
      if (shortcut in lastcss.substitutions) {
        const expanded = lastcss.substitutions[shortcut] + s.substring(shortcut.length);
        for (const e of expanded.split(" ")) {
          style_components.push(parse_dot_notation_to_object(e));
        }
        continue;
      }
      style_components.push(parse_dot_notation_to_object(s));
    }
    return remove_duplicates_keeping_last(style_components, (e) => e.property);
  }
  function apply_style_inline(elements) {
    for (const element of elements) {
      const ui_tag = element.getAttribute("ui");
      for (const { property, value } of parse_ui_tag(ui_tag)) {
        element.style[property] = value;
      }
      element.removeAttribute("ui");
    }
  }
  function apply_style_global(elements) {
    let styles = {};
    for (const element of elements) {
      const ui_tag = element.getAttribute("ui");
      let style_str2 = "";
      for (const { property, value } of parse_ui_tag(ui_tag)) {
        style_str2 += `${property}:${value};`;
      }
      if (style_str2 in styles) {
        styles[style_str2].push(element);
      } else {
        styles[style_str2] = [element];
      }
    }
    let style_str = Object.entries(styles).map(([style2, style_elements], i) => {
      const id = get_unique_id();
      style_elements.map((e) => e.setAttribute("ui", id));
      return `[ui="${id}"]{
${style2.split(";").join(";\n")}}`;
    }).join("\n");
    var style = document.createElement("style");
    style.innerHTML = style_str;
    document.head.appendChild(style);
  }
  function substitute_ui_attributes_with_css() {
    time("\u{1F7E3}\u{1F3C1} Apply styles");
    let elements = querySelectorAllIncudingTemplates(document, "[ui]");
    elements = remove_with_numeric_ui_tag(elements);
    if (lastcss.config.mode === "global") {
      apply_style_global(elements);
    } else if (lastcss.config.mode === "inline") {
      apply_style_inline(elements);
    }
    timeEnd("\u{1F7E3}\u{1F3C1} Apply styles");
  }
  var utils_default = {
    log,
    time,
    timeEnd,
    parse_and_validate_substitutions,
    dispatch,
    get_unique_id,
    querySelectorAllIncudingTemplates,
    apply_style_global,
    substitute_ui_attributes_with_css
  };

  // src/substitutions.js
  var substitutions_default = [
    ["m", "margin"],
    ["mt", "margin-top"],
    ["mb", "margin-bottom"],
    ["ml", "margin-left"],
    ["mr", "margin-right"],
    ["p", "padding"],
    ["pt", "padding-top"],
    ["pb", "padding-bottom"],
    ["pl", "padding-left"],
    ["pr", "padding-right"],
    ["flex", "display.flex"],
    ["flow", "display.flex flex-flow"],
    ["justify-content", "display.flex justify-content"],
    ["align-items", "display.flex align-items"],
    ["align-content", "display.flex align-content"],
    ["grow", "flex-grow"],
    ["shrink", "flex-shrink"],
    ["w", "width"],
    ["h", "height"],
    ["min-w", "min-width"],
    ["min-h", "min-height"],
    ["max-w", "max-width"],
    ["max-h", "max-height"],
    ["pos", "position"],
    ["pos.abs", "position.absolute"],
    ["pos.rel", "position.relative"],
    ["t", "top"],
    ["b", "bottom"],
    ["l", "left"],
    ["r", "right"],
    ["z", "z-index"],
    ["button", "background-color.var(--ui-primary-color) color.#fff border.none padding.10px border-radius.5px font-size.18px font-weight.bold cursor.pointer"]
  ];

  // src/index.js
  window.lastcss = lastcss_default;
  if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag");
  }
  console.log("\u{1F7E3} Last: start init");
  console.time("\u{1F7E3} Last init");
  utils_default.dispatch(document, "last:init");
  lastcss_default.substitutions = utils_default.parse_and_validate_substitutions(substitutions_default);
  lastcss_default.refresh = utils_default.substitute_ui_attributes_with_css;
  utils_default.substitute_ui_attributes_with_css();
  utils_default.dispatch(document, "last:initialized");
  console.timeEnd("\u{1F7E3} Last init");
})();
