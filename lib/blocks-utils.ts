import { KodularComponent } from "./ide-types"

/**
 * Gera o XML do Toolbox para o Blockly com base nos componentes ativos.
 * Isso permite que o editor de blocos "enxergue" os componentes do Designer.
 */
export function generateDynamicToolbox(root: KodularComponent): string {
  const components: KodularComponent[] = []
  
  // Função recursiva para extrair todos os componentes da árvore SCM
  const extractComponents = (comp: KodularComponent) => {
    components.push(comp)
    if (comp.$Components) {
      comp.$Components.forEach(extractComponents)
    }
  }
  
  extractComponents(root)

  // Categorias padrão do Kodular/Blockly
  let toolboxXml = `
    <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
      <category name="Controle" colour="#FFAB19">
        <block type="controls_if"></block>
        <block type="controls_repeat_ext"></block>
        <block type="controls_whileUntil"></block>
        <block type="controls_for">
          <value name="FROM">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">10</field>
            </shadow>
          </value>
          <value name="BY">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
        </block>
      </category>
      <category name="Logica" colour="#4C97FF">
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_negate"></block>
        <block type="logic_boolean"></block>
        <block type="logic_null"></block>
      </category>
      <category name="Matemática" colour="#5962AD">
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
        <block type="math_single"></block>
        <block type="math_constant"></block>
      </category>
      <category name="Texto" colour="#59AD89">
        <block type="text"></block>
        <block type="text_join"></block>
        <block type="text_length"></block>
        <block type="text_isEmpty"></block>
      </category>
      <sep></sep>
      <category name="Variáveis" colour="#FF8C1A" custom="VARIABLE"></category>
      <category name="Procedimentos" colour="#FF661A" custom="PROCEDURE"></category>
      <sep></sep>
  `

  // Adicionar categorias dinâmicas para cada componente do projeto
  // No futuro, isso pode ser filtrado por tipo de componente para mostrar apenas blocos válidos
  components.forEach(comp => {
    const type = comp.$Type.split(".").pop() || comp.$Type
    const name = comp.$Name
    
    // Cores baseadas no tipo para facilitar identificação (estilo Kodular)
    let catColor = "#7B1FA2" // Padrão roxo
    if (type.includes("Arrangement")) catColor = "#455A64"
    if (type === "Button") catColor = "#004D40"
    if (type === "Label") catColor = "#1A237E"
    
    toolboxXml += `
      <category name="${name}" colour="${catColor}">
        <block type="kodular_event">
          <field name="COMPONENT">${name}</field>
          <field name="EVENT">Click</field>
        </block>
        <block type="kodular_set_property">
          <field name="COMPONENT">${name}</field>
          <field name="PROPERTY">Visible</field>
        </block>
        <block type="kodular_get_property">
          <field name="COMPONENT">${name}</field>
          <field name="PROPERTY">Visible</field>
        </block>
      </category>
    `
  })

  toolboxXml += `</xml>`
  return toolboxXml
}

/**
 * Registra as definições de blocos customizados do Kodular no Blockly.
 */
export function registerKodularBlocks(Blockly: any) {
  // Bloco de Evento (ex: quando Botão1.Clique)
  Blockly.Blocks['kodular_event'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("quando")
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([["Clique","Click"], ["CliqueLongo","LongClick"]]), "EVENT");
      this.appendStatementInput("DO")
          .setCheck(null)
          .appendField("fazer");
      this.setColour(20);
      this.setTooltip("Executa blocos quando um evento ocorre");
      this.setHelpUrl("");
    }
  };

  // Bloco de Definição de Propriedade (ex: ajustar Botão1.Texto para)
  Blockly.Blocks['kodular_set_property'] = {
    init: function() {
      this.appendValueInput("VALUE")
          .setCheck(null)
          .appendField("ajustar")
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([["Texto","Text"], ["Visível","Visible"], ["Cor de Fundo","BackgroundColor"]]), "PROPERTY")
          .appendField("para");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Altera uma propriedade do componente");
      this.setHelpUrl("");
    }
  };

  // Bloco de Obtenção de Propriedade (ex: Botão1.Texto)
  Blockly.Blocks['kodular_get_property'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(new Blockly.FieldLabelSerializable(""), "COMPONENT")
          .appendField(".")
          .appendField(new Blockly.FieldDropdown([["Texto","Text"], ["Visível","Visible"], ["Cor de Fundo","BackgroundColor"]]), "PROPERTY");
      this.setOutput(true, null);
      this.setColour(160);
      this.setTooltip("Obtém o valor de uma propriedade do componente");
      this.setHelpUrl("");
    }
  };
}
