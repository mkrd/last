(() => {
  // src/substitutions.js
  var substitutions = [
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
    ["bg", "background"],
    ["bg-color", "background-color"],
    ["header", "font-size.3rem font-weight.800"],
    ["tiny", "transform.scale(0.5)"]
  ];
  function parse_and_validate_substitutions(substitutions2) {
    const duplicates = substitutions2.map((e) => e[0]).filter((e, i, a) => a.indexOf(e) !== i);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate substitution shortcuts: ${duplicates.join(", ")}`);
    }
    return Object.fromEntries(substitutions2);
  }
  var parsed_and_validated_substitutions = parse_and_validate_substitutions(substitutions);
  var substitutions_default = parsed_and_validated_substitutions;

  // src/lastcss.js
  var lastcss_default = {
    substitutions: substitutions_default,
    config: {
      mode: "global",
      log: false
    }
  };

  // src/logging.js
  function log(...args) {
    if (!lastcss_default.config.log)
      return;
    console.log(...args);
  }
  function time(label) {
    if (!lastcss_default.config.log)
      return;
    console.time(label);
  }
  function timeEnd(label) {
    if (!lastcss_default.config.log)
      return;
    console.timeEnd(label);
  }

  // src/components/button.js
  log("\u{1FA83} Parse components/button");
  var button_component = {
    shortcut: "button",
    ui_tag: "bg-color.var(--ui-primary-color) color.#fff border.none p.10px border-radius.5px font-size.18px font-weight.bold cursor.pointer",
    modifiers: {
      "secondary": "bg-color.var(--ui-secondary-color)"
    },
    init: (ele) => {
      log("Init button");
    },
    events: {
      click: (event) => {
        log("Clicked button", event.target);
      }
    }
  };

  // src/components/index.js
  var components = {};
  function register_component(component) {
    log("\u{1F590}", "Register component", component.shortcut);
    if (component.shortcut in components) {
      throw new Error(`Component with shortcut ${component.shortcut} already registered`);
    }
    components[component.shortcut] = component;
  }
  register_component(button_component);
  function intersect(a, b) {
    return a.filter((x) => b.includes(x));
  }
  function apply_components(element) {
    let ui_tag_split = element.getAttribute("ui").split(" ");
    let components_to_apply = intersect(ui_tag_split, Object.keys(components));
    if (components_to_apply.length === 0)
      return;
    if (components_to_apply.length > 1) {
      throw new Error(`Cannot apply multiple ui components to one element. Choose one from: ${components_to_apply.join(", ")}`);
    }
    const component = components[components_to_apply[0]];
    let modifiers = [];
    if ("modifiers" in component) {
      for (const [modifier, modifier_value] of Object.entries(component.modifiers)) {
        const modifier_index = ui_tag_split.indexOf(modifier);
        if (modifier_index !== -1) {
          ui_tag_split.splice(modifier_index, 1);
          modifiers.push(modifier_value);
        }
      }
    }
    ui_tag_split.splice(ui_tag_split.indexOf(component.shortcut), 1, component.ui_tag, ...modifiers);
    if ("init" in component)
      component.init(element);
    if ("events" in component) {
      for (const event in component.events) {
        element.addEventListener(event, component.events[event]);
      }
    }
    element.setAttribute("ui", ui_tag_split.join(" "));
  }

  // src/utils.js
  function dispatch(element, name, detail = {}) {
    element.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
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
    const property = split[0];
    let value = split.slice(1).join(".");
    let parenthesis_is_open = false;
    for (var i = 0; i < value.length; i++) {
      if (value[i] === "(") {
        parenthesis_is_open = true;
        continue;
      }
      if (value[i] === ")") {
        parenthesis_is_open = false;
        continue;
      }
      if (!parenthesis_is_open && value[i] === ".") {
        value = value.substring(0, i) + " " + value.substring(i + 1);
      }
    }
    return {
      property,
      value
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
  function apply_all() {
    time("\u{1F7E3}\u{1F3C1} Apply styles");
    let elements = querySelectorAllIncudingTemplates(document, "[ui]");
    elements = remove_with_numeric_ui_tag(elements);
    log("apply_all", elements);
    for (const element of elements) {
      apply_components(element);
    }
    if (lastcss.config.mode === "global") {
      apply_style_global(elements);
    } else if (lastcss.config.mode === "inline") {
      apply_style_inline(elements);
    }
    timeEnd("\u{1F7E3}\u{1F3C1} Apply styles");
  }
  var utils_default = {
    dispatch,
    get_unique_id,
    apply_all
  };

  // src/index.js
  window.lastcss = lastcss_default;
  if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag");
  }
  log("\u{1F7E3} Last: start init");
  time("\u{1F7E3} Last init");
  utils_default.dispatch(document, "last:init");
  lastcss_default.refresh = utils_default.apply_all;
  utils_default.apply_all();
  utils_default.dispatch(document, "last:initialized");
  timeEnd("\u{1F7E3} Last init");
})();
