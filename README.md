
# Last CSS



The last CSS framework you will ever need!



A css library that:

- Uses a semantic syntax

- Also has utility classes that overwrite semantic components

- Small and unopinionated

- Configurable

- Community made and rated components



## Requirements

- Separation of concerns, i.e. no styling by using uitlity classes




Learned from:

- Semantic UI

- Tailwind



## Examples


```html
<div ui="flex w.100%">
	<div ui="h.3rem border-radius.1px.2px.3px.4px bg-color.var(--green-color)">
	<h1>Hello</h1>
	</div>
</div>
```

Which is equivalent to
```html
<div style="display: flex; width: 100%;">
	<div style="height: 3rem; border-radius: 1px 2px 3px 4px; background-color: var(--green-color);">
		<h1>Hello</h1>
	</div>
</div>
```


# Data Classes

First, all DOM elements, including those of the shadow DOM, with have the `ui` tag are obtained.
If an element's `ui` tag contains a number only, then it will be omitted, since it was already processed.

Then, the string content of each element's `ui` tag gets parsed as a `RawUIElement` with




```ts
// Can be an abbreviation, like ml.5px (later evaluated to margin-left: 5px;)
// But also could already represent a stict CCS rule
class LaxUIProperty {
	constructor() {
		this.property = ...
	}
}

// Must be strictly valid CSS
class StrictUIProperty {
	constructor() {
		this.name = ...
		this.value = ...
	}
}

class RawUITag {
	constructor(ui_tag) {
		this.property_list = []
		for (const ui_tag_property of ui_tag.split(" ")) {
			this.insert()
		}
	}

	insert(prop: UIProperty, overwrite_if_exists: bool) {
		// Insert prop into this.property_list
		// Overwrite existing if prop is already there, otherwise to nothing
	}

	concat(tag: RawUITag) {
		//
	}
}
```

Next, components are resolved.

# Data Flow
`ui` tag content processed to:

```js
{
	ui_tag_elements_list: list[LaxUIProperty]
}
```

Go through registered components, check how many in `ui_tag_elements_list`. If more than one, error.
If none, continue.
If exactly one, replace string in `ui_tag_elements_list` with `class Component(string)`.
Then init component.
Then replace component element with computed tags `list[LaxUIPropery]`.
Also remove Component modifiers from `ui_tag_elements_list` and insert their substituted `list[LaxUIPropery]` right after the inserted stuff of the component

Then as long as there are `LaxUIProperty`s in `ui_tag_elements_list` iterate `ui_tag_elements_list`, and for each, check if another substitution exists. If yes, replace with list of substitutions `list[LaxUIPropery]`. If no and contains at least one dot, transform and replace with `UIStrictProperty`, else remove because element is not valid.
