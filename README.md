# Bible Query Parser

This script builds on the [Bible Passage Reference Parser](https://github.com/openbibleinfo/Bible-Passage-Reference-Parser) and recommends whether to treat a given string as a passage reference or a word search.

If you're building a Bible search engine, you can use this script to decide what to do with queries that your users enter--you may want to show them a passage or search results, depending on the string.

## Usage

```javascript
const parseQuery = require("./bibleQueryParser.js")
const result = parseQuery("Matthew 5-7: Sermon on the Mount")
/*
{
	q: "Matthew 5-7: Sermon on the Mount",
	counts: {
		words: 1,
		osis: 1,
		book: 0,
		invalid_osis: 0
	},
	components: [
		{
			type: "osis",
			osis: "Matt.5-Matt.7",
			content: "Matthew 5-7",
			indices: [0, 11],
		},
		{
			type: "text",
			subtype: "words",
			content: ": Sermon on the Mount",
			indices: [11, 32],
		},
	],
	recommend: "osis",
}
*/
```

The script exports a single function, here `parseQuery`, that returns an object. The `recommend` key is `osis` if it suggests treating the string as a passage reference, `words` if it suggests treating the string as a word-search query, or `error` if there's a reference, but it's invalid (such as `Revelation 99`, which doesn't exist).

`q` is the original string.

`counts` provides a count of how many components of each type are in the string: `words` matches `[A-Za-z\d]`; `osis` matches valid references; `book` matches book names without chapters or verses; `invalid_osis` matches invalid passage references.

By looping through the `components` array, you can decide how to treat each part of the string.

Each item in `components` is an object with a few keys:

* `type`: `osis` if it's an unambiguous reference; `book` if it's a book name without a chapter or verse (like `John`); `invalid_osis` if it looks like a reference but is invalid; or `text` if it doesn't look like it's related to a passage.
* `subtype` if the `type` is `text`: `words` if it contains letters (`[A-Za-z]`) or numbers; `space` if it's whitespace; `punctuation` if it contains common English punctuation characters; or `other` if it doesn't match any of these patterns.
* `content`: the actual text of the component from the string.
* `indices`: the indices of the component in the string.
* `messages`: passed through from the Bible Passage Reference Parser; you may be able to do something with the information here.
* `alternates`: an array of alternative references in the same format as `osis`, in order of likelihood. For example, the query `Jo 1` could refer to one of several books.

## Tests

The file `spec.js` contains tests in [Jasmine](https://jasmine.github.io/) format.
