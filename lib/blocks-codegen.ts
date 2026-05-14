/**
 * Gerador de codigo JavaScript a partir dos blocos do Blockly
 * Converte blocos visuais em codigo executavel para o Live Preview
 */

import * as Blockly from 'blockly'
import { javascriptGenerator, Order } from 'blockly/javascript'

// Registrar geradores de codigo para blocos customizados do Kodular

export function registerCodeGenerators() {
  // ===== CONTROLE =====
  
  javascriptGenerator.forBlock['controls_if_else'] = function(block: any) {
    const condition = javascriptGenerator.valueToCode(block, 'IF', Order.NONE) || 'false'
    const doCode = javascriptGenerator.statementToCode(block, 'DO')
    const elseCode = javascriptGenerator.statementToCode(block, 'ELSE')
    return `if (${condition}) {\n${doCode}} else {\n${elseCode}}\n`
  }

  javascriptGenerator.forBlock['controls_for_each'] = function(block: any) {
    const variable = block.getFieldValue('VAR') || 'item'
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    const code = javascriptGenerator.statementToCode(block, 'DO')
    return `for (const ${variable} of ${list}) {\n${code}}\n`
  }

  javascriptGenerator.forBlock['controls_for_range'] = function(block: any) {
    const variable = block.getFieldValue('VAR') || 'i'
    const start = javascriptGenerator.valueToCode(block, 'START', Order.NONE) || '1'
    const end = javascriptGenerator.valueToCode(block, 'END', Order.NONE) || '10'
    const step = javascriptGenerator.valueToCode(block, 'STEP', Order.NONE) || '1'
    const code = javascriptGenerator.statementToCode(block, 'DO')
    return `for (let ${variable} = ${start}; ${variable} <= ${end}; ${variable} += ${step}) {\n${code}}\n`
  }

  javascriptGenerator.forBlock['controls_while'] = function(block: any) {
    const condition = javascriptGenerator.valueToCode(block, 'TEST', Order.NONE) || 'false'
    const code = javascriptGenerator.statementToCode(block, 'DO')
    return `while (${condition}) {\n${code}}\n`
  }

  javascriptGenerator.forBlock['controls_break'] = function() {
    return 'break;\n'
  }

  javascriptGenerator.forBlock['controls_open_screen'] = function(block: any) {
    const screenName = javascriptGenerator.valueToCode(block, 'SCREEN_NAME', Order.NONE) || '""'
    return `__runtime.openScreen(${screenName});\n`
  }

  javascriptGenerator.forBlock['controls_open_screen_with_value'] = function(block: any) {
    const screenName = javascriptGenerator.valueToCode(block, 'SCREEN_NAME', Order.NONE) || '""'
    const value = javascriptGenerator.valueToCode(block, 'START_VALUE', Order.NONE) || 'null'
    return `__runtime.openScreenWithValue(${screenName}, ${value});\n`
  }

  javascriptGenerator.forBlock['controls_close_screen'] = function() {
    return '__runtime.closeScreen();\n'
  }

  javascriptGenerator.forBlock['controls_close_screen_with_value'] = function(block: any) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    return `__runtime.closeScreenWithValue(${value});\n`
  }

  javascriptGenerator.forBlock['controls_close_app'] = function() {
    return '__runtime.closeApp();\n'
  }

  javascriptGenerator.forBlock['controls_get_start_value'] = function() {
    return ['__runtime.getStartValue()', Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['controls_get_plain_start_text'] = function() {
    return ['__runtime.getPlainStartText()', Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['controls_close_screen_with_plain_text'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    return `__runtime.closeScreenWithPlainText(${text});\n`
  }

  javascriptGenerator.forBlock['controls_do_then_return'] = function(block: any) {
    const statements = javascriptGenerator.statementToCode(block, 'STM')
    const returnValue = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    return [`(function() {\n${statements}return ${returnValue};\n})()`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['controls_eval'] = function(block: any) {
    const expression = javascriptGenerator.valueToCode(block, 'EXPRESSION', Order.NONE) || '""'
    return [`eval(${expression})`, Order.FUNCTION_CALL]
  }

  // ===== LOGICA =====

  javascriptGenerator.forBlock['logic_true'] = function() {
    return ['true', Order.ATOMIC]
  }

  javascriptGenerator.forBlock['logic_false'] = function() {
    return ['false', Order.ATOMIC]
  }

  javascriptGenerator.forBlock['logic_compare'] = function(block: any) {
    const op = block.getFieldValue('OP')
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || '0'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || '0'
    const operators: Record<string, string> = {
      'EQ': '===', 'NEQ': '!==', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='
    }
    return [`(${a} ${operators[op] || '==='} ${b})`, Order.RELATIONAL]
  }

  javascriptGenerator.forBlock['logic_and'] = function(block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || 'false'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || 'false'
    return [`(${a} && ${b})`, Order.LOGICAL_AND]
  }

  javascriptGenerator.forBlock['logic_or'] = function(block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || 'false'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || 'false'
    return [`(${a} || ${b})`, Order.LOGICAL_OR]
  }

  javascriptGenerator.forBlock['logic_not'] = function(block: any) {
    const value = javascriptGenerator.valueToCode(block, 'BOOL', Order.NONE) || 'false'
    return [`!${value}`, Order.LOGICAL_NOT]
  }

  // ===== MATEMATICA =====

  javascriptGenerator.forBlock['math_number'] = function(block: any) {
    const num = block.getFieldValue('NUM') || 0
    return [String(num), Order.ATOMIC]
  }

  javascriptGenerator.forBlock['math_arithmetic'] = function(block: any) {
    const op = block.getFieldValue('OP')
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || '0'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || '0'
    const operators: Record<string, string> = {
      'ADD': '+', 'MINUS': '-', 'MULTIPLY': '*', 'DIVIDE': '/'
    }
    return [`(${a} ${operators[op] || '+'} ${b})`, Order.ADDITION]
  }

  javascriptGenerator.forBlock['math_power'] = function(block: any) {
    const base = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || '0'
    const exp = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || '1'
    return [`Math.pow(${base}, ${exp})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_random_int'] = function(block: any) {
    const from = javascriptGenerator.valueToCode(block, 'FROM', Order.NONE) || '1'
    const to = javascriptGenerator.valueToCode(block, 'TO', Order.NONE) || '100'
    return [`Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from}`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_random_float'] = function() {
    return ['Math.random()', Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_random_seed'] = function(block: any) {
    const seed = javascriptGenerator.valueToCode(block, 'SEED', Order.NONE) || '0'
    return `__runtime.setRandomSeed(${seed});\n`
  }

  javascriptGenerator.forBlock['math_single'] = function(block: any) {
    const op = block.getFieldValue('OP')
    const num = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0'
    const funcs: Record<string, string> = {
      'ROOT': 'Math.sqrt', 'ABS': 'Math.abs', 'NEG': '-', 
      'LN': 'Math.log', 'LOG10': 'Math.log10', 'EXP': 'Math.exp',
      'ROUND': 'Math.round', 'CEILING': 'Math.ceil', 'FLOOR': 'Math.floor'
    }
    if (op === 'NEG') return [`(-${num})`, Order.UNARY_NEGATION]
    return [`${funcs[op] || 'Math.abs'}(${num})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_trig'] = function(block: any) {
    const op = block.getFieldValue('OP')
    const angle = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0'
    const funcs: Record<string, string> = {
      'SIN': 'Math.sin', 'COS': 'Math.cos', 'TAN': 'Math.tan',
      'ASIN': 'Math.asin', 'ACOS': 'Math.acos', 'ATAN': 'Math.atan'
    }
    // Converter graus para radianos
    if (['SIN', 'COS', 'TAN'].includes(op)) {
      return [`${funcs[op]}(${angle} * Math.PI / 180)`, Order.FUNCTION_CALL]
    }
    // Converter radianos para graus
    return [`${funcs[op]}(${angle}) * 180 / Math.PI`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_atan2'] = function(block: any) {
    const y = javascriptGenerator.valueToCode(block, 'Y', Order.NONE) || '0'
    const x = javascriptGenerator.valueToCode(block, 'X', Order.NONE) || '0'
    return [`Math.atan2(${y}, ${x}) * 180 / Math.PI`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_minmax'] = function(block: any) {
    const op = block.getFieldValue('OP')
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || '0'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || '0'
    return [`Math.${op === 'MIN' ? 'min' : 'max'}(${a}, ${b})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_remainder'] = function(block: any) {
    const a = javascriptGenerator.valueToCode(block, 'DIVIDEND', Order.NONE) || '0'
    const b = javascriptGenerator.valueToCode(block, 'DIVISOR', Order.NONE) || '1'
    return [`(${a} % ${b})`, Order.MODULUS]
  }

  javascriptGenerator.forBlock['math_quotient'] = function(block: any) {
    const a = javascriptGenerator.valueToCode(block, 'DIVIDEND', Order.NONE) || '0'
    const b = javascriptGenerator.valueToCode(block, 'DIVISOR', Order.NONE) || '1'
    return [`Math.floor(${a} / ${b})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_convert_number'] = function(block: any) {
    const num = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0'
    const base = block.getFieldValue('BASE') || 'DEC'
    if (base === 'HEX') return [`parseInt(${num}, 16)`, Order.FUNCTION_CALL]
    if (base === 'BIN') return [`parseInt(${num}, 2)`, Order.FUNCTION_CALL]
    return [`parseInt(${num}, 10)`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_format_decimal'] = function(block: any) {
    const num = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0'
    const places = javascriptGenerator.valueToCode(block, 'PLACES', Order.NONE) || '2'
    return [`parseFloat(${num}).toFixed(${places})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['math_is_number'] = function(block: any) {
    const value = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '""'
    return [`!isNaN(parseFloat(${value}))`, Order.LOGICAL_NOT]
  }

  // ===== TEXTO =====

  javascriptGenerator.forBlock['text'] = function(block: any) {
    const text = block.getFieldValue('TEXT') || ''
    return [JSON.stringify(text), Order.ATOMIC]
  }

  javascriptGenerator.forBlock['text_join'] = function(block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || '""'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || '""'
    return [`String(${a}) + String(${b})`, Order.ADDITION]
  }

  javascriptGenerator.forBlock['text_length'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '""'
    return [`String(${text}).length`, Order.MEMBER]
  }

  javascriptGenerator.forBlock['text_isEmpty'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '""'
    return [`String(${text}).length === 0`, Order.EQUALITY]
  }

  javascriptGenerator.forBlock['text_compare'] = function(block: any) {
    const op = block.getFieldValue('OP')
    const a = javascriptGenerator.valueToCode(block, 'TEXT1', Order.NONE) || '""'
    const b = javascriptGenerator.valueToCode(block, 'TEXT2', Order.NONE) || '""'
    if (op === 'LT') return [`String(${a}).localeCompare(String(${b})) < 0`, Order.RELATIONAL]
    if (op === 'GT') return [`String(${a}).localeCompare(String(${b})) > 0`, Order.RELATIONAL]
    return [`String(${a}) === String(${b})`, Order.EQUALITY]
  }

  javascriptGenerator.forBlock['text_trim'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    return [`String(${text}).trim()`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_upcase'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    return [`String(${text}).toUpperCase()`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_downcase'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    return [`String(${text}).toLowerCase()`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_starts_at'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    const piece = javascriptGenerator.valueToCode(block, 'PIECE', Order.NONE) || '""'
    return [`(String(${text}).indexOf(String(${piece})) + 1)`, Order.ADDITION]
  }

  javascriptGenerator.forBlock['text_contains'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    const piece = javascriptGenerator.valueToCode(block, 'PIECE', Order.NONE) || '""'
    const mode = block.getFieldValue('MODE') || 'CONTAINS'
    if (mode === 'CONTAINS_ANY') {
      return [`String(${piece}).split('').some(c => String(${text}).includes(c))`, Order.FUNCTION_CALL]
    }
    return [`String(${text}).includes(String(${piece}))`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_split'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    const at = javascriptGenerator.valueToCode(block, 'AT', Order.NONE) || '""'
    return [`String(${text}).split(String(${at}))`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_split_at_first'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    const at = javascriptGenerator.valueToCode(block, 'AT', Order.NONE) || '""'
    return [`(function(t,s){const i=t.indexOf(s);return i===-1?[t]:[t.slice(0,i),t.slice(i+s.length)]})(String(${text}),String(${at}))`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_segment'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    const start = javascriptGenerator.valueToCode(block, 'START', Order.NONE) || '1'
    const length = javascriptGenerator.valueToCode(block, 'LENGTH', Order.NONE) || '1'
    return [`String(${text}).substr(${start} - 1, ${length})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_replace_all'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    const from = javascriptGenerator.valueToCode(block, 'FROM', Order.NONE) || '""'
    const to = javascriptGenerator.valueToCode(block, 'TO', Order.NONE) || '""'
    return [`String(${text}).split(String(${from})).join(String(${to}))`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['text_reverse'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    return [`String(${text}).split('').reverse().join('')`, Order.FUNCTION_CALL]
  }

  // ===== LISTAS =====

  javascriptGenerator.forBlock['lists_create_empty'] = function() {
    return ['[]', Order.ATOMIC]
  }

  javascriptGenerator.forBlock['lists_create_with'] = function(block: any) {
    const items: string[] = []
    for (let i = 0; i < block.itemCount_; i++) {
      const item = javascriptGenerator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null'
      items.push(item)
    }
    return [`[${items.join(', ')}]`, Order.ATOMIC]
  }

  javascriptGenerator.forBlock['lists_add_item'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || 'null'
    return `${list}.push(${item});\n`
  }

  javascriptGenerator.forBlock['lists_is_in'] = function(block: any) {
    const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || 'null'
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`${list}.includes(${item})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['lists_length'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`${list}.length`, Order.MEMBER]
  }

  javascriptGenerator.forBlock['lists_is_empty'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`${list}.length === 0`, Order.EQUALITY]
  }

  javascriptGenerator.forBlock['lists_pick_random'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`${list}[Math.floor(Math.random() * ${list}.length)]`, Order.MEMBER]
  }

  javascriptGenerator.forBlock['lists_position_in'] = function(block: any) {
    const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || 'null'
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`(${list}.indexOf(${item}) + 1)`, Order.ADDITION]
  }

  javascriptGenerator.forBlock['lists_select_item'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1'
    return [`${list}[${index} - 1]`, Order.MEMBER]
  }

  javascriptGenerator.forBlock['lists_insert_item'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1'
    const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || 'null'
    return `${list}.splice(${index} - 1, 0, ${item});\n`
  }

  javascriptGenerator.forBlock['lists_replace_item'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1'
    const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || 'null'
    return `${list}[${index} - 1] = ${item};\n`
  }

  javascriptGenerator.forBlock['lists_remove_item'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1'
    return `${list}.splice(${index} - 1, 1);\n`
  }

  javascriptGenerator.forBlock['lists_copy'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`[...${list}]`, Order.ATOMIC]
  }

  javascriptGenerator.forBlock['lists_reverse'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`[...${list}].reverse()`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['lists_to_csv_row'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', Order.NONE) || '[]'
    return [`${list}.join(',')`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['lists_from_csv_row'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || '""'
    return [`String(${text}).split(',')`, Order.FUNCTION_CALL]
  }

  // ===== DICIONARIOS =====

  javascriptGenerator.forBlock['dictionaries_create_empty'] = function() {
    return ['{}', Order.ATOMIC]
  }

  javascriptGenerator.forBlock['dictionaries_create_with'] = function(block: any) {
    const pairs: string[] = []
    for (let i = 0; i < block.itemCount_; i++) {
      const key = javascriptGenerator.valueToCode(block, 'KEY' + i, Order.NONE) || '""'
      const value = javascriptGenerator.valueToCode(block, 'VALUE' + i, Order.NONE) || 'null'
      pairs.push(`[${key}]: ${value}`)
    }
    return [`{${pairs.join(', ')}}`, Order.ATOMIC]
  }

  javascriptGenerator.forBlock['dictionaries_pair'] = function(block: any) {
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || '""'
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    return [`{${key}: ${value}}`, Order.ATOMIC]
  }

  javascriptGenerator.forBlock['dictionaries_get_value'] = function(block: any) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || '""'
    const notFound = javascriptGenerator.valueToCode(block, 'NOTFOUND', Order.NONE) || 'null'
    return [`(${dict}[${key}] !== undefined ? ${dict}[${key}] : ${notFound})`, Order.CONDITIONAL]
  }

  javascriptGenerator.forBlock['dictionaries_set_value'] = function(block: any) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || '""'
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    return `${dict}[${key}] = ${value};\n`
  }

  javascriptGenerator.forBlock['dictionaries_delete_pair'] = function(block: any) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || '""'
    return `delete ${dict}[${key}];\n`
  }

  javascriptGenerator.forBlock['dictionaries_get_keys'] = function(block: any) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    return [`Object.keys(${dict})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['dictionaries_get_values'] = function(block: any) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    return [`Object.values(${dict})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['dictionaries_is_key_in'] = function(block: any) {
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || '""'
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    return [`(${key} in ${dict})`, Order.RELATIONAL]
  }

  javascriptGenerator.forBlock['dictionaries_length'] = function(block: any) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', Order.NONE) || '{}'
    return [`Object.keys(${dict}).length`, Order.MEMBER]
  }

  // ===== CORES =====
  
  const colors: Record<string, string> = {
    'color_black': '"#000000"',
    'color_white': '"#FFFFFF"',
    'color_red': '"#FF0000"',
    'color_pink': '"#FFC0CB"',
    'color_orange': '"#FFA500"',
    'color_yellow': '"#FFFF00"',
    'color_green': '"#00FF00"',
    'color_cyan': '"#00FFFF"',
    'color_blue': '"#0000FF"',
    'color_magenta': '"#FF00FF"',
    'color_light_gray': '"#D3D3D3"',
    'color_gray': '"#808080"',
    'color_dark_gray': '"#404040"'
  }

  Object.entries(colors).forEach(([blockName, colorValue]) => {
    javascriptGenerator.forBlock[blockName] = function() {
      return [colorValue, Order.ATOMIC]
    }
  })

  javascriptGenerator.forBlock['color_make_color'] = function(block: any) {
    const r = javascriptGenerator.valueToCode(block, 'RED', Order.NONE) || '0'
    const g = javascriptGenerator.valueToCode(block, 'GREEN', Order.NONE) || '0'
    const b = javascriptGenerator.valueToCode(block, 'BLUE', Order.NONE) || '0'
    return [`\`rgb(\${${r}},\${${g}},\${${b}})\``, Order.ATOMIC]
  }

  javascriptGenerator.forBlock['color_split'] = function(block: any) {
    const color = javascriptGenerator.valueToCode(block, 'COLOR', Order.NONE) || '"#000000"'
    return [`__runtime.splitColor(${color})`, Order.FUNCTION_CALL]
  }

  // ===== VARIAVEIS GLOBAIS =====

  javascriptGenerator.forBlock['global_declaration'] = function(block: any) {
    const name = block.getFieldValue('NAME') || 'variavel'
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    return `__globals.${name} = ${value};\n`
  }

  javascriptGenerator.forBlock['lexical_variable_get'] = function(block: any) {
    const name = block.getFieldValue('VAR') || 'variavel'
    // Determinar se eh global ou local
    if (name.startsWith('global ')) {
      return [`__globals.${name.replace('global ', '')}`, Order.MEMBER]
    }
    return [name, Order.ATOMIC]
  }

  javascriptGenerator.forBlock['lexical_variable_set'] = function(block: any) {
    const name = block.getFieldValue('VAR') || 'variavel'
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    if (name.startsWith('global ')) {
      return `__globals.${name.replace('global ', '')} = ${value};\n`
    }
    return `${name} = ${value};\n`
  }

  // ===== PROCEDIMENTOS =====

  javascriptGenerator.forBlock['procedures_defnoreturn'] = function(block: any) {
    const name = block.getFieldValue('NAME') || 'procedimento'
    const statements = javascriptGenerator.statementToCode(block, 'STACK')
    return `function ${name}() {\n${statements}}\n`
  }

  javascriptGenerator.forBlock['procedures_defreturn'] = function(block: any) {
    const name = block.getFieldValue('NAME') || 'funcao'
    const statements = javascriptGenerator.statementToCode(block, 'STACK')
    const returnValue = javascriptGenerator.valueToCode(block, 'RETURN', Order.NONE) || 'null'
    return `function ${name}() {\n${statements}return ${returnValue};\n}\n`
  }

  javascriptGenerator.forBlock['procedures_callnoreturn'] = function(block: any) {
    const name = block.getFieldValue('NAME') || 'procedimento'
    return `${name}();\n`
  }

  javascriptGenerator.forBlock['procedures_callreturn'] = function(block: any) {
    const name = block.getFieldValue('NAME') || 'funcao'
    return [`${name}()`, Order.FUNCTION_CALL]
  }

  // ===== COMPONENTES =====

  // Evento de componente (quando Button1.Click fazer)
  javascriptGenerator.forBlock['component_event'] = function(block: any) {
    const component = block.getFieldValue('COMPONENT') || 'Component1'
    const event = block.getFieldValue('EVENT') || 'Click'
    const statements = javascriptGenerator.statementToCode(block, 'DO')
    return `__runtime.on('${component}', '${event}', function() {\n${statements}});\n`
  }

  // Obter propriedade de componente
  javascriptGenerator.forBlock['component_get'] = function(block: any) {
    const component = block.getFieldValue('COMPONENT') || 'Component1'
    const property = block.getFieldValue('PROPERTY') || 'Text'
    return [`__runtime.get('${component}', '${property}')`, Order.FUNCTION_CALL]
  }

  // Definir propriedade de componente
  javascriptGenerator.forBlock['component_set'] = function(block: any) {
    const component = block.getFieldValue('COMPONENT') || 'Component1'
    const property = block.getFieldValue('PROPERTY') || 'Text'
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '""'
    return `__runtime.set('${component}', '${property}', ${value});\n`
  }

  // Chamar metodo de componente
  javascriptGenerator.forBlock['component_method'] = function(block: any) {
    const component = block.getFieldValue('COMPONENT') || 'Component1'
    const method = block.getFieldValue('METHOD') || 'DoSomething'
    // Coletar argumentos se houver
    const args: string[] = []
    for (let i = 0; i < 10; i++) {
      const arg = javascriptGenerator.valueToCode(block, 'ARG' + i, Order.NONE)
      if (arg) args.push(arg)
      else break
    }
    return `__runtime.call('${component}', '${method}', [${args.join(', ')}]);\n`
  }

  // Chamar metodo com retorno
  javascriptGenerator.forBlock['component_method_with_return'] = function(block: any) {
    const component = block.getFieldValue('COMPONENT') || 'Component1'
    const method = block.getFieldValue('METHOD') || 'DoSomething'
    const args: string[] = []
    for (let i = 0; i < 10; i++) {
      const arg = javascriptGenerator.valueToCode(block, 'ARG' + i, Order.NONE)
      if (arg) args.push(arg)
      else break
    }
    return [`__runtime.call('${component}', '${method}', [${args.join(', ')}])`, Order.FUNCTION_CALL]
  }

  // ===== QUALQUER COMPONENTE =====

  javascriptGenerator.forBlock['any_component_blocks_method'] = function(block: any) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', Order.NONE) || 'null'
    const method = block.getFieldValue('METHOD') || 'Method'
    return `__runtime.callAny(${component}, '${method}', []);\n`
  }

  javascriptGenerator.forBlock['any_component_blocks_set_property'] = function(block: any) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', Order.NONE) || 'null'
    const property = block.getFieldValue('PROPERTY') || 'Property'
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null'
    return `__runtime.setAny(${component}, '${property}', ${value});\n`
  }

  javascriptGenerator.forBlock['any_component_blocks_get_property'] = function(block: any) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', Order.NONE) || 'null'
    const property = block.getFieldValue('PROPERTY') || 'Property'
    return [`__runtime.getAny(${component}, '${property}')`, Order.FUNCTION_CALL]
  }
}

/**
 * Gera codigo JavaScript a partir do workspace do Blockly
 */
export function generateCodeFromWorkspace(workspace: Blockly.WorkspaceSvg): string {
  // Registrar geradores se ainda nao registrados
  registerCodeGenerators()
  
  // Gerar codigo
  const code = javascriptGenerator.workspaceToCode(workspace)
  
  return code
}

/**
 * Gera codigo a partir do JSON salvo dos blocos
 */
export function generateCodeFromJSON(blocksJson: string): string {
  try {
    // Registrar geradores
    registerCodeGenerators()
    
    // Criar workspace temporario
    const tempDiv = document.createElement('div')
    tempDiv.style.display = 'none'
    document.body.appendChild(tempDiv)
    
    const tempWorkspace = Blockly.inject(tempDiv, {
      toolbox: '<xml></xml>'
    })
    
    // Carregar blocos
    const state = JSON.parse(blocksJson)
    Blockly.serialization.workspaces.load(state, tempWorkspace)
    
    // Gerar codigo
    const code = javascriptGenerator.workspaceToCode(tempWorkspace)
    
    // Limpar
    tempWorkspace.dispose()
    document.body.removeChild(tempDiv)
    
    return code
  } catch (e) {
    console.error('Erro ao gerar codigo:', e)
    return ''
  }
}

/**
 * Runtime wrapper para executar codigo gerado
 */
export function createRuntime(
  components: Record<string, any>,
  updateComponent: (name: string, props: Record<string, any>) => void,
  showNotification: (message: string) => void
) {
  const eventHandlers: Record<string, Record<string, Function[]>> = {}
  const globals: Record<string, any> = {}
  
  return {
    __globals: globals,
    __runtime: {
      // Eventos
      on: (component: string, event: string, handler: Function) => {
        if (!eventHandlers[component]) eventHandlers[component] = {}
        if (!eventHandlers[component][event]) eventHandlers[component][event] = []
        eventHandlers[component][event].push(handler)
      },
      
      trigger: (component: string, event: string, ...args: any[]) => {
        const handlers = eventHandlers[component]?.[event] || []
        handlers.forEach(h => h(...args))
      },
      
      // Propriedades
      get: (component: string, property: string) => {
        return components[component]?.[property] ?? null
      },
      
      set: (component: string, property: string, value: any) => {
        updateComponent(component, { [property]: value })
      },
      
      // Metodos
      call: (component: string, method: string, args: any[]) => {
        // Implementar chamadas de metodos especificos
        if (method === 'ShowAlert') {
          showNotification(args[0] || 'Alerta')
          return
        }
        console.log(`[Runtime] ${component}.${method}(${args.join(', ')})`)
      },
      
      // Any Component
      getAny: (component: any, property: string) => {
        if (typeof component === 'string') {
          return components[component]?.[property] ?? null
        }
        return component?.[property] ?? null
      },
      
      setAny: (component: any, property: string, value: any) => {
        if (typeof component === 'string') {
          updateComponent(component, { [property]: value })
        }
      },
      
      callAny: (component: any, method: string, args: any[]) => {
        const name = typeof component === 'string' ? component : component?.$Name
        if (name) {
          return createRuntime(components, updateComponent, showNotification).__runtime.call(name, method, args)
        }
      },
      
      // Telas
      openScreen: (screenName: string) => {
        showNotification(`Abrindo tela: ${screenName}`)
      },
      
      openScreenWithValue: (screenName: string, value: any) => {
        showNotification(`Abrindo tela: ${screenName} com valor: ${JSON.stringify(value)}`)
      },
      
      closeScreen: () => {
        showNotification('Fechando tela')
      },
      
      closeScreenWithValue: (value: any) => {
        showNotification(`Fechando tela com valor: ${JSON.stringify(value)}`)
      },
      
      closeApp: () => {
        showNotification('Fechando aplicativo')
      },
      
      getStartValue: () => null,
      getPlainStartText: () => '',
      closeScreenWithPlainText: (text: string) => {
        showNotification(`Fechando com texto: ${text}`)
      },
      
      // Utilitarios
      setRandomSeed: (seed: number) => {
        // Implementar se necessario
      },
      
      splitColor: (color: string) => {
        // Parse hex color to RGB
        const hex = color.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16) || 0
        const g = parseInt(hex.substr(2, 2), 16) || 0
        const b = parseInt(hex.substr(4, 2), 16) || 0
        return [r, g, b]
      }
    },
    
    // Disparar evento de componente
    triggerEvent: (component: string, event: string, ...args: any[]) => {
      const handlers = eventHandlers[component]?.[event] || []
      handlers.forEach(h => h(...args))
    },
    
    // Obter todos os handlers registrados
    getEventHandlers: () => eventHandlers
  }
}
