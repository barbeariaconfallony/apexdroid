import { KodularComponent, ProjectData } from "./ide-types"

/**
 * Converte a estrutura do arquivo SCM (Designer) em blocos do Blockly (BKY)
 * Baseado na linguagem/propriedades definidas no JSON do projeto.
 */
export function convertScmToBlocks(project: ProjectData): any {
  const blocks: any[] = []
  let currentY = 20

  const allComponents: KodularComponent[] = []
  
  const extractComponents = (comp: KodularComponent) => {
    allComponents.push(comp)
    if (comp.$Components) {
      comp.$Components.forEach(extractComponents)
    }
  }

  if (project.Properties) {
    extractComponents(project.Properties)
  }

  // Mapeamento de componentes por nome para busca rapida
  const compMap: Record<string, KodularComponent> = {}
  allComponents.forEach(c => {
    compMap[c.$Name] = c
  })

  // Iterar componentes para encontrar logica embutida nas propriedades
  allComponents.forEach(comp => {
    // Exemplo: Temporizador com propriedade "Timer" apontando para uma acao
    // como "OpenScreen"
    
    const props = Object.keys(comp).filter(k => !k.startsWith("$"))
    
    props.forEach(prop => {
      const value = comp[prop]
      
      // Se o valor da propriedade e o nome de outro componente
      if (typeof value === "string" && compMap[value]) {
        const targetComp = compMap[value]
        
        // Se o componente de destino for uma acao conhecida (ex: OpenScreen)
        if (targetComp.$Type === "OpenScreen") {
          const eventBlock = createEventBlock(
            comp.$Name, 
            prop, // O nome da propriedade age como o evento (ex: Timer)
            createOpenScreenBlock(targetComp.ScreenName as string || "Screen1"),
            20, 
            currentY
          )
          blocks.push(eventBlock)
          currentY += 150
        }
      }
    })
  })

  return {
    languageVersion: 0,
    blocks: {
      blocks: blocks
    }
  }
}

/**
 * Cria um bloco de evento (kodular_event)
 */
function createEventBlock(component: string, event: string, statementBlock: any, x: number, y: number) {
  return {
    type: "component_event",
    x: x,
    y: y,
    fields: {
      COMPONENT: component,
      EVENT: event
    },
    inputs: {
      DO: {
        block: statementBlock
      }
    }
  }
}

/**
 * Cria um bloco de abrir tela
 */
function createOpenScreenBlock(screenName: string) {
  return {
    type: "controls_open_screen",
    inputs: {
      SCREEN_NAME: {
        block: {
          type: "text",
          fields: {
            TEXT: screenName
          }
        }
      }
    }
  }
}
