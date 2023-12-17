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

  // src/tools.js
  function assert(condition) {
    if (!condition) {
      throw new Error("Assertion failed");
    }
    console.log("assertion passed");
  }
  function array_equals(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]);
  }
  function log(...args) {
    if (!lastcss_default.config.log)
      return;
    console.log(...args);
  }
  var __active_timers = {};
  function time(label) {
    if (!lastcss_default.config.log)
      return;
    if (label in __active_timers) {
      const ms = performance.now() - __active_timers[label];
      console.log(`${label} - ${ms.toFixed(1)}ms`);
      delete __active_timers[label];
    } else {
      __active_timers[label] = performance.now();
    }
  }
  function dispatch(element, name, detail = {}) {
    element.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }
  var __unique_id_counter = 0;
  function get_unique_id() {
    const id = `${__unique_id_counter}`;
    __unique_id_counter++;
    return id;
  }
  function intersect(a, b) {
    return a.filter((x) => b.includes(x));
  }
  assert(array_equals(intersect([1, 2, 3], [2, 3, 4]), [2, 3]));
  assert(array_equals(intersect([1, 2, 3], [4, 5, 6]), []));

  // src/components/models.js
  var UIComponent = class {
    name;
    ui_tag;
    modifiers;
    init;
    events;
    constructor(json) {
      this.name = json.name;
      this.ui_tag = json.ui_tag;
      this.modifiers = {};
      if ("modifiers" in json)
        this.modifiers = json.modifiers;
      this.init = json.init;
      this.events = json.events;
    }
  };

  // src/components/all/button.js
  log("\u{1FA83} Parse components/button");
  var button_component = {
    name: "button",
    ui_tag: "bg-color.var(--ui-primary-color) color.#fff border.none p.10px border-radius.5px font-size.18px font-weight.bold cursor.pointer",
    modifiers: {
      "secondary": "bg-color.var(--ui-secondary-color)"
    },
    init: (ele) => {
      log("Button component init", ele);
    },
    events: {
      click: (event) => {
        log("Button component clicked", event.target);
      }
    }
  };

  // src/components/index.js
  var components = {};
  function register_component(component) {
    log("\u{1F590}", "Register component", component.name);
    if (component.name in components) {
      throw new Error(`Cannot register component with name ${component.name} because a component with that name already exists`);
    }
    if (component.name in substitutions_default) {
      throw new Error(`Cannot register component with name ${component.name} because a substitution with that name already exists`);
    }
    components[component.name] = new UIComponent(component);
  }
  register_component(button_component);

  // src/utils.js
  function filter_elements_with_number_ui_attr(elements) {
    let filtered = [];
    for (const e of elements) {
      const split = e.getAttribute("ui").split(" ");
      let found_match = false;
      for (const part of split) {
        if (part.match(/^\d+$/))
          found_match = true;
      }
      if (!found_match)
        filtered.push(e);
    }
    return filtered;
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
      if ("()".includes(value[i])) {
        parenthesis_is_open = value[i] === "(";
        continue;
      }
      if (!parenthesis_is_open && value[i] === ".") {
        value = value.substring(0, i) + " " + value.substring(i + 1);
      }
    }
    return { property, value };
  }
  function parse_ui_tag(ui_tag) {
    let css_rules = [];
    for (const s of ui_tag.split(" ")) {
      if (s in lastcss.substitutions) {
        for (const e of lastcss.substitutions[s].split(" ")) {
          css_rules.push(parse_dot_notation_to_object(e));
        }
        continue;
      }
      let shortcut = s.split(".")[0];
      if (shortcut in lastcss.substitutions) {
        const expanded = lastcss.substitutions[shortcut] + s.substring(shortcut.length);
        for (const e of expanded.split(" ")) {
          css_rules.push(parse_dot_notation_to_object(e));
        }
        continue;
      }
      css_rules.push(parse_dot_notation_to_object(s));
    }
    return remove_duplicates_keeping_last(css_rules, (e) => e.property);
  }
  var UIElement = class {
    element;
    ui_tag_list;
    component;
    used_component_modifiers;
    constructor(element) {
      this.element = element;
      this.ui_tag_list = element.getAttribute("ui").split(" ");
      element.removeAttribute("ui");
    }
    extract_component_properties = () => {
      let components_to_apply = intersect(this.ui_tag_list, Object.keys(components));
      if (components_to_apply.length > 1) {
        throw new Error(`Cannot apply multiple ui components to one element. Choose one from: ${components_to_apply.join(", ")}`);
      }
      if (components_to_apply.length === 0) {
        this.component = null;
        return;
      }
      this.component = components[components_to_apply[0]];
      this.ui_tag_list = this.ui_tag_list.filter((e) => e !== this.component.shortcut);
      this.used_component_modifiers = intersect(this.ui_tag_list, Object.keys(this.component.modifiers));
      this.ui_tag_list = this.ui_tag_list.filter((e) => !this.used_component_modifiers.includes(e));
    };
    apply_component_functions = () => {
      if (!this.component) {
        return;
      }
      if ("init" in this.component) {
        this.component.init(this.element);
      }
      if ("events" in this.component) {
        for (const event in this.component.events) {
          this.element.addEventListener(event, this.component.events[event]);
        }
      }
      const new_ui_tag = `${this.used_component_modifiers.join(" ")} ${this.ui_tag_list.join(" ")}`;
      if (this.element.getAttribute("ui") !== new_ui_tag) {
        this.element.setAttribute("ui", `${this.used_component_modifiers.join(" ")} ${this.ui_tag_list.join(" ")}`);
      }
    };
    apply_style_inline = () => {
      const ui_tag = this.ui_tag_list.join(" ");
      for (const { property, value } of parse_ui_tag(ui_tag)) {
        this.element.style[property] = value;
      }
    };
  };
  var UIElementList = class {
    elements;
    constructor(elements) {
      this.elements = [];
      for (const element of elements) {
        const ui_element = new UIElement(element);
        ui_element.extract_component_properties();
        this.elements.push(ui_element);
      }
    }
    make_global_component_style_sheet = () => {
      let all_styles = {};
      for (const element of this.elements) {
        if (!element.component) {
          continue;
        }
        const element_selector = `[ui~="${element.component.name}"]`;
        if (!(element_selector in all_styles)) {
          all_styles[element_selector] = parse_ui_tag(element.component.ui_tag).map((e) => `${e.property}:${e.value};
`).join("");
        }
        for (const modifier of element.used_component_modifiers) {
          const modifier_selector = `:where([ui~="${element.component.name}"])[ui~="${modifier}"]`;
          if (!(modifier_selector in all_styles)) {
            const css_rules = parse_ui_tag(element.component.modifiers[modifier]);
            let style_str = css_rules.map((e) => `${e.property}:${e.value};
`).join("");
            all_styles[modifier_selector] = style_str;
          }
        }
      }
      var style_ele = document.createElement("style");
      style_ele.innerHTML = Object.entries(all_styles).map((e) => `${e[0]}{
${e[1]}}`).join("");
      document.head.insertBefore(style_ele, document.head.querySelector("style"));
    };
    apply_component_functions = () => {
      for (const element of this.elements) {
        element.apply_component_functions();
      }
    };
    apply_styles_inline = () => {
      for (const element of this.elements) {
        element.apply_style_inline();
      }
    };
    apply_styles_global = () => {
      const elements = this.elements;
      let styles = {};
      for (const element of elements) {
        const ui_tag = element.ui_tag_list.join(" ");
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
        style_elements.map((e) => e.element.setAttribute("ui", [e.element.getAttribute("ui") ?? "", id].join(" ")));
        return `[ui~="${id}"]{
${style2.split(";").join(";\n")}}`;
      }).join("\n");
      let style = document.createElement("style");
      style.innerHTML = style_str;
      document.head.appendChild(style);
    };
  };
  function apply_to_element(element, source = null) {
    if (source !== null) {
      console.log("\u{1F4CD} Run apply_to_element from source", source, "for element", element);
    } else {
      console.log("\u{1F4CD} Run apply_to_element for element", element);
    }
    const ui_element_list = new UIElementList([element]);
    ui_element_list.make_global_component_style_sheet();
    ui_element_list.apply_component_functions();
    ui_element_list.apply_styles_inline();
    if (lastcss.config.mode === "global") {
      ui_element_list.apply_styles_global();
    } else if (lastcss.config.mode === "inline") {
      ui_element_list.apply_styles_inline();
    }
  }
  function apply_all() {
    time("\u{1F7E3}\u{1F3C1} Apply all styles");
    let elements = querySelectorAllIncudingTemplates(document, "[ui]");
    elements = filter_elements_with_number_ui_attr(elements);
    for (const element of elements) {
      apply_to_element(element, "apply_all");
    }
    time("\u{1F7E3}\u{1F3C1} Apply all styles");
  }
  function on_mutation(mutation_list, observer) {
    time("Mutation observer callback");
    console.log("mutation_list", mutation_list);
    for (const mutation of mutation_list) {
      if (mutation.type === "childList") {
        for (const added_node of mutation.addedNodes) {
          if (added_node.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }
          if (!added_node.hasAttribute("ui")) {
            continue;
          }
          apply_to_element(added_node, "childList mutation");
        }
      } else if (mutation.type === "attributes") {
        if (mutation.target.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        if (!mutation.target.hasAttribute("ui")) {
          continue;
        }
        if (mutation.oldValue === null) {
          continue;
        }
        const old_ui_tag = String(mutation.oldValue).trim();
        const new_ui_tag = mutation.target.getAttribute("ui").trim();
        if (old_ui_tag === new_ui_tag) {
          continue;
        }
        apply_to_element(mutation.target, "attribute mutation (" + old_ui_tag + " -> " + new_ui_tag + ")");
      }
    }
    time("Mutation observer callback");
  }

  // src/index.js
  window.lastcss = lastcss_default;
  if (!document.body) {
    throw new Error("Unable to initialize Last CSS. Do not use the <script> tag in the header, but rater after the <body> tag");
  }
  log("\u{1F7E3} Last: start init");
  time("Last init");
  dispatch(document, "last:init");
  apply_all();
  window.last_css_observer = new MutationObserver(on_mutation);
  window.last_css_observer.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["ui"],
    attributeOldValue: true
  });
  dispatch(document, "last:initialized");
  time("Last init");
})();
