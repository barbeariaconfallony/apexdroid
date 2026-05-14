import { KodularComponent } from "./ide-types"

/**
 * Cores estilo Kodular para as categorias
 */
const KODULAR_COLORS = {
  control: "#FFAB19",
  logic: "#4C97FF",
  math: "#5962AD",
  text: "#59AD89",
  lists: "#7B4397",
  dictionaries: "#AA47BC",
  colors: "#CF63CF",
  variables: "#FF8C1A",
  procedures: "#FF661A",
  components: "#8E24AA"
}

/**
 * Gera o XML do Toolbox completo estilo Kodular
 */
export function generateDynamicToolbox(root: KodularComponent): string {
  const components: KodularComponent[] = []
  
  const extractComponents = (comp: KodularComponent) => {
    components.push(comp)
    if (comp.$Components) {
      comp.$Components.forEach(extractComponents)
    }
  }
  
  extractComponents(root)

  let toolboxXml = `
    <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
      
      <!-- CONTROL -->
      <category name="Controle" colour="${KODULAR_COLORS.control}">
        <block type="controls_if"></block>
        <block type="controls_if">
          <mutation else="1"></mutation>
        </block>
        <block type="controls_if">
          <mutation elseif="1" else="1"></mutation>
        </block>
        <block type="kodular_if_then_else"></block>
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <shadow type="math_number"><field name="NUM">10</field></shadow>
          </value>
        </block>
        <block type="controls_whileUntil"></block>
        <block type="controls_for">
          <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
          <value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
          <value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        </block>
        <block type="controls_forEach"></block>
        <block type="kodular_for_each_dict"></block>
        <block type="controls_flow_statements"></block>
        <block type="kodular_break"></block>
        <block type="kodular_open_screen"></block>
        <block type="kodular_open_screen_with_value"></block>
        <block type="kodular_get_start_value"></block>
        <block type="kodular_get_plain_start_text"></block>
        <block type="kodular_close_screen"></block>
        <block type="kodular_close_screen_with_value"></block>
        <block type="kodular_close_screen_with_plain_text"></block>
        <block type="kodular_close_application"></block>
        <block type="kodular_do"></block>
        <block type="kodular_evaluate_but_ignore"></block>
      </category>

      <!-- LOGIC -->
      <category name="Logica" colour="${KODULAR_COLORS.logic}">
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_negate"></block>
        <block type="logic_boolean"></block>
        <block type="logic_null"></block>
        <block type="kodular_true"></block>
        <block type="kodular_false"></block>
      </category>

      <!-- MATH -->
      <category name="Matematica" colour="${KODULAR_COLORS.math}">
        <block type="math_number"><field name="NUM">0</field></block>
        <block type="math_arithmetic">
          <value name="A"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
          <value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        </block>
        <block type="kodular_math_compare"></block>
        <block type="math_single"></block>
        <block type="math_trig"></block>
        <block type="math_constant"></block>
        <block type="math_number_property"></block>
        <block type="math_round"></block>
        <block type="math_on_list"></block>
        <block type="math_modulo">
          <value name="DIVIDEND"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
          <value name="DIVISOR"><shadow type="math_number"><field name="NUM">3</field></shadow></value>
        </block>
        <block type="math_constrain">
          <value name="VALUE"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
          <value name="LOW"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
          <value name="HIGH"><shadow type="math_number"><field name="NUM">100</field></shadow></value>
        </block>
        <block type="math_random_int">
          <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
          <value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value>
        </block>
        <block type="math_random_float"></block>
        <block type="kodular_random_set_seed"></block>
        <block type="kodular_math_convert_number"></block>
        <block type="kodular_math_convert_deg_rad"></block>
        <block type="kodular_math_format_decimal"></block>
        <block type="kodular_math_is_number"></block>
        <block type="kodular_math_bitwise_and"></block>
        <block type="kodular_math_bitwise_or"></block>
        <block type="kodular_math_bitwise_xor"></block>
      </category>

      <!-- TEXT -->
      <category name="Texto" colour="${KODULAR_COLORS.text}">
        <block type="text"><field name="TEXT"></field></block>
        <block type="text_join"></block>
        <block type="text_append">
          <value name="TEXT"><shadow type="text"><field name="TEXT"></field></shadow></value>
        </block>
        <block type="text_length">
          <value name="VALUE"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_isEmpty">
          <value name="VALUE"><shadow type="text"><field name="TEXT"></field></shadow></value>
        </block>
        <block type="kodular_text_is_string"></block>
        <block type="text_indexOf">
          <value name="VALUE"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
          <value name="FIND"><shadow type="text"><field name="TEXT">b</field></shadow></value>
        </block>
        <block type="text_charAt">
          <value name="VALUE"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_getSubstring">
          <value name="STRING"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_changeCase">
          <value name="TEXT"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_trim">
          <value name="TEXT"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="kodular_text_compare"></block>
        <block type="kodular_text_contains"></block>
        <block type="kodular_text_split"></block>
        <block type="kodular_text_split_at_any"></block>
        <block type="kodular_text_split_at_first"></block>
        <block type="kodular_text_split_at_first_of_any"></block>
        <block type="kodular_text_split_at_spaces"></block>
        <block type="kodular_text_segment"></block>
        <block type="kodular_text_replace_all"></block>
        <block type="kodular_text_obfuscated"></block>
      </category>

      <!-- LISTS -->
      <category name="Listas" colour="${KODULAR_COLORS.lists}">
        <block type="lists_create_empty"></block>
        <block type="lists_create_with">
          <mutation items="3"></mutation>
        </block>
        <block type="lists_repeat">
          <value name="NUM"><shadow type="math_number"><field name="NUM">5</field></shadow></value>
        </block>
        <block type="lists_length"></block>
        <block type="lists_isEmpty"></block>
        <block type="lists_indexOf">
          <value name="VALUE"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="lists_getIndex"></block>
        <block type="lists_setIndex"></block>
        <block type="kodular_list_add_items"></block>
        <block type="kodular_list_append"></block>
        <block type="kodular_list_copy"></block>
        <block type="kodular_list_is_list"></block>
        <block type="kodular_list_is_in_list"></block>
        <block type="kodular_list_pick_random"></block>
        <block type="kodular_list_remove_item"></block>
        <block type="kodular_list_insert_item"></block>
        <block type="kodular_list_replace_item"></block>
        <block type="kodular_list_reverse"></block>
        <block type="kodular_list_join_with_separator"></block>
        <block type="kodular_list_from_csv_row"></block>
        <block type="kodular_list_from_csv_table"></block>
        <block type="kodular_list_to_csv_row"></block>
        <block type="kodular_list_to_csv_table"></block>
        <block type="kodular_list_lookup_pairs"></block>
      </category>

      <!-- DICTIONARIES -->
      <category name="Dicionarios" colour="${KODULAR_COLORS.dictionaries}">
        <block type="kodular_dict_create_empty"></block>
        <block type="kodular_dict_make"></block>
        <block type="kodular_dict_pair"></block>
        <block type="kodular_dict_get_value"></block>
        <block type="kodular_dict_set_value"></block>
        <block type="kodular_dict_delete_entry"></block>
        <block type="kodular_dict_get_keys"></block>
        <block type="kodular_dict_get_values"></block>
        <block type="kodular_dict_is_dict"></block>
        <block type="kodular_dict_is_key_in"></block>
        <block type="kodular_dict_size"></block>
        <block type="kodular_dict_to_list"></block>
        <block type="kodular_dict_from_list"></block>
        <block type="kodular_dict_copy"></block>
        <block type="kodular_dict_merge"></block>
        <block type="kodular_dict_get_value_at_key_path"></block>
        <block type="kodular_dict_set_value_for_key_path"></block>
        <block type="kodular_dict_list_by_walking_key_path"></block>
        <block type="kodular_dict_walk_all_at_level"></block>
      </category>

      <!-- COLORS -->
      <category name="Cores" colour="${KODULAR_COLORS.colors}">
        <block type="colour_picker"></block>
        <block type="kodular_color_black"></block>
        <block type="kodular_color_white"></block>
        <block type="kodular_color_red"></block>
        <block type="kodular_color_pink"></block>
        <block type="kodular_color_orange"></block>
        <block type="kodular_color_yellow"></block>
        <block type="kodular_color_green"></block>
        <block type="kodular_color_cyan"></block>
        <block type="kodular_color_blue"></block>
        <block type="kodular_color_magenta"></block>
        <block type="kodular_color_light_gray"></block>
        <block type="kodular_color_gray"></block>
        <block type="kodular_color_dark_gray"></block>
        <block type="kodular_make_color"></block>
        <block type="kodular_split_color"></block>
      </category>

      <sep></sep>

      <!-- VARIABLES -->
      <category name="Variaveis" colour="${KODULAR_COLORS.variables}" custom="VARIABLE">
      </category>

      <!-- PROCEDURES -->
      <category name="Procedimentos" colour="${KODULAR_COLORS.procedures}" custom="PROCEDURE">
      </category>

      <sep></sep>

      <!-- DYNAMIC COMPONENT CATEGORIES -->
  `

  // Adicionar categorias para cada componente do projeto
  components.forEach(comp => {
    const type = comp.$Type.split(".").pop() || comp.$Type
    const name = comp.$Name
    
    toolboxXml += `
      <category name="${name}" colour="${KODULAR_COLORS.components}">
        <block type="kodular_event">
          <field name="COMPONENT">${name}</field>
          <field name="EVENT">Click</field>
        </block>
        <block type="kodular_event">
          <field name="COMPONENT">${name}</field>
          <field name="EVENT">LongClick</field>
        </block>
        <block type="kodular_set_property">
          <field name="COMPONENT">${name}</field>
          <field name="PROPERTY">Text</field>
        </block>
        <block type="kodular_get_property">
          <field name="COMPONENT">${name}</field>
          <field name="PROPERTY">Text</field>
        </block>
        <block type="kodular_call_method">
          <field name="COMPONENT">${name}</field>
          <field name="METHOD">ToString</field>
        </block>
      </category>
    `
  })

  toolboxXml += `
      <!-- ANY COMPONENT -->
      <category name="Qualquer Componente" colour="#607D8B">
        <block type="kodular_any_component_event"></block>
        <block type="kodular_any_component_set_property"></block>
        <block type="kodular_any_component_get_property"></block>
        <block type="kodular_any_component_call_method"></block>
      </category>
    </xml>`
    
  return toolboxXml
}

/**
 * Registra TODAS as definicoes de blocos customizados do Kodular
 */
export function registerKodularBlocks(Blockly: any) {
  
  // ==================== CONTROL BLOCKS ====================
  
  Blockly.Blocks['kodular_if_then_else'] = {
    init: function() {
      this.appendValueInput("CONDITION").setCheck("Boolean").appendField("se");
      this.appendValueInput("THEN").appendField("entao");
      this.appendValueInput("ELSE").appendField("senao");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Retorna o valor de 'entao' se verdadeiro, senao retorna 'senao'");
    }
  };

  Blockly.Blocks['kodular_break'] = {
    init: function() {
      this.appendDummyInput().appendField("quebrar");
      this.setPreviousStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Sai do loop atual");
    }
  };

  Blockly.Blocks['kodular_open_screen'] = {
    init: function() {
      this.appendValueInput("SCREEN").setCheck("String").appendField("abrir outra tela");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Abre outra tela pelo nome");
    }
  };

  Blockly.Blocks['kodular_open_screen_with_value'] = {
    init: function() {
      this.appendValueInput("SCREEN").setCheck("String").appendField("abrir outra tela");
      this.appendValueInput("VALUE").appendField("com valor inicial");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Abre outra tela passando um valor");
    }
  };

  Blockly.Blocks['kodular_get_start_value'] = {
    init: function() {
      this.appendDummyInput().appendField("obter valor inicial");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Retorna o valor passado pela tela anterior");
    }
  };

  Blockly.Blocks['kodular_get_plain_start_text'] = {
    init: function() {
      this.appendDummyInput().appendField("obter texto inicial simples");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Retorna o texto simples passado pela tela anterior");
    }
  };

  Blockly.Blocks['kodular_close_screen'] = {
    init: function() {
      this.appendDummyInput().appendField("fechar tela");
      this.setPreviousStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Fecha a tela atual");
    }
  };

  Blockly.Blocks['kodular_close_screen_with_value'] = {
    init: function() {
      this.appendValueInput("VALUE").appendField("fechar tela com valor");
      this.setPreviousStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Fecha a tela retornando um valor");
    }
  };

  Blockly.Blocks['kodular_close_screen_with_plain_text'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("fechar tela com texto simples");
      this.setPreviousStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Fecha a tela retornando texto simples");
    }
  };

  Blockly.Blocks['kodular_close_application'] = {
    init: function() {
      this.appendDummyInput().appendField("fechar aplicativo");
      this.setPreviousStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Fecha o aplicativo completamente");
    }
  };

  Blockly.Blocks['kodular_do'] = {
    init: function() {
      this.appendStatementInput("DO").appendField("fazer");
      this.appendValueInput("RESULT").appendField("resultado");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Executa comandos e retorna um resultado");
    }
  };

  Blockly.Blocks['kodular_evaluate_but_ignore'] = {
    init: function() {
      this.appendValueInput("VALUE").appendField("avaliar mas ignorar resultado");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Avalia uma expressao mas ignora o resultado");
    }
  };

  Blockly.Blocks['kodular_for_each_dict'] = {
    init: function() {
      this.appendValueInput("DICT").appendField("para cada chave").appendField(new Blockly.FieldVariable("chave"), "KEY").appendField("com valor").appendField(new Blockly.FieldVariable("valor"), "VALUE").appendField("no dicionario");
      this.appendStatementInput("DO").appendField("fazer");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.control);
      this.setTooltip("Itera sobre cada par chave-valor de um dicionario");
    }
  };

  // ==================== LOGIC BLOCKS ====================
  
  Blockly.Blocks['kodular_true'] = {
    init: function() {
      this.appendDummyInput().appendField("verdadeiro");
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.logic);
    }
  };

  Blockly.Blocks['kodular_false'] = {
    init: function() {
      this.appendDummyInput().appendField("falso");
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.logic);
    }
  };

  // ==================== MATH BLOCKS ====================
  
  Blockly.Blocks['kodular_math_compare'] = {
    init: function() {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([["=","EQ"],["\\u2260","NEQ"],["<","LT"],["\\u2264","LTE"],[">","GT"],["\\u2265","GTE"]]), "OP");
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_random_set_seed'] = {
    init: function() {
      this.appendValueInput("SEED").setCheck("Number").appendField("definir semente aleatoria para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_convert_number'] = {
    init: function() {
      this.appendValueInput("NUM").appendField("converter numero");
      this.appendDummyInput().appendField("base").appendField(new Blockly.FieldDropdown([["binario","2"],["octal","8"],["decimal","10"],["hexadecimal","16"]]), "BASE");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_convert_deg_rad'] = {
    init: function() {
      this.appendValueInput("NUM").appendField("converter");
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([["graus para radianos","DEG_TO_RAD"],["radianos para graus","RAD_TO_DEG"]]), "OP");
      this.setOutput(true, "Number");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_format_decimal'] = {
    init: function() {
      this.appendValueInput("NUM").setCheck("Number").appendField("formatar como decimal");
      this.appendValueInput("PLACES").setCheck("Number").appendField("casas");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_is_number'] = {
    init: function() {
      this.appendValueInput("VALUE").appendField("e um numero?");
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_bitwise_and'] = {
    init: function() {
      this.appendValueInput("A").setCheck("Number");
      this.appendValueInput("B").setCheck("Number").appendField("AND bit a bit");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_bitwise_or'] = {
    init: function() {
      this.appendValueInput("A").setCheck("Number");
      this.appendValueInput("B").setCheck("Number").appendField("OR bit a bit");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  Blockly.Blocks['kodular_math_bitwise_xor'] = {
    init: function() {
      this.appendValueInput("A").setCheck("Number");
      this.appendValueInput("B").setCheck("Number").appendField("XOR bit a bit");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(KODULAR_COLORS.math);
    }
  };

  // ==================== TEXT BLOCKS ====================
  
  Blockly.Blocks['kodular_text_is_string'] = {
    init: function() {
      this.appendValueInput("VALUE").appendField("e texto?");
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_compare'] = {
    init: function() {
      this.appendValueInput("TEXT1").setCheck("String").appendField("comparar textos");
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([["<","LT"],["=","EQ"],[">","GT"]]), "OP");
      this.appendValueInput("TEXT2").setCheck("String");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_contains'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("texto");
      this.appendValueInput("PIECE").setCheck("String").appendField("contem");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_split'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("dividir texto");
      this.appendValueInput("AT").setCheck("String").appendField("em");
      this.setInputsInline(true);
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_split_at_any'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("dividir texto");
      this.appendValueInput("AT").setCheck("Array").appendField("em qualquer");
      this.setInputsInline(true);
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_split_at_first'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("dividir no primeiro");
      this.appendValueInput("AT").setCheck("String").appendField("em");
      this.setInputsInline(true);
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_split_at_first_of_any'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("dividir no primeiro de qualquer");
      this.appendValueInput("AT").setCheck("Array").appendField("em");
      this.setInputsInline(true);
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_split_at_spaces'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("dividir nos espacos");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_segment'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("segmento de texto");
      this.appendValueInput("START").setCheck("Number").appendField("inicio");
      this.appendValueInput("LENGTH").setCheck("Number").appendField("tamanho");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_replace_all'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("substituir tudo");
      this.appendValueInput("FROM").setCheck("String").appendField("de");
      this.appendValueInput("TO").setCheck("String").appendField("para");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.text);
    }
  };

  Blockly.Blocks['kodular_text_obfuscated'] = {
    init: function() {
      this.appendDummyInput().appendField("texto ofuscado").appendField(new Blockly.FieldTextInput(""), "TEXT");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.text);
      this.setTooltip("Texto que fica oculto no codigo fonte");
    }
  };

  // ==================== LIST BLOCKS ====================
  
  Blockly.Blocks['kodular_list_add_items'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("adicionar itens a lista");
      this.appendValueInput("ITEM").appendField("item");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_append'] = {
    init: function() {
      this.appendValueInput("LIST1").setCheck("Array").appendField("anexar a lista");
      this.appendValueInput("LIST2").setCheck("Array");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_copy'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("copiar lista");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_is_list'] = {
    init: function() {
      this.appendValueInput("VALUE").appendField("e uma lista?");
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_is_in_list'] = {
    init: function() {
      this.appendValueInput("ITEM").appendField("item");
      this.appendValueInput("LIST").setCheck("Array").appendField("esta na lista?");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_pick_random'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("escolher item aleatorio");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_remove_item'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("remover item da lista");
      this.appendValueInput("INDEX").setCheck("Number").appendField("indice");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_insert_item'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("inserir item na lista");
      this.appendValueInput("INDEX").setCheck("Number").appendField("indice");
      this.appendValueInput("ITEM").appendField("item");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_replace_item'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("substituir item da lista");
      this.appendValueInput("INDEX").setCheck("Number").appendField("indice");
      this.appendValueInput("ITEM").appendField("por");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_reverse'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("reverter lista");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_join_with_separator'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("juntar itens com separador");
      this.appendValueInput("SEPARATOR").setCheck("String").appendField("separador");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_from_csv_row'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("lista de linha CSV");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_from_csv_table'] = {
    init: function() {
      this.appendValueInput("TEXT").setCheck("String").appendField("lista de tabela CSV");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_to_csv_row'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("lista para linha CSV");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_to_csv_table'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("lista para tabela CSV");
      this.setOutput(true, "String");
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  Blockly.Blocks['kodular_list_lookup_pairs'] = {
    init: function() {
      this.appendValueInput("KEY").appendField("buscar em pares");
      this.appendValueInput("PAIRS").setCheck("Array").appendField("chave");
      this.appendValueInput("DEFAULT").appendField("nao encontrado");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.lists);
    }
  };

  // ==================== DICTIONARY BLOCKS ====================
  
  Blockly.Blocks['kodular_dict_create_empty'] = {
    init: function() {
      this.appendDummyInput().appendField("criar dicionario vazio");
      this.setOutput(true, "Dictionary");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_make'] = {
    init: function() {
      this.appendDummyInput().appendField("criar dicionario");
      this.appendValueInput("PAIRS").setCheck("Array");
      this.setOutput(true, "Dictionary");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_pair'] = {
    init: function() {
      this.appendValueInput("KEY").appendField("par chave");
      this.appendValueInput("VALUE").appendField("valor");
      this.setInputsInline(true);
      this.setOutput(true, "Pair");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_get_value'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("obter valor para chave");
      this.appendValueInput("KEY");
      this.appendValueInput("DEFAULT").appendField("ou se nao encontrado");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_set_value'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("definir valor no dicionario");
      this.appendValueInput("KEY").appendField("para chave");
      this.appendValueInput("VALUE").appendField("para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_delete_entry'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("deletar entrada");
      this.appendValueInput("KEY").appendField("chave");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_get_keys'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("obter chaves");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_get_values'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("obter valores");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_is_dict'] = {
    init: function() {
      this.appendValueInput("VALUE").appendField("e um dicionario?");
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_is_key_in'] = {
    init: function() {
      this.appendValueInput("KEY").appendField("chave");
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("esta no dicionario?");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_size'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("tamanho do dicionario");
      this.setOutput(true, "Number");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_to_list'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("dicionario para lista de pares");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_from_list'] = {
    init: function() {
      this.appendValueInput("LIST").setCheck("Array").appendField("lista de pares para dicionario");
      this.setOutput(true, "Dictionary");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_copy'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("copiar dicionario");
      this.setOutput(true, "Dictionary");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_merge'] = {
    init: function() {
      this.appendValueInput("DICT1").setCheck("Dictionary").appendField("mesclar no dicionario");
      this.appendValueInput("DICT2").setCheck("Dictionary").appendField("de");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_get_value_at_key_path'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("obter valor no caminho");
      this.appendValueInput("PATH").setCheck("Array").appendField("caminho");
      this.setOutput(true, null);
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_set_value_for_key_path'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("definir valor no caminho");
      this.appendValueInput("PATH").setCheck("Array").appendField("caminho");
      this.appendValueInput("VALUE").appendField("para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_list_by_walking_key_path'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("listar caminhando pelo caminho");
      this.appendValueInput("PATH").setCheck("Array").appendField("caminho");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  Blockly.Blocks['kodular_dict_walk_all_at_level'] = {
    init: function() {
      this.appendValueInput("DICT").setCheck("Dictionary").appendField("caminhar tudo no nivel");
      this.appendValueInput("PATH").setCheck("Array").appendField("caminho");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.dictionaries);
    }
  };

  // ==================== COLOR BLOCKS ====================
  
  const colorBlocks = [
    { name: 'black', label: 'preto', color: '#000000' },
    { name: 'white', label: 'branco', color: '#FFFFFF' },
    { name: 'red', label: 'vermelho', color: '#FF0000' },
    { name: 'pink', label: 'rosa', color: '#FFC0CB' },
    { name: 'orange', label: 'laranja', color: '#FFA500' },
    { name: 'yellow', label: 'amarelo', color: '#FFFF00' },
    { name: 'green', label: 'verde', color: '#00FF00' },
    { name: 'cyan', label: 'ciano', color: '#00FFFF' },
    { name: 'blue', label: 'azul', color: '#0000FF' },
    { name: 'magenta', label: 'magenta', color: '#FF00FF' },
    { name: 'light_gray', label: 'cinza claro', color: '#C0C0C0' },
    { name: 'gray', label: 'cinza', color: '#808080' },
    { name: 'dark_gray', label: 'cinza escuro', color: '#404040' },
  ];

  colorBlocks.forEach(({ name, label, color }) => {
    Blockly.Blocks[`kodular_color_${name}`] = {
      init: function() {
        this.appendDummyInput().appendField(label).appendField(new Blockly.FieldColour(color), "COLOR");
        this.setOutput(true, "Colour");
        this.setColour(KODULAR_COLORS.colors);
      }
    };
  });

  Blockly.Blocks['kodular_make_color'] = {
    init: function() {
      this.appendValueInput("R").setCheck("Number").appendField("criar cor R");
      this.appendValueInput("G").setCheck("Number").appendField("G");
      this.appendValueInput("B").setCheck("Number").appendField("B");
      this.setInputsInline(true);
      this.setOutput(true, "Colour");
      this.setColour(KODULAR_COLORS.colors);
    }
  };

  Blockly.Blocks['kodular_split_color'] = {
    init: function() {
      this.appendValueInput("COLOR").setCheck("Colour").appendField("dividir cor");
      this.setOutput(true, "Array");
      this.setColour(KODULAR_COLORS.colors);
      this.setTooltip("Retorna uma lista com [R, G, B]");
    }
  };

  // ==================== COMPONENT BLOCKS ====================
  
  Blockly.Blocks['kodular_event'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("quando")
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([
            ["Clique","Click"], 
            ["CliqueLongo","LongClick"],
            ["FocoAlterado","FocusChanged"],
            ["Toque","Touch"],
            ["Arrastado","Dragged"]
          ]), "EVENT");
      this.appendStatementInput("DO").setCheck(null).appendField("fazer");
      this.setColour(20);
      this.setTooltip("Executa blocos quando um evento ocorre");
    }
  };

  Blockly.Blocks['kodular_set_property'] = {
    init: function() {
      this.appendValueInput("VALUE")
          .setCheck(null)
          .appendField("ajustar")
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([
            ["Texto","Text"], 
            ["Visivel","Visible"], 
            ["CorDeFundo","BackgroundColor"],
            ["CorDoTexto","TextColor"],
            ["Habilitado","Enabled"],
            ["Largura","Width"],
            ["Altura","Height"],
            ["FonteNegrito","FontBold"],
            ["TamanhoFonte","FontSize"],
            ["Dica","Hint"],
            ["Imagem","Image"]
          ]), "PROPERTY")
          .appendField("para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    }
  };

  Blockly.Blocks['kodular_get_property'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([
            ["Texto","Text"], 
            ["Visivel","Visible"], 
            ["CorDeFundo","BackgroundColor"],
            ["CorDoTexto","TextColor"],
            ["Habilitado","Enabled"],
            ["Largura","Width"],
            ["Altura","Height"],
            ["FonteNegrito","FontBold"],
            ["TamanhoFonte","FontSize"],
            ["Dica","Hint"],
            ["Imagem","Image"]
          ]), "PROPERTY");
      this.setOutput(true, null);
      this.setColour(160);
    }
  };

  Blockly.Blocks['kodular_call_method'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("chamar")
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([
            ["ToString","ToString"],
            ["Focar","RequestFocus"],
            ["Esconder","HideKeyboard"]
          ]), "METHOD");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    }
  };

  // ==================== ANY COMPONENT BLOCKS ====================
  
  Blockly.Blocks['kodular_any_component_event'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("quando qualquer")
          .appendField(new Blockly.FieldDropdown([
            ["Botao","Button"],
            ["Label","Label"],
            ["CaixaDeTexto","TextBox"],
            ["Imagem","Image"]
          ]), "TYPE")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([
            ["Clique","Click"],
            ["CliqueLongo","LongClick"]
          ]), "EVENT");
      this.appendStatementInput("DO").appendField("fazer");
      this.setColour("#607D8B");
    }
  };

  Blockly.Blocks['kodular_any_component_set_property'] = {
    init: function() {
      this.appendValueInput("COMPONENT").appendField("de qualquer");
      this.appendValueInput("VALUE")
          .appendField("ajustar")
          .appendField(new Blockly.FieldDropdown([
            ["Texto","Text"],
            ["Visivel","Visible"],
            ["CorDeFundo","BackgroundColor"]
          ]), "PROPERTY")
          .appendField("para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#607D8B");
    }
  };

  Blockly.Blocks['kodular_any_component_get_property'] = {
    init: function() {
      this.appendValueInput("COMPONENT").appendField("de qualquer");
      this.appendDummyInput()
          .appendField("obter")
          .appendField(new Blockly.FieldDropdown([
            ["Texto","Text"],
            ["Visivel","Visible"],
            ["CorDeFundo","BackgroundColor"]
          ]), "PROPERTY");
      this.setOutput(true, null);
      this.setColour("#607D8B");
    }
  };

  Blockly.Blocks['kodular_any_component_call_method'] = {
    init: function() {
      this.appendValueInput("COMPONENT").appendField("de qualquer");
      this.appendDummyInput()
          .appendField("chamar")
          .appendField(new Blockly.FieldDropdown([
            ["ToString","ToString"],
            ["Focar","RequestFocus"]
          ]), "METHOD");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#607D8B");
    }
  };
}
