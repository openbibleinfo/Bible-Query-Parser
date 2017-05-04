"use strict"
const parseQuery = require("./bibleQueryParser.js")

describe("Parsing", () => {
	it("should handle an empty string", () => {
		expect(parseQuery("")).toEqual({
			q: "",
			counts: {
				words: 1,
				osis: 0,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "text",
					subtype: "other",
					content: "",
					indices: [0, 0],
				},
			],
			recommend: "words",
		})	
	})
	it("should handle words", () => {
		expect(parseQuery("This string only has words in it.")).toEqual({
			q: "This string only has words in it.",
			counts: {
				words: 1,
				osis: 0,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "text",
					subtype: "words",
					content: "This string only has words in it.",
					indices: [0, 33],
				},
			],
			recommend: "words",
		})
		expect(parseQuery("   ")).toEqual({
			q: "   ",
			counts: {
				words: 0,
				osis: 0,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "text",
					subtype: "space",
					content: "   ",
					indices: [0, 3],
				},
			],
			recommend: "words",
		})
		expect(parseQuery(".\u2013")).toEqual({
			q: ".\u2013",
			counts: {
				words: 0,
				osis: 0,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "text",
					subtype: "punctuation",
					content: ".\u2013",
					indices: [0, 2],
				},
			],
			recommend: "words",
		})
	})
	it("should handle a book on its own", () => {
		expect(parseQuery("Philemon")).toEqual({
			q: "Philemon",
			counts: {
				words: 0,
				osis: 0,
				book: 1,
				invalid_osis: 0
			},
			components: [
				{
					type: "book",
					osis: "Phlm.1",
					content: "Philemon",
					indices: [0, 8],
				},
			],
			recommend: "osis",
		})
		expect(parseQuery("Philemon.")).toEqual({
			q: "Philemon.",
			counts: {
				words: 0,
				osis: 0,
				book: 1,
				invalid_osis: 0
			},
			components: [
				{
					type: "book",
					osis: "Phlm.1",
					content: "Philemon",
					indices: [0, 8],
				},
				{
					type: "text",
					subtype: "punctuation",
					content: ".",
					indices: [8, 9],
				},
			],
			recommend: "osis",
		})
		expect(parseQuery("John Mark")).toEqual({
			q: "John Mark",
			counts: {
				words: 0,
				osis: 0,
				book: 2,
				invalid_osis: 0
			},
			components: [
				{
					type: "book",
					osis: "John.1",
					content: "John",
					indices: [0, 4],
				},
				{
					type: "text",
					subtype: "space",
					content: " ",
					indices: [4, 5],
				},
				{
					type: "book",
					osis: "Mark.1",
					content: "Mark",
					indices: [5, 9],
				},
			],
			recommend: "osis",
		})
	})
	it("should handle invalid osis", () => {
		expect(parseQuery("Phil 5")).toEqual({
			q: "Phil 5",
			counts: {
				words: 0,
				osis: 0,
				book: 0,
				invalid_osis: 1
			},
			components: [
				{
					type: "invalid_osis",
					osis: "",
					content: "Phil 5",
					indices: [0, 6],
					messages: {
						start_chapter_not_exist: 4
					},
				},
			],
			recommend: "error",
		})
	})
	it("should handle a passage on its own", () => {
		expect(parseQuery("Phil 2")).toEqual({
			q: "Phil 2",
			counts: {
				words: 0,
				osis: 1,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "osis",
					osis: "Phil.2",
					content: "Phil 2",
					indices: [0, 6],
				},
			],
			recommend: "osis",
		})
		expect(parseQuery("Phil 2?")).toEqual({
			q: "Phil 2?",
			counts: {
				words: 0,
				osis: 1,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "osis",
					osis: "Phil.2",
					content: "Phil 2",
					indices: [0, 6],
				},
				{
					type: "text",
					subtype: "punctuation",
					content: "?",
					indices: [6, 7],
				},
			],
			recommend: "osis",
		})
	})
	it("should handle a book with words", () => {
		expect(parseQuery("John the Baptist")).toEqual({
			q: "John the Baptist",
			counts: {
				words: 1,
				osis: 0,
				book: 1,
				invalid_osis: 0
			},
			components: [
				{
					type: "book",
					osis: "John.1",
					content: "John",
					indices: [0, 4],
				},
				{
					type: "text",
					subtype: "words",
					content: " the Baptist",
					indices: [4, 16],
				},
			],
			recommend: "words",
		})
		expect(parseQuery("John and Mark")).toEqual({
			q: "John and Mark",
			counts: {
				words: 1,
				osis: 0,
				book: 2,
				invalid_osis: 0
			},
			components: [
				{
					type: "book",
					osis: "John.1",
					content: "John",
					indices: [0, 4],
				},
				{
					type: "text",
					subtype: "words",
					content: " and ",
					indices: [4, 9],
				},
				{
					type: "book",
					osis: "Mark.1",
					content: "Mark",
					indices: [9, 13],
				},
			],
			recommend: "words",
		})
	})
	it("should handle a passage with words", () => {
		expect(parseQuery("Matthew 5-7: Sermon on the Mount")).toEqual({
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
		})
	})
	it("should handle an ambiguous osis", () => {
		expect(parseQuery("Jo 1")).toEqual({
			q: "Jo 1",
			counts: {
				words: 0,
				osis: 1,
				book: 0,
				invalid_osis: 0,
			},
			components: [
				{
					type: "osis",
					osis: "John.1",
					content: "Jo 1",
					indices: [0, 4],
					alternates: [
						"Jonah.1",
						"Job.1",
						"Josh.1",
						"Joel.1",
					],
				},
			],
			recommend: "osis",
		})
	})
})

describe("Normalizing", () => {
	it("shouldn't change ascii + punctuation", () => {
		expect(parseQuery("There\u2019s a string.")).toEqual({
			q: "There\u2019s a string.",
			counts: {
				words: 1,
				osis: 0,
				book: 0,
				invalid_osis: 0
			},
			components: [
				{
					type: "text",
					subtype: "words",
					content: "There\u2019s a string.",
					indices: [0, 17],
				},
			],
			recommend: "words",
		})
	})
	it("shouldn't change already-normalized text", () => {
		expect(parseQuery("G\xe9nesis 1")).toEqual({
			q: "G\xe9nesis 1",
			counts: {
				words: 1,
				osis: 0,
				book: 0,
				invalid_osis: 0,
			},
			components: [
				{
					type: "text",
					subtype: "words",
					content: "G\xe9nesis 1",
					indices: [0, 9],
				},
			],
			recommend: "words",
		})
	})
	it("should normalize denormalized text", () => {
		// `\u301` is a combining acute accent.
		expect(parseQuery("Ge\u0301nesis 1")).toEqual({
			q: "G\xe9nesis 1",
			counts: {
				words: 1,
				osis: 0,
				book: 0,
				invalid_osis: 0,
			},
			components: [
				{
					type: "text",
					subtype: "words",
					content: "G\xe9nesis 1",
					indices: [0, 9],
				},
			],
			recommend: "words",
		})
	})
})