(() => {
  // src/lastcss.js
  var lastcss2 = {
    config: {
      mode: "global"
    }
  };
  var lastcss_default = lastcss2;

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
  function querySelectorAllIncudingTemplates(root, selector) {
    let res = [...root.querySelectorAll(selector)];
    const templates = root.querySelectorAll("template");
    for (const t of templates) {
      res = res.concat([...t.content.querySelectorAll(selector)]);
    }
    return res;
  }
  function remove_duplicates_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for (var i = 0; i < len; i++) {
      var item = a[i];
      if (seen[item] !== 1) {
        seen[item] = 1;
        out[j++] = item;
      }
    }
    return out;
  }
  function parse_ui_expanded_styler(ui_expanded_styler) {
    let res = [];
    for (const style of ui_expanded_styler.split(" ")) {
      res.push({
        name: style.split(".")[0],
        value: style.split(".").slice(1).join(" ")
      });
    }
    console.log("parse_ui_expanded_styler", res);
    return res;
  }
  function expand_shortcuts(ui_styler) {
    let res = /* @__PURE__ */ new Set();
    for (const s of ui_styler.split(" ")) {
      console.log("-", s, "-", s in lastcss.substitutions);
      let shortcut = s.split(".")[0];
      if (s in lastcss.substitutions) {
        res.add(lastcss.substitutions[s]);
      } else if (shortcut in lastcss.substitutions) {
        const expanded = lastcss.substitutions[shortcut] + s.substring(shortcut.length);
        for (const e of expanded.split(" ")) {
          res.add(e);
        }
      } else {
        res.add(s);
      }
    }
    return [...res].join(" ");
  }
  function apply_style_inline(elements) {
    for (const element of elements) {
      const ui_styler = element.getAttribute("ui");
      const ui_expanded_styler = expand_shortcuts(ui_styler);
      for (const { name, value } of parse_ui_expanded_styler(ui_expanded_styler)) {
        element.style[name] = value;
      }
      element.removeAttribute("ui");
    }
  }
  function apply_style_global(elements) {
    let styles = {};
    for (const element of elements) {
      const ui_styler = element.getAttribute("ui");
      let style_str2 = "";
      for (const { name, value } of parse_ui_expanded_styler(expand_shortcuts(ui_styler))) {
        style_str2 += `${name}:${value};`;
      }
      if (style_str2 in styles) {
        styles[style_str2].push(element);
      } else {
        styles[style_str2] = [element];
      }
    }
    let style_str = Object.entries(styles).map(([style2, style_elements], i) => {
      style_elements.map((e) => e.setAttribute("ui", i));
      return `[ui="${i}"]{
${style2.split(";").join(";\n")}}`;
    }).join("\n");
    var style = document.createElement("style");
    style.innerHTML = style_str;
    document.head.appendChild(style);
  }
  function substitute_ui_attributes_with_css() {
    let elements = querySelectorAllIncudingTemplates(document, "[ui]");
    if (lastcss.config.mode === "global") {
      apply_style_global(elements);
    } else if (lastcss.config.mode === "inline") {
      apply_style_inline(elements);
    }
  }
  var utils_default = {
    parse_and_validate_substitutions,
    dispatch,
    querySelectorAllIncudingTemplates,
    remove_duplicates_fast,
    parse_ui_expanded_styler,
    expand_shortcuts,
    apply_style_inline,
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
    ["button", "background-color.var(--ui-primary-color) color.#fff border.none padding.10px border-radius.5px font-size.16px font-weight.bold cursor.pointer"]
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
  utils_default.substitute_ui_attributes_with_css();
  utils_default.dispatch(document, "last:initialized");
  console.timeEnd("\u{1F7E3} Last init");
})();
