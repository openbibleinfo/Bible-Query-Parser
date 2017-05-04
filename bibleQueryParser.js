"use strict"
const bcvParser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
let bcv = resetParser()

// The only exported function. It normalizes the string and returns an object with a recommended course of action.
function parse(q) {
	// The BCV parser expects normalized UTF-8. If the query contains anything besides ASCII or punctuation, make sure it's normalized. If your environment doesn't support `String.normalize`, try https://github.com/walling/unorm . Alternately, if you're only interested in ASCII text, you could probably delete this line.
	q = q.normalize("NFC")
	const response = {
		q,
		counts: {
			words: 0,
			osis: 0,
			book: 0,
			// Not camel-cased because it's an output propery, so we want it consistent with output from `bcv_parser`.
			invalid_osis: 0
		},
		components: [],
	}

	let entities
	try {
		entities = bcv.parse(q).parsed_entities()
	} catch (e) {
		response.error = e
		entities = []
		bcv = resetParser()
	}

	if (entities.length === 0) {
		noEntities(q, response)
	} else {
		handleEntities(q, entities, response)
		// Do a simple heuristic to recommend to the consumer how to treat the query.
		if (response.counts.osis > 0) {
			response.recommend = "osis"
		} else if (response.counts.words > 0) {
			// Queries like `John the Baptist` should be `words` rather than `osis`.
			response.recommend = "words"
		} else if (response.counts.book > 0) {
			response.recommend = "osis"
		} else if (response.counts.invalid_osis > 0) {
			response.recommend = "error"
		} else {
			response.recommend = "words"
		}
	}
	return response
}

// Even if there are no entities in the string, return an object in the same format that `handleEntities` produces.
function noEntities(q, response) {
	handleQueryText(q, response, 0, q.length)
	response.recommend = "words"
}

// Loop through the query string and identify all the components, whether osis, text, or book.
function handleEntities(q, entities, response) {
	// The current offset in string `q`.
	let currentIndex = 0
	for (const entity of entities) {
		const [start, end] = entity.indices
		// If there's text between the current position in the string and where the entity starts, then count it as text.
		if (start > currentIndex) {
			handleQueryText(q, response, currentIndex, start)
		}
		const obj = {
			type: "osis",
			osis: entity.osis,
			content: q.substr(start, end - start),
			indices: [start, end],
		}
		// Because we're using `sequence_combination_strategy: separate`, there's only one object in `entity.entities`.
		if (Object.getOwnPropertyNames(entity.entities[0].valid.messages).length > 0) {
			obj.messages = entity.entities[0].valid.messages
		}

		// The consumer may want to treat books without references differently from regular references.
		if (entity.type === "b") {
			obj.type = "book"
			response.counts.book++
		} else if (entity.osis === "") {
			obj.type = "invalid_osis"
			// TODO: We could do something more useful here, like make a suggestion for a correct reference.
			response.counts.invalid_osis++
		} else {
			response.counts.osis++
		}
		// Include any valid alternates.
		if (entity.entities[0].alternates != null) {
			for (const alt of entity.entities[0].alternates) {
				if (alt.valid.valid === false) {
					continue
				}
				if (!obj.alternates) {
					obj.alternates = []
				}
				obj.alternates.push(makeAlternate(alt.start, alt.end))
			}
		}

		response.components.push(obj)
		currentIndex = end
	}
	// Grab any spare text at the end of the string.
	if (currentIndex < q.length) {
		handleQueryText(q, response, currentIndex, q.length)
	}
}

// Turn the `alternate` objects into valid osises.
function makeAlternate(startObj, endObj) {
	const start = objToOsis(startObj)
	const end = objToOsis(endObj)
	if (start === end) {
		return start
	} else {
		return `${start}-${end}`
	}
}

// Given an object with `b` and optional `c` and `v` keys, produce an osis.
function objToOsis(obj) {
	let osis = obj.b
	if (obj.c != null) {
		osis += "." + obj.c
		if (obj.v != null) {
			osis += "." + obj.v
		}
	}
	return osis
}

// Extract text from the query string and increment the count if relevant.
function handleQueryText(q, response, currentIndex, endIndex) {
	const text = extractText(q, currentIndex, endIndex)
	response.components.push(text)
	if (text.subtype === "words" || text.subtype === "other") {
		response.counts.words++
	}
}

// Turn text into an object for future manipulation.
function extractText(q, start, end) {
	const content = q.substr(start, end - start)
	return {
		type: "text",
		subtype: extractTextSubtype(content),
		content,
		indices: [start, end],
	}
}

// Based on the content of the string, guess whether it contains words that the consumer might want to handle.
function extractTextSubtype(text) {
	if (/[A-Za-z0-9]/.test(text)) {
		return "words"
	} else if (/^\s+$/.test(text)) {
		return "space"
	// Latin punctuation characters and spaces.
	} else if (/^[\s,.?\/<>`~!@#$%^&*()\-_=+;:'"\[\]{}\\|\u2000-\u206F]+$/.test(text)) {
		return "punctuation"
	}
	// We could do a complicated test here to handle non-English queries and determine whether the other characters are letters or punctuation, but we don't.
	return "other"
}

function resetParser() {
	const parser = new bcvParser
	return parser.set_options({
		book_sequence_strategy: "include",
		book_alone_strategy: "first_chapter",
		captive_end_digits_strategy: "include",
		include_apocrypha: true,
		invalid_passage_strategy: "include",
		invalid_sequence_strategy: "include",
		non_latin_digits_strategy: "replace",
		osis_compaction_strategy: "bc",
		sequence_combination_strategy: "separate",
		zero_chapter_strategy: "upgrade",
		zero_verse_strategy: "upgrade"
		})
}

module.exports = parse
