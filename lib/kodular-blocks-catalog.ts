/**
 * Catalogo de blocos Kodular organizados por tipo de componente
 * Baseado na documentacao oficial do Kodular/App Inventor
 */

export interface KodularBlockDef {
  type: "event" | "method" | "property_get" | "property_set"
  name: string
  label: string
  description?: string
  params?: { name: string; type: string }[]
  returnType?: string
}

export interface ComponentBlocksCatalog {
  [componentType: string]: {
    events: KodularBlockDef[]
    methods: KodularBlockDef[]
    properties: KodularBlockDef[]
  }
}

// Catalogo completo de blocos por tipo de componente
export const KODULAR_BLOCKS_CATALOG: ComponentBlocksCatalog = {
  // ============ USER INTERFACE ============
  Button: {
    events: [
      { type: "event", name: "Click", label: "Quando clicado", description: "Disparado quando o botao e clicado" },
      { type: "event", name: "LongClick", label: "Quando pressionado longo", description: "Disparado quando o botao e pressionado por mais tempo" },
      { type: "event", name: "TouchDown", label: "Quando toque inicia", description: "Disparado quando o toque comeca" },
      { type: "event", name: "TouchUp", label: "Quando toque termina", description: "Disparado quando o toque termina" },
      { type: "event", name: "GotFocus", label: "Quando recebe foco", description: "Disparado quando o componente recebe foco" },
      { type: "event", name: "LostFocus", label: "Quando perde foco", description: "Disparado quando o componente perde foco" },
    ],
    methods: [
      { type: "method", name: "SetShadow", label: "Definir Sombra", params: [{ name: "x", type: "number" }, { name: "y", type: "number" }, { name: "radius", type: "number" }, { name: "color", type: "color" }] },
    ],
    properties: [
      { type: "property_get", name: "Text", label: "Texto", returnType: "text" },
      { type: "property_set", name: "Text", label: "Definir Texto", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Enabled", label: "Habilitado", returnType: "boolean" },
      { type: "property_set", name: "Enabled", label: "Definir Habilitado", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "FontBold", label: "Negrito", returnType: "boolean" },
      { type: "property_set", name: "FontBold", label: "Definir Negrito", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "FontItalic", label: "Italico", returnType: "boolean" },
      { type: "property_set", name: "FontItalic", label: "Definir Italico", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "FontSize", label: "Tamanho da Fonte", returnType: "number" },
      { type: "property_set", name: "FontSize", label: "Definir Tamanho da Fonte", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_set", name: "Height", label: "Definir Altura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_set", name: "Width", label: "Definir Largura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Image", label: "Imagem", returnType: "text" },
      { type: "property_set", name: "Image", label: "Definir Imagem", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "TextColor", label: "Cor do Texto", returnType: "color" },
      { type: "property_set", name: "TextColor", label: "Definir Cor do Texto", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
    ]
  },

  Label: {
    events: [
      { type: "event", name: "Click", label: "Quando clicado", description: "Disparado quando a label e clicada" },
      { type: "event", name: "LongClick", label: "Quando pressionado longo", description: "Disparado quando a label e pressionada por mais tempo" },
    ],
    methods: [
      { type: "method", name: "SetShadow", label: "Definir Sombra", params: [{ name: "x", type: "number" }, { name: "y", type: "number" }, { name: "radius", type: "number" }, { name: "color", type: "color" }] },
    ],
    properties: [
      { type: "property_get", name: "Text", label: "Texto", returnType: "text" },
      { type: "property_set", name: "Text", label: "Definir Texto", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "FontBold", label: "Negrito", returnType: "boolean" },
      { type: "property_set", name: "FontBold", label: "Definir Negrito", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "FontItalic", label: "Italico", returnType: "boolean" },
      { type: "property_set", name: "FontItalic", label: "Definir Italico", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "FontSize", label: "Tamanho da Fonte", returnType: "number" },
      { type: "property_set", name: "FontSize", label: "Definir Tamanho da Fonte", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_set", name: "Height", label: "Definir Altura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_set", name: "Width", label: "Definir Largura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "TextColor", label: "Cor do Texto", returnType: "color" },
      { type: "property_set", name: "TextColor", label: "Definir Cor do Texto", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "TextAlignment", label: "Alinhamento", returnType: "number" },
      { type: "property_set", name: "TextAlignment", label: "Definir Alinhamento", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "HasMargins", label: "Tem Margens", returnType: "boolean" },
      { type: "property_set", name: "HasMargins", label: "Definir Margens", params: [{ name: "value", type: "boolean" }] },
    ]
  },

  TextBox: {
    events: [
      { type: "event", name: "GotFocus", label: "Quando recebe foco", description: "Disparado quando o campo recebe foco" },
      { type: "event", name: "LostFocus", label: "Quando perde foco", description: "Disparado quando o campo perde foco" },
      { type: "event", name: "TextChanged", label: "Quando texto muda", description: "Disparado quando o texto e alterado" },
    ],
    methods: [
      { type: "method", name: "HideKeyboard", label: "Esconder Teclado" },
      { type: "method", name: "RequestFocus", label: "Solicitar Foco" },
      { type: "method", name: "SetShadow", label: "Definir Sombra", params: [{ name: "x", type: "number" }, { name: "y", type: "number" }, { name: "radius", type: "number" }, { name: "color", type: "color" }] },
    ],
    properties: [
      { type: "property_get", name: "Text", label: "Texto", returnType: "text" },
      { type: "property_set", name: "Text", label: "Definir Texto", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "Hint", label: "Dica", returnType: "text" },
      { type: "property_set", name: "Hint", label: "Definir Dica", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Enabled", label: "Habilitado", returnType: "boolean" },
      { type: "property_set", name: "Enabled", label: "Definir Habilitado", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "FontSize", label: "Tamanho da Fonte", returnType: "number" },
      { type: "property_set", name: "FontSize", label: "Definir Tamanho da Fonte", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "MultiLine", label: "Multiplas Linhas", returnType: "boolean" },
      { type: "property_set", name: "MultiLine", label: "Definir Multiplas Linhas", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "NumbersOnly", label: "Apenas Numeros", returnType: "boolean" },
      { type: "property_set", name: "NumbersOnly", label: "Definir Apenas Numeros", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "ReadOnly", label: "Somente Leitura", returnType: "boolean" },
      { type: "property_set", name: "ReadOnly", label: "Definir Somente Leitura", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "TextColor", label: "Cor do Texto", returnType: "color" },
      { type: "property_set", name: "TextColor", label: "Definir Cor do Texto", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
    ]
  },

  Image: {
    events: [
      { type: "event", name: "Click", label: "Quando clicado", description: "Disparado quando a imagem e clicada" },
      { type: "event", name: "LongClick", label: "Quando pressionado longo", description: "Disparado quando a imagem e pressionada por mais tempo" },
    ],
    methods: [],
    properties: [
      { type: "property_get", name: "Picture", label: "Imagem", returnType: "text" },
      { type: "property_set", name: "Picture", label: "Definir Imagem", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_set", name: "Height", label: "Definir Altura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_set", name: "Width", label: "Definir Largura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "Animation", label: "Animacao", returnType: "text" },
      { type: "property_set", name: "Animation", label: "Definir Animacao", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "Clickable", label: "Clicavel", returnType: "boolean" },
      { type: "property_set", name: "Clickable", label: "Definir Clicavel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "RotationAngle", label: "Angulo de Rotacao", returnType: "number" },
      { type: "property_set", name: "RotationAngle", label: "Definir Angulo de Rotacao", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "ScalePictureToFit", label: "Escalar para Caber", returnType: "boolean" },
      { type: "property_set", name: "ScalePictureToFit", label: "Definir Escalar para Caber", params: [{ name: "value", type: "boolean" }] },
    ]
  },

  // ============ LAYOUT ============
  HorizontalArrangement: {
    events: [
      { type: "event", name: "Click", label: "Quando clicado", description: "Disparado quando o arranjo e clicado" },
      { type: "event", name: "LongClick", label: "Quando pressionado longo", description: "Disparado quando o arranjo e pressionado por mais tempo" },
    ],
    methods: [],
    properties: [
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_set", name: "Height", label: "Definir Altura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_set", name: "Width", label: "Definir Largura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "AlignHorizontal", label: "Alinhamento Horizontal", returnType: "number" },
      { type: "property_set", name: "AlignHorizontal", label: "Definir Alinhamento Horizontal", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "AlignVertical", label: "Alinhamento Vertical", returnType: "number" },
      { type: "property_set", name: "AlignVertical", label: "Definir Alinhamento Vertical", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Image", label: "Imagem", returnType: "text" },
      { type: "property_set", name: "Image", label: "Definir Imagem", params: [{ name: "value", type: "text" }] },
    ]
  },

  VerticalArrangement: {
    events: [
      { type: "event", name: "Click", label: "Quando clicado", description: "Disparado quando o arranjo e clicado" },
      { type: "event", name: "LongClick", label: "Quando pressionado longo", description: "Disparado quando o arranjo e pressionado por mais tempo" },
    ],
    methods: [],
    properties: [
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_set", name: "Height", label: "Definir Altura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_set", name: "Width", label: "Definir Largura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "AlignHorizontal", label: "Alinhamento Horizontal", returnType: "number" },
      { type: "property_set", name: "AlignHorizontal", label: "Definir Alinhamento Horizontal", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "AlignVertical", label: "Alinhamento Vertical", returnType: "number" },
      { type: "property_set", name: "AlignVertical", label: "Definir Alinhamento Vertical", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Image", label: "Imagem", returnType: "text" },
      { type: "property_set", name: "Image", label: "Definir Imagem", params: [{ name: "value", type: "text" }] },
    ]
  },

  // ============ MEDIA ============
  Player: {
    events: [
      { type: "event", name: "Completed", label: "Quando completo", description: "Disparado quando a reproducao termina" },
      { type: "event", name: "OtherPlayerStarted", label: "Quando outro player inicia", description: "Disparado quando outro player comeca a tocar" },
    ],
    methods: [
      { type: "method", name: "Pause", label: "Pausar" },
      { type: "method", name: "Start", label: "Iniciar" },
      { type: "method", name: "Stop", label: "Parar" },
      { type: "method", name: "Vibrate", label: "Vibrar", params: [{ name: "milliseconds", type: "number" }] },
    ],
    properties: [
      { type: "property_get", name: "IsPlaying", label: "Esta Tocando", returnType: "boolean" },
      { type: "property_get", name: "Loop", label: "Repetir", returnType: "boolean" },
      { type: "property_set", name: "Loop", label: "Definir Repetir", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "PlayOnlyInForeground", label: "Tocar Apenas em Primeiro Plano", returnType: "boolean" },
      { type: "property_set", name: "PlayOnlyInForeground", label: "Definir Tocar Apenas em Primeiro Plano", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "Source", label: "Fonte", returnType: "text" },
      { type: "property_set", name: "Source", label: "Definir Fonte", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "Volume", label: "Volume", returnType: "number" },
      { type: "property_set", name: "Volume", label: "Definir Volume", params: [{ name: "value", type: "number" }] },
    ]
  },

  Sound: {
    events: [],
    methods: [
      { type: "method", name: "Pause", label: "Pausar" },
      { type: "method", name: "Play", label: "Tocar" },
      { type: "method", name: "Resume", label: "Continuar" },
      { type: "method", name: "Stop", label: "Parar" },
      { type: "method", name: "Vibrate", label: "Vibrar", params: [{ name: "milliseconds", type: "number" }] },
    ],
    properties: [
      { type: "property_get", name: "MinimumInterval", label: "Intervalo Minimo", returnType: "number" },
      { type: "property_set", name: "MinimumInterval", label: "Definir Intervalo Minimo", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Source", label: "Fonte", returnType: "text" },
      { type: "property_set", name: "Source", label: "Definir Fonte", params: [{ name: "value", type: "text" }] },
    ]
  },

  // ============ CONNECTIVITY ============
  Web: {
    events: [
      { type: "event", name: "GotFile", label: "Quando recebe arquivo", description: "Disparado quando um arquivo e recebido" },
      { type: "event", name: "GotText", label: "Quando recebe texto", description: "Disparado quando texto e recebido" },
      { type: "event", name: "TimedOut", label: "Quando tempo esgota", description: "Disparado quando a requisicao expira" },
    ],
    methods: [
      { type: "method", name: "ClearCookies", label: "Limpar Cookies" },
      { type: "method", name: "Delete", label: "Deletar" },
      { type: "method", name: "Get", label: "Obter" },
      { type: "method", name: "PostFile", label: "Enviar Arquivo", params: [{ name: "path", type: "text" }] },
      { type: "method", name: "PostText", label: "Enviar Texto", params: [{ name: "text", type: "text" }] },
      { type: "method", name: "PostTextWithEncoding", label: "Enviar Texto com Encoding", params: [{ name: "text", type: "text" }, { name: "encoding", type: "text" }] },
      { type: "method", name: "Put", label: "Colocar", params: [{ name: "text", type: "text" }] },
      { type: "method", name: "PutFile", label: "Colocar Arquivo", params: [{ name: "path", type: "text" }] },
      { type: "method", name: "PutText", label: "Colocar Texto", params: [{ name: "text", type: "text" }] },
      { type: "method", name: "UriEncode", label: "Codificar URI", params: [{ name: "text", type: "text" }], returnType: "text" },
      { type: "method", name: "XMLTextDecode", label: "Decodificar XML", params: [{ name: "text", type: "text" }], returnType: "any" },
      { type: "method", name: "JsonTextDecode", label: "Decodificar JSON", params: [{ name: "text", type: "text" }], returnType: "any" },
      { type: "method", name: "JsonObjectEncode", label: "Codificar JSON", params: [{ name: "object", type: "any" }], returnType: "text" },
      { type: "method", name: "BuildRequestData", label: "Construir Dados da Requisicao", params: [{ name: "list", type: "list" }], returnType: "text" },
      { type: "method", name: "HtmlTextDecode", label: "Decodificar HTML", params: [{ name: "text", type: "text" }], returnType: "text" },
    ],
    properties: [
      { type: "property_get", name: "AllowCookies", label: "Permitir Cookies", returnType: "boolean" },
      { type: "property_set", name: "AllowCookies", label: "Definir Permitir Cookies", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "RequestHeaders", label: "Cabecalhos da Requisicao", returnType: "list" },
      { type: "property_set", name: "RequestHeaders", label: "Definir Cabecalhos da Requisicao", params: [{ name: "value", type: "list" }] },
      { type: "property_get", name: "ResponseFileName", label: "Nome do Arquivo de Resposta", returnType: "text" },
      { type: "property_set", name: "ResponseFileName", label: "Definir Nome do Arquivo de Resposta", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "SaveResponse", label: "Salvar Resposta", returnType: "boolean" },
      { type: "property_set", name: "SaveResponse", label: "Definir Salvar Resposta", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "Timeout", label: "Tempo Limite", returnType: "number" },
      { type: "property_set", name: "Timeout", label: "Definir Tempo Limite", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Url", label: "URL", returnType: "text" },
      { type: "property_set", name: "Url", label: "Definir URL", params: [{ name: "value", type: "text" }] },
    ]
  },

  // ============ STORAGE ============
  TinyDB: {
    events: [],
    methods: [
      { type: "method", name: "ClearAll", label: "Limpar Tudo" },
      { type: "method", name: "ClearTag", label: "Limpar Tag", params: [{ name: "tag", type: "text" }] },
      { type: "method", name: "GetTags", label: "Obter Tags", returnType: "list" },
      { type: "method", name: "GetValue", label: "Obter Valor", params: [{ name: "tag", type: "text" }, { name: "valueIfTagNotThere", type: "any" }], returnType: "any" },
      { type: "method", name: "StoreValue", label: "Armazenar Valor", params: [{ name: "tag", type: "text" }, { name: "valueToStore", type: "any" }] },
    ],
    properties: [
      { type: "property_get", name: "Namespace", label: "Namespace", returnType: "text" },
      { type: "property_set", name: "Namespace", label: "Definir Namespace", params: [{ name: "value", type: "text" }] },
    ]
  },

  File: {
    events: [
      { type: "event", name: "AfterFileSaved", label: "Apos Arquivo Salvo", description: "Disparado apos salvar arquivo" },
      { type: "event", name: "GotText", label: "Quando Recebe Texto", description: "Disparado ao ler texto de arquivo" },
    ],
    methods: [
      { type: "method", name: "AppendToFile", label: "Adicionar ao Arquivo", params: [{ name: "text", type: "text" }, { name: "fileName", type: "text" }] },
      { type: "method", name: "Delete", label: "Deletar", params: [{ name: "fileName", type: "text" }] },
      { type: "method", name: "Exists", label: "Existe", params: [{ name: "scope", type: "text" }, { name: "path", type: "text" }], returnType: "boolean" },
      { type: "method", name: "IsDirectory", label: "E Diretorio", params: [{ name: "scope", type: "text" }, { name: "path", type: "text" }], returnType: "boolean" },
      { type: "method", name: "ListDirectory", label: "Listar Diretorio", params: [{ name: "scope", type: "text" }, { name: "path", type: "text" }], returnType: "list" },
      { type: "method", name: "MakeDirectory", label: "Criar Diretorio", params: [{ name: "scope", type: "text" }, { name: "path", type: "text" }], returnType: "boolean" },
      { type: "method", name: "MakeFullPath", label: "Criar Caminho Completo", params: [{ name: "scope", type: "text" }, { name: "path", type: "text" }], returnType: "text" },
      { type: "method", name: "ReadFrom", label: "Ler De", params: [{ name: "fileName", type: "text" }] },
      { type: "method", name: "RemoveDirectory", label: "Remover Diretorio", params: [{ name: "scope", type: "text" }, { name: "path", type: "text" }, { name: "recursive", type: "boolean" }], returnType: "boolean" },
      { type: "method", name: "SaveFile", label: "Salvar Arquivo", params: [{ name: "text", type: "text" }, { name: "fileName", type: "text" }] },
    ],
    properties: [
      { type: "property_get", name: "DefaultScope", label: "Escopo Padrao", returnType: "text" },
      { type: "property_set", name: "DefaultScope", label: "Definir Escopo Padrao", params: [{ name: "value", type: "text" }] },
    ]
  },

  // ============ SENSORS ============
  Clock: {
    events: [
      { type: "event", name: "Timer", label: "Temporizador", description: "Disparado a cada intervalo definido" },
    ],
    methods: [
      { type: "method", name: "AddDays", label: "Adicionar Dias", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddDuration", label: "Adicionar Duracao", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddHours", label: "Adicionar Horas", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddMinutes", label: "Adicionar Minutos", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddMonths", label: "Adicionar Meses", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddSeconds", label: "Adicionar Segundos", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddWeeks", label: "Adicionar Semanas", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "AddYears", label: "Adicionar Anos", params: [{ name: "instant", type: "instant" }, { name: "quantity", type: "number" }], returnType: "instant" },
      { type: "method", name: "DayOfMonth", label: "Dia do Mes", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "Duration", label: "Duracao", params: [{ name: "start", type: "instant" }, { name: "end", type: "instant" }], returnType: "number" },
      { type: "method", name: "DurationToDays", label: "Duracao em Dias", params: [{ name: "duration", type: "number" }], returnType: "number" },
      { type: "method", name: "DurationToHours", label: "Duracao em Horas", params: [{ name: "duration", type: "number" }], returnType: "number" },
      { type: "method", name: "DurationToMinutes", label: "Duracao em Minutos", params: [{ name: "duration", type: "number" }], returnType: "number" },
      { type: "method", name: "DurationToSeconds", label: "Duracao em Segundos", params: [{ name: "duration", type: "number" }], returnType: "number" },
      { type: "method", name: "DurationToWeeks", label: "Duracao em Semanas", params: [{ name: "duration", type: "number" }], returnType: "number" },
      { type: "method", name: "FormatDate", label: "Formatar Data", params: [{ name: "instant", type: "instant" }, { name: "pattern", type: "text" }], returnType: "text" },
      { type: "method", name: "FormatDateTime", label: "Formatar Data e Hora", params: [{ name: "instant", type: "instant" }, { name: "pattern", type: "text" }], returnType: "text" },
      { type: "method", name: "FormatTime", label: "Formatar Hora", params: [{ name: "instant", type: "instant" }], returnType: "text" },
      { type: "method", name: "GetMillis", label: "Obter Milissegundos", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "Hour", label: "Hora", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "MakeDate", label: "Criar Data", params: [{ name: "year", type: "number" }, { name: "month", type: "number" }, { name: "day", type: "number" }], returnType: "instant" },
      { type: "method", name: "MakeInstant", label: "Criar Instante", params: [{ name: "text", type: "text" }], returnType: "instant" },
      { type: "method", name: "MakeInstantFromMillis", label: "Criar Instante de Milissegundos", params: [{ name: "millis", type: "number" }], returnType: "instant" },
      { type: "method", name: "MakeInstantFromParts", label: "Criar Instante de Partes", params: [{ name: "year", type: "number" }, { name: "month", type: "number" }, { name: "day", type: "number" }, { name: "hour", type: "number" }, { name: "minute", type: "number" }, { name: "second", type: "number" }], returnType: "instant" },
      { type: "method", name: "MakeTime", label: "Criar Hora", params: [{ name: "hour", type: "number" }, { name: "minute", type: "number" }, { name: "second", type: "number" }], returnType: "instant" },
      { type: "method", name: "Minute", label: "Minuto", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "Month", label: "Mes", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "MonthName", label: "Nome do Mes", params: [{ name: "instant", type: "instant" }], returnType: "text" },
      { type: "method", name: "Now", label: "Agora", returnType: "instant" },
      { type: "method", name: "Second", label: "Segundo", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "SystemTime", label: "Hora do Sistema", returnType: "number" },
      { type: "method", name: "Weekday", label: "Dia da Semana", params: [{ name: "instant", type: "instant" }], returnType: "number" },
      { type: "method", name: "WeekdayName", label: "Nome do Dia da Semana", params: [{ name: "instant", type: "instant" }], returnType: "text" },
      { type: "method", name: "Year", label: "Ano", params: [{ name: "instant", type: "instant" }], returnType: "number" },
    ],
    properties: [
      { type: "property_get", name: "TimerAlwaysFires", label: "Timer Sempre Dispara", returnType: "boolean" },
      { type: "property_set", name: "TimerAlwaysFires", label: "Definir Timer Sempre Dispara", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "TimerEnabled", label: "Timer Habilitado", returnType: "boolean" },
      { type: "property_set", name: "TimerEnabled", label: "Definir Timer Habilitado", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "TimerInterval", label: "Intervalo do Timer", returnType: "number" },
      { type: "property_set", name: "TimerInterval", label: "Definir Intervalo do Timer", params: [{ name: "value", type: "number" }] },
    ]
  },

  // ============ SOCIAL ============
  Notifier: {
    events: [
      { type: "event", name: "AfterChoosing", label: "Apos Escolha", description: "Disparado apos o usuario fazer uma escolha" },
      { type: "event", name: "AfterTextInput", label: "Apos Entrada de Texto", description: "Disparado apos o usuario digitar texto" },
      { type: "event", name: "ChoosingCanceled", label: "Escolha Cancelada", description: "Disparado quando o usuario cancela" },
      { type: "event", name: "TextInputCanceled", label: "Entrada de Texto Cancelada", description: "Disparado quando a entrada e cancelada" },
    ],
    methods: [
      { type: "method", name: "DismissProgressDialog", label: "Fechar Dialogo de Progresso" },
      { type: "method", name: "LogError", label: "Registrar Erro", params: [{ name: "message", type: "text" }] },
      { type: "method", name: "LogInfo", label: "Registrar Info", params: [{ name: "message", type: "text" }] },
      { type: "method", name: "LogWarning", label: "Registrar Aviso", params: [{ name: "message", type: "text" }] },
      { type: "method", name: "ShowAlert", label: "Mostrar Alerta", params: [{ name: "notice", type: "text" }] },
      { type: "method", name: "ShowChooseDialog", label: "Mostrar Dialogo de Escolha", params: [{ name: "message", type: "text" }, { name: "title", type: "text" }, { name: "button1Text", type: "text" }, { name: "button2Text", type: "text" }, { name: "cancelable", type: "boolean" }] },
      { type: "method", name: "ShowMessageDialog", label: "Mostrar Dialogo de Mensagem", params: [{ name: "message", type: "text" }, { name: "title", type: "text" }, { name: "buttonText", type: "text" }] },
      { type: "method", name: "ShowPasswordDialog", label: "Mostrar Dialogo de Senha", params: [{ name: "message", type: "text" }, { name: "title", type: "text" }, { name: "cancelable", type: "boolean" }] },
      { type: "method", name: "ShowProgressDialog", label: "Mostrar Dialogo de Progresso", params: [{ name: "message", type: "text" }, { name: "title", type: "text" }] },
      { type: "method", name: "ShowTextDialog", label: "Mostrar Dialogo de Texto", params: [{ name: "message", type: "text" }, { name: "title", type: "text" }, { name: "cancelable", type: "boolean" }] },
    ],
    properties: [
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "NotifierLength", label: "Duracao do Notificador", returnType: "number" },
      { type: "property_set", name: "NotifierLength", label: "Definir Duracao do Notificador", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "TextColor", label: "Cor do Texto", returnType: "color" },
      { type: "property_set", name: "TextColor", label: "Definir Cor do Texto", params: [{ name: "value", type: "color" }] },
    ]
  },

  // ============ SCREEN / FORM ============
  Screen: {
    events: [
      { type: "event", name: "Initialize", label: "Quando Inicializa", description: "Disparado quando a tela inicia" },
      { type: "event", name: "BackPressed", label: "Quando Voltar Pressionado", description: "Disparado quando o usuario pressiona voltar" },
      { type: "event", name: "ErrorOccurred", label: "Quando Erro Ocorre", description: "Disparado quando um erro ocorre" },
      { type: "event", name: "OtherScreenClosed", label: "Quando Outra Tela Fecha", description: "Disparado quando outra tela fecha" },
      { type: "event", name: "PermissionDenied", label: "Quando Permissao Negada", description: "Disparado quando permissao e negada" },
      { type: "event", name: "PermissionGranted", label: "Quando Permissao Concedida", description: "Disparado quando permissao e concedida" },
      { type: "event", name: "ScreenOrientationChanged", label: "Quando Orientacao Muda", description: "Disparado quando a orientacao muda" },
    ],
    methods: [
      { type: "method", name: "AskForPermission", label: "Pedir Permissao", params: [{ name: "permissionName", type: "text" }] },
      { type: "method", name: "HideKeyboard", label: "Esconder Teclado" },
    ],
    properties: [
      { type: "property_get", name: "AboutScreen", label: "Sobre a Tela", returnType: "text" },
      { type: "property_set", name: "AboutScreen", label: "Definir Sobre a Tela", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "AlignHorizontal", label: "Alinhamento Horizontal", returnType: "number" },
      { type: "property_set", name: "AlignHorizontal", label: "Definir Alinhamento Horizontal", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "AlignVertical", label: "Alinhamento Vertical", returnType: "number" },
      { type: "property_set", name: "AlignVertical", label: "Definir Alinhamento Vertical", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "BackgroundColor", label: "Cor de Fundo", returnType: "color" },
      { type: "property_set", name: "BackgroundColor", label: "Definir Cor de Fundo", params: [{ name: "value", type: "color" }] },
      { type: "property_get", name: "BackgroundImage", label: "Imagem de Fundo", returnType: "text" },
      { type: "property_set", name: "BackgroundImage", label: "Definir Imagem de Fundo", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_get", name: "Title", label: "Titulo", returnType: "text" },
      { type: "property_set", name: "Title", label: "Definir Titulo", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "TitleVisible", label: "Titulo Visivel", returnType: "boolean" },
      { type: "property_set", name: "TitleVisible", label: "Definir Titulo Visivel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "ShowStatusBar", label: "Mostrar Barra de Status", returnType: "boolean" },
      { type: "property_set", name: "ShowStatusBar", label: "Definir Mostrar Barra de Status", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "ScreenOrientation", label: "Orientacao da Tela", returnType: "text" },
      { type: "property_set", name: "ScreenOrientation", label: "Definir Orientacao da Tela", params: [{ name: "value", type: "text" }] },
      { type: "property_get", name: "Scrollable", label: "Rolavel", returnType: "boolean" },
      { type: "property_set", name: "Scrollable", label: "Definir Rolavel", params: [{ name: "value", type: "boolean" }] },
    ]
  },

  // Default para componentes desconhecidos
  default: {
    events: [
      { type: "event", name: "Click", label: "Quando clicado", description: "Disparado quando o componente e clicado" },
      { type: "event", name: "LongClick", label: "Quando pressionado longo", description: "Disparado quando o componente e pressionado por mais tempo" },
      { type: "event", name: "GotFocus", label: "Quando recebe foco", description: "Disparado quando o componente recebe foco" },
      { type: "event", name: "LostFocus", label: "Quando perde foco", description: "Disparado quando o componente perde foco" },
    ],
    methods: [],
    properties: [
      { type: "property_get", name: "Visible", label: "Visivel", returnType: "boolean" },
      { type: "property_set", name: "Visible", label: "Definir Visivel", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "Enabled", label: "Habilitado", returnType: "boolean" },
      { type: "property_set", name: "Enabled", label: "Definir Habilitado", params: [{ name: "value", type: "boolean" }] },
      { type: "property_get", name: "Height", label: "Altura", returnType: "number" },
      { type: "property_set", name: "Height", label: "Definir Altura", params: [{ name: "value", type: "number" }] },
      { type: "property_get", name: "Width", label: "Largura", returnType: "number" },
      { type: "property_set", name: "Width", label: "Definir Largura", params: [{ name: "value", type: "number" }] },
    ]
  },
}

/**
 * Obtem o catalogo de blocos para um tipo de componente
 */
export function getBlocksCatalogForComponent(componentType: string) {
  const type = componentType.split('.').pop() || componentType
  return KODULAR_BLOCKS_CATALOG[type] || KODULAR_BLOCKS_CATALOG.default
}

/**
 * Obtem todas as funcoes disponiveis para um tipo de componente
 */
export function getAllFunctionsForComponent(componentType: string): KodularBlockDef[] {
  const catalog = getBlocksCatalogForComponent(componentType)
  return [
    ...catalog.events,
    ...catalog.methods,
    ...catalog.properties,
  ]
}

/**
 * Obtem apenas eventos para um tipo de componente
 */
export function getEventsForComponent(componentType: string): KodularBlockDef[] {
  const catalog = getBlocksCatalogForComponent(componentType)
  return catalog.events
}

/**
 * Obtem apenas metodos para um tipo de componente
 */
export function getMethodsForComponent(componentType: string): KodularBlockDef[] {
  const catalog = getBlocksCatalogForComponent(componentType)
  return catalog.methods
}

/**
 * Obtem apenas propriedades para um tipo de componente
 */
export function getPropertiesForComponent(componentType: string): KodularBlockDef[] {
  const catalog = getBlocksCatalogForComponent(componentType)
  return catalog.properties
}
