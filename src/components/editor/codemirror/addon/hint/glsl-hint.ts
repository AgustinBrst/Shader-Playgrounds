import CodeMirror from "../../lib/codemirror"
import fuzzysort from "fuzzysort"

interface Completion {
    name: string
    type: string
}

CodeMirror.registerHelper( "hint", "x-shader/x-vertex", ( editor: CodeMirror.Editor, options: any ) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const token  = editor.getTokenAt( cursor )
    const cursorFollowsWhitespace = token.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : token.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end   = cursor.ch

    const completions: Completion[] = [
        { name: "dot",      type: "function" },
        { name: "vec2",     type: "type" },
        { name: "vec3",     type: "type" },
        { name: "vec4",     type: "type" },
        { name: "uniform",  type: "keyword" },
        { name: "#version", type: "keyword" }
    ]

    const results = fuzzysort.go<Completion>( token.string, completions, { key: "name" } )

    const list: CodeMirror.Hint[] = results.map( ( result ): CodeMirror.Hint => ( {
        text: result.obj.name,
        displayText: result.obj.name + " ...",
        className: classForType( result.obj.type ),
        render,
        indexes: result.indexes
    } ) )

    const from = CodeMirror.Pos( cursor.line, start )
    const to   = CodeMirror.Pos( cursor.line, end )

    return { list, from, to }
} )

function render( element: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint ) {
    const textSpan = document.createElement( "span" )

    textSpan.classList.add( "display-text" )
    textSpan.innerHTML = highlight( cur.displayText || cur.text, cur.indexes || [] )

    element.appendChild( textSpan )
}

function highlight( text: string, indexes: number[] = [], openingMark: string = "<b>", closingMark: string = "</b>" ) {
    var highlighted = ""
    var matchesIndex = 0
    var opened = false
    var textLength = text.length
    var matchesBest = indexes

    for ( var i = 0; i < textLength; ++ i ) {
        var char = text[i]

        if ( matchesBest[matchesIndex] === i ) {
            ++ matchesIndex

            if ( ! opened ) {
                opened = true
                highlighted += openingMark
            }

            if ( matchesIndex === matchesBest.length ) {
                highlighted += char + closingMark + text.substr( i + 1 )
                break
            }
        } else {
            if ( opened ) {
                opened = false
                highlighted += closingMark
            }
        }
        highlighted += char
    }

    return highlighted
}

function classForType( type: string ) {
    switch ( type ) {
        case "function":    return "class1"
        case "type":        return "class2"
        case "keyword":     return "class3"
    }
}
